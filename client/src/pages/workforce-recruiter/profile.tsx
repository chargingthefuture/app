import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { WorkforceRecruiterProfile } from "@shared/schema";
import {
  insertWorkforceRecruiterProfileSchema,
} from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { ChevronDown } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { DeleteProfileDialog } from "@/components/delete-profile-dialog";

const profileFormSchema = insertWorkforceRecruiterProfileSchema.omit({ userId: true });
type ProfileFormValues = z.infer<typeof profileFormSchema>;

const organizationTypeOptions = [
  { value: "nonprofit", label: "Nonprofit" },
  { value: "mutual_aid", label: "Mutual Aid" },
  { value: "cooperative", label: "Cooperative" },
  { value: "collective", label: "Collective" },
  { value: "coalition", label: "Coalition" },
  { value: "other", label: "Other" },
];

const communicationOptions = [
  { value: "signal", label: "Signal" },
  { value: "email", label: "Email" },
  { value: "matrix", label: "Matrix" },
  { value: "phone", label: "Phone" },
];

export default function WorkforceRecruiterProfilePage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: profile, isLoading } = useQuery<WorkforceRecruiterProfile | null>({
    queryKey: ["/api/workforce-recruiter/profile"],
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      organizationName: "",
      organizationType: "nonprofit",
      missionStatement: "",
      primaryIndustries: "",
      regionsServed: "",
      country: "",
      city: "",
      intakeCapacity: 0,
      contactEmail: "",
      contactSignal: "",
      website: "",
      preferredCommunication: "signal",
      talentNeeds: "",
      supportNeeded: "",
      partnershipPreferences: "",
      isAcceptingCandidates: true,
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        organizationName: profile.organizationName ?? "",
        organizationType: profile.organizationType ?? "nonprofit",
        missionStatement: profile.missionStatement ?? "",
        primaryIndustries: profile.primaryIndustries ?? "",
        regionsServed: profile.regionsServed ?? "",
        country: profile.country ?? "",
        city: profile.city ?? "",
        intakeCapacity: profile.intakeCapacity ?? 0,
        contactEmail: profile.contactEmail ?? "",
        contactSignal: profile.contactSignal ?? "",
        website: profile.website ?? "",
        preferredCommunication: profile.preferredCommunication ?? "signal",
        talentNeeds: profile.talentNeeds ?? "",
        supportNeeded: profile.supportNeeded ?? "",
        partnershipPreferences: profile.partnershipPreferences ?? "",
        isAcceptingCandidates: profile.isAcceptingCandidates ?? true,
      });
    }
  }, [profile, form]);

  const createMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("POST", "/api/workforce-recruiter/profile", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/profile"] });
      toast({ title: "Profile saved", description: "Workforce Recruiter profile created" });
      setLocation("/apps/workforce-recruiter");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PUT", "/api/workforce-recruiter/profile", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/profile"] });
      toast({ title: "Profile updated", description: "Details saved successfully" });
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
    mutationFn: async (reason?: string) => {
      const res = await apiRequest("DELETE", "/api/workforce-recruiter/profile", { reason });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/profile"] });
      setDeleteDialogOpen(false);
      toast({
        title: "Profile deleted",
        description: "You can create a new profile whenever you're ready.",
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

  const onSubmit = (data: ProfileFormValues) => {
    if (profile) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold mb-2">
          {profile ? "Edit Workforce Recruiter Profile" : "Create Workforce Recruiter Profile"}
        </h1>
        <p className="text-muted-foreground">
          Share how your mini-app or initiative supports placements so other admins can collaborate quickly.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="organizationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-organization-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="organizationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-organization-type">
                            <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {organizationTypeOptions.map((option) => (
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
                  name="intakeCapacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Intake Capacity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          data-testid="input-intake-capacity"
                          value={field.value ?? ""}
                          onChange={(event) => {
                            const value = event.target.value;
                            field.onChange(value === "" ? undefined : Number(value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="missionStatement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mission Statement</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={4}
                        data-testid="textarea-mission"
                        placeholder="How does your team support survivor-friendly work placements?"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="primaryIndustries"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industries Supported</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          data-testid="input-industries"
                          placeholder="Healthcare, Logistics, Advocacy..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="regionsServed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Regions Served</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          data-testid="input-regions"
                          placeholder="Pacific Northwest, Remote, etc."
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
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-city" />
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
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="justify-between"
                              data-testid="button-country"
                            >
                              {field.value ? field.value : "Select country"}
                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search country..." />
                            <CommandEmpty>No country found.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-y-auto">
                              {COUNTRIES.map((country) => (
                                <CommandItem
                                  key={country}
                                  value={country}
                                  onSelect={() => field.onChange(country)}
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
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" data-testid="input-contact-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactSignal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Signal Link</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-contact-signal" placeholder="https://signal.me/#p/..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website or Linktree</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-website" placeholder="https://example.org" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="preferredCommunication"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Communication</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-communication">
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {communicationOptions.map((option) => (
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
                  name="isAcceptingCandidates"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-1">
                        <FormLabel>Accepting candidates</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Toggle off when you need to pause intake.
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-accepting"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="talentNeeds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Talent Needs</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        data-testid="textarea-talent-needs"
                        rows={3}
                        placeholder="What types of candidates or roles are you supporting this quarter?"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supportNeeded"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Support Needed from Platform</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        data-testid="textarea-support-needed"
                        rows={3}
                        placeholder="Training, sourcing, tooling, messaging, etc."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="partnershipPreferences"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partnership Preferences</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        data-testid="textarea-partnership-preferences"
                        rows={3}
                        placeholder="How should other admins collaborate with you?"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit-workforce-profile"
                  >
                    {profile ? "Update Profile" : "Create Profile"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    asChild
                    data-testid="button-cancel-workforce-profile"
                  >
                    <Link href="/apps/workforce-recruiter">Cancel</Link>
                  </Button>
                </div>
                {profile && (
                  <Button
                    type="button"
                    variant="destructive"
                    data-testid="button-delete-workforce-profile"
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={deleteMutation.isPending}
                  >
                    Delete Profile
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
