import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Lock, ArrowRight } from "lucide-react";

export function LoginForm() {
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSignIn = () => {
    setRedirectUrl('https://accounts.app.chargingthefuture.com/sign-in');
    setIsDialogOpen(true);
  };

  const handleSignUp = () => {
    setRedirectUrl('https://accounts.app.chargingthefuture.com/sign-up');
    setIsDialogOpen(true);
  };

  const handleConfirmRedirect = () => {
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setRedirectUrl(null);
  };

  return (
    <>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redirecting to Accounts Portal</DialogTitle>
            <DialogDescription>
              You are about to be redirected to the accounts portal. This will take you to an external site to sign in or create an account.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground break-all">{redirectUrl}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} data-testid="button-cancel-redirect">
              Cancel
            </Button>
            <Button onClick={handleConfirmRedirect} data-testid="button-confirm-redirect">
              <ArrowRight className="w-4 h-4 mr-2" />
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

