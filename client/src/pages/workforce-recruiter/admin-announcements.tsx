import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Megaphone, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { MiniAppBackButton } from "@/components/mini-app-back-button";

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
        title: "Announcement published",
        description: "Recruiters will see the update right away.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Unable to publish announcement",
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
        description: "Changes saved successfully.",
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
      return apiRequest("DELETE", `/api/workforce-recruiter/admin/announcements/${id}`);
    },
    onSuccess: () => {
      invalidateAnnouncementQueries();
      toast({
        title: "Announcement removed",
        description: "It no longer appears for recruiters.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Unable to delete announcement",
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
      expiresAt: announcement.expiresAt ? format(new Date(announcement.expiresAt), "yyyy-MM-dd") : "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    form.reset({
      title: "",
      content: "",
      type: "info",
      expiresAt: "",
    });
  };

  const onSubmit = (data: AnnouncementFormValues) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "warning":
        return "destructive" as const;
      case "maintenance":
        return "secondary" as const;
      case "promotion":
        return "default" as const;
      default:
        return "outline" as const;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-8">
      <MiniAppBackButton />
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/apps/workforce-recruiter/admin">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-semibold flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary" />
            Workforce Recruiter Announcements
          </h1>
          <p className="text-muted-foreground">
            Inform recruiters about policy updates, maintenance, and new roles.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Announcement" : "Create Announcement"}</CardTitle>
          <CardDescription>
            All announcements display in the Workforce Recruiter dashboard banner.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
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
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} data-testid="textarea-announcement-content" />
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
                          <SelectTrigger>
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
                      <FormLabel>Expires On (optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="submit"
                  data-testid="button-submit-workforce-announcement"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {editingId ? "Update Announcement" : "Publish Announcement"}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
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
          <CardTitle>Recent Announcements</CardTitle>
          <CardDescription>Drag-friendly cards for quick editing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {announcements && announcements.length > 0 ? (
            announcements.map((announcement) => (
              <Card key={announcement.id} className="border border-muted/80">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Badge variant={getBadgeVariant(announcement.type)}>
                        {announcement.type.toUpperCase()}
                      </Badge>
                      {announcement.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Published {format(new Date(announcement.createdAt), "PPP")}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(announcement)}
                      data-testid={`button-edit-announcement-${announcement.id}`}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => deleteMutation.mutate(announcement.id)}
                      data-testid={`button-delete-announcement-${announcement.id}`}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{announcement.content}</p>
                  {announcement.expiresAt && (
                    <div className="text-xs text-muted-foreground">
                      Expires {format(new Date(announcement.expiresAt), "PPP")}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center text-sm text-muted-foreground py-10">
              No announcements yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
