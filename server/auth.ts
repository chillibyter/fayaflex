import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, RequestHandler } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import jwksClient from "jwks-rsa";
import { storage } from "./storage";
import { User, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import connectPg from "connect-pg-simple";
import { sendPasswordResetEmail } from "./emailService";

// Google ID-token verifier. We accept tokens issued for the web Google
// Identity Services client. The audience is the Google OAuth client ID.
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || "";
const googleAuthClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;
if (!GOOGLE_CLIENT_ID) {
  console.warn("[Auth] GOOGLE_CLIENT_ID not set — Google sign-in disabled.");
}

// Apple Sign-In identity-token verifier. Apple issues identity tokens signed
// with rotating RSA keys exposed at https://appleid.apple.com/auth/keys.
// We accept tokens whose audience is either our native iOS bundle ID
// (com.fayaflex.app) or our web Service ID (set via APPLE_SIGN_IN_SERVICE_ID).
const APPLE_BUNDLE_ID = "com.fayaflex.app";
const APPLE_SERVICE_ID = process.env.APPLE_SIGN_IN_SERVICE_ID || "";
const ALLOWED_APPLE_AUDIENCES = [APPLE_BUNDLE_ID, APPLE_SERVICE_ID].filter(Boolean);

// Normalize a PEM-encoded private key that may have been pasted into the
// secrets manager with newlines collapsed to spaces or to literal "\n".
// Returns the original string if it already contains real newlines.
export function normalizePemPrivateKey(raw: string | undefined): string {
  if (!raw) return "";
  if (raw.includes("\n")) return raw;
  if (raw.includes("\\n")) return raw.replace(/\\n/g, "\n");
  // Spaces-as-newlines fallback: rebuild line breaks around BEGIN/END markers
  // and reflow the base64 body into 64-char lines as openssl emits.
  const m = raw.match(/-----BEGIN ([^-]+?)-----\s*([A-Za-z0-9+/=\s]+?)\s*-----END \1-----/);
  if (!m) return raw;
  const label = m[1].trim();
  const body = m[2].replace(/\s+/g, "");
  const wrapped = body.match(/.{1,64}/g)?.join("\n") ?? body;
  return `-----BEGIN ${label}-----\n${wrapped}\n-----END ${label}-----\n`;
}
const appleJwksClient = jwksClient({
  jwksUri: "https://appleid.apple.com/auth/keys",
  cache: true,
  cacheMaxAge: 24 * 60 * 60 * 1000,
  rateLimit: true,
});
function getAppleSigningKey(kid: string): Promise<string> {
  return new Promise((resolve, reject) => {
    appleJwksClient.getSigningKey(kid, (err, key) => {
      if (err || !key) return reject(err || new Error("Apple signing key not found"));
      resolve(key.getPublicKey());
    });
  });
}
async function verifyAppleIdentityToken(idToken: string): Promise<{
  sub: string;
  email?: string;
  email_verified?: boolean | string;
}> {
  const decodedHeader = jwt.decode(idToken, { complete: true });
  if (!decodedHeader || typeof decodedHeader === "string" || !decodedHeader.header.kid) {
    throw new Error("Invalid Apple identity token (no kid).");
  }
  const publicKey = await getAppleSigningKey(decodedHeader.header.kid as string);
  const verified = jwt.verify(idToken, publicKey, {
    algorithms: ["RS256"],
    issuer: "https://appleid.apple.com",
    audience: ALLOWED_APPLE_AUDIENCES,
  }) as { sub: string; email?: string; email_verified?: boolean | string };
  if (!verified.sub) throw new Error("Apple identity token missing subject.");
  return verified;
}

// Build a unique username from a Google email. Falls back to incrementing
// numeric suffixes if the base is already taken.
async function generateUniqueUsernameFromEmail(email: string): Promise<string> {
  const base = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20) || "user";
  let candidate = base;
  let suffix = 0;
  // Cap attempts to avoid runaway loops; collisions are rare.
  while (await storage.getUserByUsername(candidate)) {
    suffix += 1;
    candidate = `${base}${suffix}`;
    if (suffix > 9999) {
      candidate = `${base}${Math.floor(Math.random() * 1_000_000)}`;
      break;
    }
  }
  return candidate;
}

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string | null;
      password: string | null;
      email: string | null;
      firstName: string | null;
      lastName: string | null;
      profileImageUrl: string | null;
      avatarId: string | null;
      createdAt: Date | null;
      updatedAt: Date | null;
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string | null) {
  if (!stored) return false;
  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) return false;
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Sanitize user object to remove sensitive fields
function sanitizeUser(user: User): Omit<User, "password"> {
  const { password, ...sanitized } = user;
  return sanitized;
}

