import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { type WorkforceRecruiterProfile, type WorkforceRecruiterConfig, type WorkforceRecruiterOccupation } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

interface PaginatedOccupations {
  items: WorkforceRecruiterOccupation[];
  total: number;
}

interface WorkforceSummaryResponse {
  totalOccupations: number;
  activeOccupations: number;
  remoteFriendly: number;
  urgentDemand: number;
  openRoles: number;
}

export default function WorkforceRecruiterDashboard() {
  const { isAdmin } = useAuth();

  const { data: profile } = useQuery<WorkforceRecruiterProfile | null>({
    queryKey: ["/api/workforce-recruiter/profile"],
  });

  const { data: config } = useQuery<WorkforceRecruiterConfig>({
    queryKey: ["/api/workforce-recruiter/config"],
  });

  const { data: occupations } = useQuery<PaginatedOccupations>({
    queryKey: ["/api/workforce-recruiter/occupations?limit=3&offset=0"],
  });

  const { data: summary } = useQuery<WorkforceSummaryResponse>({
    queryKey: ["/api/workforce-recruiter/reports/summary"],
    enabled: Boolean(isAdmin),
    retry: false,
  });

  const highlightedOccupations = occupations?.items ?? [];

  return (
    <div className="container mx-auto max-w-6xl p-4 sm:p-6 md:p-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Trauma-informed job placement</p>
          <h1 className="text-3xl font-semibold tracking-tight">Workforce Recruiter</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Match with living wage roles, training partners, and employers committed to survivor-led recovery.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" data-testid="button-view-occupations">
            <Link href="/apps/workforce-recruiter/occupations">Browse Opportunities</Link>
          </Button>
          <Button asChild data-testid="button-manage-profile">
            <Link href="/apps/workforce-recruiter/profile">
              {profile ? "Edit Profile" : "Create Profile"}
            </Link>
          </Button>
        </div>
      </div>

      <AnnouncementBanner
        apiEndpoint="/api/workforce-recruiter/announcements"
        queryKey="/api/workforce-recruiter/announcements"
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Snapshot</CardTitle>
            <CardDescription>
              Recruiters rely on this profile to advocate for wraparound support and safe employment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {profile ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Name</span>
                  <span>{profile.preferredName || profile.fullName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Experience</span>
                  <span>
                    {profile.experienceLevel?.toUpperCase()} · {profile.yearsExperience || 0} yrs
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Remote preference</span>
                  <span className="capitalize">{profile.remotePreference || "hybrid"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Support needs</span>
                  <span>{profile.relocationSupportNeeded ? "Needs planning" : "Flexible"}</span>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <p className="text-foreground font-medium">No profile yet</p>
                <p>
                  Share skills and access needs so vetted recruiters can source safe contracts or apprenticeships on your behalf.
                </p>
                <Button asChild size="sm">
                  <Link href="/apps/workforce-recruiter/profile">Create Profile</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application Settings</CardTitle>
            <CardDescription>
              Platform-wide parameters that recruiters follow when sourcing survivors for paid work.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">Status</span>
              <span className="capitalize">{config?.applicationStatus || "open"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">Max active candidates</span>
              <span>{config?.maxActiveCandidates ?? 25}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">Featured sectors</span>
              <span className="text-right ml-4">
                {config?.featuredSectors || "Healthcare · Skilled Trades · Remote Ops"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">Contact</span>
              <span>{config?.contactEmail || "workforce@chargingthefuture.com"}</span>
            </div>
            {isAdmin && (
              <Button asChild variant="outline" size="sm" className="w-full" data-testid="button-admin-config">
                <Link href="/apps/workforce-recruiter/admin/config">Edit Config</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Highlighted Opportunities</CardTitle>
              <CardDescription>Curated roles balancing living wages, security, and remote-first options.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" data-testid="button-view-all-occupations">
              <Link href="/apps/workforce-recruiter/occupations">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {highlightedOccupations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Opportunities refresh every few hours. Check back soon.</p>
            ) : (
              highlightedOccupations.map((occupation) => (
                <div key={occupation.id} className="rounded-lg border p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground">{occupation.title}</p>
                    {occupation.demandLevel === "urgent" && (
                      <span className="text-xs font-medium text-red-600">Urgent</span>
                    )}
                  </div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {occupation.sector} · {occupation.isRemoteFriendly ? "Remote-friendly" : "On-site"}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{occupation.description}</p>
                  <div className="text-xs text-muted-foreground">
                    {occupation.openRoles || 0} openings · {occupation.locations || "Global"}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {isAdmin && summary && (
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Overview</CardTitle>
              <CardDescription>Admin only snapshot of how many survivors and roles are in rotation.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-3xl font-bold">{summary.totalOccupations}</p>
                <p className="text-sm text-muted-foreground">Total occupations</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{summary.remoteFriendly}</p>
                <p className="text-sm text-muted-foreground">Remote-friendly roles</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{summary.urgentDemand}</p>
                <p className="text-sm text-muted-foreground">Marked urgent</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{summary.openRoles}</p>
                <p className="text-sm text-muted-foreground">Open seats</p>
              </div>
              <Button asChild variant="outline" size="sm" data-testid="button-admin-occupations" className="sm:col-span-2">
                <Link href="/apps/workforce-recruiter/admin/occupations">Manage occupations</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
