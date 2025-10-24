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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Partnership, SupportMatchProfile } from "@shared/schema";
import { format } from "date-fns";
import { ArrowLeft, UserCheck, Plus } from "lucide-react";
import { Link } from "wouter";

const partnershipFormSchema = z.object({
  user1Id: z.string().min(1, "User 1 is required"),
  user2Id: z.string().min(1, "User 2 is required"),
});

type PartnershipFormValues = z.infer<typeof partnershipFormSchema>;

export default function SupportMatchAdminPartnerships() {
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: profiles } = useQuery<SupportMatchProfile[]>({
    queryKey: ["/api/supportmatch/admin/profiles"],
  });

  const { data: partnerships, isLoading } = useQuery<Partnership[]>({
    queryKey: ["/api/supportmatch/admin/partnerships"],
  });

  const form = useForm<PartnershipFormValues>({
    resolver: zodResolver(partnershipFormSchema),
    defaultValues: {
      user1Id: "",
      user2Id: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PartnershipFormValues) => {
      return apiRequest("POST", "/api/supportmatch/admin/partnerships", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supportmatch/admin/partnerships"] });
      form.reset();
      setShowCreateForm(false);
      toast({
        title: "Success",
        description: "Partnership created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create partnership",
        variant: "destructive",
      });
    },
  });

  const endMutation = useMutation({
    mutationFn: async (partnershipId: string) => {
      return apiRequest("PUT", `/api/supportmatch/admin/partnerships/${partnershipId}/status`, { status: "ended" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supportmatch/admin/partnerships"] });
      toast({
        title: "Success",
        description: "Partnership ended successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to end partnership",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PartnershipFormValues) => {
    if (data.user1Id === data.user2Id) {
      toast({
        title: "Error",
        description: "Cannot match a user with themselves",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(data);
  };

  const getUserNickname = (userId: string) => {
    const profile = profiles?.find(p => p.userId === userId);
    return profile?.nickname || "Anonymous";
  };

  const activePartnerships = partnerships?.filter(p => p.status === "active") || [];
  const endedPartnerships = partnerships?.filter(p => p.status === "ended") || [];

  if (isLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading partnerships...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/apps/supportmatch/admin">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-semibold">Partnership Management</h1>
          <p className="text-muted-foreground">
            Create and manage accountability partnerships
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          data-testid="button-toggle-create-form"
        >
          <Plus className="w-4 h-4 mr-2" />
          {showCreateForm ? "Cancel" : "Create Partnership"}
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Partnership</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="user1Id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User 1</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-user1">
                            <SelectValue placeholder="Select first user" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {profiles?.filter(p => p.isActive).map((profile) => (
                            <SelectItem key={profile.userId} value={profile.userId}>
                              {profile.nickname || "Anonymous"} ({profile.gender})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="user2Id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User 2</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-user2">
                            <SelectValue placeholder="Select second user" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {profiles?.filter(p => p.isActive).map((profile) => (
                            <SelectItem key={profile.userId} value={profile.userId}>
                              {profile.nickname || "Anonymous"} ({profile.gender})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  data-testid="button-submit-partnership"
                >
                  Create Partnership
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Active Partnerships</h2>
          {activePartnerships.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No active partnerships.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {activePartnerships.map((partnership) => (
                <Card key={partnership.id} data-testid={`partnership-card-${partnership.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">
                          {getUserNickname(partnership.user1Id)} & {getUserNickname(partnership.user2Id)}
                        </CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="default">Active</Badge>
                          <span className="text-sm text-muted-foreground">
                            Started: {format(new Date(partnership.startDate), "MMM d, yyyy")}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => endMutation.mutate(partnership.id)}
                        disabled={endMutation.isPending}
                        data-testid={`button-end-${partnership.id}`}
                      >
                        End Partnership
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Past Partnerships</h2>
          {endedPartnerships.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No past partnerships.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {endedPartnerships.map((partnership) => (
                <Card key={partnership.id} data-testid={`past-partnership-card-${partnership.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">
                          {getUserNickname(partnership.user1Id)} & {getUserNickname(partnership.user2Id)}
                        </CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary">Ended</Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(partnership.startDate), "MMM d, yyyy")} - {partnership.endDate ? format(new Date(partnership.endDate), "MMM d, yyyy") : "?"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
