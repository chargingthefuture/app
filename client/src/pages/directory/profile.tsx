import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { DirectoryProfile } from "@shared/schema";
import { ExternalLink, ShieldCheck, Shield } from "lucide-react";

const ALL_SKILLS = [
  "Cooking",
  "Tutoring",
  "Childcare",
  "Counseling",
  "Job Search Help",
  "Resume Writing",
  "Ride Sharing",
  "Language Exchange",
  "Art & Crafts",
  "Tech Support",
];

export default function DirectoryProfilePage() {
  const { toast } = useToast();
  const { data: profile, isLoading } = useQuery<DirectoryProfile | null>({
    queryKey: ["/api/directory/profile"],
  });

  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [signalUrl, setSignalUrl] = useState("");
  const [quoraUrl, setQuoraUrl] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [country, setCountry] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingLink, setPendingLink] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDescription(profile.description || "");
      setSkills(profile.skills || []);
      setSignalUrl(profile.signalUrl || "");
      setQuoraUrl(profile.quoraUrl || "");
      setCity(profile.city || "");
      setStateVal(profile.state || "");
      setCountry(profile.country || "");
      setIsPublic(!!profile.isPublic);
    }
  }, [profile]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        description: description.trim(),
        skills,
        signalUrl: signalUrl || null,
        quoraUrl: quoraUrl || null,
        city: city || null,
        state: stateVal || null,
        country: country || null,
        isPublic,
      };
      return apiRequest("POST", "/api/directory/profile", payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/directory/profile"] });
      toast({ title: "Saved", description: "Directory profile created" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message || "Failed to create profile", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        description: description.trim(),
        skills,
        signalUrl: signalUrl || null,
        quoraUrl: quoraUrl || null,
        city: city || null,
        state: stateVal || null,
        country: country || null,
        isPublic,
      };
      return apiRequest("PUT", "/api/directory/profile", payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/directory/profile"] });
      toast({ title: "Saved", description: "Directory profile updated" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message || "Failed to update profile", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => apiRequest("DELETE", "/api/directory/profile"),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/directory/profile"] });
      setDescription(""); setSkills([]); setSignalUrl(""); setQuoraUrl(""); setCity(""); setStateVal(""); setCountry(""); setIsPublic(false);
      toast({ title: "Deleted", description: "Directory profile deleted" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message || "Failed to delete profile", variant: "destructive" });
    }
  });

  const remaining = useMemo(() => 140 - description.length, [description]);

  const toggleSkill = (s: string) => {
    setSkills(prev => {
      if (prev.includes(s)) return prev.filter(x => x !== s);
      if (prev.length >= 3) {
        toast({ title: "Limit reached", description: "Select up to 3 skills", variant: "destructive" });
        return prev;
      }
      return [...prev, s];
    });
  };

  const openExternal = (url: string) => {
    setPendingLink(url);
    setConfirmOpen(true);
  };

  const proceedOpen = () => {
    if (pendingLink) window.open(pendingLink, "_blank", "noopener,noreferrer");
    setConfirmOpen(false);
    setPendingLink(null);
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="text-center py-8 sm:py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const isVerified = !!profile?.isVerified;
  const badge = isVerified ? (
    <Badge className="gap-1" variant="secondary"><ShieldCheck className="w-3 h-3" /> Verified by Farah</Badge>
  ) : (
    <Badge className="gap-1" variant="outline"><Shield className="w-3 h-3" /> Unverified</Badge>
  );

  const shareUrl = profile?.isPublic ? `${window.location.origin}/apps/directory/public/${profile.id}` : null;

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-2">Directory Profile</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Connect and exchange skills with other survivors</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg sm:text-xl">Your Profile {badge}</CardTitle>
            {shareUrl && (
              <Button variant="outline" size="sm" onClick={() => openExternal(shareUrl)} data-testid="button-share">
                <ExternalLink className="w-4 h-4 mr-2" /> Share public link
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Short description ({remaining} left)</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value.slice(0, 140))} placeholder="What can you offer or what are you looking for?" />
          </div>

          <div className="space-y-2">
            <Label>Skills (up to 3)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALL_SKILLS.map(s => (
                <label key={s} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={skills.includes(s)} onCheckedChange={() => toggleSkill(s)} />
                  <span>{s}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="signal">Signal profile URL</Label>
              <Input id="signal" placeholder="https://signal.me/#p/…" value={signalUrl} onChange={(e) => setSignalUrl(e.target.value)} />
              {signalUrl && (
                <Button variant="ghost" size="sm" onClick={() => openExternal(signalUrl)} className="justify-start px-0 text-primary">
                  <ExternalLink className="w-4 h-4 mr-2" /> Open Signal link
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="quora">Quora profile URL</Label>
              <Input id="quora" placeholder="https://www.quora.com/profile/…" value={quoraUrl} onChange={(e) => setQuoraUrl(e.target.value)} />
              {quoraUrl && (
                <Button variant="ghost" size="sm" onClick={() => openExternal(quoraUrl)} className="justify-start px-0 text-primary">
                  <ExternalLink className="w-4 h-4 mr-2" /> Open Quora link
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <Label>Visibility</Label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={isPublic} onCheckedChange={(v) => setIsPublic(!!v)} />
                <span>Make my Directory profile public</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" value={stateVal} onChange={(e) => setStateVal(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {!profile ? (
              <Button onClick={() => createMutation.mutate()} disabled={!description.trim() || skills.length === 0 || createMutation.isPending} data-testid="button-create-directory-profile">
                {createMutation.isPending ? "Saving…" : "Create Profile"}
              </Button>
            ) : (
              <>
                <Button onClick={() => updateMutation.mutate()} disabled={!description.trim() || updateMutation.isPending} data-testid="button-update-directory-profile">
                  {updateMutation.isPending ? "Saving…" : "Save Changes"}
                </Button>
                <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending} data-testid="button-delete-directory-profile">
                  {deleteMutation.isPending ? "Deleting…" : "Delete Profile"}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Opening link in a new tab</DialogTitle>
            <DialogDescription>
              You are about to open this link in a new tab:
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 bg-muted rounded-md break-all text-sm">{pendingLink}</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={proceedOpen}>Open Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
