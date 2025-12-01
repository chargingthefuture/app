import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AnnouncementBanner } from "@/components/announcement-banner";
import type {
  WorkforceRecruiterConfig,
  WorkforceRecruiterOccupation,
} from "@shared/schema";

type WorkforceRecruiterSummary = {
  totals: {
    totalProfiles: number;
    activeOccupations: number;
    openRoles: number;
  };
  availabilityBreakdown: Array<{ status: string; count: number }>;
  workPreferenceBreakdown: Array<{ preference: string; count: number }>;
  occupationHighlights: Array<{
    id: string;
    title: string;
    sector: string;
    openings: number;
    demandLevel: string;
  }>;
};

const availabilityLabels: Record<string, string> = {
  open: "Open",
  interviewing: "Interviewing",
  placed: "Placed",
  paused: "Paused",
};

const preferenceLabels: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "Onsite",
};

function StatCard({
  label,
  value,
  description,
  testId,
}: {
  label: string;
  value: string | number | undefined;
  description?: string;
  testId: string;
}) {
  return (
    <Card className="bg-muted/20 border-muted" data-testid={testId}>
      <CardHeader className="space-y-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <CardTitle className="text-3xl font-semibold">{value ?? "—"}</CardTitle>
      </CardHeader>
      {description && (
        <CardContent>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      )}
    </Card>
  );
}

export default function WorkforceRecruiterDashboard() {
  const { data: config, isLoading: configLoading } = useQuery<WorkforceRecruiterConfig>({
    queryKey: ["/api/workforce-recruiter/config"],
  });

  const { data: summary, isLoading: summaryLoading } = useQuery<WorkforceRecruiterSummary>({
    queryKey: ["/api/workforce-recruiter/reports/summary"],
  });

  const { data: occupations = [], isLoading: occupationsLoading } = useQuery<WorkforceRecruiterOccupation[]>({
    queryKey: ["/api/workforce-recruiter/occupations"],
  });

  const highlightStats = useMemo(() => {
    if (!config && !summary) {
      return [];
    }

    return [
      {
        label: config?.highlightOneLabel ?? "Active candidates",
        value:
          config?.highlightOneValue ??
          summary?.totals.totalProfiles?.toString() ??
          "0",
        description: "Profiles that are currently onboarding or active.",
        testId: "stat-workforce-candidates",
      },
      {
        label: config?.highlightTwoLabel ?? "Employer partners",
        value: config?.highlightTwoValue ?? summary?.totals.activeOccupations ?? "0",
        description: "Trusted partners with trauma-informed placements.",
        testId: "stat-workforce-partners",
      },
      {
        label: config?.highlightThreeLabel ?? "Open roles",
        value: config?.highlightThreeValue ?? summary?.totals.openRoles ?? "0",
        description: "Roles with safe, vetted environments.",
        testId: "stat-workforce-open-roles",
      },
    ];
  }, [config, summary]);

  const renderBreakdown = (
    items: Array<{ label: string; value: number }>,
    testId: string,
  ) => {
    if (!items.length) {
      return <p className="text-sm text-muted-foreground">No data yet.</p>;
    }

    return (
      <div className="space-y-2" data-testid={testId}>
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-muted-foreground">{item.label}</span>
            <Badge variant="outline">{item.value}</Badge>
          </div>
        ))}
      </div>
    );
  };

  const availabilityData =
    summary?.availabilityBreakdown.map((item) => ({
      label: availabilityLabels[item.status] ?? item.status,
      value: item.count,
    })) ?? [];

  const preferenceData =
    summary?.workPreferenceBreakdown.map((item) => ({
      label: preferenceLabels[item.preference] ?? item.preference,
      value: item.count,
    })) ?? [];

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <AnnouncementBanner
        apiEndpoint="/api/workforce-recruiter/announcements"
        queryKey="/api/workforce-recruiter/announcements"
      />

      <Card>
        <CardHeader className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Workforce readiness
            </p>
            {configLoading ? (
              <Skeleton className="h-8 w-64" />
            ) : (
              <CardTitle className="text-3xl md:text-4xl">
                {config?.heroTitle ?? "Workforce Recruiter"}
              </CardTitle>
            )}
            <p className="text-muted-foreground max-w-3xl">
              {config?.heroSubtitle ??
                "Build a career path with partners who understand complex trauma, safety planning, and the need for flexible work agreements."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild data-testid="button-manage-workforce-profile">
              <Link href="/apps/workforce-recruiter/profile">Manage Profile</Link>
            </Button>
            {config?.resourceLinkUrl && (
              <Button
                variant="outline"
                asChild
                data-testid="button-workforce-resource"
              >
                <a
                  href={config.resourceLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {config.resourceLinkLabel ?? "Resource Library"}
                </a>
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {summaryLoading && !summary ? (
          <>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </>
        ) : (
          highlightStats.map((stat) => (
            <StatCard key={stat.testId} {...stat} />
          ))
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Availability</CardTitle>
            <p className="text-sm text-muted-foreground">
              Snapshot of candidate readiness each week.
            </p>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              renderBreakdown(availabilityData, "list-workforce-availability")
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Work Preferences</CardTitle>
            <p className="text-sm text-muted-foreground">
              Quickly match based on environment needs.
            </p>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              renderBreakdown(preferenceData, "list-workforce-preferences")
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>In-demand Occupations</CardTitle>
          <p className="text-sm text-muted-foreground">
            Trauma-informed partners with safe teams, vetted supervisors, and
            predictable shifts.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {occupationsLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : occupations.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              We&apos;ll publish roles once we have placements ready.
            </p>
          ) : (
            <ul
              className="space-y-3"
              data-testid="list-workforce-occupations"
            >
              {occupations.slice(0, 6).map((occupation) => (
                <li
                  key={occupation.id}
                  className="flex flex-col gap-1 rounded-lg border border-border/60 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2 justify-between">
                    <p className="font-medium">{occupation.title}</p>
                    <Badge variant="secondary">
                      {occupation.demandLevel.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {occupation.description ??
                      "Curated opportunity with wrap-around employer support."}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>{occupation.sector}</span>
                    <span>•</span>
                    <span>{occupation.isRemoteFriendly ? "Remote friendly" : "Onsite focus"}</span>
                    <span>•</span>
                    <span>{occupation.openings} openings</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
