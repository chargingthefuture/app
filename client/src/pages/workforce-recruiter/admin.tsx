import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "wouter";
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
import { PaginationControls } from "@/components/pagination-controls";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type {
  WorkforceRecruiterConfig,
  WorkforceRecruiterOccupation,
} from "@shared/schema";
import {
  insertWorkforceRecruiterConfigSchema,
  insertWorkforceRecruiterOccupationSchema,
} from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

type WorkforceRecruiterSummary = {
  totals: {
    totalProfiles: number;
    activeOccupations: number;
    openRoles: number;
  };
};

const configSchema = insertWorkforceRecruiterConfigSchema.partial();
type ConfigFormValues = z.infer<typeof configSchema>;

const occupationSchema = insertWorkforceRecruiterOccupationSchema.pick({
  title: true,
  sector: true,
  demandLevel: true,
  description: true,
  salaryRange: true,
  openings: true,
  isRemoteFriendly: true,
  trainingProvided: true,
});
type OccupationFormValues = z.infer<typeof occupationSchema>;

function AdminStat({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <Card>
      <CardHeader>
        <p className="text-sm text-muted-foreground">{label}</p>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function WorkforceRecruiterAdminPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(0);
  const [editingOccupationId, setEditingOccupationId] = useState<string | null>(null);

  const { data: summary } = useQuery<WorkforceRecruiterSummary>({
    queryKey: ["/api/workforce-recruiter/reports/summary"],
  });

  const { data: config } = useQuery<WorkforceRecruiterConfig>({
    queryKey: ["/api/workforce-recruiter/config"],
  });

  const { data: occupations = [], isLoading: occupationsLoading } =
    useQuery<WorkforceRecruiterOccupation[]>({
      queryKey: ["/api/workforce-recruiter/occupations", "includeInactive"],
      queryFn: async () => {
        const res = await fetch(
          "/api/workforce-recruiter/occupations?includeInactive=true",
          { credentials: "include" }
        );
        if (!res.ok) throw new Error("Failed to load occupations");
        return res.json();
      },
    });

  const configForm = useForm<ConfigFormValues>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      heroTitle: "",
      heroSubtitle: "",
      intakeStatus: "open",
      highlightOneLabel: "",
      highlightOneValue: "",
      highlightTwoLabel: "",
      highlightTwoValue: "",
      highlightThreeLabel: "",
      highlightThreeValue: "",
      contactEmail: "",
      contactPhone: "",
      resourceLinkLabel: "",
      resourceLinkUrl: "",
    },
  });

  useEffect(() => {
    if (config) {
      configForm.reset({
        heroTitle: config.heroTitle,
        heroSubtitle: config.heroSubtitle ?? "",
        intakeStatus: config.intakeStatus ?? "open",
        highlightOneLabel: config.highlightOneLabel ?? "",
        highlightOneValue: config.highlightOneValue ?? "",
        highlightTwoLabel: config.highlightTwoLabel ?? "",
        highlightTwoValue: config.highlightTwoValue ?? "",
        highlightThreeLabel: config.highlightThreeLabel ?? "",
        highlightThreeValue: config.highlightThreeValue ?? "",
        contactEmail: config.contactEmail ?? "",
        contactPhone: config.contactPhone ?? "",
        resourceLinkLabel: config.resourceLinkLabel ?? "",
        resourceLinkUrl: config.resourceLinkUrl ?? "",
      });
    }
  }, [config, configForm]);

  const occupationForm = useForm<OccupationFormValues>({
    resolver: zodResolver(occupationSchema),
    defaultValues: {
      title: "",
      sector: "",
      demandLevel: "growing",
      description: "",
      salaryRange: "",
      openings: 1,
      isRemoteFriendly: true,
      trainingProvided: false,
    },
  });

  const saveConfigMutation = useMutation({
    mutationFn: async (values: ConfigFormValues) => {
      await apiRequest("PUT", "/api/workforce-recruiter/admin/config", values);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/config"] });
      toast({ title: "Configuration saved" });
    },
    onError: (error: any) => {
      toast({
        title: "Error saving config",
        description: error.message || "Unable to update configuration",
        variant: "destructive",
      });
    },
  });

  const saveOccupationMutation = useMutation({
    mutationFn: async (values: OccupationFormValues) => {
      if (editingOccupationId) {
        await apiRequest(
          "PUT",
          `/api/workforce-recruiter/admin/occupations/${editingOccupationId}`,
          values
        );
      } else {
        await apiRequest("POST", "/api/workforce-recruiter/admin/occupations", values);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["/api/workforce-recruiter/occupations", "includeInactive"],
      });
      toast({ title: "Occupation saved" });
      setEditingOccupationId(null);
      occupationForm.reset({
        title: "",
        sector: "",
        demandLevel: "growing",
        description: "",
        salaryRange: "",
        openings: 1,
        isRemoteFriendly: true,
        trainingProvided: false,
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

  const deleteOccupationMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/workforce-recruiter/admin/occupations/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["/api/workforce-recruiter/occupations", "includeInactive"],
      });
      toast({ title: "Occupation removed" });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting occupation",
        description: error.message || "Unable to delete occupation",
        variant: "destructive",
      });
    },
  });

  const toggleOccupation = async (occupation: WorkforceRecruiterOccupation) => {
    await apiRequest(
      "PUT",
      `/api/workforce-recruiter/admin/occupations/${occupation.id}`,
      { isActive: !occupation.isActive }
    );
    await queryClient.invalidateQueries({
      queryKey: ["/api/workforce-recruiter/occupations", "includeInactive"],
    });
  };

  const paginatedOccupations = occupations.slice(page * 5, page * 5 + 5);

  const handleEditOccupation = (occupation: WorkforceRecruiterOccupation) => {
    setEditingOccupationId(occupation.id);
    occupationForm.reset({
      title: occupation.title,
      sector: occupation.sector,
      demandLevel: occupation.demandLevel as OccupationFormValues["demandLevel"],
      description: occupation.description ?? "",
      salaryRange: occupation.salaryRange ?? "",
      openings: occupation.openings ?? 0,
      isRemoteFriendly: occupation.isRemoteFriendly ?? true,
      trainingProvided: occupation.trainingProvided ?? false,
    });
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase text-muted-foreground">Workforce Recruiter</p>
          <h1 className="text-3xl font-semibold">Administration</h1>
          <p className="text-muted-foreground">
            Tune the hero copy, occupations, and announcements for trauma-informed hiring partners.
          </p>
        </div>
        <Button asChild data-testid="button-workforce-announcements">
          <Link href="/apps/workforce-recruiter/admin/announcements">
            Manage announcements
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <AdminStat
          label="Active candidates"
          value={summary?.totals.totalProfiles ?? 0}
          description="Profiles cleared for matching"
        />
        <AdminStat
          label="In-demand occupations"
          value={summary?.totals.activeOccupations ?? 0}
          description="Live pipelines with partners"
        />
        <AdminStat
          label="Open roles"
          value={summary?.totals.openRoles ?? 0}
          description="Roles vetted for safety"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hero & highlights</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...configForm}>
            <form
              onSubmit={configForm.handleSubmit((values) => saveConfigMutation.mutate(values))}
              className="space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={configForm.control}
                  name="heroTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hero title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={configForm.control}
                  name="intakeStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Intake status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="waitlist">Waitlist</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={configForm.control}
                name="heroSubtitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hero subtitle</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 md:grid-cols-3">
                {["One", "Two", "Three"].map((slot, index) => (
                  <div key={slot} className="rounded-lg border p-4 space-y-2">
                    <FormField
                      control={configForm.control}
                      name={`highlight${slot}Label` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Highlight {index + 1} label</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={configForm.control}
                      name={`highlight${slot}Value` as const}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Value</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={configForm.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={configForm.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={configForm.control}
                  name="resourceLinkLabel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resource link label</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={configForm.control}
                  name="resourceLinkUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resource link URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://example.org/resource" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button
                type="submit"
                disabled={saveConfigMutation.isPending}
                data-testid="button-save-workforce-config"
              >
                Save configuration
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{editingOccupationId ? "Edit occupation" : "New occupation"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...occupationForm}>
            <form
              onSubmit={occupationForm.handleSubmit((values) =>
                saveOccupationMutation.mutate({
                  ...values,
                  openings: Number(values.openings) || 0,
                })
              )}
              className="space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={occupationForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Community navigator" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={occupationForm.control}
                  name="sector"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sector</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Non-profit, technical assistance..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={occupationForm.control}
                  name="demandLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Demand</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select demand level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="growing">Growing</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="stabilizing">Stabilizing</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={occupationForm.control}
                  name="salaryRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salary range</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="$24/hr – $30/hr" />
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
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="Safety measures, supervision style, trauma-informed practices..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={occupationForm.control}
                  name="openings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Openings</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min={0}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center gap-4">
                  <FormField
                    control={occupationForm.control}
                    name="isRemoteFriendly"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-occupation-remote"
                          />
                        </FormControl>
                        <FormLabel className="m-0">Remote friendly</FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={occupationForm.control}
                    name="trainingProvided"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-occupation-training"
                          />
                        </FormControl>
                        <FormLabel className="m-0">Training included</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="submit"
                  disabled={saveOccupationMutation.isPending}
                  data-testid="button-save-occupation"
                >
                  {editingOccupationId ? "Update occupation" : "Add occupation"}
                </Button>
                {editingOccupationId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingOccupationId(null);
                      occupationForm.reset();
                    }}
                    data-testid="button-cancel-occupation-edit"
                  >
                    Cancel edit
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Occupation library</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {occupationsLoading ? (
            <p className="text-muted-foreground text-sm">Loading occupations...</p>
          ) : paginatedOccupations.length === 0 ? (
            <p className="text-muted-foreground text-sm">No occupations yet.</p>
          ) : (
            <div className="space-y-3">
              {paginatedOccupations.map((occupation) => (
                <div
                  key={occupation.id}
                  className="rounded-lg border p-4 space-y-2"
                  data-testid="card-workforce-occupation"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{occupation.title}</p>
                      <p className="text-sm text-muted-foreground">{occupation.sector}</p>
                    </div>
                    <Badge variant={occupation.isActive ? "default" : "secondary"}>
                      {occupation.isActive ? "ACTIVE" : "PAUSED"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {occupation.description || "Awaiting partner-provided description."}
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="font-medium">{occupation.demandLevel.toUpperCase()}</span>
                    <span>•</span>
                    <span>{occupation.openings ?? 0} openings</span>
                    <span>•</span>
                    <span>{occupation.isRemoteFriendly ? "Remote friendly" : "Onsite emphasis"}</span>
                    {occupation.trainingProvided && (
                      <>
                        <span>•</span>
                        <span>Training included</span>
                      </>
                    )}
                    {occupation.salaryRange && (
                      <>
                        <span>•</span>
                        <span>{occupation.salaryRange}</span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditOccupation(occupation)}
                      data-testid="button-edit-occupation"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleOccupation(occupation)}
                      data-testid="button-toggle-occupation"
                    >
                      {occupation.isActive ? "Pause" : "Activate"}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteOccupationMutation.mutate(occupation.id)}
                      data-testid="button-delete-occupation"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <PaginationControls
            currentPage={page}
            totalItems={occupations.length}
            itemsPerPage={5}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
