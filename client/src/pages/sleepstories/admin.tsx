import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SleepStory } from "@shared/schema";
import { Plus, Trash2, Edit, Clock } from "lucide-react";

const storyFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  duration: z.string().min(1, "Duration is required").refine((val) => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "Duration must be a positive number (in seconds)",
  }),
  wistiaMediaId: z.string().min(1, "Wistia Media ID is required"),
  downloadUrl: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  thumbnailUrl: z.string().optional(),
  isActive: z.boolean().default(true),
});

type StoryFormValues = z.infer<typeof storyFormSchema>;

export default function SleepStoriesAdmin() {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: stories, isLoading } = useQuery<SleepStory[]>({
    queryKey: ["/api/sleepstories/admin/all"],
  });

  const form = useForm<StoryFormValues>({
    resolver: zodResolver(storyFormSchema),
    defaultValues: {
      title: "",
      description: "",
      duration: "",
      wistiaMediaId: "",
      downloadUrl: "",
      category: "general",
      thumbnailUrl: "",
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: StoryFormValues) => {
      const payload = {
        ...data,
        duration: parseInt(data.duration),
      };
      return apiRequest("POST", "/api/sleepstories/admin", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sleepstories/admin/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sleepstories"] });
      form.reset();
      setShowForm(false);
      toast({
        title: "Success",
        description: "Sleep story created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create sleep story",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: StoryFormValues }) => {
      const payload = {
        ...data,
        duration: parseInt(data.duration),
      };
      return apiRequest("PUT", `/api/sleepstories/admin/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sleepstories/admin/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sleepstories"] });
      form.reset();
      setEditingId(null);
      setShowForm(false);
      toast({
        title: "Success",
        description: "Sleep story updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update sleep story",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/sleepstories/admin/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sleepstories/admin/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sleepstories"] });
      toast({
        title: "Success",
        description: "Sleep story deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete sleep story",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: StoryFormValues) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (story: SleepStory) => {
    setEditingId(story.id);
    setShowForm(true);
    form.reset({
      title: story.title,
      description: story.description,
      duration: story.duration.toString(),
      wistiaMediaId: story.wistiaMediaId,
      downloadUrl: story.downloadUrl || "",
      category: story.category,
      thumbnailUrl: story.thumbnailUrl || "",
      isActive: story.isActive,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setShowForm(false);
    form.reset();
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold mb-2">
          Sleep Stories Management
        </h1>
        <p className="text-muted-foreground">
          Add and manage calming audio stories with Wistia integration
        </p>
      </div>

      {!showForm && (
        <Button onClick={() => setShowForm(true)} data-testid="button-add-story">
          <Plus className="w-4 h-4 mr-2" />
          Add New Story
        </Button>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Story" : "Add New Story"}</CardTitle>
            <CardDescription>
              Enter the Wistia media ID for your audio content and provide story details
            </CardDescription>
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
                        <Input
                          placeholder="A Peaceful Forest Journey"
                          data-testid="input-title"
                          {...field}
                        />
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
                        <Textarea
                          placeholder="Drift off to sleep as you walk through a tranquil forest..."
                          rows={3}
                          data-testid="input-description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="wistiaMediaId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wistia Media ID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="abc123xyz"
                            data-testid="input-wistia-id"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Find this in your Wistia dashboard
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (seconds)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1800"
                            data-testid="input-duration"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Total audio length in seconds
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="nature">Nature</SelectItem>
                            <SelectItem value="fantasy">Fantasy</SelectItem>
                            <SelectItem value="meditation">Meditation</SelectItem>
                            <SelectItem value="bedtime">Bedtime</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="downloadUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Download URL (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://..."
                            data-testid="input-download-url"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Direct link for offline download
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="thumbnailUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thumbnail URL (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://..."
                          data-testid="input-thumbnail-url"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Image to display in the story card
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-is-active"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Show this story to users
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {editingId ? "Update Story" : "Create Story"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Stories list */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">All Stories</h2>
        {!stories || stories.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No stories yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {stories.map((story) => (
              <Card key={story.id} data-testid={`story-card-${story.id}`}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-2">
                        <div>
                          <h3 className="text-lg font-semibold" data-testid={`text-title-${story.id}`}>
                            {story.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {story.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap text-sm">
                        <Badge variant={story.isActive ? "default" : "secondary"} data-testid={`badge-status-${story.id}`}>
                          {story.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline" data-testid={`badge-category-${story.id}`}>
                          {story.category}
                        </Badge>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {formatDuration(story.duration)}
                        </div>
                        <span className="text-muted-foreground">
                          Wistia ID: {story.wistiaMediaId}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(story)}
                        data-testid={`button-edit-${story.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this story?")) {
                            deleteMutation.mutate(story.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${story.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
