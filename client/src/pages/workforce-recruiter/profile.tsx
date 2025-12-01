import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import {
  insertWorkforceRecruiterProfileSchema,
  type WorkforceRecruiterProfile,
} from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { countries } from "@/lib/countries";
import { DeleteProfileDialog } from "@/components/delete-profile-dialog";
import { MiniAppBackButton } from "@/components/mini-app-back-button";
import { Briefcase } from "lucide-react";

const profileFormSchema = insertWorkforceRecruiterProfileSchema.omit({ userId: true });
type ProfileFormData = z.infer<typeof profileFormSchema>;

const availabilityOptions = [
  { value: "immediately_available", label: "Available now" },
  { value: "two_weeks", label: "Available in ~2 weeks" },
  { value: "exploring_opportunities", label: "Exploring opportunities" },
  { value: "not_available", label: "Not available" },
] as const;

const workSettingOptions = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "on_site", label: "On-site" },
  { value: "flexible", label: "Flexible" },
] as const;

const defaultValues: ProfileFormData = {
  displayName: "",
  headline: "",
  summary: "",
  availabilityStatus: "immediately_available",
  preferredWorkSetting: "remote",
  preferredRoleTypes: "",
  yearsExperience: undefined,
  primarySkills: "",
  supportNeeds: "",
  focusAreas: "",
  languages: "",
  city: "",
  state: "",
  country: "",
  timezone: "",
  openToRemote: true,
  openToRelocation: false,
  profileVisibility: true,
  highlightedIndustries: "",
  resumeUrl: "",
  portfolioUrl: "",
  signalUrl: "",
  safetyNotes: "",
};

