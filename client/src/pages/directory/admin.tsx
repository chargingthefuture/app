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
import { Plus, X, ExternalLink, Edit, Trash2 } from "lucide-react";
import { VerifiedBadge } from "@/components/verified-badge";
import { Textarea } from "@/components/ui/textarea";
import { COUNTRIES } from "@/lib/countries";
import { US_STATES } from "@/lib/usStates";
import { ALL_SKILLS } from "@/lib/skills";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check } from "lucide-react";
import { useExternalLink } from "@/hooks/useExternalLink";
import { Link } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
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
        city: newCity.trim() || null,
        state: newState.trim() || null,
        skills: newSkills.slice(0, 3),
        country: newCountry,
        isPublic: newPublic,
        displayNameType: 'first', // Default to 'first' for unclaimed profiles
      };
      const res = await apiRequest("POST", "/api/directory/admin/profiles", payload);
      return await res.json();
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/directory/admin/profiles"] });
      const profileId = data?.id;
      const wasPublic = newPublic;
      setNewDescription(""); setNewFirstName(""); setNewSignalUrl(""); setNewQuoraUrl(""); setNewCity(""); setNewState(""); setNewSkills([]); setNewPublic(false); setNewCountry("");
      if (profileId && wasPublic) {
        toast({ 
          title: "Created", 
          description: `Profile created. Public URL: ${window.location.origin}/apps/directory/public/${profileId}`,
          duration: 8000,
        });
      } else {
        toast({ title: "Created", description: "Unclaimed Directory profile created" });
      }
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

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<DirectoryProfile | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/directory/admin/profiles/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/directory/admin/profiles"] });
      setDeleteDialogOpen(false);
      setProfileToDelete(null);
      toast({ title: "Deleted", description: "Unclaimed profile deleted successfully" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message || "Failed to delete profile", variant: "destructive" });
      setDeleteDialogOpen(false);
      setProfileToDelete(null);
    }
  });

  const handleDeleteClick = (profile: DirectoryProfile) => {
    if (!profile.isClaimed) {
      setProfileToDelete(profile);
      setDeleteDialogOpen(true);
    }
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editFirstName, setEditFirstName] = useState("");
  const [editSignalUrl, setEditSignalUrl] = useState("");
  const [editQuoraUrl, setEditQuoraUrl] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [editPublic, setEditPublic] = useState(false);
  const [editCountry, setEditCountry] = useState<string>("");

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => apiRequest("PUT", `/api/directory/admin/profiles/${id}`, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/directory/admin/profiles"] });
      setEditingId(null);
      toast({ title: "Updated", description: "Profile updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message || "Failed to update profile", variant: "destructive" })
  });

  const startEdit = (profile: DirectoryProfile) => {
    setEditingId(profile.id);
    setEditDescription(profile.description || "");
    setEditFirstName(profile.firstName || "");
    setEditSignalUrl(profile.signalUrl || "");
    setEditQuoraUrl(profile.quoraUrl || "");
    setEditCity(profile.city || "");
    setEditState(profile.state || "");
    setEditSkills(profile.skills || []);
    setEditPublic(profile.isPublic || false);
    setEditCountry(profile.country || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdate = (id: string) => {
    const payload = {
      description: editDescription.trim() || null,
      firstName: editFirstName.trim() || null,
      signalUrl: editSignalUrl.trim() || null,
      quoraUrl: editQuoraUrl.trim() || null,
      city: editCity.trim() || null,
      state: editState.trim() || null,
      skills: editSkills.slice(0, 3),
      country: editCountry || null,
      isPublic: editPublic,
    };
    updateMutation.mutate({ id, data: payload });
  };

  const toggleEditSkill = (s: string) => {
    setEditSkills(prev => {
      if (prev.includes(s)) return prev.filter(x => x !== s);
      if (prev.length >= 3) {
        toast({ title: "Limit reached", description: "Select up to 3 skills", variant: "destructive" });
        return prev;
      }
      return [...prev, s];
    });
  };

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
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0 max-h-[80vh] flex flex-col" align="start">
                <Command shouldFilter>
                  <CommandInput placeholder="Search skills…" />
                  <CommandList>
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
                  </CommandList>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="new-city">City</Label>
              <Input id="new-city" value={newCity} onChange={(e) => setNewCity(e.target.value)} placeholder="City" data-testid="input-new-city" />
            </div>
            <div className="space-y-2">
              <Label id="new-state-label">US State (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-haspopup="listbox"
                    aria-labelledby="new-state-label"
                    data-testid="combo-state-trigger-admin"
                    className="w-full justify-between"
                  >
                    {newState || "Select US State"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command shouldFilter>
                    <CommandInput placeholder="Search US states…" />
                    <CommandEmpty>No states found.</CommandEmpty>
                    <CommandGroup>
                      {US_STATES.map((s) => (
                        <CommandItem
                          key={s}
                          value={s}
                          onSelect={() => setNewState(s)}
                          data-testid={`combo-state-item-admin-${s}`}
                          aria-selected={newState === s}
                        >
                          <Check className={`mr-2 h-4 w-4 ${newState === s ? "opacity-100" : "opacity-0"}`} />
                          <span>{s}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="space-y-2">
            <Label id="admin-country-label">Country <span className="text-red-600">*</span></Label>
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
              {profiles.map((p) => {
                const profileUser = p.userId ? users.find(u => u.id === p.userId) : null;
                const isVerified = profileUser?.isVerified || false;
                
                return editingId === p.id ? (
                  <Card key={p.id}>
                    <CardContent className="p-4 space-y-4">
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value.slice(0,140))} placeholder="140 chars max" rows={3} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`edit-first-name-${p.id}`}>First Name</Label>
                        <Input id={`edit-first-name-${p.id}`} value={editFirstName} onChange={(e) => setEditFirstName(e.target.value.slice(0, 100))} placeholder="First name for display" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`edit-signal-url-${p.id}`}>Signal URL</Label>
                        <Input id={`edit-signal-url-${p.id}`} type="url" value={editSignalUrl} onChange={(e) => setEditSignalUrl(e.target.value)} placeholder="https://signal.me/#p/…" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`edit-quora-url-${p.id}`}>Quora Profile URL</Label>
                        <Input id={`edit-quora-url-${p.id}`} type="url" value={editQuoraUrl} onChange={(e) => setEditQuoraUrl(e.target.value)} placeholder="https://www.quora.com/profile/…" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor={`edit-city-${p.id}`}>City</Label>
                          <Input id={`edit-city-${p.id}`} value={editCity} onChange={(e) => setEditCity(e.target.value)} placeholder="City" data-testid={`input-edit-city-${p.id}`} />
                        </div>
                        <div className="space-y-2">
                          <Label id={`edit-state-label-${p.id}`}>US State (Optional)</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-haspopup="listbox"
                                aria-labelledby={`edit-state-label-${p.id}`}
                                data-testid={`combo-state-edit-trigger-${p.id}`}
                                className="w-full justify-between"
                              >
                                {editState || "Select US State"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                              <Command shouldFilter>
                                <CommandInput placeholder="Search US states…" />
                                <CommandEmpty>No states found.</CommandEmpty>
                                <CommandGroup>
                                  {US_STATES.map((s) => (
                                    <CommandItem
                                      key={s}
                                      value={s}
                                      onSelect={() => setEditState(s)}
                                      data-testid={`combo-state-edit-item-${p.id}-${s}`}
                                      aria-selected={editState === s}
                                    >
                                      <Check className={`mr-2 h-4 w-4 ${editState === s ? "opacity-100" : "opacity-0"}`} />
                                      <span>{s}</span>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label id={`edit-skills-label-${p.id}`}>Skills (up to 3) <span className="text-red-600">*</span></Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" aria-haspopup="listbox" aria-labelledby={`edit-skills-label-${p.id}`} className="w-full justify-between">
                              {editSkills.length > 0 ? `${editSkills.length} selected` : "Select skills"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0 max-h-[80vh] flex flex-col" align="start">
                            <Command shouldFilter>
                              <CommandInput placeholder="Search skills…" />
                              <CommandList>
                              <CommandEmpty>No skills found.</CommandEmpty>
                              <CommandGroup>
                                {ALL_SKILLS.map((s) => {
                                  const selected = editSkills.includes(s);
                                  return (
                                    <CommandItem key={s} value={s} onSelect={() => toggleEditSkill(s)} aria-selected={selected}>
                                      <Check className={`mr-2 h-4 w-4 ${selected ? "opacity-100" : "opacity-0"}`} />
                                      <span>{s}</span>
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {editSkills.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {editSkills.map((s) => (
                              <Badge key={s} variant="outline" className="gap-1">
                                {s}
                                <button onClick={() => setEditSkills(prev => prev.filter(x => x !== s))} className="ml-1 hover:bg-muted rounded" aria-label={`Remove ${s}`}>
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label id={`edit-country-label-${p.id}`}>Country <span className="text-red-600">*</span></Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" aria-haspopup="listbox" aria-labelledby={`edit-country-label-${p.id}`} className="w-full justify-between">
                              {editCountry || "Select country"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                            <Command shouldFilter>
                              <CommandInput placeholder="Search countries…" />
                              <CommandEmpty>No countries found.</CommandEmpty>
                              <CommandGroup>
                                {COUNTRIES.map((c) => (
                                  <CommandItem key={c} value={c} onSelect={() => setEditCountry(c)} aria-selected={editCountry === c}>
                                    <Check className={`mr-2 h-4 w-4 ${editCountry === c ? "opacity-100" : "opacity-0"}`} />
                                    <span>{c}</span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox checked={editPublic} onCheckedChange={(v) => setEditPublic(!!v)} />
                        <span>Make public</span>
                      </label>
                      {(editPublic || p.isPublic) && (
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground">Public Profile URL</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              readOnly
                              value={`${window.location.origin}/apps/directory/public/${p.id}`}
                              className="font-mono text-xs"
                              data-testid={`input-public-url-${p.id}`}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openExternal(`${window.location.origin}/apps/directory/public/${p.id}`)}
                              data-testid={`button-view-public-${p.id}`}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Button onClick={() => handleUpdate(p.id)} disabled={editSkills.length === 0 || !editCountry || updateMutation.isPending} data-testid={`button-save-edit-${p.id}`}>
                            {updateMutation.isPending ? "Saving…" : "Save Changes"}
                          </Button>
                          <Button variant="outline" onClick={cancelEdit} disabled={updateMutation.isPending} data-testid={`button-cancel-edit-${p.id}`}>
                            <X className="w-4 h-4 mr-2" /> Cancel
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div key={p.id} className="rounded-md border p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {p.userId && <VerifiedBadge isVerified={isVerified} testId={`badge-verified-${p.id}`} />}
                        {!p.isClaimed && <Badge variant="outline">Unclaimed</Badge>}
                        {p.isPublic && (
                          <Badge variant="default" className="gap-1">
                            <ExternalLink className="w-3 h-3" /> Public
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm mt-1 truncate">{p.description}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {p.city || p.state || p.country ? [p.city, p.state, p.country].filter(Boolean).join(', ') : '—'}
                      </div>
                      {p.isPublic && (
                        <div className="mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openExternal(`${window.location.origin}/apps/directory/public/${p.id}`)}
                            className="text-primary text-xs h-auto p-0"
                            data-testid={`button-view-public-link-${p.id}`}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View Public Profile
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!p.isClaimed && (
                        <select 
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                          defaultValue="" 
                          onChange={(e) => e.target.value && assignMutation.mutate({ id: p.id, userId: e.target.value })}
                          data-testid={`select-assign-user-${p.id}`}
                        >
                          <option value="">Assign to user…</option>
                          {users.map(u => (
                            <option key={u.id} value={u.id}>{[u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || 'User'}</option>
                          ))}
                        </select>
                      )}
                      <Button variant="outline" size="sm" onClick={() => startEdit(p)} data-testid={`button-edit-${p.id}`}>
                        <Edit className="w-4 h-4 mr-2" /> Edit
                      </Button>
                      {!p.isClaimed && (
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDeleteClick(p)} 
                          data-testid={`button-delete-${p.id}`}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Unclaimed Profile</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Are you sure you want to delete this unclaimed profile? This action is permanent and cannot be undone.
              </p>
              {profileToDelete && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm font-medium">Profile Details:</p>
                  <p className="text-sm text-muted-foreground">{profileToDelete.description}</p>
                  {profileToDelete.firstName && (
                    <p className="text-sm text-muted-foreground">Name: {profileToDelete.firstName}</p>
                  )}
                  {profileToDelete.skills && profileToDelete.skills.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Skills: {profileToDelete.skills.join(", ")}
                    </p>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false);
                setProfileToDelete(null);
              }}
              disabled={deleteMutation.isPending}
              data-testid="button-cancel-delete"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => profileToDelete && deleteMutation.mutate(profileToDelete.id)}
              disabled={deleteMutation.isPending || !profileToDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Profile"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Announcements Section */}
      <Card>
        <CardHeader>
          <CardTitle>Announcements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Create and manage announcements for Directory.
          </p>
          <Link href="/apps/directory/admin/announcements">
            <Button className="w-full" data-testid="button-manage-announcements">
              Manage Announcements
            </Button>
          </Link>
        </CardContent>
      </Card>

      <ExternalLinkDialog />
    </div>
  );
}
