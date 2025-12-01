import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useFuzzySearch } from "@/hooks/useFuzzySearch";
import { PaginationControls } from "@/components/pagination-controls";
import {
  insertWorkforceRecruiterConfigSchema,
  insertWorkforceRecruiterOccupationSchema,
  type WorkforceRecruiterConfig,
  type WorkforceRecruiterOccupation,
} from "@shared/schema";
import { ArrowRight, ArrowLeft, ListChecks, Target, TrendingUp } from "lucide-react";

const configFormSchema = insertWorkforceRecruiterConfigSchema.partial();
type ConfigFormValues = z.infer<typeof configFormSchema>;

type OccupationFormValues = z.infer<typeof insertWorkforceRecruiterOccupationSchema>;

export default function WorkforceRecruiterAdmin() {
  const { toast } = useToast();
  const [editingOccupationId, setEditingOccupationId] = useState<string | null>(null);
  const [occupationPage, setOccupationPage] = useState(0);
  const [occupationSearch, setOccupationSearch] = useState("");
  const occupationsPerPage = 10;

  const { data: config } = useQuery<WorkforceRecruiterConfig>({
    queryKey: ["/api/workforce-recruiter/admin/config"],
  });

  const { data: summary } = useQuery<{
    totals: {
      activeRecruiters: number;
      totalCapacity: number;
      talentPoolSize: number;
      urgentOpenings: number;
      placementsLast30Days: number;
    };
  }>({
    queryKey: ["/api/workforce-recruiter/reports/summary"],
  });

  const { data: occupationsData, isLoading: isOccupationsLoading } = useQuery<{
    items: WorkforceRecruiterOccupation[];
    total: number;
  }>({
    queryKey: [
      `/api/workforce-recruiter/admin/occupations?limit=${occupationsPerPage}&offset=${
        occupationPage * occupationsPerPage
      }`,
    ],
  });

  const configForm = useForm<ConfigFormValues>({
    resolver: zodResolver(configFormSchema),
    defaultValues: {
      intakeStatus: "open",
      highlightMessage: "",
      supportEmail: "",
      supportSignal: "",
      supportPhone: "",
      applicationLink: "",
      resourcesLink: "",
      maxActiveRecruiters: 50,
      placementsGoalMonthly: 25,
      enableWaitlist: true,
    },
  });

  useEffect(() => {
    if (config) {
      configForm.reset({
        intakeStatus: config.intakeStatus,
        highlightMessage: config.highlightMessage ?? "",
        supportEmail: config.supportEmail ?? "",
        supportSignal: config.supportSignal ?? "",
        supportPhone: config.supportPhone ?? "",
        applicationLink: config.applicationLink ?? "",
        resourcesLink: config.resourcesLink ?? "",
        maxActiveRecruiters: config.maxActiveRecruiters,
        placementsGoalMonthly: config.placementsGoalMonthly,
        enableWaitlist: config.enableWaitlist ?? true,
      });
    }
  }, [config, configForm]);

  const configMutation = useMutation({
    mutationFn: (data: ConfigFormValues) =>
      apiRequest("PUT", "/api/workforce-recruiter/admin/config", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/admin/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/config"] });
      toast({
        title: "Configuration updated",
        description: "Workforce Recruiter settings saved.",
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

  const occupationForm = useForm<OccupationFormValues>({
    resolver: zodResolver(insertWorkforceRecruiterOccupationSchema),
    defaultValues: {
      occupationName: "",
      regionFocus: "",
      priorityLevel: "standard",
      talentPoolSize: 0,
      urgentOpenings: 0,
      placementsLast30Days: 0,
      avgTimeToFillDays: 30,
      supportNeeded: "",
      isActive: true,
    },
  });

  const occupationMutation = useMutation({
    mutationFn: (payload: { id?: string; data: OccupationFormValues }) => {
      if (payload.id) {
        return apiRequest(
          "PUT",
          `/api/workforce-recruiter/admin/occupations/${payload.id}`,
          payload.data
        );
      }
      return apiRequest("POST", "/api/workforce-recruiter/admin/occupations", payload.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          `/api/workforce-recruiter/admin/occupations?limit=${occupationsPerPage}&offset=${
            occupationPage * occupationsPerPage
          }`,
        ],
      });
      toast({
        title: editingOccupationId ? "Occupation updated" : "Occupation created",
        description: "Changes have been saved.",
      });
      occupationForm.reset({
        occupationName: "",
        regionFocus: "",
        priorityLevel: "standard",
        talentPoolSize: 0,
        urgentOpenings: 0,
        placementsLast30Days: 0,
        avgTimeToFillDays: 30,
        supportNeeded: "",
        isActive: true,
      });
      setEditingOccupationId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save occupation",
        variant: "destructive",
      });
    },
  });

  const occupationQuickUpdateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<OccupationFormValues> }) =>
      apiRequest("PUT", `/api/workforce-recruiter/admin/occupations/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          `/api/workforce-recruiter/admin/occupations?limit=${occupationsPerPage}&offset=${
            occupationPage * occupationsPerPage
          }`,
        ],
      });
      toast({
        title: "Occupation updated",
        description: variables.data.isActive !== undefined ? "Visibility updated." : "Saved changes.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update occupation",
        variant: "destructive",
      });
    },
  });

  const occupationDeleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/workforce-recruiter/admin/occupations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          `/api/workforce-recruiter/admin/occupations?limit=${occupationsPerPage}&offset=${
            occupationPage * occupationsPerPage
          }`,
        ],
      });
      toast({
        title: "Occupation removed",
        description: "The entry has been deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete occupation",
        variant: "destructive",
      });
    },
  });

  const occupancyFormReset = (occupation: WorkforceRecruiterOccupation | null) => {
    occupationForm.reset(
      occupation
        ? {
            occupationName: occupation.occupationName,
            regionFocus: occupation.regionFocus ?? "",
            priorityLevel: occupation.priorityLevel as OccupationFormValues["priorityLevel"],
            talentPoolSize: occupation.talentPoolSize ?? 0,
            urgentOpenings: occupation.urgentOpenings ?? 0,
            placementsLast30Days: occupation.placementsLast30Days ?? 0,
            avgTimeToFillDays: occupation.avgTimeToFillDays ?? 30,
            supportNeeded: occupation.supportNeeded ?? "",
            isActive: occupation.isActive ?? true,
          }
        : {
            occupationName: "",
            regionFocus: "",
            priorityLevel: "standard",
            talentPoolSize: 0,
            urgentOpenings: 0,
            placementsLast30Days: 0,
            avgTimeToFillDays: 30,
            supportNeeded: "",
            isActive: true,
          }
    );
  };

  const handleEditOccupation = (occupation: WorkforceRecruiterOccupation) => {
    occupancyFormReset(occupation);
    setEditingOccupationId(occupation.id);
  };

  const filteredOccupations = useFuzzySearch(
    occupationsData?.items ?? [],
    occupationSearch,
    {
      searchFields: [
        "occupationName",
        "regionFocus",
        "priorityLevel",
        "supportNeeded",
      ],
    }
  );

  const handleConfigSubmit = (values: ConfigFormValues) => {
    configMutation.mutate(values);
  };

  const handleOccupationSubmit = (values: OccupationFormValues) => {
    occupationMutation.mutate({ id: editingOccupationId ?? undefined, data: values });
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/apps/workforce-recruiter">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-semibold">Workforce Recruiter Admin</h1>
          <p className="text-muted-foreground">
            Configure pipeline guardrails, occupancy, and announcements.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Intake posture
            </CardTitle>
            <CardDescription>Live recruitment capacity</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-sm">
              {config?.intakeStatus ?? "open"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Recruiters
            </CardTitle>
            <CardDescription>Active profiles</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {summary?.totals.activeRecruiters ?? 0} / {config?.maxActiveRecruiters ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-primary" />
              Monthly goal
            </CardTitle>
            <CardDescription>Placements target</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {summary?.totals.placementsLast30Days ?? 0} /{" "}
              {config?.placementsGoalMonthly ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Adjust intake posture, contact channels, and goal posts.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...configForm}>
            <form
              className="space-y-4"
              onSubmit={configForm.handleSubmit(handleConfigSubmit)}
            >
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={configForm.control}
                  name="intakeStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Intake status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-intake-status">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
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
                        <Textarea rows={3} {...field} data-testid="textarea-highlight" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={configForm.control}
                  name="supportEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Support email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} data-testid="input-support-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={configForm.control}
                  name="supportPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Support phone</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-support-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={configForm.control}
                  name="supportSignal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Signal link</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://signal.me/#..." data-testid="input-support-signal" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={configForm.control}
                  name="applicationLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Application link</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-application-link" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={configForm.control}
                  name="resourcesLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resource library</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-resources-link" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <FormField
                  control={configForm.control}
                  name="maxActiveRecruiters"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max active recruiters</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value ?? ""}
                          onChange={(event) =>
                            field.onChange(event.target.value ? Number(event.target.value) : undefined)
                          }
                          data-testid="input-max-recruiters"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={configForm.control}
                  name="placementsGoalMonthly"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly placement goal</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value ?? ""}
                          onChange={(event) =>
                            field.onChange(event.target.value ? Number(event.target.value) : undefined)
                          }
                          data-testid="input-placement-goal"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={configForm.control}
                  name="enableWaitlist"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <FormLabel>Enable waitlist</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={field.value ?? true}
                            onCheckedChange={field.onChange}
                            data-testid="switch-enable-waitlist"
                          />
                          <span className="text-sm text-muted-foreground">
                            Route overflow to transparent queue
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                disabled={configMutation.isPending}
                data-testid="button-save-config"
              >
                Save configuration
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Occupations</CardTitle>
          <CardDescription>Govern high-sensitivity placement channels.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...occupationForm}>
            <form
              className="space-y-4"
              onSubmit={occupationForm.handleSubmit(handleOccupationSubmit)}
            >
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={occupationForm.control}
                  name="occupationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Occupation name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-occupation-name" />
                      </FormControl>
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
                        <Input {...field} data-testid="input-region-focus" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <FormField
                  control={occupationForm.control}
                  name="priorityLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-priority">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="priority">Priority</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={occupationForm.control}
                  name="talentPoolSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Talent pool size</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value ?? ""}
                          onChange={(event) =>
                            field.onChange(event.target.value ? Number(event.target.value) : undefined)
                          }
                          data-testid="input-talent-pool"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={occupationForm.control}
                  name="urgentOpenings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Urgent openings</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value ?? ""}
                          onChange={(event) =>
                            field.onChange(event.target.value ? Number(event.target.value) : undefined)
                          }
                          data-testid="input-urgent-openings"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <FormField
                  control={occupationForm.control}
                  name="placementsLast30Days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placements (last 30 days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value ?? ""}
                          onChange={(event) =>
                            field.onChange(event.target.value ? Number(event.target.value) : undefined)
                          }
                          data-testid="input-placements-last30"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={occupationForm.control}
                  name="avgTimeToFillDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avg. time to fill (days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value ?? ""}
                          onChange={(event) =>
                            field.onChange(event.target.value ? Number(event.target.value) : undefined)
                          }
                          data-testid="input-avg-fill-days"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={occupationForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <FormLabel>Active</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-occupation-active"
                          />
                          <span className="text-sm text-muted-foreground">
                            Visible to advocates
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={occupationForm.control}
                name="supportNeeded"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Support needed</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} data-testid="textarea-support-needed" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3">
                <Button
                  type="submit"
                  data-testid="button-save-occupation"
                  disabled={occupationMutation.isPending}
                >
                  {editingOccupationId ? "Update occupation" : "Create occupation"}
                </Button>
                {editingOccupationId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingOccupationId(null);
                      occupancyFormReset(null);
                    }}
                    data-testid="button-cancel-edit"
                  >
                    Cancel edit
                  </Button>
                )}
              </div>
            </form>
          </Form>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <Input
                placeholder="Search occupations..."
                value={occupationSearch}
                onChange={(event) => setOccupationSearch(event.target.value)}
                className="md:max-w-sm"
                data-testid="input-search-admin-occupations"
              />
              <PaginationControls
                currentPage={occupationPage}
                totalItems={occupationsData?.total ?? 0}
                itemsPerPage={occupationsPerPage}
                onPageChange={setOccupationPage}
              />
            </div>

            {isOccupationsLoading ? (
              <p className="text-center text-muted-foreground py-6">Loading occupations…</p>
            ) : filteredOccupations.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">
                No occupations found.
              </p>
            ) : (
              <div className="space-y-4">
                {filteredOccupations.map((occupation) => (
                  <Card key={occupation.id} className="border border-dashed">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-lg font-semibold">{occupation.occupationName}</p>
                          <p className="text-sm text-muted-foreground">
                            {occupation.regionFocus || "Global"}
                          </p>
                        </div>
                        <Badge variant={occupation.isActive ? "default" : "secondary"}>
                          {occupation.priorityLevel}
                        </Badge>
                      </div>
                      <div className="grid md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Talent pool</p>
                          <p className="font-medium">{occupation.talentPoolSize}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Urgent openings</p>
                          <p className="font-medium">{occupation.urgentOpenings}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Placements (30d)</p>
                          <p className="font-medium">{occupation.placementsLast30Days}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Avg. fill days</p>
                          <p className="font-medium">{occupation.avgTimeToFillDays}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditOccupation(occupation)}
                          data-testid={`button-edit-${occupation.id}`}
                        >
                          Edit
                        </Button>
                        <Button
                          variant={occupation.isActive ? "secondary" : "outline"}
                          size="sm"
                          onClick={() =>
                            occupationQuickUpdateMutation.mutate({
                              id: occupation.id,
                              data: { isActive: !occupation.isActive },
                            })
                          }
                          disabled={occupationQuickUpdateMutation.isPending}
                          data-testid={`button-toggle-${occupation.id}`}
                        >
                          {occupation.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => occupationDeleteMutation.mutate(occupation.id)}
                          data-testid={`button-delete-${occupation.id}`}
                        >
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Announcements & Comms</CardTitle>
          <CardDescription>Publish updates for Workforce Recruiter advocates.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">
            Manage maintenance notifications, recruiting freezes, and policy updates.
          </p>
          <Link href="/apps/workforce-recruiter/admin/announcements">
            <Button data-testid="button-manage-announcements">
              Manage announcements
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
