import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useClerk } from "@clerk/clerk-react";

export function LoginForm() {
  const { redirectToSignIn, redirectToSignUp } = useClerk();

  const handleSignIn = () => {
    // Redirect to Clerk's hosted Account Portal
    redirectToSignIn({
      redirectUrl: window.location.origin + '/',
    });
  };

  const handleSignUp = () => {
    // Redirect to Clerk's hosted Account Portal
    redirectToSignUp({
      redirectUrl: window.location.origin + '/invite-required',
    });
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <Button
        onClick={handleSignIn}
        className="w-full text-base font-semibold"
        data-testid="button-login"
      >
        <Lock className="mr-2 h-4 w-4" />
        Sign In Securely
      </Button>
      
      <Button
        onClick={handleSignUp}
        variant="outline"
        className="w-full text-base font-semibold"
        data-testid="button-signup"
      >
        Create Account
      </Button>
      
      <p className="text-xs text-center text-muted-foreground">
        Passwordless authentication available. No password needed.
      </p>
    </div>
  );
}

