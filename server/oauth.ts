import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import type { Express } from "express";
import { storage } from "./storage";
import type { User } from "@shared/schema";

// OAuth configuration for each provider
interface OAuthConfig {
  google: {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
  };
  facebook: {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
  };
  apple: {
    clientID: string;
    teamID: string;
    keyID: string;
    privateKey: string;
    callbackURL: string;
  };
}

function getOAuthConfig(): OAuthConfig {
  const baseURL = process.env.REPLIT_DEV_DOMAIN
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : "http://localhost:5000";

  return {
    google: {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: `${baseURL}/api/auth/google/callback`,
    },
    facebook: {
      clientID: process.env.FACEBOOK_APP_ID || "",
      clientSecret: process.env.FACEBOOK_APP_SECRET || "",
      callbackURL: `${baseURL}/api/auth/facebook/callback`,
    },
    apple: {
      clientID: process.env.APPLE_CLIENT_ID || "",
      teamID: process.env.APPLE_TEAM_ID || "",
      keyID: process.env.APPLE_KEY_ID || "",
      privateKey: process.env.APPLE_PRIVATE_KEY || "",
      callbackURL: `${baseURL}/api/auth/apple/callback`,
    },
  };
}

export async function setupOAuth(app: Express) {
  const config = getOAuthConfig();

  // Google OAuth Strategy
  if (config.google.clientID && config.google.clientSecret) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: config.google.clientID,
          clientSecret: config.google.clientSecret,
          callbackURL: config.google.callbackURL,
          scope: ["profile", "email"],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            const profileImage = profile.photos?.[0]?.value;
            const displayName = profile.displayName;

            // Find or create user with OAuth provider
            const user = await storage.findOrCreateOAuthUser({
              provider: "google",
              providerUserId: profile.id,
              email: email || undefined,
              displayName,
              profileImageUrl: profileImage,
              accessToken,
              refreshToken,
            });

            done(null, user);
          } catch (error) {
            done(error as Error);
          }
        }
      )
    );
  }

  // Facebook OAuth Strategy
  if (config.facebook.clientID && config.facebook.clientSecret) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: config.facebook.clientID,
          clientSecret: config.facebook.clientSecret,
          callbackURL: config.facebook.callbackURL,
          profileFields: ["id", "displayName", "photos", "email"],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            const profileImage = profile.photos?.[0]?.value;
            const displayName = profile.displayName;

            // Find or create user with OAuth provider
            const user = await storage.findOrCreateOAuthUser({
              provider: "facebook",
              providerUserId: profile.id,
              email: email || undefined,
              displayName,
              profileImageUrl: profileImage,
              accessToken,
              refreshToken,
            });

            done(null, user);
          } catch (error) {
            done(error as Error);
          }
        }
      )
    );
  }

  // Apple OAuth Strategy would be added here
  // Note: Apple Sign In requires additional setup with Apple Developer account
  // and a different package (passport-apple) which is not as straightforward

  // OAuth Routes
  // Google
  app.get(
    "/api/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => {
      // Successful authentication, redirect to dashboard
      res.redirect("/");
    }
  );

  // Facebook
  app.get(
    "/api/auth/facebook",
    passport.authenticate("facebook", { scope: ["email"] })
  );

  app.get(
    "/api/auth/facebook/callback",
    passport.authenticate("facebook", { failureRedirect: "/" }),
    (req, res) => {
      // Successful authentication, redirect to dashboard
      res.redirect("/");
    }
  );

  // Apple would be added here
  // app.get('/api/auth/apple', passport.authenticate('apple'));
  // app.get('/api/auth/apple/callback', ...);
}

export function isOAuthConfigured() {
  const config = getOAuthConfig();
  return {
    google: !!(config.google.clientID && config.google.clientSecret),
    facebook: !!(config.facebook.clientID && config.facebook.clientSecret),
    apple: false, // Apple requires more complex setup
  };
}
