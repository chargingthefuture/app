import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  type WorkforceRecruiterProfile,
  type WorkforceRecruiterSummary,
  type WorkforceRecruiterOccupation,
  type WorkforceRecruiterConfig,
} from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { PaginationControls } from "@/components/pagination-controls";
import { useAuth } from "@/hooks/useAuth";
import { useFuzzySearch } from "@/hooks/useFuzzySearch";
import { Link } from "wouter";
import {
  Briefcase,
  ShieldCheck,
  Users2,
  TrendingUp,
  MapPin,
  Sparkles,
} from "lucide-react";

const OCCUPATION_PAGE_SIZE = 6;

export default function WorkforceRecruiterDashboard() {
  const { isAdmin } = useAuth();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");

  const { data: profile } = useQuery<WorkforceRecruiterProfile | null>({
    queryKey: ["/api/workforce-recruiter/profile"],
  });

  const { data: config } = useQuery<WorkforceRecruiterConfig | null>({
    queryKey: ["/api/workforce-recruiter/config"],
  });

  const { data: summary } = useQuery<WorkforceRecruiterSummary>({
    queryKey: ["/api/workforce-recruiter/reports/summary"],
  });

  const occupationQueryKey = useMemo(() => {
    const limit = OCCUPATION_PAGE_SIZE;
    const offset = page * limit;
    const trimmedSearch = search.trim();
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    if (trimmedSearch) {
      params.set("search", trimmedSearch);
    }
    return [`/api/workforce-recruiter/occupations?${params.toString()}`];
  }, [page, search]);

  const { data: occupationsData, isLoading: occupationsLoading } = useQuery<{
    items: WorkforceRecruiterOccupation[];
    total: number;
  }>({
    queryKey: occupationQueryKey,
  });

  const filteredOccupations = useFuzzySearch(
    occupationsData?.items ?? [],
    search,
    {
      searchFields: ["title", "category", "regionFocus"],
      threshold: 0.35,
    }
  );

  const totalItems = occupationsData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / OCCUPATION_PAGE_SIZE));

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-primary font-semibold mb-1">
            Workforce Recruiter
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold">
            Safe pathways into dignified work
          </h1>
          <p className="text-muted-foreground max-w-2xl mt-2">
            This hub connects survivors with trauma-informed employers, protective housing,
            and allies offering verified roles. You remain in control of every intro.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/apps/workforce-recruiter/profile">
            <Button variant="default" data-testid="button-edit-profile">
              {profile ? "Edit profile" : "Create profile"}
            </Button>
          </Link>
          {isAdmin && (
            <Link href="/apps/workforce-recruiter/admin">
              <Button variant="outline" data-testid="button-admin-panel">
                Admin panel
              </Button>
            </Link>
          )}
        </div>
      </div>

      <AnnouncementBanner
        apiEndpoint="/api/workforce-recruiter/announcements"
        queryKey="/api/workforce-recruiter/announcements"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Profiles ready"
          value={summary?.totalProfiles ?? 0}
          icon={<Users2 className="w-5 h-5 text-primary" />}
          description="Survivors with active profiles"
        />
        <MetricCard
          title="Open roles"
          value={summary?.openRoles ?? 0}
          icon={<Briefcase className="w-5 h-5 text-primary" />}
          description="Verified openings across allies"
        />
        <MetricCard
          title="Priority placements"
          value={summary?.priorityRoles ?? 0}
          icon={<ShieldCheck className="w-5 h-5 text-primary" />}
          description="Urgent co-ops needing talent"
        />
        <MetricCard
          title="Avg training weeks"
          value={summary ? Math.round(summary.avgTrainingWeeks) : 0}
          icon={<TrendingUp className="w-5 h-5 text-primary" />}
          description="Supported upskilling timeline"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Allied opportunities</CardTitle>
            <CardDescription>
              Search and bookmark occupations curated with trauma-informed supervisors.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <Input
                value={search}
                onChange={(event) => {
                  setPage(0);
                  setSearch(event.target.value);
                }}
                placeholder="Search by title, category, or location"
                className="w-full md:max-w-sm"
                data-testid="input-search-occupations"
              />
              <PaginationControls
                currentPage={page}
                totalItems={totalItems}
                itemsPerPage={OCCUPATION_PAGE_SIZE}
                onPageChange={setPage}
                className="justify-end"
              />
            </div>

            {occupationsLoading ? (
              <div className="text-sm text-muted-foreground">Loading roles…</div>
            ) : filteredOccupations.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                No roles match your search. Adjust filters to see all openings.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOccupations.map((occupation) => (
                  <OccupationCard key={occupation.id} occupation={occupation} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Portal status</CardTitle>
            <CardDescription>How intake is configured right now.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Intake</p>
                <p className="text-xs text-muted-foreground">
                  Survivors can {config?.isPortalOpen === false ? "request access when reopened" : "submit info anytime"}.
                </p>
              </div>
              <Badge variant={config?.isPortalOpen === false ? "outline" : "default"}>
                {config?.isPortalOpen === false ? "Paused" : "Open"}
              </Badge>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p className="font-medium mb-1">Recruiter message</p>
              <p className="text-muted-foreground whitespace-pre-line">
                {config?.highlightMessage || "We surface dignified work that protects survivors first."}
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>
                  Max active applications:{" "}
                  <strong>{config?.maxActiveApplications ?? 3}</strong>
                </span>
              </div>
              {config?.supportEmail && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>{config.supportEmail}</span>
                </div>
              )}
            </div>

            <Link href="/apps/workforce-recruiter/profile">
              <Button className="w-full" variant="outline" data-testid="button-open-profile">
                {profile ? "Update your availability" : "Create your profile"}
              </Button>
            </Link>

            {isAdmin && (
              <Link href="/apps/workforce-recruiter/admin/announcements">
                <Button className="w-full" variant="ghost" data-testid="button-manage-announcements">
                  Manage announcements
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function OccupationCard({ occupation }: { occupation: WorkforceRecruiterOccupation }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">{occupation.title}</h3>
          <p className="text-sm text-muted-foreground">{occupation.category}</p>
        </div>
        {occupation.isPriorityRole && <Badge variant="destructive">Priority</Badge>}
      </div>
      <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{occupation.description}</p>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
        {occupation.regionFocus && (
          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5">
            <MapPin className="w-3 h-3" />
            {occupation.regionFocus}
          </span>
        )}
        <span className="rounded-full border px-2 py-0.5">
          Demand: {occupation.demandLevel}
        </span>
        <span className="rounded-full border px-2 py-0.5">
          Open roles: {occupation.openRoles}
        </span>
      </div>
    </div>
  );
}
