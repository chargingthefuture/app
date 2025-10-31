import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Users, Building2, UserCheck } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { VerifiedBadge } from "@/components/verified-badge";
import { PrivacyField } from "@/components/ui/privacy-field";
import type { LighthouseProfile } from "@shared/schema";

type SeekerWithUser = LighthouseProfile & {
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    isVerified: boolean;
  } | null;
};

export default function LighthouseAdminPage() {
  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ["/api/lighthouse/admin/stats"],
  });

  const { data: seekers = [], isLoading: seekersLoading, error: seekersError } = useQuery<SeekerWithUser[]>({
    queryKey: ["/api/lighthouse/admin/seekers"],
    queryFn: async () => {
      const res = await fetch("/api/lighthouse/admin/seekers", {
        credentials: "include",
      });
      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response received:", text.substring(0, 500));
        throw new Error(`Server returned ${contentType} instead of JSON. Status: ${res.status}`);
      }
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`${res.status}: ${errorText}`);
      }
      return await res.json();
    },
  });

  useEffect(() => {
    if (seekers.length > 0) {
      console.log("Seekers loaded:", seekers);
    }
    if (seekersError) {
      console.error("Seekers error:", seekersError);
    }
  }, [seekers, seekersError]);

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
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Home className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold">
              LightHouse Admin
            </h1>
            <p className="text-muted-foreground">
              Manage housing platform and matches
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card data-testid="stat-card-seekers">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Housing Seekers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-seekers">
              {stats?.totalSeekers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active profiles
            </p>
          </CardContent>
        </Card>

        <Card data-testid="stat-card-hosts">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Housing Hosts
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-hosts">
              {stats?.totalHosts || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active profiles
            </p>
          </CardContent>
        </Card>

        <Card data-testid="stat-card-properties">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Properties
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-properties">
              {stats?.totalProperties || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Available listings
            </p>
          </CardContent>
        </Card>

        <Card data-testid="stat-card-matches">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Matches
            </CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-matches">
              {stats?.activeMatches || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.completedMatches || 0} completed
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Housing Seekers</CardTitle>
          <CardDescription>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
              </p>
            </div>

            <div className="mt-6">
              {seekersLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading seekers...</div>
              ) : seekersError ? (
                <div className="text-center py-8">
                  <p className="text-destructive font-medium">Error loading seekers</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {seekersError instanceof Error ? seekersError.message : 'Unknown error'}
                  </p>
                </div>
              ) : seekers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No housing seekers found</div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Display Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Verification</TableHead>
                        <TableHead>Housing Needs</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead>Move-In Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {seekers.map((seeker) => {
                        const userName = seeker.user
                          ? [seeker.user.firstName, seeker.user.lastName].filter(Boolean).join(' ') || seeker.user.email || 'User'
                          : 'Unknown User';
                        const budgetRange = seeker.budgetMin && seeker.budgetMax
                          ? `$${seeker.budgetMin} - $${seeker.budgetMax}`
                          : seeker.budgetMin
                          ? `From $${seeker.budgetMin}`
                          : seeker.budgetMax
                          ? `Up to $${seeker.budgetMax}`
                          : 'Not specified';
                        const moveInDate = seeker.moveInDate
                          ? new Date(seeker.moveInDate).toLocaleDateString()
                          : 'Not specified';

                        return (
                          <TableRow key={seeker.id} data-testid={`row-seeker-${seeker.id}`}>
                            <TableCell className="font-medium">{userName}</TableCell>
                            <TableCell>{seeker.displayName}</TableCell>
                            <TableCell>
                              {seeker.user?.email ? (
                                <PrivacyField
                                  value={seeker.user.email}
                                  type="email"
                                  testId={`email-seeker-${seeker.id}`}
                                />
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {seeker.user ? (
                                <VerifiedBadge isVerified={seeker.user.isVerified || seeker.isVerified} testId={`badge-seeker-${seeker.id}`} />
                              ) : (
                                <Badge variant="outline">Unverified</Badge>
                              )}
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="truncate" title={seeker.housingNeeds || undefined}>
                                {seeker.housingNeeds || <span className="text-muted-foreground">—</span>}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{budgetRange}</TableCell>
                            <TableCell>{moveInDate}</TableCell>
                            <TableCell>
                              {seeker.isActive ? (
                                <Badge variant="default">Active</Badge>
                              ) : (
                                <Badge variant="secondary">Inactive</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
