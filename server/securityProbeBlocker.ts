/**
 * Security Probe Blocker Middleware
 * 
 * Blocks common security probe paths that attackers use to scan for vulnerabilities.
 * Returns 404 for these paths to avoid revealing information and prevent unnecessary
 * error logging in Sentry.
 */

import { Request, Response, NextFunction } from 'express';

// List of path patterns that are commonly used in security probes
const BLOCKED_PATH_PATTERNS = [
  /^\/\.git\//,           // Git repository files
  /^\/\.env/,             // Environment files
  /^\/\.aws\//,           // AWS credentials
  /^\/\.ssh\//,           // SSH keys
  /^\/\.docker/,          // Docker config
  /^\/\.kube/,            // Kubernetes config
  /^\/\.npmrc/,           // NPM config
  /^\/\.htaccess/,        // Apache config
  /^\/\.htpasswd/,        // Apache passwords
  /^\/wp-admin\//,        // WordPress admin
  /^\/wp-content\//,      // WordPress content
  /^\/wp-includes\//,     // WordPress includes
  /^\/phpmyadmin\//,      // phpMyAdmin
  /^\/\.well-known\/security\.txt$/,  // Allow security.txt
  /^\/\.well-known\/change-password$/, // Allow change-password
  /^\/\.well-known\/(?!security\.txt|change-password)/, // Block other .well-known except allowed
  /^\/\.config\//,        // Config directories
  /^\/\.vscode\//,        // VSCode config
  /^\/\.idea\//,          // IntelliJ config
  /^\/backup/,            // Backup files
  /^\/config\//,          // Config directory
  /^\/database\//,        // Database files
  /^\/\.DS_Store/,        // macOS metadata
  /^\/composer\.json/,    // PHP composer
  /^\/composer\.lock/,    // PHP composer lock
  /^\/package\.json$/,    // Expose package info (block it)
  /^\/package-lock\.json$/, // Expose package info (block it)
  /^\/yarn\.lock$/,       // Expose package info (block it)
  /^\/admin\//,           // Legit admin route
];

/**
 * Middleware that blocks requests to security probe paths
 */
export function blockSecurityProbes(req: Request, res: Response, next: NextFunction): void {
  const path = req.path;
  
  // Check if the path matches any blocked pattern
  for (const pattern of BLOCKED_PATH_PATTERNS) {
    if (pattern.test(path)) {
      // Return 404 without any information to avoid revealing system details
      // Don't call next() to avoid error logging in Sentry
      return res.status(404).send('Not Found');
    }
  }
  
  // Path is not blocked, continue to next middleware
  next();
}
