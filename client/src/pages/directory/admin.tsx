import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { DirectoryProfile, User } from "@shared/schema";
import { ShieldCheck, Shield, Plus } from "lucide-react";

export default function DirectoryAdminPage() {
  const { toast } = useToast();
  const { data: profiles = [], isLoading } = useQuery<DirectoryProfile[]>({
    queryKey: ["/api/directory/admin/profiles"],
  });
  const { data: users = [] } = useQuery<User[]>({ queryKey: ["/api/admin/users"] });

  const [newDescription, setNewDescription] = useState("");
  const [newSkills, setNewSkills] = useState<string>("");
  const [newPublic, setNewPublic] = useState(false);

  const createUnclaimed = useMutation({
    mutationFn: async () => {
      const payload = {
        description: newDescription.trim(),
        skills: newSkills ? newSkills.split(",").map(s => s.trim()).filter(Boolean).slice(0,3) : [],
        isPublic: newPublic,
      };
      return apiRequest("POST", "/api/directory/admin/profiles", payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/directory/admin/profiles"] });
      setNewDescription(""); setNewSkills(""); setNewPublic(false);
      toast({ title: "Created", description: "Unclaimed Directory profile created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message || "Failed to create profile", variant: "destructive" })
  });

  const assignMutation = useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => apiRequest("PUT", `/api/directory/admin/profiles/${id}/assign`, { userId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/directory/admin/profiles"] });
      toast({ title: "Assigned", description: "Profile assigned to user" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message || "Failed to assign", variant: "destructive" })
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ id, isVerified }: { id: string; isVerified: boolean }) => apiRequest("PUT", `/api/directory/admin/profiles/${id}/verify`, { isVerified }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/directory/admin/profiles"] });
      toast({ title: "Updated", description: "Verification updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message || "Failed to update", variant: "destructive" })
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-2">Directory Admin</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Manage Directory profiles</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Create Unclaimed Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Description</Label>
            <Input value={newDescription} onChange={(e) => setNewDescription(e.target.value.slice(0,140))} placeholder="140 chars max" />
          </div>
          <div className="space-y-2">
            <Label>Skills (comma-separated, up to 3)</Label>
            <Input value={newSkills} onChange={(e) => setNewSkills(e.target.value)} placeholder="e.g. Cooking, Tutoring" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={newPublic} onCheckedChange={(v) => setNewPublic(!!v)} />
            <span>Make public</span>
          </label>
          <Button onClick={() => createUnclaimed.mutate()} disabled={!newDescription.trim() || createUnclaimed.isPending}>
            <Plus className="w-4 h-4 mr-2" /> {createUnclaimed.isPending ? "Creating…" : "Create"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Profiles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="text-muted-foreground py-6 text-center">Loading…</div>
          ) : profiles.length === 0 ? (
            <div className="text-muted-foreground py-6 text-center">No profiles</div>
          ) : (
            <div className="space-y-3">
              {profiles.map((p) => (
                <div key={p.id} className="rounded-md border p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {p.isVerified ? (
                        <Badge variant="secondary" className="gap-1"><ShieldCheck className="w-3 h-3" /> Verified</Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1"><Shield className="w-3 h-3" /> Unverified</Badge>
                      )}
                      {!p.isClaimed && (
                        <Badge variant="outline">Unclaimed</Badge>
                      )}
                    </div>
                    <div className="text-sm mt-1 truncate">{p.description}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {p.city || p.state || p.country ? [p.city, p.state, p.country].filter(Boolean).join(', ') : '—'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select className="border rounded h-9 px-2 text-sm" defaultValue="" onChange={(e) => e.target.value && assignMutation.mutate({ id: p.id, userId: e.target.value })}>
                      <option value="">Assign to user…</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{[u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || 'User'}</option>
                      ))}
                    </select>
                    <Button variant="outline" size="sm" onClick={() => verifyMutation.mutate({ id: p.id, isVerified: !p.isVerified })}>
                      {p.isVerified ? "Unverify" : "Verify"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