// Validation schemas for auth endpoints
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(100),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email().optional().nullable(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  continentId: z.string().optional().nullable(),
  countryId: z.string().optional().nullable(),
  regionId: z.string().optional().nullable(),
  townId: z.string().optional().nullable(),
});

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const migrateAccountSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  username: z.string().min(3, "Username must be at least 3 characters").max(100),
  password: z.string().min(6, "Password must be at least 6 characters"),
  lastName: z.string().optional().nullable(),
});

// JWT token utilities
const JWT_SECRET = process.env.SESSION_SECRET || "fallback-secret-change-in-production";
const JWT_EXPIRES_IN = "30d"; // 30 days for mobile apps

export function generateAuthToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyAuthToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

export function setupAuth(app: Express) {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  // Must set trust proxy BEFORE session middleware
  app.set("trust proxy", 1);
  
  // Debug: Log incoming request headers to understand the proxy setup
  app.use((req, res, next) => {
    if (req.path === '/api/login' || req.path === '/api/register') {
      console.log('[Session Debug] x-forwarded-proto:', req.headers['x-forwarded-proto']);
      console.log('[Session Debug] req.secure:', req.secure);
      console.log('[Session Debug] req.protocol:', req.protocol);
    }
    next();
  });
  
  // Session configuration
  // Replit webview runs on HTTPS from a different domain, requiring cross-site cookies
  app.use(session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    name: 'connect.sid',
    cookie: {
      httpOnly: true,
      secure: true, // Required for sameSite: 'none'
      sameSite: 'none' as const, // Required for cross-site cookies (Replit webview)
      maxAge: sessionTtl,
      path: '/',
    },
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  
  // JWT token authentication middleware
  // This runs after session auth and checks for Bearer token
  // If a valid JWT is found, it authenticates the user even without a session
  app.use(async (req, res, next) => {
    // Skip if already authenticated via session
    if (req.isAuthenticated()) {
      return next();
    }
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyAuthToken(token);
      
      if (decoded) {
        try {
          const user = await storage.getUser(decoded.userId);
          if (user) {
            // Attach user to request for use in routes
            req.user = user;
          }
        } catch (error) {
          console.error('[JWT Auth] Error fetching user:', error);
        }
      }
    }
    next();
  });

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`[Auth] Login attempt for username: "${username}"`);
        // Try by username first, then fall back to email so users can log in with either
        let user = await storage.getUserByUsername(username);
        if (!user) {
          user = await storage.getUserByEmail(username);
        }
        if (!user) {
          console.log(`[Auth] User not found: "${username}"`);
          return done(null, false, { message: "Invalid username or password" });
        }
        if (!user.password) {
          console.log(`[Auth] User has no password set: "${username}"`);
          return done(null, false, { message: "Invalid username or password" });
        }
        const passwordMatch = await comparePasswords(password, user.password);
        if (!passwordMatch) {
          console.log(`[Auth] Password mismatch for user: "${username}"`);
          return done(null, false, { message: "Invalid username or password" });
        }
        console.log(`[Auth] Login successful for: "${username}"`);
        return done(null, user);
      } catch (error) {
        console.error(`[Auth] Error during login:`, error);
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user || !user.username) {
        return done(null, false);
      }
      // Allow OAuth users (password can be null for social login users)
      done(null, user);
    } catch (error) {
      done(null, false);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate request body
      const validationResult = registerSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validationResult.error.errors 
        });
      }

      const { username, password, email, firstName, lastName, continentId, countryId, regionId, townId } = validationResult.data;

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken. Please choose a different one." });
      }

      // Check if email is already registered
      if (email) {
        const existingEmail = await storage.getUserByEmail(email);
        if (existingEmail) {
          return res.status(400).json({ message: "An account with this email already exists. Please log in instead." });
        }
      }

      // Create user with hashed password and location data
      const user = await storage.createUser({
        username,
        password: await hashPassword(password),
        email: email ?? undefined,
        firstName: firstName ?? undefined,
        lastName: lastName ?? undefined,
        continentId: continentId ?? undefined,
        countryId: countryId ?? undefined,
        regionId: regionId ?? undefined,
        townId: townId ?? undefined,
      });

      // Log in the user and return sanitized user object with JWT token
      req.login(user, (err) => {
        if (err) {
          console.error("Error during req.login after registration:", err);
          return next(err);
        }
        // Include JWT token for token-based auth (works around third-party cookie blocking)
        const token = generateAuthToken(user.id);
        res.status(201).json({ ...sanitizeUser(user), token });
      });
    } catch (error: any) {
      console.error("Error during registration:", error);
      // Convert known DB constraint violations into friendly messages
      const msg: string = error?.message ?? "";
      if (msg.includes("users_email_unique") || msg.includes("duplicate key") && msg.includes("email")) {
        return res.status(400).json({ message: "An account with this email already exists. Please log in instead." });
      }
      if (msg.includes("users_username_unique") || msg.includes("duplicate key") && msg.includes("username")) {
        return res.status(400).json({ message: "Username already taken. Please choose a different one." });
      }
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    // Validate request body
    const validationResult = loginSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validationResult.error.errors 
      });
    }

    passport.authenticate("local", (err: any, user: User | false, info: any) => {
      if (err) {
        console.error("Error during passport authentication:", err);
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.login(user, (err) => {
        if (err) {
          console.error("Error during req.login after login:", err);
          return next(err);
        }
        // Explicitly save session to ensure it's persisted before responding
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Error saving session after login:", saveErr);
            return next(saveErr);
          }
          // Include JWT token for token-based auth (works around third-party cookie blocking)
          const token = generateAuthToken(user.id);
          res.status(200).json({ ...sanitizeUser(user), token });
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // ── Google Sign-In ────────────────────────────────────────────────────────
  // Accepts a Google ID token from the client (issued by Google Identity
  // Services on web, or by the Capacitor Google Auth plugin on native), then:
  //   - Verifies it against our GOOGLE_CLIENT_ID
  //   - Looks up an existing user by email (creates one if not found)
  //   - Logs the user in via passport session + JWT
  app.post("/api/auth/google", async (req, res, next) => {
    try {
      if (!googleAuthClient) {
        return res
          .status(503)
          .json({ message: "Google sign-in is not configured on this server." });
      }
      const schema = z.object({ idToken: z.string().min(10) });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ message: "Missing Google ID token." });
      }
      const ticket = await googleAuthClient.verifyIdToken({
        idToken: parsed.data.idToken,
        audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return res
          .status(401)
          .json({ message: "Could not verify Google account." });
      }
      if (payload.email_verified === false) {
        return res
          .status(401)
          .json({ message: "Your Google email is not verified." });
      }
      const email = payload.email.toLowerCase();
      let user = await storage.getUserByEmail(email);
      if (!user) {
        const username = await generateUniqueUsernameFromEmail(email);
        // Social-login users have no password — passport-local won't accept
        // them on the username/password endpoint, which is what we want.
        user = await storage.createUser({
          username,
          email,
          password: null,
          firstName: payload.given_name ?? undefined,
          lastName: payload.family_name ?? undefined,
          profileImageUrl: payload.picture ?? undefined,
        });
        console.log(`[Auth] Google sign-in created new user: ${username} <${email}>`);
      } else {
        console.log(`[Auth] Google sign-in matched existing user: ${user.username} <${email}>`);
      }
      req.login(user, (err) => {
        if (err) {
          console.error("[Auth] req.login after Google sign-in failed:", err);
          return next(err);
        }
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("[Auth] session save after Google sign-in failed:", saveErr);
            return next(saveErr);
          }
          const token = generateAuthToken(user!.id);
          res.status(200).json({ ...sanitizeUser(user!), token });
        });
      });
    } catch (error: any) {
      console.error("[Auth] Google sign-in error:", error?.message || error);
      const msg = String(error?.message || "");
      if (msg.toLowerCase().includes("token used too late") || msg.toLowerCase().includes("invalid token")) {
        return res.status(401).json({ message: "Google sign-in expired. Please try again." });
      }
      return res
        .status(401)
        .json({ message: "Google sign-in failed. Please try again." });
    }
  });

  // ── Apple Sign-In ─────────────────────────────────────────────────────────
  // Accepts an Apple identity token from the client (issued by the native
  // Capacitor Apple Sign-In plugin on iOS, or AppleID.auth on the web after
  // a Service ID is configured). The token is verified against Apple's JWKS,
  // then we lookup-or-create a user by Apple sub (and email when present).
  app.post("/api/auth/apple", async (req, res, next) => {
    try {
      const schema = z.object({
        identityToken: z.string().min(20),
        // Apple only sends name on the FIRST sign-in. The native plugin
        // surfaces it in `givenName` / `familyName`; web in `user.name`.
        givenName: z.string().optional().nullable(),
        familyName: z.string().optional().nullable(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ message: "Missing Apple identity token." });
      }
      const claims = await verifyAppleIdentityToken(parsed.data.identityToken);
      const appleSub = claims.sub;
      const claimEmail = claims.email?.toLowerCase();

      // Prefer Apple sub for lookup (stable across sign-ins, present even
      // when Apple omits email on subsequent sign-ins).
      let user = await storage.getUserByAppleId(appleSub);

      // First-time sign-in path: try email, otherwise create a fresh user
      // using Apple's private-relay email (always present on first auth).
      if (!user && claimEmail) {
        user = await storage.getUserByEmail(claimEmail);
        if (user && !user.appleId) {
          await storage.setUserAppleId(user.id, appleSub);
        }
      }
      if (!user) {
        if (!claimEmail) {
          return res.status(400).json({
            message:
              "Apple did not return an email for this account. Please sign out of FayaFlex on your Apple ID, then try again.",
          });
        }
        const username = await generateUniqueUsernameFromEmail(claimEmail);
        user = await storage.createUser({
          username,
          email: claimEmail,
          password: null,
          firstName: parsed.data.givenName ?? undefined,
          lastName: parsed.data.familyName ?? undefined,
        });
        await storage.setUserAppleId(user.id, appleSub);
        console.log(`[Auth] Apple sign-in created new user: ${username} <${claimEmail}>`);
      } else {
        console.log(`[Auth] Apple sign-in matched existing user: ${user.username}`);
      }

      req.login(user, (err) => {
        if (err) {
          console.error("[Auth] req.login after Apple sign-in failed:", err);
          return next(err);
        }
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("[Auth] session save after Apple sign-in failed:", saveErr);
            return next(saveErr);
          }
          const token = generateAuthToken(user!.id);
          res.status(200).json({ ...sanitizeUser(user!), token });
        });
      });
    } catch (error: any) {
      console.error("[Auth] Apple sign-in error:", error?.message || error);
      const msg = String(error?.message || "");
      if (msg.toLowerCase().includes("jwt expired")) {
        return res.status(401).json({ message: "Apple sign-in expired. Please try again." });
      }
      if (msg.toLowerCase().includes("jwt audience")) {
        return res.status(401).json({ message: "Apple sign-in misconfigured (audience mismatch)." });
      }
      return res
        .status(401)
        .json({ message: "Apple sign-in failed. Please try again." });
    }
  });

  app.post("/api/migrate-account", async (req, res, next) => {
    try {
      // Validate request body
      const validationResult = migrateAccountSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validationResult.error.errors 
        });
      }

      const { firstName, username, password, lastName } = validationResult.data;

      // Find legacy user - try full name first if lastName provided, then firstName only
      let legacyUser: User | undefined;
      
      if (lastName) {
        // If lastName is provided, require exact match on both first and last name
        legacyUser = await storage.getLegacyUserByFullName(firstName, lastName);
        if (!legacyUser) {
          return res.status(404).json({ 
            message: "No legacy account found with this first and last name. Please check the name or create a new account." 
          });
        }
      } else {
        // If no lastName, find by firstName but check for duplicates
        try {
          legacyUser = await storage.getLegacyUserByFirstName(firstName);
        } catch (error: any) {
          // Handle "multiple accounts" error
          if (error.message?.includes("Multiple accounts")) {
            return res.status(400).json({ 
              message: "Multiple accounts found with this first name. Please provide your last name to identify your account." 
            });
          }
          throw error;
        }
        
        if (!legacyUser) {
          return res.status(404).json({ 
            message: "No legacy account found with this first name. Please check the name or create a new account." 
          });
        }
      }

      // Check if username is already taken by another user
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Update the legacy user with username, password, and optionally lastName
      const updatedUser = await storage.updateUser(legacyUser.id, {
        username,
        password: await hashPassword(password),
        lastName: lastName || legacyUser.lastName,
      });

      // Log in the user and return sanitized user object
      req.login(updatedUser, (err) => {
        if (err) return next(err);
        res.status(200).json(sanitizeUser(updatedUser));
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/auth/user", (req, res) => {
    // Check both session auth and JWT auth (req.user is set by JWT middleware too)
    if (!req.isAuthenticated() && !req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(sanitizeUser(req.user as User));
  });

  // Mobile token endpoint - generates JWT token for mobile apps
  app.post("/api/auth/mobile-token", (req, res, next) => {
    // Validate request body
    const validationResult = loginSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validationResult.error.errors 
      });
    }

    passport.authenticate("local", (err: any, user: User | false, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      
      // Establish session for web users
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        
        // Generate JWT token for mobile users
        const token = generateAuthToken(user.id);
        
        res.status(200).json({ 
          token,
          user: sanitizeUser(user)
        });
      });
    })(req, res, next);
  });

  // Forgot password - request password reset
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Clean up expired tokens periodically
      await storage.deleteExpiredPasswordResetTokens();
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      // Always return success to prevent email enumeration attacks
      if (!user) {
        console.log(`[Password Reset] No user found for email: ${email}`);
        return res.status(200).json({ 
          message: "If an account with that email exists, a password reset link has been sent." 
        });
      }
      
      // Generate secure token
      const resetToken = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      
      // Save token to database
      await storage.createPasswordResetToken(user.id, resetToken, expiresAt);
      
      // Build reset link
      const baseUrl = process.env.APP_URL || 
        (process.env.NODE_ENV === 'production' 
          ? 'https://fayaflex.com' 
          : 'http://localhost:5000');
      const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
      
      // Send password reset email
      const emailSent = await sendPasswordResetEmail(email, resetLink);
      if (emailSent) {
        console.log(`[Password Reset] Email sent to ${email}`);
      } else {
        console.log(`[Password Reset] Email not sent (check config). Reset link: ${resetLink}`);
      }
      
      res.status(200).json({ 
        message: "If an account with that email exists, a password reset link has been sent." 
      });
    } catch (error) {
      console.error("Error in forgot password:", error);
      res.status(500).json({ message: "An error occurred. Please try again." });
    }
  });

  // Reset password with token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: "Reset token is required" });
      }
      
      if (!password || typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      
      // Find the token
      const resetToken = await storage.getPasswordResetToken(token);
      
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      // Check if token is expired
      if (new Date() > resetToken.expiresAt) {
        return res.status(400).json({ message: "Reset token has expired" });
      }
      
      // Check if token was already used
      if (resetToken.used) {
        return res.status(400).json({ message: "This reset link has already been used" });
      }
      
      // Update user's password
      const hashedPassword = await hashPassword(password);
      await storage.updateUser(resetToken.userId, { password: hashedPassword });
      
      // Mark token as used
      await storage.markPasswordResetTokenUsed(resetToken.id);
      
      console.log(`[Password Reset] Password successfully reset for user: ${resetToken.userId}`);
      
      res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Error in reset password:", error);
      res.status(500).json({ message: "An error occurred. Please try again." });
    }
  });

  // Validate reset token (for frontend to check before showing form)
  app.get("/api/auth/validate-reset-token", async (req, res) => {
    try {
      const token = req.query.token as string;
      console.log(`[Token Validation] Received token: ${token ? token.substring(0, 10) + '...' : 'none'}`);
      
      if (!token) {
        return res.status(400).json({ valid: false, message: "Token is required" });
      }
      
      const resetToken = await storage.getPasswordResetToken(token);
      console.log(`[Token Validation] Token found in DB: ${!!resetToken}`);
      
      if (!resetToken) {
        return res.status(400).json({ valid: false, message: "Invalid reset token" });
      }
      
      // Check if token was already used FIRST
      if (resetToken.used) {
        return res.status(410).json({ valid: false, message: "This reset link has already been used" });
      }
      
      if (new Date() > resetToken.expiresAt) {
        return res.status(410).json({ valid: false, message: "Reset token has expired" });
      }
      
      res.status(200).json({ valid: true });
    } catch (error) {
      console.error("Error validating reset token:", error);
      res.status(500).json({ valid: false, message: "An error occurred" });
    }
  });

}

// Enhanced authentication middleware that supports both session and JWT
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // Check session-based auth first (for web app)
  if (req.isAuthenticated()) {
    return next();
  }
  
  // Check JWT token auth (for mobile app)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const decoded = verifyAuthToken(token);
    
    if (decoded) {
      // Load user from database and attach to request
      const user = await storage.getUser(decoded.userId);
      if (user) {
        req.user = user;
        return next();
      }
    }
  }
  
  return res.status(401).json({ message: "Unauthorized" });
};
