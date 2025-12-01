import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { WorkforceRecruiterAnnouncement } from "@shared/schema";
import { format } from "date-fns";
import { ArrowLeft, Trash2 } from "lucide-react";
import { AnnouncementDisplay } from "@/components/announcement-display";

const announcementFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  type: z.enum(["info", "warning", "maintenance", "update", "promotion"]),
  expiresAt: z.string().optional(),
});

type AnnouncementFormValues = z.infer<typeof announcementFormSchema>;

export default function WorkforceRecruiterAdminAnnouncements() {
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
      expiresAt: "",
    },
  });

  const invalidateAnnouncementQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/admin/announcements"] });
    queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/announcements"] });
  };

  const createMutation = useMutation({
    mutationFn: async (data: AnnouncementFormValues) => {
      const payload = {
        ...data,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      };
      return apiRequest("POST", "/api/workforce-recruiter/admin/announcements", payload);
    },
    onSuccess: () => {
      invalidateAnnouncementQueries();
      form.reset();
      toast({
        title: "Announcement created",
        description: "Workforce Recruiter advocates will see it right away.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create announcement",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AnnouncementFormValues }) => {
      const payload = {
        ...data,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      };
      return apiRequest("PUT", `/api/workforce-recruiter/admin/announcements/${id}`, payload);
    },
    onSuccess: () => {
      invalidateAnnouncementQueries();
      form.reset();
      setEditingId(null);
      toast({
        title: "Announcement updated",
        description: "Your changes are live.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update announcement",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/workforce-recruiter/admin/announcements/${id}`);
    },
    onSuccess: () => {
      invalidateAnnouncementQueries();
      toast({
        title: "Announcement archived",
        description: "It will no longer surface to advocates.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to deactivate announcement",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (announcement: WorkforceRecruiterAnnouncement) => {
    setEditingId(announcement.id);
    form.reset({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type as AnnouncementFormValues["type"],
      expiresAt: announcement.expiresAt
        ? format(new Date(announcement.expiresAt), "yyyy-MM-dd")
        : "",
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    form.reset();
  };

  const onSubmit = (data: AnnouncementFormValues) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading announcements…</p>
        </div>
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
          <h1 className="text-3xl font-semibold">Manage Announcements</h1>
          <p className="text-muted-foreground">
            Publish operational updates for the Workforce Recruiter collective.
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
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-title" />
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
                      <Textarea rows={5} {...field} data-testid="textarea-content" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-type">
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
                      <FormLabel>Expiration date (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value || ""}
                          data-testid="input-expiresAt"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit"
                >
                  {editingId ? "Update announcement" : "Publish announcement"}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          Live announcements
          <Badge variant="outline">{announcements?.length ?? 0}</Badge>
        </h2>
        {announcements && announcements.length > 0 ? (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <Card key={announcement.id}>
                <CardContent className="p-5 space-y-3">
                  <AnnouncementDisplay
                    id={announcement.id}
                    title={announcement.title}
                    content={announcement.content}
                    type={announcement.type}
                    createdAt={announcement.createdAt}
                    expiresAt={announcement.expiresAt}
                    showExpiration
                  />
                  <div className="flex flex-wrap gap-2 justify-between items-center">
                    <Badge variant={announcement.isActive ? "default" : "secondary"}>
                      {announcement.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(announcement)}
                        data-testid={`button-edit-${announcement.id}`}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMutation.mutate(announcement.id)}
                        data-testid={`button-delete-${announcement.id}`}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Archive
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No announcements yet. Publish one using the form above.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
