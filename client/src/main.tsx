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
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Tracing
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in production, 100% in development
    // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: [
      "localhost",
      /^https:\/\/.*\.railway\.app/,
      /^https:\/\/.*\.the-comic\.com/,
      /^https:\/\/app\.chargingthefuture\.com/,
    ],
    // Session Replay
    replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in production, 100% in development
    replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
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
