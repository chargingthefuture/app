import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { DirectoryProfile } from "@shared/schema";
import { ExternalLink, ShieldCheck, Shield, Check, X } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useExternalLink } from "@/hooks/useExternalLink";

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
  const { data: publicProfiles = [], isLoading: listLoading } = useQuery<any[]>({
    queryKey: ["/api/directory/list"],
    enabled: !!profile,
  });

  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [signalUrl, setSignalUrl] = useState("");
  const [quoraUrl, setQuoraUrl] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [country, setCountry] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [nickname, setNickname] = useState("");
  const [displayNameType, setDisplayNameType] = useState<'first' | 'nickname'>("first");

  const { openExternal, ExternalLinkDialog } = useExternalLink();

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
      setNickname(profile.nickname || "");
      setDisplayNameType((profile.displayNameType as 'first' | 'nickname') || "first");
      setIsEditing(false);
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
        country: country,
        nickname: nickname || null,
        displayNameType,
        isPublic,
      };
      return apiRequest("POST", "/api/directory/profile", payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/directory/profile"] });
      toast({ title: "Saved", description: "Directory profile created" });
      setIsEditing(false);
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
        country: country,
        nickname: nickname || null,
        displayNameType,
        isPublic,
      };
      return apiRequest("PUT", "/api/directory/profile", payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/directory/profile"] });
      toast({ title: "Saved", description: "Directory profile updated" });
      setIsEditing(false);
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
            <div className="flex items-center gap-2">
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} data-testid="button-edit-profile">Edit</Button>
              )}
              {shareUrl && (
                <Button variant="outline" size="sm" onClick={() => openExternal(shareUrl)} data-testid="button-share">
                  <ExternalLink className="w-4 h-4 mr-2" /> Share public link
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isEditing ? (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="mt-1">{description || "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Display Name</Label>
                <p className="mt-1">{displayNameType === 'nickname' ? (nickname || '—') : 'First name'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Skills</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {skills.length ? skills.map(s => (<Badge key={s} variant="secondary">{s}</Badge>)) : <span>—</span>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-muted-foreground">Signal</Label>
                  {signalUrl ? (
                    <Button variant="ghost" size="sm" onClick={() => openExternal(signalUrl)} className="justify-start px-0 text-primary mt-1">
                      <ExternalLink className="w-4 h-4 mr-2" /> Open Signal link
                    </Button>
                  ) : (
                    <div className="mt-1">—</div>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Quora</Label>
                  {quoraUrl ? (
                    <Button variant="ghost" size="sm" onClick={() => openExternal(quoraUrl)} className="justify-start px-0 text-primary">
                      <ExternalLink className="w-4 h-4 mr-2" /> Open Quora link
                    </Button>
                  ) : (
                    <div className="mt-1">—</div>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Location</Label>
                  <div className="mt-1">{[city, stateVal, country].filter(Boolean).join(', ') || '—'}</div>
                </div>
              </div>
            </div>
          ) : (
          <>
          <div className="space-y-2">
            <Label htmlFor="description">Short description ({remaining} left)</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value.slice(0, 140))} placeholder="What can you offer or what are you looking for?" />
          </div>

          <div className="space-y-2">
            <Label>Display Name</Label>
            <RadioGroup value={displayNameType} onValueChange={(v) => setDisplayNameType(v as any)} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="first" />
                <span>Use my first name</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="nickname" />
                <span>Use a nickname</span>
              </label>
            </RadioGroup>
            {displayNameType === 'nickname' && (
              <div className="space-y-2">
                <Label htmlFor="nickname">Nickname</Label>
                <Input id="nickname" value={nickname} onChange={(e) => setNickname(e.target.value.slice(0, 100))} placeholder="e.g. Sky" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label id="skills-label">Skills (up to 3) <span className="text-red-600">*</span></Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-haspopup="listbox"
                  aria-labelledby="skills-label"
                  data-testid="combo-skills-trigger"
                  className="w-full justify-between"
                >
                  {skills.length > 0 ? `${skills.length} selected` : "Select skills"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command shouldFilter>
                  <CommandInput placeholder="Search skills…" />
                  <CommandEmpty>No skills found.</CommandEmpty>
                  <CommandGroup>
                    {ALL_SKILLS.map((s) => {
                      const selected = skills.includes(s);
                      return (
                        <CommandItem
                          key={s}
                          value={s}
                          onSelect={() => toggleSkill(s)}
                          data-testid={`combo-skills-item-${s}`}
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

            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <Badge key={s} variant="secondary" className="pr-0">
                    <span className="mr-1">{s}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleSkill(s)}
                      className="h-5 w-5 ml-1"
                      aria-label={`Remove ${s}`}
                      data-testid={`button-remove-skill-${s}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
            {skills.length === 0 && (
              <p className="text-xs text-red-600" data-testid="help-skills-required">Select at least one skill.</p>
            )}
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
              <Label id="country-label">Country <span className="text-red-600">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-haspopup="listbox"
                    aria-labelledby="country-label"
                    data-testid="combo-country-trigger"
                    className="w-full justify-between"
                  >
                    {country || "Select country"}
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
                          onSelect={() => setCountry(c)}
                          data-testid={`combo-country-item-${c}`}
                          aria-selected={country === c}
                        >
                          <Check className={`mr-2 h-4 w-4 ${country === c ? "opacity-100" : "opacity-0"}`} />
                          <span>{c}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              {!country && (
                <p className="text-xs text-red-600" data-testid="help-country-required">Country is required.</p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {!profile ? (
              <Button onClick={() => createMutation.mutate()} disabled={skills.length === 0 || !country || createMutation.isPending} data-testid="button-create-directory-profile">
                {createMutation.isPending ? "Saving…" : "Create Profile"}
              </Button>
            ) : (
              <>
                <Button onClick={() => updateMutation.mutate()} disabled={skills.length === 0 || !country || updateMutation.isPending} data-testid="button-update-directory-profile">
                  {updateMutation.isPending ? "Saving…" : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={updateMutation.isPending} data-testid="button-cancel-edit">
                  Cancel
                </Button>
                <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending} data-testid="button-delete-directory-profile">
                  {deleteMutation.isPending ? "Deleting…" : "Delete Profile"}
                </Button>
              </>
            )}
          </div>
          </>
          )}
        </CardContent>
      </Card>

      <ExternalLinkDialog />

      {profile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Explore the Directory</CardTitle>
          </CardHeader>
          <CardContent>
            {listLoading ? (
              <div className="text-muted-foreground py-6 text-center">Loading…</div>
            ) : (
              (() => {
                const profilesToShow = (publicProfiles && publicProfiles.length > 0) ? publicProfiles : [profile];
                if (!profilesToShow || profilesToShow.length === 0) {
                  return <div className="text-muted-foreground py-6 text-center">No profiles yet</div>;
                }
                return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {profilesToShow.map((p: any) => {
                  // Compute displayName if not present
                  let computedName = p.displayName;
                  if (!computedName) {
                    if (p.displayNameType === 'nickname' && p.nickname) {
                      computedName = p.nickname;
                    }
                    if (!computedName && p.nickname) computedName = p.nickname;
                  }
                  return (
                  <div key={p.id} className="rounded-md border p-3 flex flex-col gap-2">
                    <div className="font-medium truncate">{computedName || '—'}</div>
                    <div className="flex items-center gap-2">
                      {p.isVerified ? (
                        <Badge variant="secondary" className="gap-1"><ShieldCheck className="w-3 h-3" /> Verified</Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1"><Shield className="w-3 h-3" /> Unverified</Badge>
                      )}
                    </div>
                    <div className="text-sm">{p.description}</div>
                    <div className="flex flex-wrap gap-2">
                      {p.skills?.map((s: string) => (<Badge key={s} variant="outline">{s}</Badge>))}
                    </div>
                    {p.signalUrl ? (
                      <div>
                        <Button variant="ghost" size="sm" onClick={() => openExternal(p.signalUrl)} className="justify-start px-0 text-primary">
                          <ExternalLink className="w-4 h-4 mr-2" /> Signal profile
                        </Button>
                      </div>
                    ) : null}
                    <div className="text-xs text-muted-foreground">
                      {[p.city, p.state, p.country].filter(Boolean).join(', ')}
                    </div>
                    <div>
                      <Button asChild variant="outline" size="sm" data-testid={`button-view-public-${p.id}`}>
                        <a href={`/apps/directory/public/${p.id}`}>View</a>
                      </Button>
                    </div>
                  </div>
                  );
                })}
              </div>
                );
              })()
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
