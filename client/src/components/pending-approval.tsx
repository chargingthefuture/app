import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

const QUORA_PROFILE_PREFIX = "https://quora.com/profile/";

// Extract handle from a full Quora URL
function extractHandle(url: string | null | undefined): string {
  if (!url) return "";
  // Remove the prefix if present
  const handle = url.replace(/^https?:\/\/(www\.)?quora\.com\/profile\//i, "").trim();
  return handle;
}

// Build full URL from handle
function buildFullUrl(handle: string): string | null {
  const trimmed = handle.trim();
  if (!trimmed) return null;
  // Remove any leading slashes or prefixes the user might have typed
  const cleanHandle = trimmed.replace(/^https?:\/\/(www\.)?quora\.com\/profile\//i, "").replace(/^\//, "");
  return `${QUORA_PROFILE_PREFIX}${cleanHandle}`;
}

export function PendingApproval() {
  const { user } = useAuth();
  const { toast } = useToast();
  const hasInitialized = useRef(false);
  
  // Extract handle from existing URL or start empty
  const [quoraHandle, setQuoraHandle] = useState(() => extractHandle(user?.quoraProfileUrl));
  const [lastSavedUrl, setLastSavedUrl] = useState(user?.quoraProfileUrl || "");

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

  // Sync state when user data changes
  useEffect(() => {
    if (user?.quoraProfileUrl !== undefined) {
      const handle = extractHandle(user.quoraProfileUrl);
      setQuoraHandle(handle);
      setLastSavedUrl(user.quoraProfileUrl || "");
      hasInitialized.current = true;
    }
  }, [user?.quoraProfileUrl]);

  // Auto-save on mount if user has a URL that hasn't been saved yet
  // This fixes the staging issue where URL might not be saved on page access
  useEffect(() => {
    if (hasInitialized.current && user?.quoraProfileUrl && user.quoraProfileUrl !== lastSavedUrl) {
      // User has a URL but it hasn't been tracked as saved - ensure it's saved
      // This handles cases where the URL exists in DB but wasn't properly tracked in state
      const fullUrl = buildFullUrl(quoraHandle);
      if (fullUrl && fullUrl === user.quoraProfileUrl && fullUrl !== lastSavedUrl) {
        // URL matches what's in DB, just update our tracking
        setLastSavedUrl(fullUrl);
      } else if (fullUrl && fullUrl !== lastSavedUrl) {
        // URL has changed, save it
        updateMutation.mutate(fullUrl);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.quoraProfileUrl]);

  const handleSave = () => {
    const fullUrl = buildFullUrl(quoraHandle);
    if (fullUrl && fullUrl !== lastSavedUrl) {
      updateMutation.mutate(fullUrl);
    } else if (!fullUrl && lastSavedUrl) {
      // User cleared the handle, save null
      updateMutation.mutate(null);
    }
  };

  const handleBlur = () => {
    // Auto-save on blur if the handle has changed
    const fullUrl = buildFullUrl(quoraHandle);
    if (fullUrl && fullUrl !== lastSavedUrl) {
      updateMutation.mutate(fullUrl);
    } else if (!fullUrl && lastSavedUrl) {
      // User cleared the handle, save null
      updateMutation.mutate(null);
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
            <Label htmlFor="quora-handle">
              Quora Profile URL <span className="text-muted-foreground">(required)</span>
            </Label>
            <div className="flex items-center gap-0">
              <div className="px-3 py-2 bg-muted border border-r-0 rounded-l-md text-sm text-muted-foreground whitespace-nowrap">
                {QUORA_PROFILE_PREFIX}
              </div>
              <Input
                id="quora-handle"
                type="text"
                placeholder="farah-brunache"
                value={quoraHandle}
                onChange={(e) => {
                  // Remove any prefixes the user might type
                  const value = e.target.value.replace(/^https?:\/\/(www\.)?quora\.com\/profile\//i, "").replace(/^\//, "");
                  setQuoraHandle(value);
                }}
                onBlur={handleBlur}
                className="rounded-l-none"
                data-testid="input-quora-handle"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter your Quora profile handle (e.g., "farah-brunache"). The full URL will be saved automatically.
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

