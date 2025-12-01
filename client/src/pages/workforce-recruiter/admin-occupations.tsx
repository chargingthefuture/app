import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { WorkforceRecruiterOccupation } from "@shared/schema";
import { insertWorkforceRecruiterOccupationSchema } from "@shared/schema";
import { format } from "date-fns";
import { Link } from "wouter";
import { ArrowLeft, Trash2 } from "lucide-react";

const occupationFormSchema = insertWorkforceRecruiterOccupationSchema.omit({ createdBy: true });

type OccupationFormValues = z.infer<typeof occupationFormSchema>;

interface PaginatedOccupations {
  items: WorkforceRecruiterOccupation[];
  total: number;
}

export default function WorkforceRecruiterAdminOccupations() {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(true);

  const { data, isLoading } = useQuery<PaginatedOccupations>({
    queryKey: [
      `/api/workforce-recruiter/admin/occupations?limit=100&offset=0&includeInactive=${includeInactive}`,
    ],
  });

  const occupations = data?.items ?? [];

  const form = useForm<OccupationFormValues>({
    resolver: zodResolver(occupationFormSchema),
    defaultValues: {
      title: "",
      sector: "",
      description: "",
      demandLevel: "steady",
      openRoles: 1,
      annualCompensationUsd: undefined,
      locations: "",
      skillsEmphasis: "",
      trainingResources: "",
      supportNotes: "",
      isRemoteFriendly: true,
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: OccupationFormValues) => apiRequest("POST", "/api/workforce-recruiter/admin/occupations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/admin/occupations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/occupations"] });
      form.reset({
        title: "",
        sector: "",
        description: "",
        demandLevel: "steady",
        openRoles: 1,
        annualCompensationUsd: undefined,
        locations: "",
        skillsEmphasis: "",
        trainingResources: "",
        supportNotes: "",
        isRemoteFriendly: true,
        isActive: true,
      });
      toast({ title: "Occupation created" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create occupation", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: OccupationFormValues }) =>
      apiRequest("PUT", `/api/workforce-recruiter/admin/occupations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/admin/occupations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/occupations"] });
      setEditingId(null);
      form.reset({
        title: "",
        sector: "",
        description: "",
        demandLevel: "steady",
        openRoles: 1,
        annualCompensationUsd: undefined,
        locations: "",
        skillsEmphasis: "",
        trainingResources: "",
        supportNotes: "",
        isRemoteFriendly: true,
        isActive: true,
      });
      toast({ title: "Occupation updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update occupation", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/workforce-recruiter/admin/occupations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/admin/occupations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/occupations"] });
      toast({ title: "Occupation removed" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete occupation", variant: "destructive" });
    },
  });

  const handleEdit = (occupation: WorkforceRecruiterOccupation) => {
    setEditingId(occupation.id);
    form.reset({
      title: occupation.title,
      sector: occupation.sector,
      description: occupation.description,
      demandLevel: occupation.demandLevel as OccupationFormValues["demandLevel"],
      openRoles: occupation.openRoles ?? 0,
      annualCompensationUsd: occupation.annualCompensationUsd ?? undefined,
      locations: occupation.locations ?? "",
      skillsEmphasis: occupation.skillsEmphasis ?? "",
      trainingResources: occupation.trainingResources ?? "",
      supportNotes: occupation.supportNotes ?? "",
      isRemoteFriendly: occupation.isRemoteFriendly ?? true,
      isActive: occupation.isActive ?? true,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    form.reset({
      title: "",
      sector: "",
      description: "",
      demandLevel: "steady",
      openRoles: 1,
      annualCompensationUsd: undefined,
      locations: "",
      skillsEmphasis: "",
      trainingResources: "",
      supportNotes: "",
      isRemoteFriendly: true,
      isActive: true,
    });
  };

  const onSubmit = (data: OccupationFormValues) => {
    const payload: OccupationFormValues = {
      ...data,
      locations: data.locations || null,
      skillsEmphasis: data.skillsEmphasis || null,
      trainingResources: data.trainingResources || null,
      supportNotes: data.supportNotes || null,
    } as OccupationFormValues;

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8">
        <p className="text-center text-muted-foreground">Loading occupations…</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/apps/workforce-recruiter/admin">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-semibold">Manage Occupations</h1>
          <p className="text-muted-foreground">
            Publish or retire trauma-informed job pathways.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Occupation" : "Create Occupation"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Community Safety Coordinator" data-testid="input-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sector"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sector</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Safety · Logistics · Health" data-testid="input-sector" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} placeholder="Describe duties, supports, and living wage details" data-testid="textarea-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="demandLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Demand Level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-demand-level">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="steady">Steady</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="openRoles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Open Roles</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          value={field.value ?? ""}
                          onChange={(event) => field.onChange(Number(event.target.value) || 0)}
                          data-testid="input-open-roles"
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
                  name="annualCompensationUsd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Annual Compensation (USD)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          value={field.value ?? ""}
                          onChange={(event) => field.onChange(event.target.value ? Number(event.target.value) : undefined)}
                          data-testid="input-compensation"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="locations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Locations</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Remote · Nairobi · Toronto" data-testid="input-locations" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="skillsEmphasis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skills Emphasis</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Language access, mobile outreach, crisis response" data-testid="textarea-skills" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="trainingResources"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Training Resources</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="List partner orgs or scholarship codes" data-testid="textarea-training" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supportNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Support Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Include wraparound or confidentiality notes" data-testid="textarea-support" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="isRemoteFriendly"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel>Remote Friendly</FormLabel>
                        <p className="text-sm text-muted-foreground">Supports remote/virtual placements.</p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value ?? false} onCheckedChange={field.onChange} data-testid="switch-remote" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel>Active Listing</FormLabel>
                        <p className="text-sm text-muted-foreground">Hide or publish this occupation.</p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value ?? true} onCheckedChange={field.onChange} data-testid="switch-active" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit">
                  {editingId ? "Update Occupation" : "Create Occupation"}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={handleCancel} data-testid="button-cancel">
                    Cancel
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIncludeInactive((prev) => !prev)}
                  data-testid="button-toggle-inactive"
                >
                  {includeInactive ? "Hide Inactive" : "Show Inactive"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Current Occupations</h2>
        {occupations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              No occupations found. Create one above.
            </CardContent>
          </Card>
        ) : (
          occupations.map((occupation) => (
            <Card key={occupation.id}>
              <CardContent className="p-6 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-foreground">{occupation.title}</p>
                    <p className="text-sm text-muted-foreground">{occupation.sector}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(occupation)} data-testid={`button-edit-${occupation.id}`}>
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteMutation.mutate(occupation.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${occupation.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{occupation.description}</p>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>Demand: {occupation.demandLevel}</span>
                  <span>{occupation.isRemoteFriendly ? "Remote friendly" : "On-site"}</span>
                  <span>{occupation.openRoles ?? 0} open roles</span>
                  <span>Created {format(new Date(occupation.createdAt), "MMM d, yyyy")}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
