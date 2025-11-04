import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useLocation } from "wouter";

export function LoginForm() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex flex-col items-center space-y-4">
      <Button
        onClick={() => setLocation("/sign-in")}
        className="w-full text-base font-semibold"
        data-testid="button-login"
      >
        <Lock className="mr-2 h-4 w-4" />
        Sign In Securely
      </Button>
      
      <p className="text-xs text-center text-muted-foreground">
        Passwordless authentication available. No password needed.
      </p>
    </div>
  );
}

