import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Users, Building2, UserCheck } from "lucide-react";

export default function LighthouseAdminPage() {
  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ["/api/lighthouse/admin/stats"],
  });

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
          <CardTitle>Platform Overview</CardTitle>
          <CardDescription>
            LightHouse housing matching platform statistics and management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              LightHouse connects housing seekers with safe, affordable housing options provided by survivor hosts and communities.
            </p>
            <p>
              Use the admin tools to manage profiles, properties, and matches, ensuring a safe and supportive experience for all participants.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
