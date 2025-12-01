import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type {
  WorkforceRecruiterProfile,
  WorkforceRecruiterOccupation,
} from "@shared/schema";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PaginationControls } from "@/components/pagination-controls";
import { useFuzzySearch } from "@/hooks/useFuzzySearch";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, Briefcase } from "lucide-react";

type SummaryReport = {
  totalRecruiters: number;
  activeRecruiters: number;
  pausedRecruiters: number;
  intakeStatus: string;
  reviewCadenceDays: number;
  highlightedIndustries: string[];
  totalOccupations: number;
  criticalOpenings: number;
  averageTalentPoolSize: number;
  lastPlacementHighlights: Array<{ title: string; lastPlacementAt: string | null }>;
};

type OccupationResponse = {
  items: WorkforceRecruiterOccupation[];
  total: number;
};

const priorityCopy: Record<string, { label: string; color: string }> = {
  critical: { label: "Critical", color: "bg-destructive/10 text-destructive" },
  high: { label: "High", color: "bg-amber-100 text-amber-900" },
  normal: { label: "Standard", color: "bg-muted text-muted-foreground" },
};

const pageSize = 4;

export default function WorkforceRecruiterDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);

  const { data: profile, isLoading: profileLoading } = useQuery<WorkforceRecruiterProfile | null>({
    queryKey: ["/api/workforce-recruiter/profile"],
  });

  const { data: summary, isLoading: summaryLoading } = useQuery<SummaryReport>({
    queryKey: ["/api/workforce-recruiter/reports/summary"],
  });

  const { data: occupationData, isLoading: occupationLoading } = useQuery<OccupationResponse>({
    queryKey: ["/api/workforce-recruiter/occupations"],
  });

  const filteredOccupations = useFuzzySearch(
    occupationData?.items ?? [],
    searchTerm,
    {
      searchFields: ["title", "description", "regionFocus", "preferredSkills"],
      threshold: 0.35,
    }
  );

  const paginatedOccupations = useMemo(() => {
    const start = page * pageSize;
    return filteredOccupations.slice(start, start + pageSize);
  }, [filteredOccupations, page]);

  const resetPage = () => setPage(0);

  const intakeBadge = summary?.intakeStatus === "open"
    ? { label: "Intake Open", variant: "default" as const }
    : summary?.intakeStatus === "invite_only"
      ? { label: "Invite Only", variant: "secondary" as const }
      : { label: "Paused", variant: "destructive" as const };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Briefcase className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-3xl font-semibold">Workforce Recruiter</h1>
            <p className="text-muted-foreground">
              Coordinate dignified placements for survivors and partners.
            </p>
          </div>
        </div>
        <AnnouncementBanner
          apiEndpoint="/api/workforce-recruiter/announcements"
          queryKey="/api/workforce-recruiter/announcements"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl">Your Recruiter Profile</CardTitle>
            <p className="text-sm text-muted-foreground">
              Keep your partner preferences and contact details current.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button asChild data-testid="button-edit-workforce-profile">
              <Link href="/apps/workforce-recruiter/profile">
                {profile ? "Edit Profile" : "Create Profile"}
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              data-testid="button-view-workforce-announcements"
            >
              <Link href="/apps/workforce-recruiter/announcements">View Updates</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {profileLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : profile ? (
            <div className="space-y-2">
              <p className="font-medium">{profile.organizationName}</p>
              <p className="text-sm text-muted-foreground">{profile.missionStatement}</p>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                {profile.primaryIndustries && (
                  <span>Industries: {profile.primaryIndustries}</span>
                )}
                {profile.regionsServed && (
                  <span>Regions: {profile.regionsServed}</span>
                )}
                <span>Status: {profile.isAcceptingCandidates ? "Accepting candidates" : "Paused"}</span>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No profile yet</AlertTitle>
              <AlertDescription>
                Create your recruiter profile to access shared reports and request support from the team.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryLoading ? (
          Array.from({ length: 4 }).map((_, idx) => <Skeleton key={idx} className="h-32 w-full" />)
        ) : summary ? (
          <>
            <SummaryCard
              title="Active Recruiters"
              value={summary.activeRecruiters}
              subtitle={`${summary.totalRecruiters} total`}
              icon={<CheckCircle2 className="w-4 h-4 text-primary" />}
            />
            <SummaryCard
              title="Open Roles"
              value={summary.totalOccupations}
              subtitle={`${summary.criticalOpenings} critical`}
            />
            <SummaryCard
              title="Avg Talent Pool"
              value={summary.averageTalentPoolSize}
              subtitle="Candidates per role"
            />
            <SummaryCard
              title="Intake Status"
              value={intakeBadge.label}
              subtitle={`Review every ${summary.reviewCadenceDays} days`}
              badgeVariant={intakeBadge.variant}
            />
          </>
        ) : (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Unable to load summary</AlertTitle>
            <AlertDescription>Please try refreshing the page.</AlertDescription>
          </Alert>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Priority Occupations</h2>
            <p className="text-muted-foreground text-sm">
              Track current needs and talent pools across the ecosystem.
            </p>
          </div>
          <Input
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              resetPage();
            }}
            placeholder="Search roles or regions..."
            className="w-full md:w-72"
            data-testid="input-workforce-search"
          />
        </div>
        {occupationLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : paginatedOccupations.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No occupations match your filters yet.
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {paginatedOccupations.map((occupation) => {
                const priority = priorityCopy[occupation.priorityLevel || "normal"];
                return (
                  <Card key={occupation.id} data-testid="card-workforce-occupation">
                    <CardHeader className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-lg">{occupation.title}</CardTitle>
                        <Badge className={cn("text-xs", priority?.color)}>
                          {priority?.label ?? "Standard"}
                        </Badge>
                      </div>
                      {occupation.regionFocus && (
                        <p className="text-sm text-muted-foreground">
                          {occupation.regionFocus}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {occupation.description && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {occupation.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>Talent pool: {occupation.talentPoolSize ?? 0}</span>
                        <span>Active roles: {occupation.activeOpportunities ?? 0}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <PaginationControls
              currentPage={page}
              itemsPerPage={pageSize}
              totalItems={filteredOccupations.length}
              onPageChange={setPage}
              className="justify-end"
              data-testid="pagination-workforce-occupations"
            />
          </>
        )}
      </section>

      {summary && summary.lastPlacementHighlights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Placements</CardTitle>
            <p className="text-sm text-muted-foreground">
              Snapshot of the most recently fulfilled requests.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.lastPlacementHighlights.map((item) => (
              <div key={`${item.title}-${item.lastPlacementAt}`} className="flex flex-col">
                <span className="font-medium">{item.title}</span>
                <span className="text-sm text-muted-foreground">
                  {item.lastPlacementAt
                    ? new Date(item.lastPlacementAt).toLocaleDateString()
                    : "Date not recorded"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  badgeVariant,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  badgeVariant?: "default" | "secondary" | "destructive";
}) {
  return (
    <Card className="border-muted">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {icon}
        </div>
        <div className="text-2xl font-semibold">
          {badgeVariant ? (
            <Badge variant={badgeVariant}>{value}</Badge>
          ) : (
            value
          )}
        </div>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </CardHeader>
    </Card>
  );
}
