import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Services from "@/pages/services";
import UserPayments from "@/pages/user-payments";
import InviteRequired from "@/pages/invite-required";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminInvites from "@/pages/admin/invites";
import AdminPayments from "@/pages/admin/payments";
import AdminActivity from "@/pages/admin/activity";
import AdminPricingTiers from "@/pages/admin/pricing-tiers";
import SupportMatchDashboard from "@/pages/supportmatch/dashboard";
import SupportMatchProfile from "@/pages/supportmatch/profile";
import SupportMatchPartnership from "@/pages/supportmatch/partnership";
import SupportMatchAnnouncements from "@/pages/supportmatch/announcements";
import SupportMatchHistory from "@/pages/supportmatch/history";
import SupportMatchSafety from "@/pages/supportmatch/safety";
import SupportMatchAdmin from "@/pages/supportmatch/admin";
import SupportMatchAdminAnnouncements from "@/pages/supportmatch/admin-announcements";
import SupportMatchAdminUsers from "@/pages/supportmatch/admin-users";
import SupportMatchAdminPartnerships from "@/pages/supportmatch/admin-partnerships";
import SupportMatchAdminReports from "@/pages/supportmatch/admin-reports";
import SleepStoriesLibrary from "@/pages/sleepstories/library";
import SleepStoryPlayer from "@/pages/sleepstories/player";
import SleepStoriesAdmin from "@/pages/sleepstories/admin";
import SleepStoriesAdminAnnouncements from "@/pages/sleepstories/admin-announcements";
import LighthouseDashboard from "@/pages/lighthouse/dashboard";
import LighthouseProfile from "@/pages/lighthouse/profile";
import LighthouseBrowse from "@/pages/lighthouse/browse";
import LighthousePropertyDetail from "@/pages/lighthouse/property-detail";
import LighthouseMatches from "@/pages/lighthouse/matches";
import LighthouseAdmin from "@/pages/lighthouse/admin";
import LighthouseMyProperties from "@/pages/lighthouse/my-properties";
import LighthousePropertyForm from "@/pages/lighthouse/property-form";
import LighthouseAdminAnnouncements from "@/pages/lighthouse/admin-announcements";
import SocketRelayDashboard from "@/pages/socketrelay/dashboard";
import SocketRelayProfile from "@/pages/socketrelay/profile";
import SocketRelayChat from "@/pages/socketrelay/chat";
import SocketRelayAdmin from "@/pages/socketrelay/admin";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Check if user needs to provide invite code
  const needsInviteCode = user && !user.inviteCodeUsed && !user.isAdmin;

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : needsInviteCode ? (
        <Route path="/" component={InviteRequired} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/services" component={Services} />
          <Route path="/payments" component={UserPayments} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/users" component={AdminUsers} />
          <Route path="/admin/invites" component={AdminInvites} />
          <Route path="/admin/payments" component={AdminPayments} />
          <Route path="/admin/pricing" component={AdminPricingTiers} />
          <Route path="/admin/activity" component={AdminActivity} />
          <Route path="/apps/supportmatch" component={SupportMatchDashboard} />
          <Route path="/apps/supportmatch/profile" component={SupportMatchProfile} />
          <Route path="/apps/supportmatch/partnership" component={SupportMatchPartnership} />
          <Route path="/apps/supportmatch/announcements" component={SupportMatchAnnouncements} />
          <Route path="/apps/supportmatch/history" component={SupportMatchHistory} />
          <Route path="/apps/supportmatch/safety" component={SupportMatchSafety} />
          <Route path="/apps/supportmatch/admin" component={SupportMatchAdmin} />
          <Route path="/apps/supportmatch/admin/announcements" component={SupportMatchAdminAnnouncements} />
          <Route path="/apps/supportmatch/admin/users" component={SupportMatchAdminUsers} />
          <Route path="/apps/supportmatch/admin/partnerships" component={SupportMatchAdminPartnerships} />
          <Route path="/apps/supportmatch/admin/reports" component={SupportMatchAdminReports} />
          <Route path="/apps/sleepstories" component={SleepStoriesLibrary} />
          <Route path="/apps/sleepstories/admin" component={SleepStoriesAdmin} />
          <Route path="/apps/sleepstories/admin/announcements" component={SleepStoriesAdminAnnouncements} />
          <Route path="/apps/sleepstories/:id" component={SleepStoryPlayer} />
          <Route path="/apps/lighthouse" component={LighthouseDashboard} />
          <Route path="/apps/lighthouse/profile" component={LighthouseProfile} />
          <Route path="/apps/lighthouse/browse" component={LighthouseBrowse} />
          <Route path="/apps/lighthouse/my-properties" component={LighthouseMyProperties} />
          <Route path="/apps/lighthouse/property/new" component={LighthousePropertyForm} />
          <Route path="/apps/lighthouse/property/edit/:id" component={LighthousePropertyForm} />
          <Route path="/apps/lighthouse/property/:id" component={LighthousePropertyDetail} />
          <Route path="/apps/lighthouse/matches" component={LighthouseMatches} />
          <Route path="/apps/lighthouse/admin" component={LighthouseAdmin} />
          <Route path="/apps/lighthouse/admin/announcements" component={LighthouseAdminAnnouncements} />
          <Route path="/apps/socketrelay" component={SocketRelayDashboard} />
          <Route path="/apps/socketrelay/profile" component={SocketRelayProfile} />
          <Route path="/apps/socketrelay/chat/:id" component={SocketRelayChat} />
          <Route path="/apps/socketrelay/admin" component={SocketRelayAdmin} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const needsInviteCode = user && !user.inviteCodeUsed && !user.isAdmin;

  // Sidebar width customization for better content display
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <>
      {!isLoading && isAuthenticated && !needsInviteCode ? (
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <header className="flex items-center justify-between min-h-14 h-14 sm:h-16 px-3 sm:px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <div className="text-xs sm:text-sm text-muted-foreground">
                  a work of optimism
                </div>
              </header>
              <main className="flex-1 overflow-auto">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
      ) : (
        <Router />
      )}
      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
