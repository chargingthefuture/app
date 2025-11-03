import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { validateCsrfToken } from "./csrf";

// Auth0 Configuration
if (!process.env.AUTH0_ISSUER_URL) {
  throw new Error("Environment variable AUTH0_ISSUER_URL not provided");
}

if (!process.env.AUTH0_CLIENT_ID) {
  throw new Error("Environment variable AUTH0_CLIENT_ID not provided");
}

if (!process.env.AUTH0_CLIENT_SECRET) {
  throw new Error("Environment variable AUTH0_CLIENT_SECRET not provided");
}

if (!process.env.APP_URL) {
  throw new Error("Environment variable APP_URL not provided (e.g., https://yourdomain.com)");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.AUTH0_ISSUER_URL!),
      process.env.AUTH0_CLIENT_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
      sameSite: 'strict', // CSRF protection - prevents cookies from being sent in cross-site requests
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

/**
 * Map Auth0 claims to our user schema
 * Auth0 uses different claim names:
 * - given_name (first name)
 * - family_name (last name)
 * - picture (profile image URL)
 */
function mapAuth0Claims(claims: any) {
  // Split full name if separate fields not available
  let firstName = claims["given_name"] || "";
  let lastName = claims["family_name"] || "";
  
  // If no separate name fields, try to split from name field
  if (!firstName && !lastName && claims["name"]) {
    const nameParts = claims["name"].split(" ");
    firstName = nameParts[0] || "";
    lastName = nameParts.slice(1).join(" ") || "";
  }

  return {
    sub: claims["sub"],
    email: claims["email"],
    first_name: firstName,
    last_name: lastName,
    profile_image_url: claims["picture"] || null,
  };
}

async function upsertUser(
  claims: any,
) {
  // Map Auth0 claims to our schema format
  const mappedClaims = mapAuth0Claims(claims);
  
  // Check if user already exists
  const existingUser = await storage.getUser(mappedClaims.sub);
  
  if (existingUser) {
    // For existing users, only update profile information, preserve pricing tier
    await storage.upsertUser({
      id: mappedClaims.sub,
      email: mappedClaims.email,
      firstName: mappedClaims.first_name,
      lastName: mappedClaims.last_name,
      profileImageUrl: mappedClaims.profile_image_url,
      pricingTier: existingUser.pricingTier, // Preserve existing pricing tier (grandfathered)
      isAdmin: existingUser.isAdmin, // Preserve admin status
      subscriptionStatus: existingUser.subscriptionStatus, // Preserve subscription status
      inviteCodeUsed: existingUser.inviteCodeUsed, // Preserve invite code
    });
  } else {
    // For new users, get current pricing tier
    const currentTier = await storage.getCurrentPricingTier();
    const pricingTier = currentTier?.amount || '1.00';

    await storage.upsertUser({
      id: mappedClaims.sub,
      email: mappedClaims.email,
      firstName: mappedClaims.first_name,
      lastName: mappedClaims.last_name,
      profileImageUrl: mappedClaims.profile_image_url,
      pricingTier,
    });
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();
  const callbackURL = `${process.env.APP_URL}/api/callback`;

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Auth0 strategy (single strategy)
  // The config from discovery already includes client info, but we need to pass credentials
  const strategy = new Strategy(
    {
      name: "auth0",
      config: {
        ...config,
        client: {
          client_id: process.env.AUTH0_CLIENT_ID!,
          client_secret: process.env.AUTH0_CLIENT_SECRET!,
        },
      },
      scope: "openid email profile offline_access",
      callbackURL,
    },
    verify,
  );
  passport.use(strategy);

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate("auth0", {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate("auth0", {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
      const redirectUri = `${protocol}://${req.get('host') || new URL(process.env.APP_URL!).hostname}`;
      
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.AUTH0_CLIENT_ID!,
          post_logout_redirect_uri: redirectUri,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

export const isAdmin: RequestHandler = async (req, res, next) => {
  const userId = (req.user as any)?.claims?.sub;
  
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await storage.getUser(userId);
  
  if (!user || !user.isAdmin) {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }

  next();
};

/**
 * Combined middleware: Admin auth + CSRF validation
 * Use this for state-changing admin operations (POST, PUT, DELETE, PATCH)
 * 
 * Usage:
 * app.post('/api/admin/endpoint', isAuthenticated, ...isAdminWithCsrf, async (req, res) => { ... });
 */
export const isAdminWithCsrf: RequestHandler[] = [isAdmin, validateCsrfToken];

