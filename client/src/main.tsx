import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ConditionalClerkProvider } from "./components/conditional-clerk-provider";

// Initialize Sentry before anything else
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,
    integrations: [
      // Performance Monitoring: Automatically instruments browser performance
      // Tracks page loads, navigation, and user interactions
      Sentry.browserTracingIntegration(),
      // Session Replay: Records user sessions for debugging
      Sentry.replayIntegration(),
    ],
    // Performance Tracing Configuration
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
    // We recommend adjusting this value in production to reduce data volume
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in production, 100% in development
    
    // Distributed Tracing: Enable trace propagation for API calls
    // This allows you to trace requests from frontend to backend
    // Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: [
      "localhost",
      /^https?:\/\/.*\.railway\.app/, // Railway deployments
      /^https?:\/\/.*\.the-comic\.com/, // Production domain
      /^https?:\/\/app\.chargingthefuture\.com/, // Staging domain
      // Include all API routes for distributed tracing
      /^https?:\/\/.*\/api\//, // All API endpoints
    ],
    
    // Session Replay Configuration
    replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in production, 100% in development
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors are recorded
    
    // Environment detection
    environment: import.meta.env.MODE || "development",
    
    // Enable logs to be sent to Sentry
    enableLogs: true,
  });
}

// Initialize theme from localStorage before rendering
const storedTheme = localStorage.getItem("theme-preference");
if (storedTheme === "dark") {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);
root.render(
  <ConditionalClerkProvider>
    <App />
  </ConditionalClerkProvider>
);
