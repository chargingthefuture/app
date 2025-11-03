import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    // Don't serve HTML for API routes - let them return JSON errors
    if (url.startsWith("/api/")) {
      console.log("Vite middleware: Skipping API route:", url);
      return next();
    }

    try {
      // In development, use process.cwd() which is the project root
      // Use defensive checks to ensure we always have a valid path
      let baseDir: string = '/app'; // Default fallback
      try {
        const cwdResult = process.cwd();
        if (cwdResult && typeof cwdResult === 'string' && cwdResult.length > 0) {
          baseDir = cwdResult;
        }
      } catch (error) {
        console.warn('process.cwd() failed in setupVite, using /app fallback:', error);
      }
      
      // Ensure baseDir is always a valid string
      if (!baseDir || typeof baseDir !== 'string' || baseDir.length === 0) {
        baseDir = '/app';
      }
      
      const clientTemplate = path.resolve(
        baseDir,
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // In production, the bundled server code is at dist/index.js
  // The frontend build is at dist/public (from vite build)
  // Use process.cwd() which is the project root where npm runs
  // Use defensive checks to ensure we always have a valid path
  let cwd: string = '/app'; // Default fallback for Railway
  try {
    const cwdResult = process.cwd();
    if (cwdResult && typeof cwdResult === 'string' && cwdResult.length > 0) {
      cwd = cwdResult;
    } else {
      console.warn('process.cwd() returned invalid value, using /app fallback:', cwdResult);
    }
  } catch (error) {
    // Last resort fallback - assume we're in /app on Railway
    console.warn('process.cwd() failed, using /app as fallback:', error);
  }
  
  // Ensure cwd is always a valid string before using it
  if (!cwd || typeof cwd !== 'string' || cwd.length === 0) {
    cwd = '/app';
  }
  
  const distPath = path.resolve(cwd, "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (req, res) => {
    // Don't serve HTML for API routes - let them return JSON errors
    if (req.originalUrl.startsWith("/api/")) {
      return res.status(404).json({ message: "API endpoint not found" });
    }
    const indexPath = path.resolve(distPath, "index.html");
    if (!fs.existsSync(indexPath)) {
      return res.status(404).json({ message: "Frontend build not found" });
    }
    res.sendFile(indexPath);
  });
}
