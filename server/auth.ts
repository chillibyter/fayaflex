import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, RequestHandler } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { User, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import connectPg from "connect-pg-simple";

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

  // Determine if we're in production (HTTPS available)
  const isProduction = Boolean(process.env.NODE_ENV === 'production' || process.env.REPL_SLUG);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction, // Only require HTTPS in production
      sameSite: 'lax' as const,
      maxAge: sessionTtl,
      path: '/',
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !user.password || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user || !user.username || !user.password) {
        return done(null, false);
      }
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

      const { username, password, email, firstName, lastName } = validationResult.data;

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Create user with hashed password
      const user = await storage.createUser({
        username,
        password: await hashPassword(password),
        email: email || null,
        firstName: firstName || null,
        lastName: lastName || null,
      });

      // Log in the user and return sanitized user object
      req.login(user, (err) => {
        if (err) {
          console.error("Error during req.login after registration:", err);
          return next(err);
        }
        res.status(201).json(sanitizeUser(user));
      });
    } catch (error) {
      console.error("Error during registration:", error);
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
        res.status(200).json(sanitizeUser(user));
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
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
    if (!req.isAuthenticated()) {
      // Temporarily return fake user for testing - auth disabled
      return res.json({
        id: '1',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        avatarId: null,
      });
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
      
      // Generate JWT token
      const token = generateAuthToken(user.id);
      
      res.status(200).json({ 
        token,
        user: sanitizeUser(user)
      });
    })(req, res, next);
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
