import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { COUNTRIES } from "@/lib/countries";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DeleteProfileDialog } from "@/components/delete-profile-dialog";
import type { WorkforceRecruiterProfile } from "@shared/schema";
import { insertWorkforceRecruiterProfileSchema } from "@shared/schema";

const profileFormSchema = insertWorkforceRecruiterProfileSchema.omit({
  userId: true,
  createdAt: true,
  updatedAt: true,
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

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
      preferredName: "",
      preferredIndustry: "",
      preferredRole: "",
      experienceLevel: "entry",
      workPreference: "remote",
      availabilityStatus: "open",
      city: "",
      state: "",
      country: "United States",
      supportNeeds: "",
      certifications: "",
      languages: "",
      relocationReady: false,
      hasRemoteSetup: false,
      mentorshipInterest: false,
      summary: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        preferredName: profile.preferredName ?? "",
        preferredIndustry: profile.preferredIndustry ?? "",
        preferredRole: profile.preferredRole ?? "",
        experienceLevel: (profile.experienceLevel as ProfileFormValues["experienceLevel"]) ?? "entry",
        workPreference: (profile.workPreference as ProfileFormValues["workPreference"]) ?? "remote",
        availabilityStatus: (profile.availabilityStatus as ProfileFormValues["availabilityStatus"]) ?? "open",
        city: profile.city ?? "",
        state: profile.state ?? "",
        country: profile.country ?? "United States",
        supportNeeds: profile.supportNeeds ?? "",
        certifications: profile.certifications ?? "",
        languages: profile.languages ?? "",
        relocationReady: profile.relocationReady ?? false,
        hasRemoteSetup: profile.hasRemoteSetup ?? false,
        mentorshipInterest: profile.mentorshipInterest ?? false,
        summary: profile.summary ?? "",
      });
    }
  }, [profile, form]);

  const createMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      await apiRequest("POST", "/api/workforce-recruiter/profile", values);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/profile"] });
      toast({
        title: "Profile saved",
        description: "Your Workforce Recruiter profile is ready.",
      });
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
    mutationFn: async (values: ProfileFormValues) => {
      await apiRequest("PUT", "/api/workforce-recruiter/profile", values);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/profile"] });
      toast({
        title: "Profile updated",
        description: "Your profile changes are saved.",
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
    mutationFn: async (reason?: string) => {
      await apiRequest("DELETE", "/api/workforce-recruiter/profile", { reason });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/profile"] });
      setDeleteDialogOpen(false);
      toast({
        title: "Profile deleted",
        description: "We removed your Workforce Recruiter profile.",
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

  const onSubmit = (values: ProfileFormValues) => {
    if (profile) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-10">
            <p className="text-muted-foreground">Loading profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wide text-muted-foreground">
          Workforce Recruiter
        </p>
        <h1 className="text-3xl font-semibold">
          {profile ? "Update profile" : "Create profile"}
        </h1>
        <p className="text-muted-foreground">
          Share only the information that feels safe. Every field is designed to support trauma-aware placements.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>About you</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="preferredName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-preferred-name" placeholder="Preferred display name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="preferredRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred role</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-preferred-role" placeholder="e.g. Program coordinator" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="preferredIndustry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred industry</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-preferred-industry" placeholder="e.g. Healthcare, technology" />
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
                      <FormLabel>Experience level</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-experience-level">
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="entry">Entry</SelectItem>
                          <SelectItem value="mid">Mid</SelectItem>
                          <SelectItem value="senior">Senior</SelectItem>
                          <SelectItem value="executive">Executive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="workPreference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work preference</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-work-preference">
                            <SelectValue placeholder="Select preference" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="remote">Remote</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                          <SelectItem value="onsite">Onsite</SelectItem>
                        </SelectContent>
                      </Select>
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
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-availability-status">
                            <SelectValue placeholder="Select availability" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="open">Open to interview</SelectItem>
                          <SelectItem value="interviewing">Interviewing</SelectItem>
                          <SelectItem value="placed">Already placed</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                        </SelectContent>
                      </Select>
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
                        <Input {...field} data-testid="input-city" placeholder="City" />
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
                      <FormLabel>State / region</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-state" placeholder="State or region" />
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
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-country">
                            <SelectValue placeholder="Select a country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-64">
                          {COUNTRIES.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                    <FormLabel>Professional summary</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        data-testid="textarea-summary"
                        placeholder="Highlight work you enjoy, accessibility needs, or the kind of supervision that feels best."
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="supportNeeds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Support needs</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          data-testid="textarea-support-needs"
                          placeholder="Flexible scheduling, trauma-informed supervisor, peer mentor..."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="languages"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Languages / communication preferences</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          data-testid="textarea-languages"
                          placeholder="English, Spanish, ASL, text-only, etc."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="certifications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skills or certifications</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        data-testid="textarea-certifications"
                        placeholder="List software, licenses, or training that matters for your placements."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="relocationReady"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel>Open to relocation</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Indicates you can relocate with support.
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-relocation-ready"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hasRemoteSetup"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel>Remote-ready tools</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Reliable device & connectivity for remote roles.
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-remote-setup"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mentorshipInterest"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel>Mentorship</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Interested in a survivor-led mentor during onboarding.
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-mentorship"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  type="submit"
                  data-testid="button-submit-workforce-profile"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {profile ? "Update profile" : "Save profile"}
                </Button>
                {profile && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => form.reset()}
                      data-testid="button-reset-workforce-profile"
                    >
                      Reset
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setDeleteDialogOpen(true)}
                      data-testid="button-delete-profile"
                    >
                      Delete profile
                    </Button>
                  </>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <DeleteProfileDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={(reason) => deleteMutation.mutate(reason)}
        appName="Workforce Recruiter"
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
