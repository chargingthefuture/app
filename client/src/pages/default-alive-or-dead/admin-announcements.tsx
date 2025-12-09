import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import type { DefaultAliveOrDeadAnnouncement } from "@shared/schema";
import { format } from "date-fns";
import { AlertCircle, Info, Wrench, Bell, Megaphone, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { MiniAppBackButton } from "@/components/mini-app-back-button";
import { AnnouncementDisplay } from "@/components/announcement-display";

const announcementFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  type: z.enum(["info", "warning", "maintenance", "update", "promotion"]),
  expiresAt: z.string().optional(),
});

type AnnouncementFormValues = z.infer<typeof announcementFormSchema>;

export default function DefaultAliveOrDeadAdminAnnouncements() {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: announcements, isLoading } = useQuery<DefaultAliveOrDeadAnnouncement[]>({
    queryKey: ["/api/default-alive-or-dead/admin/announcements"],
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

  const createMutation = useMutation({
    mutationFn: async (data: AnnouncementFormValues) => {
      const payload = {
        ...data,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      };
      return apiRequest("POST", "/api/default-alive-or-dead/admin/announcements", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/default-alive-or-dead/admin/announcements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/default-alive-or-dead/announcements"] });
      form.reset();
      toast({
        title: "Success",
        description: "Announcement created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create announcement",
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
      return apiRequest("PUT", `/api/default-alive-or-dead/admin/announcements/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/default-alive-or-dead/admin/announcements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/default-alive-or-dead/announcements"] });
      form.reset();
      setEditingId(null);
      toast({
        title: "Success",
        description: "Announcement updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update announcement",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/default-alive-or-dead/admin/announcements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/default-alive-or-dead/admin/announcements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/default-alive-or-dead/announcements"] });
      toast({
        title: "Success",
        description: "Announcement deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete announcement",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (announcement: DefaultAliveOrDeadAnnouncement) => {
    setEditingId(announcement.id);
    form.reset({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type as any,
      expiresAt: announcement.expiresAt ? format(new Date(announcement.expiresAt), "yyyy-MM-dd") : "",
    });
  };

  const handleCancelEdit = () => {
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertCircle className="w-4 h-4" />;
      case "maintenance":
        return <Wrench className="w-4 h-4" />;
      case "update":
        return <Bell className="w-4 h-4" />;
      case "promotion":
        return <Megaphone className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="flex items-center gap-4">
        <MiniAppBackButton href="/apps/default-alive-or-dead/admin" />
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold">Manage Announcements</h1>
          <p className="text-muted-foreground">
            Create and manage Default Alive or Dead announcements
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Announcement" : "Create New Announcement"}</CardTitle>
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
                      <Input {...field} placeholder="Announcement title" data-testid="input-announcement-title" />
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
                        placeholder="Announcement content"
                        rows={6}
                        data-testid="textarea-announcement-content"
                      />
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-announcement-type">
                          <SelectValue placeholder="Select announcement type" />
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
                    <FormLabel>Expiration Date (Optional)</FormLabel>
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

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit-announcement"
                >
                  {editingId ? "Update Announcement" : "Create Announcement"}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    data-testid="button-cancel-edit"
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
          <CardTitle>Existing Announcements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {announcements && announcements.length > 0 ? (
            announcements.map((announcement) => (
              <div key={announcement.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(announcement.type)}
                    <h3 className="font-semibold">{announcement.title}</h3>
                    <Badge variant={announcement.isActive ? "default" : "secondary"}>
                      {announcement.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline">{announcement.type}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(announcement)}
                      data-testid={`button-edit-announcement-${announcement.id}`}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteMutation.mutate(announcement.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-announcement-${announcement.id}`}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                <AnnouncementDisplay
                  id={announcement.id}
                  title={announcement.title}
                  content={announcement.content}
                  type={announcement.type}
                  createdAt={announcement.createdAt}
                  expiresAt={announcement.expiresAt}
                  showExpiration={true}
                />
                <p className="text-xs text-muted-foreground">
                  Created: {format(new Date(announcement.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  {announcement.expiresAt && (
                    <> • Expires: {format(new Date(announcement.expiresAt), "MMM d, yyyy")}</>
                  )}
                </p>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">No announcements found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

