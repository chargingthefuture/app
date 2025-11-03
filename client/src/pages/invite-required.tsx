import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Ticket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function InviteRequired() {
  const { toast } = useToast();
  const [inviteCode, setInviteCode] = useState("");
  const [, setLocation] = useLocation();

  const submitMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/redeem-invite", {
        code: inviteCode.trim().toUpperCase(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Welcome!",
        description: "Your invite code has been validated. Welcome to the platform.",
      });
      // Redirect to home page to trigger router update
      setTimeout(() => setLocation("/"), 100);
    },
    onError: (error: Error) => {
      toast({
        title: "Invalid Code",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Ticket className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Invite Code Required</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              This platform is invite-only for your security. Please enter your invite code to continue.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="invite-code">Invite Code</Label>
            <Input
              id="invite-code"
              placeholder="Enter your 12-character code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="font-mono tracking-wider text-center text-lg"
              maxLength={12}
              data-testid="input-invite-code"
            />
            <p className="text-xs text-muted-foreground">
              Contact your support coordinator if you don't have an invite code.
            </p>
          </div>

          <Button
            onClick={() => submitMutation.mutate()}
            disabled={inviteCode.length !== 12 || submitMutation.isPending}
            className="w-full h-12 text-base font-semibold"
            data-testid="button-submit-invite"
          >
            {submitMutation.isPending ? "Validating..." : "Submit Code"}
          </Button>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4 border-t">
            <Lock className="w-3 h-3" />
            <span>Secure & Private Access</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
