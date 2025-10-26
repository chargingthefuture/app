import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PrivacyField } from "@/components/ui/privacy-field";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertLighthouseProfileSchema, type LighthouseProfile } from "@shared/schema";
import { useEffect } from "react";
import { Home } from "lucide-react";

export default function LighthouseProfilePage() {
  const { toast } = useToast();
  const { data: profile, isLoading } = useQuery<LighthouseProfile | null>({
    queryKey: ["/api/lighthouse/profile"],
  });

  const form = useForm({
    resolver: zodResolver(
      insertLighthouseProfileSchema
        .omit({ userId: true })
        .extend({
          moveInDate: insertLighthouseProfileSchema.shape.moveInDate.optional().nullable(),
          budgetMin: insertLighthouseProfileSchema.shape.budgetMin.optional().nullable(),
          budgetMax: insertLighthouseProfileSchema.shape.budgetMax.optional().nullable(),
        })
    ),
    defaultValues: {
      profileType: "seeker",
      displayName: "",
      bio: "",
      phoneNumber: "",
      housingNeeds: "",
      moveInDate: null,
      budgetMin: null,
      budgetMax: null,
      hasProperty: false,
      isActive: true,
    },
  });

  // Load existing profile data
  useEffect(() => {
    if (profile) {
      form.reset({
        profileType: profile.profileType,
        displayName: profile.displayName,
        bio: profile.bio || "",
        phoneNumber: profile.phoneNumber || "",
        housingNeeds: profile.housingNeeds || "",
        moveInDate: profile.moveInDate ? new Date(profile.moveInDate) : null,
        budgetMin: profile.budgetMin,
        budgetMax: profile.budgetMax,
        hasProperty: profile.hasProperty || false,
        isActive: profile.isActive,
      });
    }
  }, [profile, form]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/lighthouse/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lighthouse/profile"] });
      toast({
        title: "Success",
        description: "Profile created successfully",
      });
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
    mutationFn: async (data: any) => apiRequest("PUT", "/api/lighthouse/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lighthouse/profile"] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
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

  const onSubmit = (data: any) => {
    if (profile) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const profileType = form.watch("profileType");
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Home className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold">
              {profile ? "Edit Profile" : "Create Profile"}
            </h1>
            <p className="text-muted-foreground">
              {profile ? "Update your LightHouse profile information" : "Set up your LightHouse profile to get started"}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Tell us about yourself and your housing needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="profileType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>I am a</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!!profile}>
                      <FormControl>
                        <SelectTrigger data-testid="select-profileType">
                          <SelectValue placeholder="Select profile type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="seeker">Housing Seeker (I need housing)</SelectItem>
                        <SelectItem value="host">Housing Host (I have housing to offer)</SelectItem>
                      </SelectContent>
                    </Select>
                    {profile && (
                      <FormDescription>
                        Profile type cannot be changed after creation
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="How you'd like to be known" data-testid="input-displayName" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>About Me</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value || ""} 
                        placeholder="Share a bit about yourself" 
                        rows={4}
                        data-testid="input-bio"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    {profile?.phoneNumber && (
                      <div className="mb-2">
                        <span className="text-sm text-muted-foreground">Current: </span>
                        <PrivacyField 
                          value={profile.phoneNumber} 
                          type="phone"
                          testId="current-phone-display"
                          className="text-sm"
                        />
                      </div>
                    )}
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="(555) 123-4567" data-testid="input-phoneNumber" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {profileType === "seeker" && (
                <>
                  <FormField
                    control={form.control}
                    name="housingNeeds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Housing Needs</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            value={field.value || ""} 
                            placeholder="Describe your housing needs and situation" 
                            rows={3}
                            data-testid="input-housingNeeds"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="moveInDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Desired Move-in Date (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            value={field.value ? new Date(field.value).toISOString().split('T')[0] : ""} 
                            onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                            data-testid="input-moveInDate"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="budgetMin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Monthly Budget (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              value={field.value || ""} 
                              onChange={(e) => field.onChange(e.target.value ? e.target.value : null)}
                              placeholder="0" 
                              data-testid="input-budgetMin"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="budgetMax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Monthly Budget (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              value={field.value || ""} 
                              onChange={(e) => field.onChange(e.target.value ? e.target.value : null)}
                              placeholder="0" 
                              data-testid="input-budgetMax"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3">
                <Button type="submit" disabled={isSubmitting} data-testid="button-save">
                  {isSubmitting ? "Saving..." : profile ? "Update Profile" : "Create Profile"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
