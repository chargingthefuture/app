import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertWorkforceRecruiterProfileSchema, type WorkforceRecruiterProfile } from "@shared/schema";
import { DeleteProfileDialog } from "@/components/delete-profile-dialog";
import { useLocation } from "wouter";
import { MiniAppBackButton } from "@/components/mini-app-back-button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { COUNTRIES } from "@/lib/countries";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const profileFormSchema = insertWorkforceRecruiterProfileSchema.omit({ userId: true });

type ProfileFormData = z.infer<typeof profileFormSchema>;

const EXPERIENCE_LEVELS = [
  { value: "entry", label: "Entry Level" },
  { value: "mid", label: "Mid Level" },
  { value: "senior", label: "Senior" },
  { value: "executive", label: "Executive" },
];

const REMOTE_PREFERENCES = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];

export default function WorkforceRecruiterProfile() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);

  const { data: profile, isLoading } = useQuery<WorkforceRecruiterProfile | null>({
    queryKey: ["/api/workforce-recruiter/profile"],
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: "",
      preferredName: "",
      currentRole: "",
      experienceLevel: "entry",
      yearsExperience: 0,
      preferredIndustries: "",
      preferredRoles: "",
      keySkills: "",
      country: "",
      city: "",
      remotePreference: "hybrid",
      relocationSupportNeeded: false,
      availabilityTimeline: "",
      supportNeeds: "",
      impactStatement: "",
      linkedinUrl: "",
      portfolioUrl: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        fullName: profile.fullName ?? "",
        preferredName: profile.preferredName ?? "",
        currentRole: profile.currentRole ?? "",
        experienceLevel: (profile.experienceLevel as ProfileFormData["experienceLevel"]) ?? "entry",
        yearsExperience: profile.yearsExperience ?? 0,
        preferredIndustries: profile.preferredIndustries ?? "",
        preferredRoles: profile.preferredRoles ?? "",
        keySkills: profile.keySkills ?? "",
        country: profile.country ?? "",
        city: profile.city ?? "",
        remotePreference: (profile.remotePreference as ProfileFormData["remotePreference"]) ?? "hybrid",
        relocationSupportNeeded: profile.relocationSupportNeeded ?? false,
        availabilityTimeline: profile.availabilityTimeline ?? "",
        supportNeeds: profile.supportNeeds ?? "",
        impactStatement: profile.impactStatement ?? "",
        linkedinUrl: profile.linkedinUrl ?? "",
        portfolioUrl: profile.portfolioUrl ?? "",
      });
    }
  }, [profile, form]);

  const createMutation = useMutation({
    mutationFn: (data: ProfileFormData) => apiRequest("POST", "/api/workforce-recruiter/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/profile"] });
      toast({
        title: "Profile Created",
        description: "Your Workforce Recruiter profile has been created successfully.",
      });
      setLocation("/apps/workforce-recruiter");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create profile",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProfileFormData) => apiRequest("PUT", "/api/workforce-recruiter/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/profile"] });
      toast({
        title: "Profile Updated",
        description: "Your Workforce Recruiter profile has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (reason?: string) => apiRequest("DELETE", "/api/workforce-recruiter/profile", { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/profile"] });
      setDeleteDialogOpen(false);
      toast({
        title: "Profile Deleted",
        description: "Your Workforce Recruiter profile has been deleted successfully.",
      });
      setLocation("/apps/workforce-recruiter");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete profile",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    const submitData: ProfileFormData = {
      ...data,
      preferredName: data.preferredName || null,
      currentRole: data.currentRole || null,
      preferredIndustries: data.preferredIndustries || null,
      preferredRoles: data.preferredRoles || null,
      keySkills: data.keySkills || null,
      country: data.country || null,
      city: data.city || null,
      availabilityTimeline: data.availabilityTimeline || null,
      supportNeeds: data.supportNeeds || null,
      impactStatement: data.impactStatement || null,
      linkedinUrl: data.linkedinUrl || null,
      portfolioUrl: data.portfolioUrl || null,
    } as ProfileFormData;

    if (profile) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const selectedCountry = form.watch("country");

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <MiniAppBackButton href="/apps/workforce-recruiter" label="Back to Workforce Recruiter" />
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-semibold">
          {profile ? "Edit Workforce Profile" : "Create Workforce Profile"}
        </h1>
        <p className="text-muted-foreground">
          Share how employers should understand your strengths, accessibility needs, and placement goals.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Provide enough detail for trauma-informed recruiters to advocate on your behalf.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Asha Daniels" data-testid="input-fullName" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="preferredName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Optional" data-testid="input-preferredName" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="currentRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Role or Focus</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Community advocate" data-testid="input-currentRole" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="experienceLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience Level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-experienceLevel">
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EXPERIENCE_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="yearsExperience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of Experience</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="5"
                          value={field.value ?? ""}
                          onChange={(event) => field.onChange(event.target.value === "" ? undefined : Number(event.target.value))}
                          data-testid="input-yearsExperience"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="remotePreference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Preference</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-remotePreference">
                            <SelectValue placeholder="Select preference" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {REMOTE_PREFERENCES.map((option) => (
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

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="preferredIndustries"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Industries</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Healthcare, community safety..." data-testid="textarea-preferredIndustries" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="preferredRoles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Roles</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Community liaison, logistics coordinator" data-testid="textarea-preferredRoles" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="keySkills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Skills & Certifications</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="List language access, technical skills, or care experience" data-testid="textarea-keySkills" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Country</FormLabel>
                      <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn("justify-between", !field.value && "text-muted-foreground")}
                              data-testid="select-country"
                            >
                              {field.value ? field.value : "Select country"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search countries…" />
                            <CommandEmpty>No country found.</CommandEmpty>
                            <CommandList>
                              {COUNTRIES.map((country) => (
                                <CommandItem
                                  key={country}
                                  onSelect={() => {
                                    field.onChange(country);
                                    setCountryOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      country === selectedCountry ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {country}
                                </CommandItem>
                              ))}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary City</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Nairobi" data-testid="input-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="relocationSupportNeeded"
                render={({ field }) => (
                  <FormItem className="flex items-start space-x-3 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-relocation"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Relocation or wraparound support needed</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Checking this flags recruiters to plan for additional travel, childcare, or wellness support.
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="availabilityTimeline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Availability Timeline</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Available from March 2026" data-testid="input-availability" />
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
                      <FormLabel>Accessibility / Support Needs</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Quiet workspace, flexible scheduling" data-testid="input-supportNeeds" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="impactStatement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Impact Statement</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Share how trauma-informed employment will sustain you and your community." data-testid="textarea-impactStatement" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="linkedinUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn or Professional Link</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://" data-testid="input-linkedinUrl" />
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
                      <FormLabel>Portfolio or Showcase Link</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Optional" data-testid="input-portfolioUrl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={isSubmitting} data-testid="button-submit">
                  {profile ? (isSubmitting ? "Saving..." : "Update Profile") : (isSubmitting ? "Creating..." : "Create Profile")}
                </Button>
                {profile && (
                  <>
                    <Button type="button" variant="outline" onClick={() => setLocation("/apps/workforce-recruiter")} data-testid="button-cancel">
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setDeleteDialogOpen(true)}
                      data-testid="button-delete-profile"
                    >
                      Delete Profile
                    </Button>
                  </>
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
