import { useState } from "react";
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
import { AnnouncementDisplay } from "@/components/announcement-display";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { WorkforceRecruiterAnnouncement } from "@shared/schema";
import { insertWorkforceRecruiterAnnouncementSchema } from "@shared/schema";
import { ArrowLeft } from "lucide-react";

const announcementFormSchema = insertWorkforceRecruiterAnnouncementSchema.pick({
  title: true,
  content: true,
  type: true,
  audience: true,
  ctaLabel: true,
  ctaUrl: true,
  expiresAt: true,
});

type AnnouncementFormValues = z.infer<typeof announcementFormSchema>;

export default function WorkforceRecruiterAdminAnnouncementsPage() {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    data: announcements = [],
    isLoading,
  } = useQuery<WorkforceRecruiterAnnouncement[]>({
    queryKey: ["/api/workforce-recruiter/admin/announcements"],
  });

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: {
      title: "",
      content: "",
      type: "info",
      audience: "applicants",
      ctaLabel: "",
      ctaUrl: "",
      expiresAt: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: AnnouncementFormValues) => {
      await apiRequest("POST", "/api/workforce-recruiter/admin/announcements", {
        ...values,
        expiresAt: values.expiresAt || undefined,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["/api/workforce-recruiter/admin/announcements"],
      });
      toast({ title: "Announcement created" });
      form.reset({
        title: "",
        content: "",
        type: "info",
        audience: "applicants",
        ctaLabel: "",
        ctaUrl: "",
        expiresAt: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Unable to create announcement",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: AnnouncementFormValues) => {
      if (!editingId) return;
      await apiRequest(
        "PUT",
        `/api/workforce-recruiter/admin/announcements/${editingId}`,
        {
          ...values,
          expiresAt: values.expiresAt || undefined,
        },
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["/api/workforce-recruiter/admin/announcements"],
      });
      toast({ title: "Announcement updated" });
      setEditingId(null);
      form.reset({
        title: "",
        content: "",
        type: "info",
        audience: "applicants",
        ctaLabel: "",
        ctaUrl: "",
        expiresAt: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Unable to update announcement",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/workforce-recruiter/admin/announcements/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["/api/workforce-recruiter/admin/announcements"],
      });
      toast({ title: "Announcement removed" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Unable to delete announcement",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: AnnouncementFormValues) => {
    if (editingId) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  const startEditing = (announcement: WorkforceRecruiterAnnouncement) => {
    setEditingId(announcement.id);
    form.reset({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type as AnnouncementFormValues["type"],
      audience: (announcement.audience as AnnouncementFormValues["audience"]) ?? "applicants",
      ctaLabel: announcement.ctaLabel ?? "",
      ctaUrl: announcement.ctaUrl ?? "",
      expiresAt: announcement.expiresAt
        ? announcement.expiresAt.slice(0, 10)
        : "",
    });
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          asChild
          variant="ghost"
          size="icon"
          data-testid="button-back-to-admin"
        >
          <Link href="/apps/workforce-recruiter/admin">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <p className="text-sm uppercase text-muted-foreground">Workforce Recruiter</p>
          <h1 className="text-3xl font-semibold">Announcements</h1>
          <p className="text-muted-foreground">
            Publish role updates, safety alerts, and hiring pauses in one place.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit announcement" : "Create announcement"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
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
              </div>
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={4}
                        data-testid="textarea-announcement-content"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="audience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Audience</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-announcement-audience">
                            <SelectValue placeholder="Audience" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="applicants">Applicants</SelectItem>
                          <SelectItem value="employers">Employer partners</SelectItem>
                          <SelectItem value="all">All users</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ctaLabel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CTA label</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Review safety checklist" />
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
                        <Input {...field} placeholder="https://example.org/checklist" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiration date (optional)</FormLabel>
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
              <div className="flex flex-wrap gap-3">
                <Button
                  type="submit"
                  data-testid="button-save-announcement"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingId ? "Update announcement" : "Publish announcement"}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingId(null);
                      form.reset({
                        title: "",
                        content: "",
                        type: "info",
                        audience: "applicants",
                        ctaLabel: "",
                        ctaUrl: "",
                        expiresAt: "",
                      });
                    }}
                    data-testid="button-cancel-announcement-edit"
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
          <CardTitle>Published announcements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading announcements...</p>
          ) : announcements.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing published yet.</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="space-y-2">
                  <AnnouncementDisplay
                    id={announcement.id}
                    title={announcement.title}
                    content={announcement.content}
                    type={announcement.type}
                    createdAt={announcement.createdAt}
                    expiresAt={announcement.expiresAt}
                    showExpiration
                    testId={`announcement-${announcement.id}`}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditing(announcement)}
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
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
