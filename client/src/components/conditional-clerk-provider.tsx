import { ClerkProvider } from "@clerk/clerk-react";
import { ReactNode, useEffect, useState } from "react";
import { ClerkErrorBoundary } from "./clerk-error-boundary";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Get the base URL for redirects
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.VITE_APP_URL || 'https://app.chargingthefuture.com';
};

export function ConditionalClerkProvider({ children }: { children: ReactNode }) {
  const [scriptLoadError, setScriptLoadError] = useState<string | null>(null);

  // Monitor Clerk script loading
  useEffect(() => {
    if (!clerkPublishableKey) return;

    // Check if Clerk scripts are loading properly
    const checkScripts = () => {
      const scripts = Array.from(document.querySelectorAll('script[src*="clerk"]'));
      if (scripts.length === 0) {
        // Wait a bit for scripts to be injected
        const timer = setTimeout(() => {
          const scriptsAfterDelay = Array.from(document.querySelectorAll('script[src*="clerk"]'));
          if (scriptsAfterDelay.length === 0) {
            setScriptLoadError("Clerk scripts failed to load. This may indicate a network or CORS issue.");
          }
        }, 2000);
        return () => clearTimeout(timer);
      }
    };

    // Listen for script errors
    const handleError = (event: ErrorEvent) => {
      if (event.message?.includes('clerk') || event.filename?.includes('clerk')) {
        setScriptLoadError(`Clerk script error: ${event.message}`);
      }
    };

    window.addEventListener('error', handleError);
    const cleanup = checkScripts();

    return () => {
      window.removeEventListener('error', handleError);
      if (cleanup) cleanup();
    };
  }, [clerkPublishableKey]);

  // Only render ClerkProvider if key is available and valid
  // Check for empty string, undefined, or the literal string "undefined"
  const isValidKey = clerkPublishableKey && 
                     clerkPublishableKey !== 'undefined' && 
                     clerkPublishableKey.trim() !== '' &&
                     clerkPublishableKey.startsWith('pk_');
  
  if (!isValidKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold">Configuration Error</h1>
          <p className="text-muted-foreground">
            Missing or invalid VITE_CLERK_PUBLISHABLE_KEY environment variable.
          </p>
          <p className="text-sm text-muted-foreground">
            Please set VITE_CLERK_PUBLISHABLE_KEY in your environment variables.
            The key should start with "pk_" and be set at build time.
          </p>
          {typeof window !== 'undefined' && (
            <div className="mt-4 space-y-2 text-xs text-muted-foreground font-mono bg-muted p-4 rounded">
              <p><strong>Debug Info:</strong></p>
              <p>Environment: {import.meta.env.MODE}</p>
              <p>Key present: {clerkPublishableKey ? 'Yes' : 'No'}</p>
              <p>Key value: {clerkPublishableKey ? `${clerkPublishableKey.substring(0, 20)}...` : 'undefined'}</p>
              <p>Key valid: {isValidKey ? 'Yes' : 'No'}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const baseUrl = getBaseUrl();
  
  // Only use domain prop in production with custom domain
  // In local development, don't set domain to avoid script loading issues
  const isProduction = baseUrl.includes('app.chargingthefuture.com');
  const clerkDomain = isProduction && typeof window !== 'undefined' 
    ? window.location.hostname 
    : undefined;

  // Use dev URLs in development, production URLs in production
  const signInUrl = isProduction 
    ? "https://accounts.app.chargingthefuture.com/sign-in"
    : "https://sure-oarfish-90.accounts.dev/sign-in";
  const signUpUrl = isProduction
    ? "https://accounts.app.chargingthefuture.com/sign-up"
    : "https://sure-oarfish-90.accounts.dev/sign-up";
  const unauthorizedSignInUrl = isProduction
    ? "https://accounts.app.chargingthefuture.com/unauthorized-sign-in"
    : "https://sure-oarfish-90.accounts.dev/unauthorized-sign-in";

  // Wrap in error boundary to catch initialization errors
  return (
    <ClerkErrorBoundary>
      <ClerkProvider 
        publishableKey={clerkPublishableKey}
        {...(clerkDomain ? { domain: clerkDomain } : {})}
        // Use Clerk's hosted Account Portal (dev or prod based on environment)
        signInUrl={signInUrl}
        signUpUrl={signUpUrl}
        unauthorizedSignInUrl={unauthorizedSignInUrl}
        // Redirect to invite-required page after sign-up (users need to enter invite code)
        afterSignUpUrl={`${baseUrl}/invite-required`}
        // Redirect to home after sign-in (if they have invite code) or invite-required (if not)
        afterSignInUrl={`${baseUrl}/`}
        appearance={{
          elements: {
            rootBox: "mx-auto",
          },
        }}
      >
        {children}
      </ClerkProvider>
    </ClerkErrorBoundary>
  );
}
