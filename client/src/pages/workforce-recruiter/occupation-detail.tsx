import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { WorkforceRecruiterOccupation, WorkforceRecruiterRecruitmentEvent } from "@shared/schema";
import { PaginationControls } from "@/components/pagination-controls";

export default function OccupationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [page, setPage] = useState(0);
  const [recruitmentDialogOpen, setRecruitmentDialogOpen] = useState(false);
  const [recruitmentCount, setRecruitmentCount] = useState("");
  const [recruitmentSource, setRecruitmentSource] = useState("hire");
  const [recruitmentNotes, setRecruitmentNotes] = useState("");
  const limit = 20;

  const { data: occupation, isLoading: occupationLoading } = useQuery<WorkforceRecruiterOccupation>({
    queryKey: ["/api/workforce-recruiter/occupations", id],
    queryFn: async () => {
      const res = await fetch(`/api/workforce-recruiter/occupations/${id}`);
      if (!res.ok) throw new Error("Occupation not found");
      return await res.json();
    },
    enabled: !!id,
  });

  const { data: eventsData, isLoading: eventsLoading } = useQuery<{ events: WorkforceRecruiterRecruitmentEvent[]; total: number }>({
    queryKey: [`/api/workforce-recruiter/recruitments?occupationId=${id}&limit=${limit}&offset=${page * limit}`],
    enabled: !!id,
  });

  const events = eventsData?.events || [];
  const totalEvents = eventsData?.total || 0;

  // Calculate cumulative recruited over time
  const cumulativeData = events
    .slice()
    .reverse()
    .reduce((acc, event) => {
      const prev = acc.length > 0 ? acc[acc.length - 1].value : (occupation?.currentRecruited || 0);
      acc.push({
        date: event.date,
        value: prev - event.count, // Reverse to get historical values
        count: event.count,
      });
      return acc;
    }, [] as Array<{ date: Date | string; value: number; count: number }>)
    .reverse();

  const recruitmentMutation = useMutation({
    mutationFn: async (data: { occupationId: string; date: string; count: number; source: string; notes?: string }) => {
      return apiRequest("POST", "/api/workforce-recruiter/recruitments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/occupations", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/recruitments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/reports/summary"] });
      setRecruitmentDialogOpen(false);
      setRecruitmentCount("");
      setRecruitmentSource("hire");
      setRecruitmentNotes("");
      toast({
        title: "Recruitment Event Added",
        description: "The recruitment event has been recorded successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add recruitment event",
        variant: "destructive",
      });
    },
  });

  const handleSubmitRecruitment = () => {
    if (!occupation) return;
    const count = parseInt(recruitmentCount);
    if (isNaN(count) || count === 0) {
      toast({
        title: "Invalid Count",
        description: "Please enter a valid non-zero number",
        variant: "destructive",
      });
      return;
    }

    recruitmentMutation.mutate({
      occupationId: occupation.id,
      date: format(new Date(), "yyyy-MM-dd"),
      count,
      source: recruitmentSource,
      notes: recruitmentNotes || undefined,
    });
  };

  const getSkillLevelBadgeVariant = (skillLevel: string) => {
    switch (skillLevel) {
      case "High":
        return "default";
      case "Medium":
        return "secondary";
      case "Low":
        return "outline";
      default:
        return "outline";
    }
  };

  if (occupationLoading) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading occupation details...</p>
        </div>
      </div>
    );
  }

  if (!occupation) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Occupation not found</p>
          <Link href="/apps/workforce-recruiter/occupations">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Occupations
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const percentFilled = occupation.headcountTarget > 0
    ? (occupation.currentRecruited / occupation.headcountTarget) * 100
    : 0;
  const remaining = Math.max(0, occupation.headcountTarget - occupation.currentRecruited);

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/apps/workforce-recruiter/occupations">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold">{occupation.occupationTitle}</h1>
            <p className="text-muted-foreground">{occupation.sector}</p>
          </div>
        </div>
        <Button onClick={() => setRecruitmentDialogOpen(true)} data-testid="button-add-recruitment">
          <Plus className="w-4 h-4 mr-2" />
          Add Recruitment Event
        </Button>
      </div>

      {/* Occupation Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Headcount Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupation.headcountTarget.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Recruited</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupation.currentRecruited.toLocaleString()}</div>
            <div className="mt-2">
              <Progress value={Math.min(percentFilled, 100)} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{percentFilled.toFixed(1)}% filled</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{remaining.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Skill Level</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={getSkillLevelBadgeVariant(occupation.skillLevel)} className="text-sm">
              {occupation.skillLevel}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Annual Training Target */}
      <Card>
        <CardHeader>
          <CardTitle>Annual Training Target</CardTitle>
          <CardDescription>Target number of new recruits needed per year</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{occupation.annualTrainingTarget.toLocaleString()}</div>
        </CardContent>
      </Card>

      {/* Recruitment Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Recruitment Timeline</CardTitle>
          <CardDescription>History of recruitment events for this occupation</CardDescription>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No recruitment events yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{format(new Date(event.date), "MMM d, yyyy")}</span>
                      <Badge variant={event.count > 0 ? "default" : "destructive"}>
                        {event.count > 0 ? "+" : ""}{event.count}
                      </Badge>
                      <Badge variant="outline">{event.source}</Badge>
                    </div>
                    {event.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{event.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {totalEvents > limit && (
            <div className="mt-4">
              <PaginationControls
                currentPage={page}
                totalItems={totalEvents}
                itemsPerPage={limit}
                onPageChange={setPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cumulative Chart (Simple visualization) */}
      {cumulativeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cumulative Recruitment Over Time</CardTitle>
            <CardDescription>Historical progression of recruited count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {cumulativeData.slice(-10).map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-24 text-xs text-muted-foreground">
                    {format(new Date(item.date), "MMM d")}
                  </div>
                  <div className="flex-1">
                    <Progress value={(item.value / occupation.headcountTarget) * 100} className="h-3" />
                  </div>
                  <div className="w-20 text-right text-sm font-medium">
                    {item.value.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recruitment Dialog */}
      <Dialog open={recruitmentDialogOpen} onOpenChange={setRecruitmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Recruitment Event</DialogTitle>
            <DialogDescription>
              Record a recruitment event for {occupation.occupationTitle}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="count">Count</Label>
              <Input
                id="count"
                type="number"
                value={recruitmentCount}
                onChange={(e) => setRecruitmentCount(e.target.value)}
                placeholder="Enter positive number for hires/grads, negative for attrition"
                data-testid="input-recruitment-count"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Positive for hires/graduates, negative for attrition
              </p>
            </div>
            <div>
              <Label htmlFor="source">Source</Label>
              <Select value={recruitmentSource} onValueChange={setRecruitmentSource}>
                <SelectTrigger id="source" data-testid="select-recruitment-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hire">Hire</SelectItem>
                  <SelectItem value="grad">Graduate</SelectItem>
                  <SelectItem value="attrition">Attrition</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={recruitmentNotes}
                onChange={(e) => setRecruitmentNotes(e.target.value)}
                placeholder="Additional notes about this recruitment event"
                data-testid="textarea-recruitment-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRecruitmentDialogOpen(false)}
              data-testid="button-cancel-recruitment"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitRecruitment}
              disabled={recruitmentMutation.isPending}
              data-testid="button-submit-recruitment"
            >
              {recruitmentMutation.isPending ? "Adding..." : "Add Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}








