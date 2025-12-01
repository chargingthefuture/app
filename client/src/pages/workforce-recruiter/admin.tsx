import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "wouter";
import type { WorkforceRecruiterOccupation, WorkforceRecruiterConfig } from "@shared/schema";
import { insertWorkforceRecruiterOccupationSchema } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PaginationControls } from "@/components/pagination-controls";
import { useFuzzySearch } from "@/hooks/useFuzzySearch";

const configFormSchema = z.object({
  intakeStatus: z.enum(["open", "paused", "invite_only"]),
  primaryContactEmail: z.string().email("Valid email required"),
  reviewCadenceDays: z.coerce.number().int().min(1).max(120),
  highlightedIndustries: z.string().optional(),
  applicationFormUrl: z.string().url().optional().or(z.literal("")),
  routingInbox: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
});

type ConfigFormValues = z.infer<typeof configFormSchema>;

const occupationFormSchema = insertWorkforceRecruiterOccupationSchema;
type OccupationFormValues = z.infer<typeof occupationFormSchema>;

export default function WorkforceRecruiterAdminPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 5;

  const { data: config } = useQuery<WorkforceRecruiterConfig>({
    queryKey: ["/api/workforce-recruiter/config"],
  });

  const { data: occupations, isLoading: occupationsLoading } = useQuery<{
    items: WorkforceRecruiterOccupation[];
    total: number;
  }>({
    queryKey: ["/api/workforce-recruiter/admin/occupations?includeInactive=true&limit=200&offset=0"],
  });

  const configForm = useForm<ConfigFormValues>({
    resolver: zodResolver(configFormSchema),
    defaultValues: {
      intakeStatus: "open",
      primaryContactEmail: "",
      reviewCadenceDays: 14,
      highlightedIndustries: "",
      applicationFormUrl: "",
      routingInbox: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (config) {
      configForm.reset({
        intakeStatus: (config.intakeStatus as ConfigFormValues["intakeStatus"]) ?? "open",
        primaryContactEmail: config.primaryContactEmail || "",
        reviewCadenceDays: config.reviewCadenceDays ?? 14,
        highlightedIndustries: (config.highlightedIndustries ?? []).join(", "),
        applicationFormUrl: config.applicationFormUrl ?? "",
        routingInbox: config.routingInbox ?? "",
        notes: config.notes ?? "",
      });
    }
  }, [config, configForm]);

  const updateConfigMutation = useMutation({
    mutationFn: async (values: ConfigFormValues) => {
      const payload = {
        intakeStatus: values.intakeStatus,
        primaryContactEmail: values.primaryContactEmail,
        reviewCadenceDays: values.reviewCadenceDays,
        highlightedIndustries: values.highlightedIndustries
          ? values.highlightedIndustries
              .split(",")
              .map((entry) => entry.trim())
              .filter(Boolean)
          : [],
        applicationFormUrl: values.applicationFormUrl || undefined,
        routingInbox: values.routingInbox || undefined,
        notes: values.notes || undefined,
      };
      return apiRequest("PUT", "/api/workforce-recruiter/admin/config", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/config"] });
      toast({ title: "Configuration updated", description: "Settings saved successfully." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update configuration",
        variant: "destructive",
      });
    },
  });

  const occupationForm = useForm<OccupationFormValues>({
    resolver: zodResolver(occupationFormSchema),
    defaultValues: {
      title: "",
      description: "",
      priorityLevel: "normal",
      regionFocus: "",
      talentPoolSize: 0,
      activeOpportunities: 0,
      preferredSkills: "",
      supportNeeded: "",
    },
  });

  const createOccupationMutation = useMutation({
    mutationFn: async (values: OccupationFormValues) =>
      apiRequest("POST", "/api/workforce-recruiter/admin/occupations", values),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/workforce-recruiter/admin/occupations?includeInactive=true&limit=200&offset=0"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/occupations"] });
      occupationForm.reset();
      toast({ title: "Occupation created", description: "Role added to the tracker." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create occupation",
        variant: "destructive",
      });
    },
  });

  const deactivateOccupationMutation = useMutation({
    mutationFn: async (id: string) =>
      apiRequest("DELETE", `/api/workforce-recruiter/admin/occupations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/workforce-recruiter/admin/occupations?includeInactive=true&limit=200&offset=0"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/occupations"] });
      toast({ title: "Occupation updated", description: "Occupation marked inactive." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update occupation",
        variant: "destructive",
      });
    },
  });

  const filteredOccupations = useFuzzySearch(
    occupations?.items ?? [],
    search,
    { searchFields: ["title", "description", "regionFocus"], threshold: 0.3 }
  );

  const paginatedOccupations = useMemo(() => {
    const start = page * pageSize;
    return filteredOccupations.slice(start, start + pageSize);
  }, [filteredOccupations, page]);

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Workforce Recruiter Admin</h1>
          <p className="text-muted-foreground">
            Tune intake settings, manage occupations, and broadcast announcements.
          </p>
        </div>
        <Button asChild data-testid="button-workforce-manage-announcements">
          <Link href="/apps/workforce-recruiter/admin/announcements">Manage Announcements</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Intake Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...configForm}>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={configForm.handleSubmit((values) => updateConfigMutation.mutate(values))}
            >
              <FormField
                control={configForm.control}
                name="intakeStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Intake Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-intake-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="invite_only">Invite Only</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={configForm.control}
                name="reviewCadenceDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Review Cadence (days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                        data-testid="input-review-cadence"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={configForm.control}
                name="primaryContactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Contact Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" data-testid="input-primary-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={configForm.control}
                name="routingInbox"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Routing Inbox</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" data-testid="input-routing-inbox" placeholder="Optional shared inbox" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={configForm.control}
                name="applicationFormUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application Link</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-application-url" placeholder="https://..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={configForm.control}
                name="highlightedIndustries"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Highlighted Industries</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-highlighted-industries"
                        placeholder="Comma separated list"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={configForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Internal Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        data-testid="textarea-config-notes"
                        rows={3}
                        placeholder="Context for other admins"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={updateConfigMutation.isPending}
                  data-testid="button-save-config"
                >
                  Save Configuration
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Occupations</CardTitle>
            <p className="text-sm text-muted-foreground">
              Track and adjust staffing priorities across mini-apps.
            </p>
          </div>
          <Input
            placeholder="Search occupations..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            className="w-full md:w-64"
            data-testid="input-occupation-search"
          />
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...occupationForm}>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={occupationForm.handleSubmit((values) => createOccupationMutation.mutate(values))}
            >
              <FormField
                control={occupationForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Title</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-occupation-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={occupationForm.control}
                name="priorityLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-occupation-priority">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={occupationForm.control}
                name="regionFocus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region Focus</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-occupation-region" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={occupationForm.control}
                name="talentPoolSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Talent Pool Size</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                        data-testid="input-occupation-pool"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={occupationForm.control}
                name="activeOpportunities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Active Opportunities</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                        data-testid="input-occupation-openings"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={occupationForm.control}
                name="preferredSkills"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Preferred Skills</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} data-testid="textarea-occupation-skills" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={occupationForm.control}
                name="supportNeeded"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Support Needed</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} data-testid="textarea-occupation-support" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={createOccupationMutation.isPending}
                  data-testid="button-create-occupation"
                >
                  Add Occupation
                </Button>
              </div>
            </form>
          </Form>

          <div className="space-y-4">
            {occupationsLoading ? (
              <p className="text-muted-foreground">Loading occupations...</p>
            ) : paginatedOccupations.length === 0 ? (
              <p className="text-muted-foreground">No occupations found.</p>
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedOccupations.map((occupation) => (
                    <Card key={occupation.id}>
                      <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                        <div>
                          <CardTitle className="text-lg">{occupation.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {occupation.regionFocus || "Global"} · Pool {occupation.talentPoolSize ?? 0}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={occupation.isActive ? "default" : "secondary"}>
                            {occupation.priorityLevel}
                          </Badge>
                          {!occupation.isActive && (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                          {occupation.isActive && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deactivateOccupationMutation.mutate(occupation.id)}
                              data-testid="button-deactivate-occupation"
                            >
                              Mark Inactive
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {occupation.description && (
                          <p className="text-sm text-muted-foreground">{occupation.description}</p>
                        )}
                        {occupation.preferredSkills && (
                          <p className="text-sm text-muted-foreground">
                            Skills: {occupation.preferredSkills}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <PaginationControls
                  currentPage={page}
                  itemsPerPage={pageSize}
                  totalItems={filteredOccupations.length}
                  onPageChange={setPage}
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
