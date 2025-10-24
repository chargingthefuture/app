import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Users, Settings, Bell, MessageSquare, UserCheck, ShieldAlert } from "lucide-react";
import type { SupportMatchProfile, Partnership } from "@shared/schema";

export default function SupportMatchDashboard() {
  const { data: profile, isLoading: profileLoading } = useQuery<SupportMatchProfile | null>({
    queryKey: ["/api/supportmatch/profile"],
  });

  const { data: activePartnership, isLoading: partnershipLoading } = useQuery<Partnership | null>({
    queryKey: ["/api/supportmatch/partnership/active"],
    enabled: !!profile,
  });

  const { data: announcements } = useQuery<any[]>({
    queryKey: ["/api/supportmatch/announcements"],
  });

  if (profileLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 md:p-8 space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold mb-2">Welcome to SupportMatch</h1>
          <p className="text-muted-foreground">
            Connect with accountability partners for your recovery journey
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              To use SupportMatch, you'll need to create your profile first. This helps us match you with
              a compatible accountability partner.
            </p>
            <Link href="/apps/supportmatch/profile">
              <Button className="w-full" data-testid="button-create-profile">
                Create Your Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getPartnershipStatus = () => {
    if (partnershipLoading) {
      return { label: 'Loading...', variant: 'secondary' as const };
    }
    if (!activePartnership) {
      return { label: 'No Active Partnership', variant: 'secondary' as const };
    }
    return { label: 'Active Partnership', variant: 'default' as const };
  };

  const statusInfo = getPartnershipStatus();
  const activeAnnouncementsCount = announcements?.filter((a) => a.showOnLogin).length || 0;

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold mb-2">
          SupportMatch Dashboard
        </h1>
        <p className="text-muted-foreground">
          {profile.nickname ? `Hey ${profile.nickname}!` : 'Your accountability partner connection'}
        </p>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle>Partnership Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Current Status</p>
                <Badge variant={statusInfo.variant} data-testid="badge-partnership-status">
                  {statusInfo.label}
                </Badge>
              </div>
            </div>
            
            {activePartnership && (
              <Link href="/apps/supportmatch/partnership">
                <Button data-testid="button-view-partnership">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  View Partnership
                </Button>
              </Link>
            )}
          </div>

          {activePartnership && (
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                <span className="font-medium text-foreground">Partner:</span> {(activePartnership as any).partnerNickname || 'Loading...'}
              </p>
              <p>
                <span className="font-medium text-foreground">Started:</span> {format(new Date(activePartnership.startDate), 'MMM d, yyyy')}
              </p>
              {activePartnership.endDate && (
                <p>
                  <span className="font-medium text-foreground">Ends:</span> {format(new Date(activePartnership.endDate), 'MMM d, yyyy')}
                </p>
              )}
            </div>
          )}
          
          {!activePartnership && (
            <p className="text-sm text-muted-foreground">
              You're currently not in an active partnership. Your admin will match you with a partner during the next monthly cycle.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover-elevate">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Profile Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Update your preferences and gender settings
            </p>
            <Link href="/apps/supportmatch/profile">
              <Button variant="outline" className="w-full" data-testid="button-manage-profile">
                Manage Profile
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Safety & Privacy</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Manage blocked users and privacy settings
            </p>
            <Link href="/apps/supportmatch/safety">
              <Button variant="outline" className="w-full" data-testid="button-manage-safety">
                Manage Safety
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Announcements</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {activeAnnouncementsCount > 0 
                ? `${activeAnnouncementsCount} new announcement${activeAnnouncementsCount > 1 ? 's' : ''}`
                : 'View platform updates and notifications'}
            </p>
            <Link href="/apps/supportmatch/announcements">
              <Button variant="outline" className="w-full" data-testid="button-view-announcements">
                View Announcements
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-lg">History</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View your past partnerships and connection history
            </p>
            <Link href="/apps/supportmatch/history">
              <Button variant="outline" className="w-full" data-testid="button-view-history">
                View History
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
