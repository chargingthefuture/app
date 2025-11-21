// CRITICAL: Load environment variables FIRST, before any other imports
// This must be at the very top so env vars are available when other modules import db.ts
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") }); // Fallback to .env

import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { clerkMiddleware } from "@clerk/express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { errorHandler, notFoundHandler } from "./errorHandler";

const app = express();

// Trust proxy for rate limiting IP detection (important for production behind load balancers)
app.set('trust proxy', 1);

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser()); // Required for CSRF token cookies

// Clerk middleware - must be before routes
app.use(clerkMiddleware());

// Security headers middleware
app.use((req, res, next) => {
  // HTTP Strict Transport Security (HSTS)
  // Forces browsers to only connect via HTTPS for 1 year
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Content Security Policy (CSP)
  // Prevents XSS attacks by controlling what resources can be loaded
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.app.chargingthefuture.com https://*.app.chargingthefuture.com", // Clerk CDN + custom domain + unsafe-eval needed for Vite dev
    "worker-src 'self' blob:", // Allow blob: URLs for Clerk workers
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.clerk.accounts.dev https://*.clerk.com https://clerk.app.chargingthefuture.com https://*.app.chargingthefuture.com", // Clerk styles
    "font-src 'self' https://fonts.gstatic.com https://*.clerk.accounts.dev https://*.clerk.com https://clerk.app.chargingthefuture.com https://*.app.chargingthefuture.com", // Clerk fonts
    "img-src 'self' data: https:",
    "connect-src 'self' wss: ws: https://*.clerk.accounts.dev https://*.clerk.com https://clerk.app.chargingthefuture.com https://*.app.chargingthefuture.com", // Clerk API calls
    "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.app.chargingthefuture.com https://*.app.chargingthefuture.com", // Clerk iframes for auth
    "frame-ancestors 'none'", // Prevents clickjacking
  ].join('; ');
  res.setHeader('Content-Security-Policy', cspDirectives);
  
  // X-Frame-Options - prevents clickjacking attacks
  res.setHeader('X-Frame-Options', 'DENY');
  
  // X-Content-Type-Options - prevents MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Referrer-Policy - controls how much referrer information is shared
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions-Policy - restricts browser features
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // 404 handler - must be after all routes (including static file serving)
  // Only catch API routes that don't exist - static file serving handles frontend routes
  app.use((req, res, next) => {
    // If it's an API route that wasn't handled, use notFoundHandler
    if (req.path.startsWith("/api/")) {
      return notFoundHandler(req, res, next);
    }
    // For non-API routes, static file serving should have already handled them
    // If we get here, something went wrong - but don't call next() as it would hit error handler
    // The catch-all in serveStatic should have served index.html already
    // This is a safety net that shouldn't normally be reached
    return;
  });

  // Error handler - must be last
  app.use(errorHandler);

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: false,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
