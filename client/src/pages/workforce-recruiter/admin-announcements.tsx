import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  type WorkforceRecruiterAnnouncement,
} from "@shared/schema";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { ArrowLeft, Megaphone, Trash2 } from "lucide-react";

const announcementFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  type: z.enum(["info", "warning", "maintenance", "update", "promotion"]),
  targetAudience: z.enum(["all", "job_seekers", "recruiters"]),
  expiresAt: z.string().optional().nullable(),
});

type AnnouncementFormValues = z.infer<typeof announcementFormSchema>;

const defaultValues: AnnouncementFormValues = {
  title: "",
  content: "",
  type: "info",
  targetAudience: "all",
  expiresAt: "",
};

export default function WorkforceRecruiterAdminAnnouncements() {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: announcements, isLoading } = useQuery<WorkforceRecruiterAnnouncement[]>({
    queryKey: ["/api/workforce-recruiter/admin/announcements"],
  });

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!editingId) {
      form.reset(defaultValues);
      return;
    }
    const current = announcements?.find((announcement) => announcement.id === editingId);
    if (current) {
      form.reset({
        title: current.title,
        content: current.content,
        type: current.type as AnnouncementFormValues["type"],
        targetAudience: current.targetAudience as AnnouncementFormValues["targetAudience"],
        expiresAt: current.expiresAt ? new Date(current.expiresAt).toISOString().split("T")[0] : "",
      });
    }
  }, [editingId, announcements, form]);

  const saveMutation = useMutation({
    mutationFn: async (values: AnnouncementFormValues) => {
      const payload = {
        ...values,
        expiresAt: values.expiresAt ? new Date(values.expiresAt) : null,
      };
      if (editingId) {
        return apiRequest("PUT", `/api/workforce-recruiter/admin/announcements/${editingId}`, payload);
      }
      return apiRequest("POST", "/api/workforce-recruiter/admin/announcements", payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/admin/announcements"] });
      setEditingId(null);
      toast({
        title: "Announcement saved",
        description: "Workforce Recruiter banner updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error saving announcement",
        description: error.message || "Unable to save announcement",
        variant: "destructive",
      });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/workforce-recruiter/admin/announcements/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/admin/announcements"] });
      toast({
        title: "Announcement archived",
        description: "Announcement is no longer visible to survivors.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error archiving announcement",
        description: error.message || "Unable to archive announcement",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/apps/workforce-recruiter/admin">
          <Button variant="ghost" size="icon" data-testid="button-back-admin">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <p className="text-sm uppercase tracking-wide text-primary font-semibold mb-1">
            Workforce Recruiter
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold">Manage announcements</h1>
          <p className="text-muted-foreground">
            Inform survivors and recruiters about role changes, safety updates, or maintenance windows.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-primary" />
            {editingId ? "Edit announcement" : "Create announcement"}
          </CardTitle>
          <CardDescription>
            All announcements are visible inside the Workforce Recruiter mini-app and on survivor dashboards.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Signal-verified employers added" data-testid="input-announcement-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        placeholder="Describe the update, available resources, or safety instructions."
                        data-testid="textarea-announcement-content"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-3 md:grid-cols-3">
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

                <FormField
                  control={form.control}
                  name="targetAudience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Audience</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-announcement-audience">
                            <SelectValue placeholder="Select audience" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">Everyone</SelectItem>
                          <SelectItem value="job_seekers">Job seekers</SelectItem>
                          <SelectItem value="recruiters">Recruiters</SelectItem>
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
                      <FormLabel>Expires on</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value ?? ""}
                          onChange={(event) => field.onChange(event.target.value || "")}
                          data-testid="input-announcement-expiration"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save-announcement">
                  {editingId ? "Update announcement" : "Create announcement"}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(null);
                      form.reset(defaultValues);
                    }}
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

      <Card>
        <CardHeader>
          <CardTitle>Existing announcements</CardTitle>
          <CardDescription>
            Deactivate announcements once they expire or no longer apply to survivors.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading announcements…</div>
          ) : !announcements || announcements.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
              No announcements yet. Create one above.
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="rounded-lg border px-4 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium">{announcement.title}</p>
                    <p className="text-sm text-muted-foreground">{announcement.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Type: {announcement.type} · Audience: {announcement.targetAudience}
                      {announcement.expiresAt && ` · Expires ${new Date(announcement.expiresAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingId(announcement.id)}
                      data-testid={`button-edit-announcement-${announcement.id}`}
                    >
                      Edit
                    </Button>
                    {announcement.isActive && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deactivateMutation.mutate(announcement.id)}
                        data-testid={`button-deactivate-announcement-${announcement.id}`}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Deactivate
                      </Button>
                    )}
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
