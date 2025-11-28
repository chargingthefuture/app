/**
 * File-based logging utility with rotation
 * 
 * Writes logs to files in logs/ directory while still outputting to console.
 * Automatically rotates logs to prevent files from growing too large.
 * 
 * Enable with: ENABLE_FILE_LOGGING=true
 * Configure with:
 * - LOG_DIR (default: logs/)
 * - MAX_LOG_SIZE_MB (default: 10)
 * - MAX_LOG_FILES (default: 5)
 */

import fs from 'fs';
import path from 'path';

const ENABLE_FILE_LOGGING = process.env.ENABLE_FILE_LOGGING === 'true';
const LOG_DIR = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
const MAX_LOG_SIZE_MB = parseInt(process.env.MAX_LOG_SIZE_MB || '10', 10);
const MAX_LOG_SIZE_BYTES = MAX_LOG_SIZE_MB * 1024 * 1024;
const MAX_LOG_FILES = parseInt(process.env.MAX_LOG_FILES || '5', 10);

// Ensure logs directory exists
if (ENABLE_FILE_LOGGING) {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
  } catch (error) {
    console.error('Failed to create logs directory:', error);
  }
}

interface LogEntry {
  timestamp: string;
  level: 'log' | 'error' | 'warn' | 'info';
  message: string;
  data?: any;
}

/**
 * Format log entry as JSON line
 */
function formatLogEntry(level: LogEntry['level'], message: string, data?: any): string {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(data && { data }),
  };
  return JSON.stringify(entry) + '\n';
}

/**
 * Get current log file path
 */
function getLogFilePath(level: 'log' | 'error' | 'warn' | 'info' = 'log'): string {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const filename = `app-${level}-${date}.log`;
  return path.join(LOG_DIR, filename);
}

/**
 * Rotate log files if they exceed size limit
 */
function rotateLogFile(filePath: string): void {
  try {
    if (!fs.existsSync(filePath)) {
      return;
    }

    const stats = fs.statSync(filePath);
    if (stats.size < MAX_LOG_SIZE_BYTES) {
      return; // File not too large yet
    }

    // Find next available rotated file number
    let rotatedNum = 1;
    let rotatedPath = `${filePath}.${rotatedNum}`;
    while (fs.existsSync(rotatedPath) && rotatedNum < MAX_LOG_FILES) {
      rotatedNum++;
      rotatedPath = `${filePath}.${rotatedNum}`;
    }

    // If we've reached max files, delete the oldest and shift
    if (rotatedNum >= MAX_LOG_FILES) {
      // Delete oldest file
      const oldestPath = `${filePath}.1`;
      if (fs.existsSync(oldestPath)) {
        fs.unlinkSync(oldestPath);
      }
      // Shift all files down
      for (let i = 2; i < MAX_LOG_FILES; i++) {
        const oldPath = `${filePath}.${i}`;
        const newPath = `${filePath}.${i - 1}`;
        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
        }
      }
      rotatedPath = `${filePath}.${MAX_LOG_FILES - 1}`;
    }

    // Rename current file to rotated file
    fs.renameSync(filePath, rotatedPath);
  } catch (error) {
    console.error('Failed to rotate log file:', error);
  }
}

/**
 * Write log entry to file
 */
function writeToFile(level: LogEntry['level'], message: string, data?: any): void {
  if (!ENABLE_FILE_LOGGING) {
    return;
  }

  try {
    const filePath = getLogFilePath(level);
    
    // Rotate if needed before writing
    rotateLogFile(filePath);
    
    // Append to log file
    const logLine = formatLogEntry(level, message, data);
    fs.appendFileSync(filePath, logLine, 'utf8');
  } catch (error) {
    // Don't throw - logging failures shouldn't crash the app
    // But log to console as fallback
    console.error('Failed to write to log file:', error);
  }
}

/**
 * Clean up old log files (older than 7 days)
 */
function cleanupOldLogs(): void {
  if (!ENABLE_FILE_LOGGING) {
    return;
  }

  try {
    const files = fs.readdirSync(LOG_DIR);
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    for (const file of files) {
      if (!file.startsWith('app-') || !file.endsWith('.log')) {
        continue;
      }

      const filePath = path.join(LOG_DIR, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtimeMs < sevenDaysAgo) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old log file: ${file}`);
      }
    }
  } catch (error) {
    console.error('Failed to cleanup old logs:', error);
  }
}

// Run cleanup on startup (once per day)
let lastCleanup = 0;
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

function maybeCleanup(): void {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    cleanupOldLogs();
    lastCleanup = now;
  }
}

/**
 * Wrapper for console.log that also writes to file
 */
export function fileLog(message: string, ...args: any[]): void {
  console.log(message, ...args);
  const fullMessage = args.length > 0 
    ? `${message} ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')}`
    : message;
  writeToFile('log', fullMessage);
  maybeCleanup();
}

/**
 * Wrapper for console.error that also writes to file
 */
export function fileError(message: string, ...args: any[]): void {
  console.error(message, ...args);
  const fullMessage = args.length > 0 
    ? `${message} ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')}`
    : message;
  writeToFile('error', fullMessage, args.length > 0 ? args : undefined);
  maybeCleanup();
}

/**
 * Wrapper for console.warn that also writes to file
 */
export function fileWarn(message: string, ...args: any[]): void {
  console.warn(message, ...args);
  const fullMessage = args.length > 0 
    ? `${message} ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')}`
    : message;
  writeToFile('warn', fullMessage, args.length > 0 ? args : undefined);
  maybeCleanup();
}

/**
 * Wrapper for console.info that also writes to file
 */
export function fileInfo(message: string, ...args: any[]): void {
  console.info(message, ...args);
  const fullMessage = args.length > 0 
    ? `${message} ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')}`
    : message;
  writeToFile('info', fullMessage, args.length > 0 ? args : undefined);
  maybeCleanup();
}

/**
 * Log structured data (like sync operations)
 */
export function fileLogStructured(level: 'log' | 'error' | 'warn' | 'info', data: Record<string, any>): void {
  const message = data.message || JSON.stringify(data);
  const logFn = level === 'error' ? console.error : 
                level === 'warn' ? console.warn :
                level === 'info' ? console.info : 
                console.log;
  
  logFn(message, data);
  writeToFile(level, message, data);
  maybeCleanup();
}

// Log startup message
if (ENABLE_FILE_LOGGING) {
  fileInfo('File logging enabled', {
    logDir: LOG_DIR,
    maxSizeMB: MAX_LOG_SIZE_MB,
    maxFiles: MAX_LOG_FILES,
  });
}

