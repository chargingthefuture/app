import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DeleteProfileDialog } from "@/components/delete-profile-dialog";
import { MiniAppBackButton } from "@/components/mini-app-back-button";
import {
  insertWorkforceRecruiterProfileSchema,
  type WorkforceRecruiterProfile,
} from "@shared/schema";
import { ClipboardList, Mail, Phone, ShieldCheck } from "lucide-react";

const profileFormSchema = insertWorkforceRecruiterProfileSchema.omit({ userId: true });
type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function WorkforceRecruiterProfile() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const initializedRef = useRef(false);

  const { data: profile, isLoading } = useQuery<WorkforceRecruiterProfile | null>({
    queryKey: ["/api/workforce-recruiter/profile"],
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      organizationName: "",
      recruiterName: "",
      contactEmail: "",
      contactPhone: "",
      focusIndustries: "",
      serviceRegions: "",
      remoteExpertise: "",
      candidateCapacity: 0,
      placementsCompleted: 0,
      isAcceptingCandidates: true,
      preferredRoles: "",
      languagesSupported: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (profile && !initializedRef.current) {
      initializedRef.current = true;
      form.reset({
        organizationName: profile.organizationName || "",
        recruiterName: profile.recruiterName || "",
        contactEmail: profile.contactEmail || "",
        contactPhone: profile.contactPhone || "",
        focusIndustries: profile.focusIndustries || "",
        serviceRegions: profile.serviceRegions || "",
        remoteExpertise: profile.remoteExpertise || "",
        candidateCapacity: profile.candidateCapacity ?? 0,
        placementsCompleted: profile.placementsCompleted ?? 0,
        isAcceptingCandidates: profile.isAcceptingCandidates ?? true,
        preferredRoles: profile.preferredRoles || "",
        languagesSupported: profile.languagesSupported || "",
        notes: profile.notes || "",
      });
    }
    if (!profile) {
      initializedRef.current = false;
      form.reset({
        organizationName: "",
        recruiterName: "",
        contactEmail: "",
        contactPhone: "",
        focusIndustries: "",
        serviceRegions: "",
        remoteExpertise: "",
        candidateCapacity: 0,
        placementsCompleted: 0,
        isAcceptingCandidates: true,
        preferredRoles: "",
        languagesSupported: "",
        notes: "",
      });
    }
  }, [profile, form]);

  const createMutation = useMutation({
    mutationFn: (data: ProfileFormValues) =>
      apiRequest("POST", "/api/workforce-recruiter/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/profile"] });
      toast({
        title: "Profile Created",
        description: "Your Workforce Recruiter profile is now live.",
      });
      setLocation("/apps/workforce-recruiter");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Unable to create profile",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProfileFormValues) =>
      apiRequest("PUT", "/api/workforce-recruiter/profile", data),
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Updates saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/profile"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Unable to update profile",
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
        title: "Profile Deleted",
        description: "Your presence in Workforce Recruiter has been removed.",
      });
      setDeleteDialogOpen(false);
      setLocation("/apps/workforce-recruiter");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Unable to delete profile",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormValues) => {
    const sanitizedData = {
      ...data,
      candidateCapacity: Number(data.candidateCapacity) || 0,
      placementsCompleted: Number(data.placementsCompleted) || 0,
      contactPhone: data.contactPhone || null,
      focusIndustries: data.focusIndustries || null,
      preferredRoles: data.preferredRoles || null,
      languagesSupported: data.languagesSupported || null,
      notes: data.notes || null,
      remoteExpertise: data.remoteExpertise || null,
      serviceRegions: data.serviceRegions || null,
    };
    if (profile) {
      updateMutation.mutate(sanitizedData);
    } else {
      createMutation.mutate(sanitizedData);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

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
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <MiniAppBackButton />
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold">
                {profile ? "Update Workforce Profile" : "Create Workforce Profile"}
              </h1>
              <p className="text-muted-foreground">
                Share the details employers need to collaborate with the Survivor Workforce Network.
              </p>
            </div>
          </div>
        </div>
        {profile && (
          <Badge variant="secondary" className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            {profile.verificationStatus?.toUpperCase() || "PENDING"}
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>
            This information is shared with Workforce liaisons and used in risk reviews.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
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
                <FormField
                  control={form.control}
                  name="recruiterName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Point of Contact</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-recruiter-name" />
                      </FormControl>
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
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        Contact Email
                      </FormLabel>
                      <FormControl>
                        <Input type="email" {...field} data-testid="input-contact-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        Phone
                      </FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-contact-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="candidateCapacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Candidate Capacity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          data-testid="input-candidate-capacity"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="placementsCompleted"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placements Completed</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          data-testid="input-placements-completed"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isAcceptingCandidates"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border px-4 py-3">
                    <div className="space-y-0.5">
                      <FormLabel>Currently accepting candidates</FormLabel>
                      <CardDescription>
                        Toggle this off when you need to pause referrals.
                      </CardDescription>
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

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="focusIndustries"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Focus Industries</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={4}
                          placeholder="Healthcare logistics, ethical tech support, supply chain coordinators..."
                          {...field}
                          data-testid="textarea-focus-industries"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="serviceRegions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Regions</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={4}
                          placeholder="Remote within North America, onsite in Chicago & Toronto..."
                          {...field}
                          data-testid="textarea-service-regions"
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
                  name="remoteExpertise"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remote/Hybrid Expertise</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          {...field}
                          data-testid="textarea-remote-expertise"
                        />
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
                        <Textarea
                          rows={3}
                          {...field}
                          data-testid="textarea-preferred-roles"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="languagesSupported"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Languages Supported</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="English, Spanish, Ukrainian..."
                        {...field}
                        data-testid="textarea-languages-supported"
                      />
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
                    <FormLabel>Optional Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Share any trauma-informed accommodations, onboarding support, or recruiter commitments."
                        {...field}
                        data-testid="textarea-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-wrap gap-3">
                <Button
                  type="submit"
                  disabled={isSaving}
                  data-testid="button-save-workforce-profile"
                >
                  {profile ? "Save Changes" : "Create Profile"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  asChild
                  data-testid="button-cancel-workforce-profile"
                >
                  <Link href="/apps/workforce-recruiter">Cancel</Link>
                </Button>
                {profile && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                    data-testid="button-delete-workforce-profile"
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
