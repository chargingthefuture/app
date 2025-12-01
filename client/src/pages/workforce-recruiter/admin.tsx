import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import {
  insertWorkforceRecruiterConfigSchema,
  insertWorkforceRecruiterOccupationSchema,
  type WorkforceRecruiterConfig,
  type WorkforceRecruiterOccupation,
} from "@shared/schema";
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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaginationControls } from "@/components/pagination-controls";
import { useToast } from "@/hooks/use-toast";
import { useFuzzySearch } from "@/hooks/useFuzzySearch";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Switch } from "@/components/ui/switch";
import {
  BarChart2,
  Bell,
  Briefcase,
  CheckCircle2,
  ClipboardList,
  Plus,
  RefreshCcw,
  Search,
  Settings,
  Trash2,
  Users,
} from "lucide-react";
import { MiniAppBackButton } from "@/components/mini-app-back-button";

type SummaryResponse = {
  totalProfiles: number;
  acceptingProfiles: number;
  averageCandidateCapacity: number;
  totalOpenRoles: number;
  remoteFriendlyOccupations: number;
  highDemandOccupations: number;
  categoryBreakdown: Array<{ category: string; openRoles: number }>;
  lastGeneratedAt: string;
};

const configFormSchema = insertWorkforceRecruiterConfigSchema.extend({
  lastReviewedAt: z.string().optional().nullable(),
});

const occupationFormSchema = insertWorkforceRecruiterOccupationSchema.extend({
  id: z.string().optional(),
  lastReviewedAt: z.string().optional().nullable(),
});

const OCCUPATION_LIMIT = 12;

