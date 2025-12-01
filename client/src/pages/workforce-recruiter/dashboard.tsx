import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useExternalLink } from "@/hooks/useExternalLink";
import { useFuzzySearch } from "@/hooks/useFuzzySearch";
import { PaginationControls } from "@/components/pagination-controls";
import {
  Briefcase,
  Target,
  TrendingUp,
  Globe2,
  ClipboardList,
} from "lucide-react";
import type {
  WorkforceRecruiterProfile,
  WorkforceRecruiterConfig,
  WorkforceRecruiterOccupation,
} from "@shared/schema";

type WorkforceRecruiterSummary = {
  totals: {
    activeRecruiters: number;
    totalCapacity: number;
    talentPoolSize: number;
    urgentOpenings: number;
    placementsLast30Days: number;
  };
  priorityOccupations: WorkforceRecruiterOccupation[];
  generatedAt: string;
};

export default function WorkforceRecruiterDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { openExternal, ExternalLinkDialog } = useExternalLink();
  const [occupationPage, setOccupationPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const occupationsPerPage = 6;

  const { data: profile, isLoading: isProfileLoading } = useQuery<WorkforceRecruiterProfile | null>({
    queryKey: ["/api/workforce-recruiter/profile"],
  });

  const { data: config, isLoading: isConfigLoading } = useQuery<WorkforceRecruiterConfig>({
    queryKey: ["/api/workforce-recruiter/config"],
  });

  const { data: summary, isLoading: isSummaryLoading } = useQuery<WorkforceRecruiterSummary>({
    queryKey: ["/api/workforce-recruiter/reports/summary"],
  });

  const { data: occupationsData, isLoading: isOccupationsLoading } = useQuery<{
    items: WorkforceRecruiterOccupation[];
    total: number;
  }>({
    queryKey: [
      `/api/workforce-recruiter/occupations?limit=${occupationsPerPage}&offset=${
        occupationPage * occupationsPerPage
      }`,
    ],
  });

  const occupations = occupationsData?.items ?? [];
  const filteredOccupations = useFuzzySearch(occupations, searchTerm, {
    searchFields: ["occupationName", "regionFocus", "supportNeeded"],
    threshold: 0.3,
  });

  const isLoading =
    isProfileLoading || isConfigLoading || isSummaryLoading || isOccupationsLoading;

  const handleExternalLink = (url?: string | null) => {
    if (!url) {
      toast({
        title: "Unavailable",
        description: "This resource isn't configured yet.",
        variant: "destructive",
      });
      return;
    }
    openExternal(url);
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading Workforce Recruiter...</p>
        </div>
        <ExternalLinkDialog />
      </div>
    );
  }

  const activeProfile = Boolean(profile);
  const intakeStatus = config?.intakeStatus ?? "open";

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold">Workforce Recruiter</h1>
            <p className="text-muted-foreground">
              {user?.firstName
                ? `Welcome back, ${user.firstName}.`
                : "Welcome back."}{" "}
              Trauma-informed hiring pipelines for survivor talent.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/apps/workforce-recruiter/profile">
            <Button variant="outline" data-testid="button-edit-profile">
              {activeProfile ? "Edit Profile" : "Create Profile"}
            </Button>
          </Link>
          <Button
            variant="default"
            onClick={() => handleExternalLink(config?.applicationLink)}
            data-testid="button-open-application"
          >
            Submit Cohort Application
          </Button>
        </div>
      </div>

      <AnnouncementBanner
        apiEndpoint="/api/workforce-recruiter/announcements"
        queryKey="/api/workforce-recruiter/announcements"
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="hover-elevate">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Intake & Support
            </CardTitle>
            <CardDescription>
              Current onboarding posture and escalation channels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Intake status</span>
              <Badge variant={intakeStatus === "open" ? "default" : "secondary"}>
                {intakeStatus.replace(/^\w/, (m) => m.toUpperCase())}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {config?.highlightMessage ||
                "We prioritize survivor-led placements with wraparound support."}
            </p>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Signal</p>
                <p className="font-medium break-words">{config?.supportSignal || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{config?.supportEmail}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium">{config?.supportPhone || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Resources</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExternalLink(config?.resourcesLink)}
                  data-testid="button-open-resources"
                >
                  Open resource kit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Pipeline Snapshot
            </CardTitle>
            <CardDescription>Real-time capacity indicators</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border bg-muted/40">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Active recruiters
              </p>
              <p className="text-2xl font-semibold">
                {summary?.totals.activeRecruiters ?? 0}
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/40">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Total capacity
              </p>
              <p className="text-2xl font-semibold">
                {summary?.totals.totalCapacity ?? 0}
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/40">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Talent pool size
              </p>
              <p className="text-2xl font-semibold">
                {summary?.totals.talentPoolSize ?? 0}
              </p>
            </div>
            <div className="p-4 rounded-lg border bg-muted/40">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Urgent openings
              </p>
              <p className="text-2xl font-semibold">
                {summary?.totals.urgentOpenings ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Priority Occupations
          </CardTitle>
          <CardDescription>
            High-demand roles where survivor talent is needed most urgently
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Input
              placeholder="Search occupations..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="md:max-w-sm"
              data-testid="input-search-occupations"
            />
            <PaginationControls
              currentPage={occupationPage}
              totalItems={occupationsData?.total ?? 0}
              itemsPerPage={occupationsPerPage}
              onPageChange={setOccupationPage}
            />
          </div>

          {filteredOccupations.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              No occupations found for this page.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredOccupations.map((occupation) => (
                <Card key={occupation.id} className="border border-dashed">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-semibold">{occupation.occupationName}</p>
                        <p className="text-sm text-muted-foreground">
                          {occupation.regionFocus || "Global"}
                        </p>
                      </div>
                      <Badge
                        variant={
                          occupation.priorityLevel === "critical" ? "destructive" : "secondary"
                        }
                      >
                        {occupation.priorityLevel}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Talent Pool</p>
                        <p className="font-medium">{occupation.talentPoolSize}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Urgent Roles</p>
                        <p className="font-medium">{occupation.urgentOpenings}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Placements (30d)</p>
                        <p className="font-medium">{occupation.placementsLast30Days}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg. Fill Days</p>
                        <p className="font-medium">{occupation.avgTimeToFillDays}</p>
                      </div>
                    </div>
                    {occupation.supportNeeded && (
                      <p className="text-sm bg-muted/60 rounded-lg p-3">
                        {occupation.supportNeeded}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-primary" />
            Next Actions
          </CardTitle>
          <CardDescription>Keep the pipeline moving safely</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border bg-muted/40 space-y-2">
            <p className="text-sm font-medium">Stay aligned with program ops</p>
            <p className="text-sm text-muted-foreground">
              Review the latest cohort priorities and update your capacity weekly.
            </p>
            <Link href="/apps/workforce-recruiter/profile">
              <Button variant="outline" className="w-full" data-testid="button-review-profile">
                Update Profile
              </Button>
            </Link>
          </div>
          <div className="p-4 rounded-lg border bg-muted/40 space-y-2">
            <p className="text-sm font-medium">Signal urgent incidents</p>
            <p className="text-sm text-muted-foreground">
              Use the Signal channel for escalation if a placement risks safety or dignity.
            </p>
            <Button
              variant="default"
              className="w-full"
              onClick={() => handleExternalLink(config?.supportSignal)}
              data-testid="button-open-signal"
            >
              Open Signal
            </Button>
          </div>
        </CardContent>
      </Card>

      <ExternalLinkDialog />
    </div>
  );
}
