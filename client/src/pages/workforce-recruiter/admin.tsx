import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  insertWorkforceRecruiterConfigSchema,
  insertWorkforceRecruiterOccupationSchema,
  type WorkforceRecruiterConfig,
  type WorkforceRecruiterOccupation,
} from "@shared/schema";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaginationControls } from "@/components/pagination-controls";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useFuzzySearch } from "@/hooks/useFuzzySearch";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Settings, PlusCircle, RefreshCcw } from "lucide-react";

type ConfigFormValues = z.infer<typeof insertWorkforceRecruiterConfigSchema>;
type OccupationFormValues = z.infer<typeof insertWorkforceRecruiterOccupationSchema>;

const configDefaults: ConfigFormValues = {
  isPortalOpen: true,
  maxActiveApplications: 3,
  highlightMessage: "",
  supportEmail: "",
  emergencySignalNumber: "",
  applicationGuidelines: "",
  featuredRegions: "",
  trainingPartners: "",
  autoShareProfileWithAllies: false,
};

const occupationDefaults: OccupationFormValues = {
  title: "",
  category: "",
  description: "",
  demandLevel: "medium",
  requiredSkills: "",
  supportProvided: "",
  trainingDurationWeeks: undefined,
  openRoles: 0,
  candidatesReady: 0,
  avgHourlyRate: undefined,
  regionFocus: "",
  applicationUrl: "",
  isPriorityRole: false,
  isActive: true,
};

const OCCUPATION_PAGE_SIZE = 8;

