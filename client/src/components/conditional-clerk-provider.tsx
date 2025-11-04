import { ClerkProvider } from "@clerk/clerk-react";
import { ReactNode } from "react";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export function ConditionalClerkProvider({ children }: { children: ReactNode }) {
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

  return (
    <ClerkProvider 
      publishableKey={clerkPublishableKey}
      domain={typeof window !== 'undefined' ? window.location.hostname : undefined}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/"
      afterSignUpUrl="/"
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
