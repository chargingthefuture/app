import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { WorkforceRecruiterAnnouncement } from "@shared/schema";
import { format } from "date-fns";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

const announcementFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  type: z.enum(["info", "warning", "maintenance", "update", "promotion"]),
  audience: z.enum(["general", "recruiters", "partners", "admins"]),
  expiresAt: z.string().optional(),
  ctaText: z.string().optional(),
  ctaUrl: z.string().url().optional().or(z.literal("")),
});

type AnnouncementFormValues = z.infer<typeof announcementFormSchema>;

export default function WorkforceRecruiterAdminAnnouncementsPage() {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: announcements, isLoading } = useQuery<WorkforceRecruiterAnnouncement[]>({
    queryKey: ["/api/workforce-recruiter/admin/announcements"],
  });

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: {
      title: "",
      content: "",
      type: "info",
      audience: "recruiters",
      expiresAt: "",
      ctaText: "",
      ctaUrl: "",
    },
  });

  const resetForm = () => {
    setEditingId(null);
    form.reset({
      title: "",
      content: "",
      type: "info",
      audience: "recruiters",
      expiresAt: "",
      ctaText: "",
      ctaUrl: "",
    });
  };

  const createMutation = useMutation({
    mutationFn: async (values: AnnouncementFormValues) => {
      const payload = {
        ...values,
        expiresAt: values.expiresAt ? new Date(values.expiresAt) : undefined,
        ctaUrl: values.ctaUrl || undefined,
      };
      return apiRequest("POST", "/api/workforce-recruiter/admin/announcements", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/admin/announcements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/announcements"] });
      resetForm();
      toast({ title: "Announcement created" });
    },
    onError: (error: any) =>
      toast({
        title: "Error",
        description: error.message || "Failed to create announcement",
        variant: "destructive",
      }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AnnouncementFormValues }) => {
      const payload = {
        ...data,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        ctaUrl: data.ctaUrl || undefined,
      };
      return apiRequest("PUT", `/api/workforce-recruiter/admin/announcements/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/admin/announcements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/announcements"] });
      resetForm();
      toast({ title: "Announcement updated" });
    },
    onError: (error: any) =>
      toast({
        title: "Error",
        description: error.message || "Failed to update announcement",
        variant: "destructive",
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      apiRequest("DELETE", `/api/workforce-recruiter/admin/announcements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/admin/announcements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/announcements"] });
      toast({ title: "Announcement archived" });
    },
    onError: (error: any) =>
      toast({
        title: "Error",
        description: error.message || "Failed to delete announcement",
        variant: "destructive",
      }),
  });

  const handleEdit = (announcement: WorkforceRecruiterAnnouncement) => {
    setEditingId(announcement.id);
    form.reset({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type as AnnouncementFormValues["type"],
      audience: (announcement.audience as AnnouncementFormValues["audience"]) ?? "recruiters",
      expiresAt: announcement.expiresAt
        ? format(new Date(announcement.expiresAt), "yyyy-MM-dd")
        : "",
      ctaText: announcement.ctaText ?? "",
      ctaUrl: announcement.ctaUrl ?? "",
    });
  };

  const onSubmit = (values: AnnouncementFormValues) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild data-testid="button-back-workforce-admin">
          <Link href="/apps/workforce-recruiter/admin">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-semibold">Manage Announcements</h1>
          <p className="text-muted-foreground">
            Share intake windows, downtime, and coordination notes with recruiters.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Announcement" : "Create Announcement"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-announcement-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="audience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Audience</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-announcement-audience">
                            <SelectValue placeholder="Select audience" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="recruiters">Recruiters</SelectItem>
                          <SelectItem value="partners">Partners</SelectItem>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="admins">Admins</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={4}
                        data-testid="textarea-announcement-content"
                        placeholder="Include actionable notes for the recruiter network."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-announcement-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="update">Update</SelectItem>
                          <SelectItem value="promotion">Promotion</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expiresAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expires On</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          data-testid="input-announcement-expires"
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
                  name="ctaText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CTA Label</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-announcement-cta-text" placeholder="Optional button copy" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ctaUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CTA URL</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-announcement-cta-url" placeholder="https://..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-announcement"
                >
                  {editingId ? "Update Announcement" : "Create Announcement"}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={resetForm}
                    data-testid="button-cancel-announcement-edit"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Existing Announcements</h2>
        {isLoading ? (
          <p className="text-muted-foreground">Loading announcements...</p>
        ) : announcements && announcements.length > 0 ? (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <Card key={announcement.id}>
                <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-lg">{announcement.title}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline">{announcement.type}</Badge>
                      <Badge variant="secondary">{announcement.audience ?? "recruiters"}</Badge>
                      {announcement.expiresAt && (
                        <span>
                          Expires {format(new Date(announcement.expiresAt), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(announcement)}
                      data-testid="button-edit-announcement"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteMutation.mutate(announcement.id)}
                      data-testid="button-delete-announcement"
                    >
                      Archive
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">{announcement.content}</p>
                  {announcement.ctaText && announcement.ctaUrl && (
                    <p className="text-sm text-muted-foreground">
                      CTA: {announcement.ctaText} · {announcement.ctaUrl}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No announcements yet.</p>
        )}
      </section>
    </div>
  );
}