export default function WorkforceRecruiterAdmin() {
  const { toast } = useToast();
  const [occupationPage, setOccupationPage] = useState(0);
  const [search, setSearch] = useState("");
  const [editingOccupation, setEditingOccupation] = useState<WorkforceRecruiterOccupation | null>(null);

  const { data: config } = useQuery<WorkforceRecruiterConfig | null>({
    queryKey: ["/api/workforce-recruiter/config"],
  });

  const occupationQueryKey = useMemo(() => {
    const params = new URLSearchParams({
      limit: String(OCCUPATION_PAGE_SIZE),
      offset: String(occupationPage * OCCUPATION_PAGE_SIZE),
      includeInactive: "true",
    });
    if (search.trim()) {
      params.set("search", search.trim());
    }
    return [`/api/workforce-recruiter/admin/occupations?${params.toString()}`];
  }, [occupationPage, search]);

  const { data: occupationsData, isLoading: occupationsLoading } = useQuery<{
    items: WorkforceRecruiterOccupation[];
    total: number;
  }>({
    queryKey: occupationQueryKey,
  });

  const configForm = useForm<ConfigFormValues>({
    resolver: zodResolver(insertWorkforceRecruiterConfigSchema),
    defaultValues: configDefaults,
  });

  useEffect(() => {
    if (config) {
      configForm.reset({
        isPortalOpen: config.isPortalOpen,
        maxActiveApplications: config.maxActiveApplications,
        highlightMessage: config.highlightMessage || "",
        supportEmail: config.supportEmail || "",
        emergencySignalNumber: config.emergencySignalNumber || "",
        applicationGuidelines: config.applicationGuidelines || "",
        featuredRegions: config.featuredRegions || "",
        trainingPartners: config.trainingPartners || "",
        autoShareProfileWithAllies: config.autoShareProfileWithAllies,
      });
    }
  }, [config, configForm]);

  const occupationForm = useForm<OccupationFormValues>({
    resolver: zodResolver(insertWorkforceRecruiterOccupationSchema),
    defaultValues: occupationDefaults,
  });

  useEffect(() => {
    if (editingOccupation) {
      occupationForm.reset({
        title: editingOccupation.title,
        category: editingOccupation.category,
        description: editingOccupation.description || "",
        demandLevel: editingOccupation.demandLevel as OccupationFormValues["demandLevel"],
        requiredSkills: editingOccupation.requiredSkills || "",
        supportProvided: editingOccupation.supportProvided || "",
        trainingDurationWeeks: editingOccupation.trainingDurationWeeks ?? undefined,
        openRoles: editingOccupation.openRoles,
        candidatesReady: editingOccupation.candidatesReady,
        avgHourlyRate: editingOccupation.avgHourlyRate ? Number(editingOccupation.avgHourlyRate) : undefined,
        regionFocus: editingOccupation.regionFocus || "",
        applicationUrl: editingOccupation.applicationUrl || "",
        isPriorityRole: editingOccupation.isPriorityRole,
        isActive: editingOccupation.isActive,
      });
    } else {
      occupationForm.reset(occupationDefaults);
    }
  }, [editingOccupation, occupationForm]);

  const configMutation = useMutation({
    mutationFn: (data: ConfigFormValues) => apiRequest("PUT", "/api/workforce-recruiter/admin/config", data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/config"] });
      toast({
        title: "Configuration saved",
        description: "Intake preferences updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error saving config",
        description: error.message || "Unable to update configuration",
        variant: "destructive",
      });
    },
  });

  const occupationMutation = useMutation({
    mutationFn: (data: OccupationFormValues) => {
      if (editingOccupation) {
        return apiRequest("PUT", `/api/workforce-recruiter/admin/occupations/${editingOccupation.id}`, data);
      }
      return apiRequest("POST", "/api/workforce-recruiter/admin/occupations", data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: occupationQueryKey });
      setEditingOccupation(null);
      toast({
        title: "Occupation saved",
        description: "The role was stored for recruiters.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error saving occupation",
        description: error.message || "Unable to save occupation",
        variant: "destructive",
      });
    },
  });

  const deactivateOccupationMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/workforce-recruiter/admin/occupations/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: occupationQueryKey });
      toast({
        title: "Occupation deactivated",
        description: "This role is now hidden from survivors.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deactivating occupation",
        description: error.message || "Unable to deactivate occupation",
        variant: "destructive",
      });
    },
  });

  const filteredOccupations = useFuzzySearch(
    occupationsData?.items ?? [],
    search,
    { searchFields: ["title", "category", "regionFocus"], threshold: 0.3 }
  );

  const totalItems = occupationsData?.total ?? 0;

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-primary font-semibold mb-1">
            Workforce Recruiter Admin
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold">Safeguard matches and intake</h1>
          <p className="text-muted-foreground max-w-2xl">
            Align employment pathways with trauma-informed standards. Only verified partners can view survivor details.
          </p>
        </div>
        <Link href="/apps/workforce-recruiter/admin/announcements">
          <Button variant="outline" data-testid="button-admin-announcements">
            Manage announcements
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" />
              Intake configuration
            </CardTitle>
            <CardDescription>
              Control who can submit profiles and how many active applications a survivor can maintain.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...configForm}>
              <form
                onSubmit={configForm.handleSubmit((data) => configMutation.mutate(data))}
                className="space-y-4"
              >
                <FormField
                  control={configForm.control}
                  name="isPortalOpen"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border px-4 py-3">
                      <div>
                        <FormLabel className="text-base">Portal open</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Toggle survivor intake without removing existing profiles.
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-portal-open" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={configForm.control}
                  name="maxActiveApplications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max active applications</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                          data-testid="input-max-applications"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={configForm.control}
                  name="highlightMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Highlight message</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={3}
                          placeholder="Let survivors know what roles are available and safety practices in place."
                          data-testid="textarea-highlight-message"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={configForm.control}
                    name="supportEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Support email</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="workforce@psyopfree.org" data-testid="input-support-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={configForm.control}
                    name="emergencySignalNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Signal #</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+12345678900" data-testid="input-signal-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={configForm.control}
                  name="applicationGuidelines"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guidelines</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} data-testid="textarea-guidelines" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={configForm.control}
                    name="featuredRegions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Featured regions</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Pacific NW, Southwest" data-testid="input-featured-regions" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={configForm.control}
                    name="trainingPartners"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Training partners</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Allied co-ops, maker labs" data-testid="input-training-partners" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={configForm.control}
                  name="autoShareProfileWithAllies"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border px-4 py-3">
                      <div>
                        <FormLabel className="text-base">Auto share with trusted allies</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          When enabled, recruiters see profiles as soon as survivors mark them public.
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-auto-share" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={configMutation.isPending} data-testid="button-save-config">
                  Save configuration
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Occupations & training
            </CardTitle>
            <CardDescription>
              Publish verified roles and specify the support offered to participants.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Form {...occupationForm}>
              <form
                onSubmit={occupationForm.handleSubmit((data) => occupationMutation.mutate(data))}
                className="space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    {editingOccupation ? "Update existing occupation" : "Create new occupation"}
                  </p>
                  {editingOccupation ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingOccupation(null)}
                      data-testid="button-cancel-edit-occupation"
                    >
                      <RefreshCcw className="w-4 h-4 mr-1" />
                      Reset
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <PlusCircle className="w-3 h-3" />
                      New role
                    </span>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <FormField
                    control={occupationForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Healing Garden Coordinator" data-testid="input-occupation-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={occupationForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Regenerative Agriculture" data-testid="input-occupation-category" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={occupationForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} data-testid="textarea-occupation-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-3 md:grid-cols-2">
                  <FormField
                    control={occupationForm.control}
                    name="demandLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Demand level</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-demand-level">
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
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
                        <FormLabel>Region focus</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Pacific Northwest" data-testid="input-region-focus" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <FormField
                    control={occupationForm.control}
                    name="openRoles"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Open roles</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(event) => field.onChange(Number(event.target.value))}
                            data-testid="input-open-roles"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={occupationForm.control}
                    name="candidatesReady"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Candidates ready</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(event) => field.onChange(Number(event.target.value))}
                            data-testid="input-candidates-ready"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={occupationForm.control}
                    name="trainingDurationWeeks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Training weeks</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(event) => field.onChange(event.target.value ? Number(event.target.value) : undefined)}
                            data-testid="input-training-weeks"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <FormField
                    control={occupationForm.control}
                    name="avgHourlyRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avg hourly rate (USD)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(event) => field.onChange(event.target.value ? Number(event.target.value) : undefined)}
                            data-testid="input-hourly-rate"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={occupationForm.control}
                    name="applicationUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Application link</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://example.com/apply" data-testid="input-application-url" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={occupationForm.control}
                  name="requiredSkills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Required skills</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} data-testid="textarea-required-skills" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={occupationForm.control}
                  name="supportProvided"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Support provided</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} data-testid="textarea-support-provided" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-wrap items-center gap-4">
                  <FormField
                    control={occupationForm.control}
                    name="isPriorityRole"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-priority-role" />
                        </FormControl>
                        <FormLabel>Priority role</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={occupationForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-occupation-active" />
                        </FormControl>
                        <FormLabel>Visible to survivors</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" disabled={occupationMutation.isPending} data-testid="button-save-occupation">
                  {editingOccupation ? "Update occupation" : "Create occupation"}
                </Button>
              </form>
            </Form>

            <div className="border-t pt-4 space-y-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <Input
                  value={search}
                  onChange={(event) => {
                    setOccupationPage(0);
                    setSearch(event.target.value);
                  }}
                  placeholder="Search occupations"
                  className="w-full md:max-w-xs"
                  data-testid="input-admin-search-occupations"
                />
                <PaginationControls
                  currentPage={occupationPage}
                  totalItems={totalItems}
                  itemsPerPage={OCCUPATION_PAGE_SIZE}
                  onPageChange={setOccupationPage}
                />
              </div>

              {occupationsLoading ? (
                <div className="text-sm text-muted-foreground">Loading occupations…</div>
              ) : filteredOccupations.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                  No occupations yet. Create the first one.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOccupations.map((occupation) => (
                    <div key={occupation.id} className="rounded-lg border px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{occupation.title}</p>
                          <p className="text-xs text-muted-foreground">{occupation.category}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!occupation.isActive && (
                            <Badge variant="outline" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                          {occupation.isPriorityRole && (
                            <Badge variant="destructive" className="text-xs">
                              Priority
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{occupation.description}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingOccupation(occupation)}
                          data-testid={`button-edit-occupation-${occupation.id}`}
                        >
                          Edit
                        </Button>
                        {occupation.isActive && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deactivateOccupationMutation.mutate(occupation.id)}
                            data-testid={`button-deactivate-occupation-${occupation.id}`}
                          >
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
