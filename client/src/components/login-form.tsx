import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

export function LoginForm() {
  const handleSignIn = () => {
    // Redirect to accounts portal sign-in
    window.location.href = 'https://accounts.app.chargingthefuture.com/sign-in';
  };

  const handleSignUp = () => {
    // Redirect to accounts portal sign-up
    window.location.href = 'https://accounts.app.chargingthefuture.com/sign-up';
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

