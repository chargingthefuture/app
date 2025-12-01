import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/pagination-controls";
import { useFuzzySearch } from "@/hooks/useFuzzySearch";
import type {
  WorkforceRecruiterProfile,
  WorkforceRecruiterConfig,
  WorkforceRecruiterOccupation,
} from "@shared/schema";
import { Briefcase, Target, Users, Search, CheckCircle2 } from "lucide-react";

const OCCUPATION_PAGE_SIZE = 10;

export default function WorkforceRecruiterDashboard() {
  const { isAdmin } = useAuth();
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: profile, isLoading: profileLoading } = useQuery<WorkforceRecruiterProfile | null>({
    queryKey: ["/api/workforce-recruiter/profile"],
  });

  const { data: config } = useQuery<WorkforceRecruiterConfig | null>({
    queryKey: ["/api/workforce-recruiter/config"],
  });

  const occupationsQueryKey = `/api/workforce-recruiter/occupations?limit=${OCCUPATION_PAGE_SIZE}&offset=${
    page * OCCUPATION_PAGE_SIZE
  }`;
  const { data: occupationData, isLoading: occupationsLoading } = useQuery<{
    occupations: WorkforceRecruiterOccupation[];
    total: number;
  }>({
    queryKey: [occupationsQueryKey],
  });

  const filteredOccupations = useFuzzySearch(
    occupationData?.occupations ?? [],
    searchTerm,
    {
      searchFields: ["title", "category", "description"],
      threshold: 0.35,
    }
  );

  const totalOccupations = occupationData?.total ?? 0;

  if (profileLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading Workforce Recruiter resources...</p>
        </div>
      </div>
    );
  }

  const hasProfile = Boolean(profile);

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold">Workforce Recruiter</h1>
              <p className="text-muted-foreground">
                Coordinate employer partners and vetted roles for survivors with dignity and care.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {isAdmin && (
            <Button asChild variant="outline" data-testid="button-go-to-workforce-admin">
              <Link href="/apps/workforce-recruiter/admin">Admin Console</Link>
            </Button>
          )}
          <Button
            asChild
            data-testid="button-edit-workforce-profile"
            variant={hasProfile ? "default" : "secondary"}
          >
            <Link href="/apps/workforce-recruiter/profile">
              {hasProfile ? "Edit Profile" : "Create Profile"}
            </Link>
          </Button>
        </div>
      </div>

      <AnnouncementBanner
        apiEndpoint="/api/workforce-recruiter/announcements"
        queryKey="/api/workforce-recruiter/announcements"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-primary" />
              Profile Overview
            </CardTitle>
            <CardDescription>
              Your readiness to accept referrals from the Survivor Workforce Network.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Organization</span>
                  <span className="font-medium">{profile.organizationName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Primary Recruiter</span>
                  <span className="font-medium">{profile.recruiterName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Candidate Capacity</span>
                  <span className="font-semibold">{profile.candidateCapacity}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Placements Completed</span>
                  <span className="font-semibold">{profile.placementsCompleted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge
                    variant={profile.isAcceptingCandidates ? "default" : "outline"}
                    className="flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {profile.isAcceptingCandidates ? "Accepting Candidates" : "On Pause"}
                  </Badge>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  Create your recruiter profile to receive high-priority candidate referrals and
                  track hiring commitments in one place.
                </p>
                <Button
                  asChild
                  className="w-full"
                  data-testid="button-create-profile-inline"
                >
                  <Link href="/apps/workforce-recruiter/profile">Create Profile</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-primary" />
              Active Commitments
            </CardTitle>
            <CardDescription>
              Guidance from the Workforce Support team for the current quarter.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground whitespace-pre-line">
              {config?.missionStatement ||
                "Each recruiter commits to trauma-informed communication, zero-fee placements, and weekly progress updates."}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-muted flex flex-col">
                <span className="text-muted-foreground">Escalation</span>
                <span className="font-semibold break-all">{config?.escalationEmail || "support@the-comic.com"}</span>
              </div>
              <div className="p-3 rounded-lg bg-muted flex flex-col">
                <span className="text-muted-foreground">Office Hours</span>
                <span className="font-semibold">{config?.officeHours || "Tuesdays @ 15:00 UTC"}</span>
              </div>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Priority Industries:&nbsp;</span>
              <span className="font-medium">
                {config?.priorityIndustries || "Healthcare, Logistics, Ethical Tech"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Active Occupations</CardTitle>
              <CardDescription>
                Roles currently prioritized across partner employers. Filter to plan outreach.
              </CardDescription>
            </div>
            <Badge variant="secondary">{totalOccupations} tracked</Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(0);
              }}
              placeholder="Search by title, category, or description"
              className="pl-9"
              data-testid="input-search-occupations"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {occupationsLoading ? (
            <div className="text-center py-10 text-muted-foreground text-sm">Loading occupations...</div>
          ) : filteredOccupations.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No occupations match your search terms on this page.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredOccupations.map((occupation) => (
                <Card key={occupation.id} className="border border-muted/70">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-base">{occupation.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {occupation.category || "General Placement"}
                        </p>
                      </div>
                      <Badge variant={occupation.demandLevel === "high" ? "default" : "outline"}>
                        {occupation.demandLevel.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {occupation.description && (
                      <p className="text-muted-foreground line-clamp-3">{occupation.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Open Roles</span>
                      <span className="font-semibold">{occupation.openRoles}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Remote Friendly</span>
                      <Badge variant={occupation.remoteFriendly ? "default" : "secondary"}>
                        {occupation.remoteFriendly ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <PaginationControls
            currentPage={page}
            totalItems={totalOccupations}
            itemsPerPage={OCCUPATION_PAGE_SIZE}
            onPageChange={(newPage) => setPage(newPage)}
            className="pt-2"
          />
        </CardContent>
      </Card>
    </div>
  );
}