export default function WorkforceRecruiterAdmin() {
  const { toast } = useToast();
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingOccupationId, setEditingOccupationId] = useState<string | null>(null);
  const invalidateOccupationQueries = () =>
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = Array.isArray(query.queryKey)
          ? query.queryKey.join("/")
          : String(query.queryKey ?? "");
        return key.startsWith("/api/workforce-recruiter/occupations");
      },
    });

  const { data: summary } = useQuery<SummaryResponse>({
    queryKey: ["/api/workforce-recruiter/reports/summary"],
  });

  const { data: config } = useQuery<WorkforceRecruiterConfig | null>({
    queryKey: ["/api/workforce-recruiter/config"],
  });

  const occupationsQueryKey = `/api/workforce-recruiter/occupations?limit=${OCCUPATION_LIMIT}&offset=${
    page * OCCUPATION_LIMIT
  }`;
  const { data: occupationData, isLoading: occupationsLoading } = useQuery<{
    occupations: WorkforceRecruiterOccupation[];
    total: number;
  }>({
    queryKey: [occupationsQueryKey],
  });

  const configForm = useForm<z.infer<typeof configFormSchema>>({
    resolver: zodResolver(configFormSchema),
    defaultValues: {
      missionStatement: "",
      candidateEligibility: "",
      employerExpectations: "",
      escalationEmail: "",
      escalationPhone: "",
      officeHours: "",
      supportChannel: "",
      priorityIndustries: "",
      lastReviewedAt: "",
    },
  });

  useEffect(() => {
    if (config) {
      configForm.reset({
        missionStatement: config.missionStatement || "",
        candidateEligibility: config.candidateEligibility || "",
        employerExpectations: config.employerExpectations || "",
        escalationEmail: config.escalationEmail || "",
        escalationPhone: config.escalationPhone || "",
        officeHours: config.officeHours || "",
        supportChannel: config.supportChannel || "",
        priorityIndustries: config.priorityIndustries || "",
        lastReviewedAt: config.lastReviewedAt
          ? new Date(config.lastReviewedAt).toISOString().slice(0, 10)
          : "",
      });
    }
  }, [config, configForm]);

  const occupationForm = useForm<z.infer<typeof occupationFormSchema>>({
    resolver: zodResolver(occupationFormSchema),
    defaultValues: {
      title: "",
      category: "",
      description: "",
      demandLevel: "moderate",
      openRoles: 0,
      priorityLevel: 3,
      remoteFriendly: false,
      requiresCertification: false,
      avgPlacementTimeDays: 30,
      lastReviewedAt: "",
    },
  });

  const filteredOccupations = useFuzzySearch(
    occupationData?.occupations ?? [],
    searchTerm,
    {
      searchFields: ["title", "category", "description"],
      threshold: 0.3,
    }
  );

  const configMutation = useMutation({
    mutationFn: async (values: z.infer<typeof configFormSchema>) => {
      const payload = {
        ...values,
        lastReviewedAt: values.lastReviewedAt ? new Date(values.lastReviewedAt) : undefined,
      };
      return apiRequest("PUT", "/api/workforce-recruiter/admin/config", payload);
    },
    onSuccess: () => {
      toast({
        title: "Config updated",
        description: "Program guidance has been refreshed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/config"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Unable to save configuration",
        variant: "destructive",
      });
    },
  });

  const occupationMutation = useMutation({
    mutationFn: async (values: z.infer<typeof occupationFormSchema>) => {
      const payload = {
        title: values.title,
        category: values.category || null,
        description: values.description || null,
        demandLevel: values.demandLevel,
        openRoles: values.openRoles,
        priorityLevel: values.priorityLevel,
        remoteFriendly: values.remoteFriendly,
        requiresCertification: values.requiresCertification,
        avgPlacementTimeDays: values.avgPlacementTimeDays,
        lastReviewedAt: values.lastReviewedAt ? new Date(values.lastReviewedAt) : undefined,
      };

      if (editingOccupationId) {
        return apiRequest(
          "PUT",
          `/api/workforce-recruiter/admin/occupations/${editingOccupationId}`,
          payload
        );
      }

      return apiRequest("POST", "/api/workforce-recruiter/admin/occupations", payload);
    },
    onSuccess: () => {
      toast({
        title: editingOccupationId ? "Occupation updated" : "Occupation created",
        description: "Changes saved successfully.",
      });
      setEditingOccupationId(null);
      occupationForm.reset({
        title: "",
        category: "",
        description: "",
        demandLevel: "moderate",
        openRoles: 0,
        priorityLevel: 3,
        remoteFriendly: false,
        requiresCertification: false,
        avgPlacementTimeDays: 30,
        lastReviewedAt: "",
      });
      queryClient.invalidateQueries({ queryKey: [occupationsQueryKey] });
      invalidateOccupationQueries();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Unable to save occupation",
        variant: "destructive",
      });
    },
  });

  const deleteOccupationMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/workforce-recruiter/admin/occupations/${id}`),
    onSuccess: () => {
      toast({ title: "Occupation removed" });
      invalidateOccupationQueries();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Unable to delete occupation",
        variant: "destructive",
      });
    },
  });

  const handleEditOccupation = (occupation: WorkforceRecruiterOccupation) => {
    setEditingOccupationId(occupation.id);
    occupationForm.reset({
      title: occupation.title,
      category: occupation.category || "",
      description: occupation.description || "",
      demandLevel: occupation.demandLevel as "low" | "moderate" | "high",
      openRoles: occupation.openRoles,
      priorityLevel: occupation.priorityLevel ?? 3,
      remoteFriendly: occupation.remoteFriendly,
      requiresCertification: occupation.requiresCertification,
      avgPlacementTimeDays: occupation.avgPlacementTimeDays ?? 30,
      lastReviewedAt: occupation.lastReviewedAt
        ? new Date(occupation.lastReviewedAt).toISOString().slice(0, 10)
        : "",
      id: occupation.id,
    });
  };

  const summaryCards = useMemo(
    () => [
      {
        label: "Active Recruiters",
        value: summary?.totalProfiles ?? 0,
        description: "Profiles that completed onboarding",
        icon: Users,
      },
      {
        label: "Accepting Referrals",
        value: summary?.acceptingProfiles ?? 0,
        description: "Actively reviewing candidates",
        icon: CheckCircle2,
      },
      {
        label: "Open Roles",
        value: summary?.totalOpenRoles ?? 0,
        description: "Tracked across all employers",
        icon: Briefcase,
      },
      {
        label: "Avg. Capacity",
        value: summary?.averageCandidateCapacity ?? 0,
        description: "Candidates per recruiter",
        icon: BarChart2,
      },
    ],
    [summary]
  );

  const totalOccupations = occupationData?.total ?? 0;

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <MiniAppBackButton />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold">Workforce Recruiter Administration</h1>
              <p className="text-muted-foreground">
                Manage program guidance, occupations, and announcements for the Workforce hub.
              </p>
            </div>
          </div>
        </div>
        <Button asChild variant="outline" data-testid="button-manage-wr-announcements">
          <Link href="/apps/workforce-recruiter/admin/announcements">
            <Bell className="w-4 h-4 mr-2" />
            Manage Announcements
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardDescription>{card.label}</CardDescription>
                <Icon className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Program Guidance</CardTitle>
          <CardDescription>
            Update what recruiters see on their dashboard. Changes take effect immediately.
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
                name="missionStatement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mission Statement</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={configForm.control}
                  name="candidateEligibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Candidate Eligibility</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={configForm.control}
                  name="employerExpectations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employer Expectations</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={configForm.control}
                  name="escalationEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Escalation Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={configForm.control}
                  name="escalationPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Escalation Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={configForm.control}
                  name="officeHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Office Hours</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={configForm.control}
                  name="supportChannel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Support Channel</FormLabel>
                      <FormControl>
                        <Input placeholder="Signal, Teams, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={configForm.control}
                  name="lastReviewedAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Reviewed</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={configForm.control}
                name="priorityIndustries"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority Industries</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={configMutation.isPending}
                  data-testid="button-save-workforce-config"
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Save Guidance
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Occupations</CardTitle>
              <CardDescription>
                Maintain the roles surfaced on recruiter dashboards. Use fuzzy search to filter.
              </CardDescription>
            </div>
            <Badge variant="secondary">{totalOccupations} total</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setPage(0);
                  }}
                  placeholder="Search occupations"
                  className="pl-9"
                  data-testid="input-search-occupation-admin"
                />
              </div>
              <div className="space-y-3">
                {occupationsLoading ? (
                  <div className="text-sm text-muted-foreground">Loading...</div>
                ) : filteredOccupations.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No occupations match your search on this page.
                  </div>
                ) : (
                  filteredOccupations.map((occupation) => (
                    <Card key={occupation.id} className="border border-muted/70">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <CardTitle className="text-base">{occupation.title}</CardTitle>
                            <CardDescription>{occupation.category || "General"}</CardDescription>
                          </div>
                          <Badge variant={occupation.demandLevel === "high" ? "default" : "outline"}>
                            {occupation.demandLevel.toUpperCase()}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        {occupation.description && (
                          <p className="text-muted-foreground line-clamp-3">{occupation.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Open roles</span>
                          <span className="font-semibold">{occupation.openRoles}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditOccupation(occupation)}
                            data-testid={`button-edit-occupation-${occupation.id}`}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => deleteOccupationMutation.mutate(occupation.id)}
                            data-testid={`button-delete-occupation-${occupation.id}`}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
              <PaginationControls
                currentPage={page}
                totalItems={totalOccupations}
                itemsPerPage={OCCUPATION_LIMIT}
                onPageChange={(newPage) => setPage(newPage)}
              />
            </div>
            <div className="border border-dashed rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <ClipboardList className="w-4 h-4" />
                    {editingOccupationId ? "Edit Occupation" : "Add Occupation"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Surface only ethical employers and living-wage roles.
                  </p>
                </div>
                {editingOccupationId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingOccupationId(null);
                      occupationForm.reset({
                        title: "",
                        category: "",
                        description: "",
                        demandLevel: "moderate",
                        openRoles: 0,
                        priorityLevel: 3,
                        remoteFriendly: false,
                        requiresCertification: false,
                        avgPlacementTimeDays: 30,
                        lastReviewedAt: "",
                      });
                    }}
                    data-testid="button-cancel-occupation-edit"
                  >
                    Cancel
                  </Button>
                )}
              </div>
              <Form {...occupationForm}>
                <form
                  onSubmit={occupationForm.handleSubmit((data) => occupationMutation.mutate(data))}
                  className="space-y-4"
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
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-occupation-category" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={occupationForm.control}
                      name="demandLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Demand Level</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Demand level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="moderate">Moderate</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={occupationForm.control}
                      name="openRoles"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Open Roles</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} data-testid="input-open-roles" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={occupationForm.control}
                      name="priorityLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority Level (1-5)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} min={1} max={5} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={occupationForm.control}
                      name="avgPlacementTimeDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Avg. Placement Time (days)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={occupationForm.control}
                      name="remoteFriendly"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border px-3 py-2">
                          <div>
                            <FormLabel>Remote Friendly</FormLabel>
                            <p className="text-xs text-muted-foreground">
                              Role can be performed remotely or hybrid.
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-remote-friendly"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={occupationForm.control}
                      name="requiresCertification"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border px-3 py-2">
                          <div>
                            <FormLabel>Requires Certification</FormLabel>
                            <p className="text-xs text-muted-foreground">
                              Mark if a license or certification is mandatory.
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-requires-cert"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={occupationForm.control}
                    name="lastReviewedAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Reviewed</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={occupationForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea rows={4} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={occupationMutation.isPending}
                      data-testid="button-save-occupation"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {editingOccupationId ? "Update Occupation" : "Add Occupation"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
