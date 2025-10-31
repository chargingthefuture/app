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
import { ShieldCheck, Shield, Plus, X, ExternalLink } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";
import { ALL_SKILLS } from "@/lib/skills";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check } from "lucide-react";
import { useExternalLink } from "@/hooks/useExternalLink";

export default function AdminDirectoryPage() {
  const { toast } = useToast();
  const { openExternal, ExternalLinkDialog } = useExternalLink();
  const { data: profiles = [], isLoading } = useQuery<DirectoryProfile[]>({
    queryKey: ["/api/directory/admin/profiles"],
  });
  const { data: users = [] } = useQuery<User[]>({ queryKey: ["/api/admin/users"] });

  const [newDescription, setNewDescription] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newSignalUrl, setNewSignalUrl] = useState("");
  const [newQuoraUrl, setNewQuoraUrl] = useState("");
  const [newSkills, setNewSkills] = useState<string[]>([]);
  const [newPublic, setNewPublic] = useState(false);
  const [newCountry, setNewCountry] = useState<string>("");

  const toggleSkill = (s: string) => {
    setNewSkills(prev => {
      if (prev.includes(s)) return prev.filter(x => x !== s);
      if (prev.length >= 3) {
        toast({ title: "Limit reached", description: "Select up to 3 skills", variant: "destructive" });
        return prev;
      }
      return [...prev, s];
    });
  };

  const createUnclaimed = useMutation({
    mutationFn: async () => {
      const payload = {
        description: newDescription.trim(),
        firstName: newFirstName.trim() || null,
        signalUrl: newSignalUrl.trim() || null,
        quoraUrl: newQuoraUrl.trim() || null,
        skills: newSkills.slice(0, 3),
        country: newCountry,
        isPublic: newPublic,
        displayNameType: 'first', // Default to 'first' for unclaimed profiles
      };
      return apiRequest("POST", "/api/directory/admin/profiles", payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/directory/admin/profiles"] });
      setNewDescription(""); setNewFirstName(""); setNewSignalUrl(""); setNewQuoraUrl(""); setNewSkills([]); setNewPublic(false); setNewCountry("");
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

  // Seed functionality removed - use scripts/seedDirectory.ts

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
            <Label htmlFor="new-first-name">First Name</Label>
            <Input 
              id="new-first-name"
              value={newFirstName} 
              onChange={(e) => setNewFirstName(e.target.value.slice(0, 100))} 
              placeholder="First name for display" 
              data-testid="input-new-first-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-signal-url">Signal URL</Label>
            <Input 
              id="new-signal-url"
              type="url"
              value={newSignalUrl} 
              onChange={(e) => setNewSignalUrl(e.target.value)} 
              placeholder="https://signal.me/#p/…" 
              data-testid="input-new-signal-url"
            />
            {newSignalUrl && (
              <Button variant="ghost" size="sm" onClick={() => openExternal(newSignalUrl)} className="justify-start px-0 text-primary" data-testid="button-preview-signal-admin">
                <ExternalLink className="w-4 h-4 mr-2" /> Open Signal link
              </Button>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-quora-url">Quora Profile URL</Label>
            <Input 
              id="new-quora-url"
              type="url"
              value={newQuoraUrl} 
              onChange={(e) => setNewQuoraUrl(e.target.value)} 
              placeholder="https://www.quora.com/profile/…" 
              data-testid="input-new-quora-url"
            />
            {newQuoraUrl && (
              <Button variant="ghost" size="sm" onClick={() => openExternal(newQuoraUrl)} className="justify-start px-0 text-primary" data-testid="button-preview-quora-admin">
                <ExternalLink className="w-4 h-4 mr-2" /> Open Quora link
              </Button>
            )}
          </div>
          <div className="space-y-2">
            <Label id="admin-skills-label">Skills (up to 3) <span className="text-red-600">*</span></Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-haspopup="listbox"
                  aria-labelledby="admin-skills-label"
                  data-testid="combo-admin-skills-trigger"
                  className="w-full justify-between"
                >
                  {newSkills.length > 0 ? `${newSkills.length} selected` : "Select skills"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command shouldFilter>
                  <CommandInput placeholder="Search skills…" />
                  <CommandEmpty>No skills found.</CommandEmpty>
                  <CommandGroup>
                    {ALL_SKILLS.map((s) => {
                      const selected = newSkills.includes(s);
                      return (
                        <CommandItem
                          key={s}
                          value={s}
                          onSelect={() => toggleSkill(s)}
                          data-testid={`combo-admin-skills-item-${s}`}
                          aria-selected={selected}
                        >
                          <Check className={`mr-2 h-4 w-4 ${selected ? "opacity-100" : "opacity-0"}`} />
                          <span>{s}</span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>

            {newSkills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {newSkills.map((s) => (
                  <Badge key={s} variant="outline" className="gap-1">
                    {s}
                    <button
                      onClick={() => setNewSkills(prev => prev.filter(x => x !== s))}
                      className="ml-1 hover:bg-muted rounded"
                      data-testid={`button-remove-skill-${s}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            {newSkills.length === 0 && (
              <p className="text-xs text-red-600" data-testid="help-admin-skills-required">Select at least one skill.</p>
            )}
          </div>
          <div className="space-y-2">
            <Label id="admin-country-label">Country</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-haspopup="listbox"
                  aria-labelledby="admin-country-label"
                  data-testid="combo-country-trigger-admin"
                  className="w-full justify-between"
                >
                  {newCountry || "Select country"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command shouldFilter>
                  <CommandInput placeholder="Search countries…" />
                  <CommandEmpty>No countries found.</CommandEmpty>
                  <CommandGroup>
                    {COUNTRIES.map((c) => (
                      <CommandItem
                        key={c}
                        value={c}
                        onSelect={() => setNewCountry(c)}
                        data-testid={`combo-country-item-admin-${c}`}
                        aria-selected={newCountry === c}
                      >
                        <Check className={`mr-2 h-4 w-4 ${newCountry === c ? "opacity-100" : "opacity-0"}`} />
                        <span>{c}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={newPublic} onCheckedChange={(v) => setNewPublic(!!v)} />
            <span>Make public</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
          <Button data-testid="button-admin-create-unclaimed" onClick={() => createUnclaimed.mutate()} disabled={newSkills.length === 0 || !newCountry || createUnclaimed.isPending}>
            <Plus className="w-4 h-4 mr-2" /> {createUnclaimed.isPending ? "Creating…" : "Create"}
          </Button>
          </div>
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

      <ExternalLinkDialog />
    </div>
  );
}