export default function WorkforceRecruiterProfile() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [countryPopoverOpen, setCountryPopoverOpen] = useState(false);

  const { data: profile, isLoading } = useQuery<WorkforceRecruiterProfile | null>({
    queryKey: ["/api/workforce-recruiter/profile"],
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        displayName: profile.displayName || "",
        headline: profile.headline || "",
        summary: profile.summary || "",
        availabilityStatus: (profile.availabilityStatus as ProfileFormData["availabilityStatus"]) || "immediately_available",
        preferredWorkSetting: (profile.preferredWorkSetting as ProfileFormData["preferredWorkSetting"]) || "remote",
        preferredRoleTypes: profile.preferredRoleTypes || "",
        yearsExperience: profile.yearsExperience ?? undefined,
        primarySkills: profile.primarySkills || "",
        supportNeeds: profile.supportNeeds || "",
        focusAreas: profile.focusAreas || "",
        languages: profile.languages || "",
        city: profile.city || "",
        state: profile.state || "",
        country: profile.country || "",
        timezone: profile.timezone || "",
        openToRemote: profile.openToRemote,
        openToRelocation: profile.openToRelocation,
        profileVisibility: profile.profileVisibility,
        highlightedIndustries: profile.highlightedIndustries || "",
        resumeUrl: profile.resumeUrl || "",
        portfolioUrl: profile.portfolioUrl || "",
        signalUrl: profile.signalUrl || "",
        safetyNotes: profile.safetyNotes || "",
      });
    } else {
      form.reset(defaultValues);
    }
  }, [profile, form]);

  const createMutation = useMutation({
    mutationFn: (data: ProfileFormData) => apiRequest("POST", "/api/workforce-recruiter/profile", data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/profile"] });
      toast({
        title: "Profile created",
        description: "Your Workforce Recruiter profile is live.",
      });
      setLocation("/apps/workforce-recruiter");
    },
    onError: (error: any) => {
      toast({
        title: "Error creating profile",
        description: error.message || "Unable to create profile",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProfileFormData) => apiRequest("PUT", "/api/workforce-recruiter/profile", data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/profile"] });
      toast({
        title: "Profile updated",
        description: "Your Workforce Recruiter profile was saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating profile",
        description: error.message || "Unable to update profile",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (reason?: string) => apiRequest("DELETE", "/api/workforce-recruiter/profile", { reason }),
    onSuccess: async () => {
      setDeleteDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/profile"] });
      toast({
        title: "Profile deleted",
        description: "Your Workforce Recruiter profile was removed.",
      });
      setLocation("/apps/workforce-recruiter");
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting profile",
        description: error.message || "Unable to delete profile",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    if (profile) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="text-center text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <MiniAppBackButton />

      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Briefcase className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold">
            {profile ? "Edit Workforce Recruiter Profile" : "Create Workforce Recruiter Profile"}
          </h1>
          <p className="text-muted-foreground">
            Share the skills, accommodations, and safety needs recruiters must honor.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile information</CardTitle>
          <CardDescription>Only vetted allies see your profile. You stay in control of what is shared.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Camila R." data-testid="input-displayName" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="headline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Headline</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Restoration specialist & peer mentor" data-testid="input-headline" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Summary</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={4}
                        placeholder="Explain the work you enjoy, trauma-informed accommodations, and your goals."
                        data-testid="textarea-summary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="availabilityStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Availability</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-availability">
                            <SelectValue placeholder="Select availability" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availabilityOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferredWorkSetting"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred work setting</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-worksetting">
                            <SelectValue placeholder="Select work setting" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {workSettingOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="preferredRoleTypes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred roles</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. food sovereignty, fab-lab assistant" data-testid="input-preferredRoleTypes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="yearsExperience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of experience</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(event) => field.onChange(event.target.value ? Number(event.target.value) : undefined)}
                          data-testid="input-yearsExperience"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="primarySkills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary skills</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} data-testid="textarea-primarySkills" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="supportNeeds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Support & accommodations</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} data-testid="textarea-supportNeeds" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="focusAreas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Focus areas</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} data-testid="textarea-focusAreas" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="languages"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Languages</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="English, Spanish" data-testid="input-languages" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="highlightedIndustries"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industries you trust</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Co-ops, maker labs, mutual aid" data-testid="input-highlightedIndustries" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Portland" data-testid="input-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State/Region</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Oregon" data-testid="input-state" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Popover open={countryPopoverOpen} onOpenChange={setCountryPopoverOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="justify-between"
                              data-testid="button-country-select"
                            >
                              {field.value ? field.value : "Select country"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-[280px]">
                          <Command>
                            <CommandInput placeholder="Search country..." />
                            <CommandEmpty>No country found.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {countries.map((country) => (
                                <CommandItem
                                  key={country}
                                  value={country}
                                  onSelect={(value) => {
                                    field.onChange(value);
                                    setCountryPopoverOpen(false);
                                  }}
                                  data-testid={`country-${country}`}
                                >
                                  {country}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="America/Los_Angeles" data-testid="input-timezone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="signalUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Signal link</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://signal.me/#p/+1234567890" data-testid="input-signalUrl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="resumeUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resume URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://example.com/resume.pdf" data-testid="input-resumeUrl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="portfolioUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Portfolio URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://example.com/portfolio" data-testid="input-portfolioUrl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="safetyNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Safety notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="Share any boundaries, communication needs, or alerts for staff."
                        data-testid="textarea-safetyNotes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="openToRemote"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border px-4 py-3">
                      <div>
                        <FormLabel className="text-base">Open to remote work</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Allies can offer remote-first opportunities.
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-openToRemote" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="openToRelocation"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border px-4 py-3">
                      <div>
                        <FormLabel className="text-base">Open to relocation</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Allies can arrange travel and housing.
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-openToRelocation" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="profileVisibility"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border px-4 py-3">
                      <div>
                        <FormLabel className="text-base">Visible to allies</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Disable if you need to pause outreach.
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-profileVisibility" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={isSaving} data-testid="button-save-profile">
                  {profile ? "Update profile" : "Create profile"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/apps/workforce-recruiter")}
                  data-testid="button-cancel-profile"
                >
                  Cancel
                </Button>
                {profile && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                    data-testid="button-delete-profile"
                  >
                    Delete profile
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {profile && (
        <DeleteProfileDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={(reason) => deleteMutation.mutate(reason)}
          appName="Workforce Recruiter"
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
