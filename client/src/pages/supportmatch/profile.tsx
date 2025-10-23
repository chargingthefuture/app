import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSupportMatchProfileSchema } from "@shared/schema";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { SupportMatchProfile } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLocation } from "wouter";

const profileFormSchema = insertSupportMatchProfileSchema.omit({ userId: true }).extend({
  nickname: z.string().optional(),
  gender: z.string().optional(),
  genderPreference: z.string().optional(),
  timezone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

export default function SupportMatchProfile() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: profile, isLoading } = useQuery<SupportMatchProfile | null>({
    queryKey: ["/api/supportmatch/profile"],
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      nickname: profile?.nickname || "",
      gender: profile?.gender || "",
      genderPreference: profile?.genderPreference || "",
      timezone: profile?.timezone || "",
      isActive: profile?.isActive ?? true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ProfileFormData) =>
      apiRequest("POST", "/api/supportmatch/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supportmatch/profile"] });
      toast({
        title: "Profile Created",
        description: "Your SupportMatch profile has been created successfully.",
      });
      setLocation("/apps/supportmatch");
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
      apiRequest("PUT", "/api/supportmatch/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supportmatch/profile"] });
      toast({
        title: "Profile Updated",
        description: "Your SupportMatch profile has been updated successfully.",
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
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold mb-2">
          {profile ? "Edit Profile" : "Create Profile"}
        </h1>
        <p className="text-muted-foreground">
          {profile 
            ? "Update your SupportMatch profile and preferences" 
            : "Set up your profile to start matching with accountability partners"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="nickname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nickname (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="How you'd like to be called"
                        data-testid="input-nickname"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-gender">
                          <SelectValue placeholder="Select your gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="genderPreference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partner Gender Preference</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-gender-preference">
                          <SelectValue placeholder="Select your preference" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                        <SelectItem value="any">Any</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., America/New_York"
                        data-testid="input-timezone"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-profile"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : profile
                    ? "Update Profile"
                    : "Create Profile"}
                </Button>
                {profile && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/apps/supportmatch")}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
