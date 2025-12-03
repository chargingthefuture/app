import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

export function PendingApproval() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [quoraProfileUrl, setQuoraProfileUrl] = useState(user?.quoraProfileUrl || "");
  const [lastSavedUrl, setLastSavedUrl] = useState(user?.quoraProfileUrl || "");

  // Sync state when user data changes
  useEffect(() => {
    if (user?.quoraProfileUrl !== undefined) {
      setQuoraProfileUrl(user.quoraProfileUrl || "");
      setLastSavedUrl(user.quoraProfileUrl || "");
    }
  }, [user?.quoraProfileUrl]);

  const updateMutation = useMutation({
    mutationFn: async (url: string | null) => {
      const res = await apiRequest("PUT", "/api/user/quora-profile-url", { quoraProfileUrl: url });
      // API endpoint returns the updated user object as JSON
      return await res.json();
    },
    onSuccess: async (user, savedUrl) => {
      // Update lastSavedUrl with the URL that was saved (from mutation variables)
      setLastSavedUrl(savedUrl || "");
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ 
        title: "Saved", 
        description: "Your Quora profile URL has been saved." 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to save Quora profile URL", 
        variant: "destructive" 
      });
    },
  });

  const handleSave = () => {
    const trimmedUrl = quoraProfileUrl.trim() || null;
    if (trimmedUrl !== lastSavedUrl) {
      updateMutation.mutate(trimmedUrl);
    }
  };

  const handleBlur = () => {
    // Auto-save on blur if the URL has changed
    const trimmedUrl = quoraProfileUrl.trim() || null;
    if (trimmedUrl !== lastSavedUrl && trimmedUrl !== "") {
      updateMutation.mutate(trimmedUrl);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Access Pending</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your account is pending approval. An administrator will review your request shortly.
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="quora-profile-url">
              Quora Profile URL <span className="text-muted-foreground">(required)</span>
            </Label>
            <Input
              id="quora-profile-url"
              type="url"
              placeholder="https://www.quora.com/profile/YourName"
              value={quoraProfileUrl}
              onChange={(e) => setQuoraProfileUrl(e.target.value)}
              onBlur={handleBlur}
              data-testid="input-quora-profile-url"
            />
            <p className="text-xs text-muted-foreground">
              Please provide your Quora profile URL to help with the approval process.
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="w-full"
            data-testid="button-save-quora-url"
          >
            {updateMutation.isPending ? "Saving..." : "Save Quora Profile URL"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

