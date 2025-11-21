import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Package, Calendar } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { PrivacyField } from "@/components/ui/privacy-field";

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  const getSubscriptionStatus = () => {
    const status = user?.subscriptionStatus || 'active';
    if (status === 'active') {
      return { label: 'Active', variant: 'default' as const };
    } else if (status === 'overdue') {
      return { label: 'Payment Overdue', variant: 'destructive' as const };
    }
    return { label: 'Inactive', variant: 'secondary' as const };
  };

  const statusInfo = getSubscriptionStatus();

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Welcome section */}
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold mb-2">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
        </h1>
        <p className="text-muted-foreground">
          Your psyop-free space for accessing essential support services
        </p>
      </div>

      {/* Profile overview */}
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={user?.profileImageUrl || undefined} alt="Profile" />
              <AvatarFallback className="text-xl">{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div>
                <h3 className="text-xl font-semibold" data-testid="text-user-name">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user?.email || 'User'}
                </h3>
                <div className="text-sm text-muted-foreground">
                  <PrivacyField 
                    value={user?.email || ""} 
                    type="email"
                    testId="text-user-email"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={statusInfo.variant} data-testid="badge-subscription-status">
                  {statusInfo.label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ${user?.pricingTier}/month
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="hover-elevate">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Services</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Browse available support services and resources
            </p>
            <Link href="/services">
              <Button variant="outline" className="w-full" data-testid="button-browse-services">
                Browse Services
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Payments</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View your payment history and subscription details
            </p>
            <Link href="/payments">
              <Button variant="outline" className="w-full" data-testid="button-view-payments">
                View Payments
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Subscription</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Your grandfathered rate: ${user?.pricingTier}/month
            </p>
            <Badge variant="secondary" className="w-full justify-center">
              Pricing Locked
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
