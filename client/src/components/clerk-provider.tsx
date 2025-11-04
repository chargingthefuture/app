import { ClerkProvider } from "@clerk/clerk-react";
import { ReactNode } from "react";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY environment variable");
}

export function AppClerkProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      {children}
    </ClerkProvider>
  );
}


