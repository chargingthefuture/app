import type { Express } from "express";
import { createServer, type Server } from "http";
import { sql } from "drizzle-orm";
import { db } from "./db";

// Valid mini-app names for health checks
const VALID_APPS = [
  'chatgroups',
  'directory',
  'gentlepulse',
  'chyme',
  'workforce-recruiter',
  'lighthouse',
  'lostmail',
  'mechanicmatch',
  'research',
  'socketrelay',
  'supportmatch',
  'trusttransport',
];

/**
 * Register all API routes
 * Returns the HTTP server instance for use with Vite HMR
 */
export async function registerRoutes(app: Express): Promise<Server> {
  // ========================================
  // Health Check Endpoints (Public, no auth required)
  // ========================================

  // Main platform health check
  app.get('/api/health', async (req, res) => {
    try {
      // Quick database check
      await db.execute(sql`SELECT 1`);
      res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'platform',
        database: 'connected',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      });
    } catch (error: any) {
      res.status(503).json({ 
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'platform',
        database: 'disconnected',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        error: error.message
      });
    }
  });

  // Mini-app specific health checks
  app.get('/api/health/:app', async (req, res) => {
    const appName = req.params.app;
    
    // Validate app name
    if (!VALID_APPS.includes(appName)) {
      return res.status(400).json({
        status: 'invalid',
        app: appName,
        timestamp: new Date().toISOString(),
        error: `Invalid app name. Valid apps: ${VALID_APPS.join(', ')}`
      });
    }

    try {
      // Check app-specific dependencies (database connection)
      await db.execute(sql`SELECT 1`);
      res.json({ 
        status: 'healthy',
        app: appName,
        timestamp: new Date().toISOString(),
        database: 'connected',
        version: process.env.npm_package_version || '1.0.0'
      });
    } catch (error: any) {
      res.status(503).json({ 
        status: 'unhealthy',
        app: appName,
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        version: process.env.npm_package_version || '1.0.0',
        error: error.message
      });
    }
  });

  // Readiness check (for Railway/Kubernetes)
  // Indicates the service is ready to accept traffic
  app.get('/api/ready', async (req, res) => {
    try {
      // Check database connection
      await db.execute(sql`SELECT 1`);
      res.json({
        ready: true,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(503).json({
        ready: false,
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  });

  // Liveness check (minimal, for Railway/Kubernetes)
  // Indicates the service is alive (doesn't check dependencies)
  app.get('/api/live', async (req, res) => {
    res.json({
      alive: true,
      timestamp: new Date().toISOString()
    });
  });

  // Create and return HTTP server instance
  const server = createServer(app);
  return server;
}
