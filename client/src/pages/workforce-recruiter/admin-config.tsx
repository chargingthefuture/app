import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertWorkforceRecruiterConfigSchema, type WorkforceRecruiterConfig } from "@shared/schema";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

const configFormSchema = insertWorkforceRecruiterConfigSchema.omit({ updatedBy: true });

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "waitlist", label: "Waitlist" },
  { value: "paused", label: "Paused" },
];

type ConfigFormData = z.infer<typeof configFormSchema>;

export default function WorkforceRecruiterAdminConfig() {
  const { toast } = useToast();

  const { data: config, isLoading } = useQuery<WorkforceRecruiterConfig>({
    queryKey: ["/api/workforce-recruiter/config"],
  });

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configFormSchema),
    defaultValues: {
      applicationStatus: "open",
      maxActiveCandidates: 25,
      featuredSectors: "Healthcare · Trades · Remote Ops",
      priorityRegions: "Global",
      contactEmail: "workforce@chargingthefuture.com",
      intakeNotes: "",
      allowSelfReferral: true,
      requireProfileReview: true,
    },
  });

  useEffect(() => {
    if (config) {
      form.reset({
        applicationStatus: config.applicationStatus ?? "open",
        maxActiveCandidates: config.maxActiveCandidates ?? 25,
        featuredSectors: config.featuredSectors ?? "",
        priorityRegions: config.priorityRegions ?? "",
        contactEmail: config.contactEmail ?? "",
        intakeNotes: config.intakeNotes ?? "",
        allowSelfReferral: config.allowSelfReferral ?? true,
        requireProfileReview: config.requireProfileReview ?? true,
      });
    }
  }, [config, form]);

  const updateMutation = useMutation({
    mutationFn: (data: ConfigFormData) => apiRequest("PUT", "/api/workforce-recruiter/admin/config", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/config"] });
      toast({
        title: "Configuration Saved",
        description: "Workforce Recruiter settings updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update configuration",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ConfigFormData) => {
    updateMutation.mutate({
      ...data,
      featuredSectors: data.featuredSectors || null,
      priorityRegions: data.priorityRegions || null,
      intakeNotes: data.intakeNotes || null,
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <p className="text-center text-muted-foreground">Loading configuration…</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl space-y-6 p-4 sm:p-6 md:p-8">
      <Button asChild variant="ghost" className="w-fit" data-testid="button-back-admin">
        <Link href="/apps/workforce-recruiter/admin">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Workforce Recruiter Configuration</CardTitle>
          <CardDescription>
            Adjust intake pacing, featured sectors, and guardrails for survivor referrals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="applicationStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-application-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
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
                name="maxActiveCandidates"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Active Candidates</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        value={field.value ?? ""}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                        data-testid="input-max-candidates"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="featuredSectors"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Featured Sectors</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Healthcare · Trades · Remote Ops" data-testid="textarea-featured-sectors" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priorityRegions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority Regions or Corridors</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="North America · Safe Migration Corridor" data-testid="textarea-priority-regions" />
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
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} data-testid="input-contact-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="intakeNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Intake Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Share guidance for staff reviewing sensitive referrals"
                        data-testid="textarea-intake-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="allowSelfReferral"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel>Allow Self-Referral</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Survivors can request recruiter intake without case manager approval.
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value ?? false} onCheckedChange={field.onChange} data-testid="switch-self-referral" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="requireProfileReview"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel>Require Profile Review</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Every profile must be approved by staff before sharing with employers.
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value ?? true} onCheckedChange={field.onChange} data-testid="switch-profile-review" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-config">
                  {updateMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
                <Button type="button" variant="outline" onClick={() => form.reset()} data-testid="button-reset-config">
                  Reset
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
