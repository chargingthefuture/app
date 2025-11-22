import { ClerkProvider } from "@clerk/clerk-react";
import { ReactNode } from "react";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Get the base URL for redirects
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.VITE_APP_URL || 'https://app.chargingthefuture.com';
};

export function AppClerkProvider({ children }: { children: ReactNode }) {
  // Only render ClerkProvider if key is available
  // If not available, show error message instead of crashing
  if (!clerkPublishableKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold">Configuration Error</h1>
          <p className="text-muted-foreground">
            Missing VITE_CLERK_PUBLISHABLE_KEY environment variable.
          </p>
          <p className="text-sm text-muted-foreground">
            Please set VITE_CLERK_PUBLISHABLE_KEY in your .env.local file.
          </p>
        </div>
      </div>
    );
  }

  const baseUrl = getBaseUrl();
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

  // Determine environment based on domain
  const isProduction = hostname.includes('app.chargingthefuture.com');
  const isStaging = hostname.includes('the-comic.com') || hostname.includes('staging');
  const isDevelopment = !isProduction && !isStaging;

  // Use appropriate URLs based on environment
  // For staging, use the staging Clerk instance (you'll need to configure this in Clerk)
  // For production, use custom domain
  // For development, use Clerk dev instance
  let signInUrl: string;
  let signUpUrl: string;
  let unauthorizedSignInUrl: string;

  if (isProduction) {
    signInUrl = "https://accounts.app.chargingthefuture.com/sign-in";
    signUpUrl = "https://accounts.app.chargingthefuture.com/sign-up";
    unauthorizedSignInUrl = "https://accounts.app.chargingthefuture.com/unauthorized-sign-in";
  } else if (isStaging) {
    // For staging, use Clerk's default URLs (or configure custom domain in Clerk)
    // You'll need to set up a custom domain in Clerk for staging, or use the default dev URLs
    // If you set up a custom domain in Clerk for staging, use those URLs here
    const stagingDomain = import.meta.env.VITE_CLERK_SIGN_IN_URL || "https://sure-oarfish-90.accounts.dev";
    signInUrl = `${stagingDomain}/sign-in`;
    signUpUrl = `${stagingDomain}/sign-up`;
    unauthorizedSignInUrl = `${stagingDomain}/unauthorized-sign-in`;
  } else {
    // Development
    signInUrl = "https://sure-oarfish-90.accounts.dev/sign-in";
    signUpUrl = "https://sure-oarfish-90.accounts.dev/sign-up";
    unauthorizedSignInUrl = "https://sure-oarfish-90.accounts.dev/unauthorized-sign-in";
  }

  return (
    <ClerkProvider 
      publishableKey={clerkPublishableKey}
      domain={typeof window !== 'undefined' ? window.location.hostname : undefined}
      // Use Clerk's hosted Account Portal (dev or prod based on environment)
      signInUrl={signInUrl}
      signUpUrl={signUpUrl}
      unauthorizedSignInUrl={unauthorizedSignInUrl}
      // Redirect to invite-required page after sign-up (users need to enter invite code)
      fallbackRedirectUrl={`${baseUrl}/invite-required`}
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
  );
}


