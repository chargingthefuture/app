import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFuzzySearch } from "@/hooks/useFuzzySearch";
import { PaginationControls } from "@/components/pagination-controls";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Eye, Plus, TrendingUp } from "lucide-react";
import type { WorkforceRecruiterOccupation } from "@shared/schema";
import { format } from "date-fns";

export default function OccupationsPage() {
  const [page, setPage] = useState(0);
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [skillLevelFilter, setSkillLevelFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [recruitmentDialogOpen, setRecruitmentDialogOpen] = useState(false);
  const [selectedOccupation, setSelectedOccupation] = useState<WorkforceRecruiterOccupation | null>(null);
  const [recruitmentCount, setRecruitmentCount] = useState("");
  const [recruitmentSource, setRecruitmentSource] = useState("hire");
  const [recruitmentNotes, setRecruitmentNotes] = useState("");
  const { toast } = useToast();
  const limit = 20;

  const queryParams = useMemo(() => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: (page * limit).toString(),
    });
    if (sectorFilter !== "all") {
      params.append("sector", sectorFilter);
    }
    if (skillLevelFilter !== "all") {
      params.append("skillLevel", skillLevelFilter);
    }
    return params.toString();
  }, [sectorFilter, skillLevelFilter, page, limit]);

  const { data, isLoading } = useQuery<{ occupations: WorkforceRecruiterOccupation[]; total: number }>({
    queryKey: [`/api/workforce-recruiter/occupations?${queryParams}`],
  });

  const occupations = data?.occupations || [];
  const total = data?.total || 0;

  // Get unique sectors for filter
  const sectors = useMemo(() => {
    const sectorSet = new Set<string>();
    occupations.forEach(occ => sectorSet.add(occ.sector));
    return Array.from(sectorSet).sort();
  }, [occupations]);

  // Fuzzy search
  const filteredOccupations = useFuzzySearch(occupations, searchQuery, {
    searchFields: ["occupationTitle", "sector"],
    threshold: 0.3,
  });

  const recruitmentMutation = useMutation({
    mutationFn: async (data: { occupationId: string; date: string; count: number; source: string; notes?: string }) => {
      return apiRequest("POST", "/api/workforce-recruiter/recruitments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workforce-recruiter/occupations"] });
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

  const handleAddRecruitment = (occupation: WorkforceRecruiterOccupation) => {
    setSelectedOccupation(occupation);
    setRecruitmentDialogOpen(true);
  };

  const handleSubmitRecruitment = () => {
    if (!selectedOccupation) return;
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
      occupationId: selectedOccupation.id,
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

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading occupations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold mb-2">Occupations</h1>
          <p className="text-muted-foreground">
            View and manage workforce occupations and recruitment
          </p>
        </div>
        <Link href="/apps/workforce-recruiter">
          <Button variant="outline" data-testid="button-back-dashboard">
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search occupations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search"
              />
            </div>
            <div>
              <Label htmlFor="sector">Sector</Label>
              <Select value={sectorFilter} onValueChange={setSectorFilter}>
                <SelectTrigger id="sector" data-testid="select-sector">
                  <SelectValue placeholder="All Sectors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sectors</SelectItem>
                  {sectors.map((sector) => (
                    <SelectItem key={sector} value={sector}>
                      {sector}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="skillLevel">Skill Level</Label>
              <Select value={skillLevelFilter} onValueChange={setSkillLevelFilter}>
                <SelectTrigger id="skillLevel" data-testid="select-skill-level">
                  <SelectValue placeholder="All Skill Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Skill Levels</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Occupations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Occupations ({filteredOccupations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOccupations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No occupations found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 text-sm font-medium">Sector</th>
                    <th className="text-left p-2 text-sm font-medium">Occupation</th>
                    <th className="text-right p-2 text-sm font-medium">Target</th>
                    <th className="text-right p-2 text-sm font-medium">Recruited</th>
                    <th className="text-center p-2 text-sm font-medium">Progress</th>
                    <th className="text-center p-2 text-sm font-medium">Skill</th>
                    <th className="text-right p-2 text-sm font-medium">Annual Training</th>
                    <th className="text-center p-2 text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOccupations.map((occupation) => {
                    const percentFilled = occupation.headcountTarget > 0
                      ? (occupation.currentRecruited / occupation.headcountTarget) * 100
                      : 0;
                    return (
                      <tr key={occupation.id} className="border-b hover:bg-accent/50">
                        <td className="p-2 text-sm">{occupation.sector}</td>
                        <td className="p-2 text-sm font-medium">{occupation.occupationTitle}</td>
                        <td className="p-2 text-sm text-right">{occupation.headcountTarget.toLocaleString()}</td>
                        <td className="p-2 text-sm text-right">{occupation.currentRecruited.toLocaleString()}</td>
                        <td className="p-2">
                          <div className="space-y-1">
                            <Progress value={Math.min(percentFilled, 100)} className="h-2" />
                            <p className="text-xs text-center text-muted-foreground">
                              {percentFilled.toFixed(1)}%
                            </p>
                          </div>
                        </td>
                        <td className="p-2 text-center">
                          <Badge variant={getSkillLevelBadgeVariant(occupation.skillLevel)}>
                            {occupation.skillLevel}
                          </Badge>
                        </td>
                        <td className="p-2 text-sm text-right">{occupation.annualTrainingTarget.toLocaleString()}</td>
                        <td className="p-2">
                          <div className="flex items-center justify-center gap-2">
                            <Link href={`/apps/workforce-recruiter/occupations/${occupation.id}`}>
                              <Button variant="ghost" size="sm" data-testid={`button-view-${occupation.id}`}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAddRecruitment(occupation)}
                              data-testid={`button-add-recruitment-${occupation.id}`}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <PaginationControls
        currentPage={page}
        totalItems={total}
        itemsPerPage={limit}
        onPageChange={setPage}
      />

      {/* Recruitment Dialog */}
      <Dialog open={recruitmentDialogOpen} onOpenChange={setRecruitmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Recruitment Event</DialogTitle>
            <DialogDescription>
              Record a recruitment event for {selectedOccupation?.occupationTitle}
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

