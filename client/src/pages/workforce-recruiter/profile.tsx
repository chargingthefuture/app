import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { DeleteProfileDialog } from "@/components/delete-profile-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { countries } from "@/lib/countries";
import {
  insertWorkforceRecruiterProfileSchema,
  type WorkforceRecruiterProfile,
} from "@shared/schema";

const profileFormSchema = insertWorkforceRecruiterProfileSchema.omit({
  userId: true,
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

export default function WorkforceRecruiterProfile() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: profile, isLoading } = useQuery<WorkforceRecruiterProfile | null>({
    queryKey: ["/api/workforce-recruiter/profile"],
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: "",
      organization: "",
      role: "",
      missionFocus: "",
      focusRegions: "",
      focusIndustries: "",
      country: "United States",
      state: "",
      city: "",
      timezone: "",
      contactEmail: "",
      contactPhone: "",
      signalHandle: "",
      preferredContactMethod: "signal",
      capacity: 5,
      availabilityStatus: "open",
      acceptsInternational: false,
      languages: "",
      linkedinUrl: "",
      websiteUrl: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        fullName: profile.fullName ?? "",
        organization: profile.organization ?? "",
        role: profile.role ?? "",
        missionFocus: profile.missionFocus ?? "",
        focusRegions: profile.focusRegions ?? "",
        focusIndustries: profile.focusIndustries ?? "",
        country: profile.country ?? "United States",
        state: profile.state ?? "",
        city: profile.city ?? "",
        timezone: profile.timezone ?? "",
        contactEmail: profile.contactEmail ?? "",
        contactPhone: profile.contactPhone ?? "",
        signalHandle: profile.signalHandle ?? "",
        preferredContactMethod: profile.preferredContactMethod ?? "signal",
        capacity: profile.capacity ?? 5,
        availabilityStatus: profile.availabilityStatus ?? "open",
        acceptsInternational: profile.acceptsInternational ?? false,
        languages: profile.languages ?? "",
        linkedinUrl: profile.linkedinUrl ?? "",
        websiteUrl: profile.websiteUrl ?? "",
        notes: profile.notes ?? "",
      });
    }
  }, [profile, form]);

  const createMutation = useMutation({
    mutationFn: (data: ProfileFormData) =>
      apiRequest("POST", "/api/workforce-recruiter/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/profile"] });
      toast({
        title: "Profile created",
        description: "You're ready to accept new opportunities.",
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
    mutationFn: (data: ProfileFormData) =>
      apiRequest("PUT", "/api/workforce-recruiter/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/profile"] });
      toast({
        title: "Profile updated",
        description: "Your availability has been refreshed.",
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
    mutationFn: (reason?: string) =>
      apiRequest("DELETE", "/api/workforce-recruiter/profile", { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/profile"] });
      toast({
        title: "Profile deleted",
        description: "You can recreate it anytime.",
      });
      setDeleteDialogOpen(false);
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
    if (profile) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold">
          {profile ? "Update Workforce Recruiter Profile" : "Create Workforce Recruiter Profile"}
        </h1>
        <p className="text-muted-foreground">
          Keep this up-to-date so survivors know when you’re available to support.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-fullName" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="organization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-organization" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-role" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="preferredContactMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred contact method</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-contact-method">
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="signal">Signal</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="missionFocus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mission focus</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="Describe your trauma-informed hiring lens"
                        data-testid="textarea-missionFocus"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="focusRegions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Focus regions</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Pacific Northwest"
                          data-testid="input-focusRegions"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="focusIndustries"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Focus industries</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Clean tech, Policy"
                          data-testid="input-focusIndustries"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-country">
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.code} value={country.name}>
                              {country.name}
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
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State / Region</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-state" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., PST" data-testid="input-timezone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} data-testid="input-contactEmail" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-contactPhone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="signalHandle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Signal link</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://signal.me/#..." data-testid="input-signalHandle" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly placements capacity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value ?? ""}
                          onChange={(event) => field.onChange(event.target.value ? Number(event.target.value) : undefined)}
                          data-testid="input-capacity"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="availabilityStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Availability</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-availability">
                            <SelectValue placeholder="Select availability" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="limited">Limited</SelectItem>
                          <SelectItem value="waitlist">Waitlist</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="acceptsInternational"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <FormLabel>Accept international placements</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-acceptsInternational"
                          />
                          <span className="text-sm text-muted-foreground">
                            Ready for cross-border work
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
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
                  name="linkedinUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://linkedin.com/in/..." data-testid="input-linkedinUrl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="websiteUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://example.org" data-testid="input-websiteUrl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} data-testid="textarea-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit"
                >
                  {profile ? "Update profile" : "Create profile"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/apps/workforce-recruiter")}
                  data-testid="button-cancel"
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
