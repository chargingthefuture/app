import React from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { NpsSurveyManager } from "@/components/nps-survey-manager";
import { ErrorBoundary } from "@/components/error-boundary";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Services from "@/pages/services";
import UserPayments from "@/pages/user-payments";
import DeleteAccount from "@/pages/account/delete";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsers from "@/pages/admin/users";
import AdminPayments from "@/pages/admin/payments";
import AdminActivity from "@/pages/admin/activity";
import AdminPricingTiers from "@/pages/admin/pricing-tiers";
import AdminWeeklyPerformance from "@/pages/admin/weekly-performance";
import VideoToGifConverter from "@/pages/admin/video-to-gif";
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
import LighthouseAdminProfileView from "@/pages/lighthouse/admin-profile-view";
import SocketRelayDashboard from "@/pages/socketrelay/dashboard";
import SocketRelayProfile from "@/pages/socketrelay/profile";
import SocketRelayChat from "@/pages/socketrelay/chat";
import SocketRelayAdmin from "@/pages/socketrelay/admin";
import SocketRelayAnnouncements from "@/pages/socketrelay/announcements";
import SocketRelayAdminAnnouncements from "@/pages/socketrelay/admin-announcements";
import DirectoryDashboard from "@/pages/directory/dashboard";
import DirectoryProfile from "@/pages/directory/profile";
import DirectoryAdmin from "@/pages/directory/admin";
import DirectoryAnnouncements from "@/pages/directory/announcements";
import DirectoryAdminAnnouncements from "@/pages/directory/admin-announcements";
import PublicDirectoryProfile from "@/pages/directory/public";
import PublicDirectoryList from "@/pages/directory/public-list";
import ChatGroups from "@/pages/chatgroups/index";
import ChatGroupsAdmin from "@/pages/chatgroups/admin";
import ChatGroupsAnnouncements from "@/pages/chatgroups/announcements";
import ChatGroupsAdminAnnouncements from "@/pages/chatgroups/admin-announcements";
import LighthouseAnnouncements from "@/pages/lighthouse/announcements";
import SleepStoriesAnnouncements from "@/pages/sleepstories/announcements";
import PublicSocketRelayRequest from "@/pages/socketrelay/public";
import PublicSocketRelayList from "@/pages/socketrelay/public-list";
import TrustTransportDashboard from "@/pages/trusttransport/dashboard";
import TrustTransportProfile from "@/pages/trusttransport/profile";
import TrustTransportBrowse from "@/pages/trusttransport/browse";
import TrustTransportRequestNew from "@/pages/trusttransport/request-new";
import TrustTransportRequestDetail from "@/pages/trusttransport/request-detail";
import TrustTransportMyRequests from "@/pages/trusttransport/my-requests";
import TrustTransportMyClaimed from "@/pages/trusttransport/my-claimed";
import TrustTransportAnnouncements from "@/pages/trusttransport/announcements";
import TrustTransportAdmin from "@/pages/trusttransport/admin";
import TrustTransportAdminAnnouncements from "@/pages/trusttransport/admin-announcements";
import MechanicMatchDashboard from "@/pages/mechanicmatch/dashboard";
import MechanicMatchProfile from "@/pages/mechanicmatch/profile";
import MechanicMatchVehicles from "@/pages/mechanicmatch/vehicles";
import MechanicMatchRequestNew from "@/pages/mechanicmatch/request-new";
import MechanicMatchAdmin from "@/pages/mechanicmatch/admin";
import MechanicMatchAdminAnnouncements from "@/pages/mechanicmatch/admin-announcements";
import LostMailDashboard from "@/pages/lostmail/dashboard";
import LostMailReport from "@/pages/lostmail/report";
import LostMailIncidentDetail from "@/pages/lostmail/incident-detail";
import LostMailAdmin from "@/pages/lostmail/admin";
import LostMailAdminAnnouncements from "@/pages/lostmail/admin-announcements";
import ResearchTimeline from "@/pages/research/timeline";
import ResearchItemView from "@/pages/research/item-view";
import NewResearchItem from "@/pages/research/new-item";
import ResearchAdmin from "@/pages/research/admin";
import ResearchAdminAnnouncements from "@/pages/research/admin-announcements";
import ResearchAdminReports from "@/pages/research/admin-reports";
import GentlePulseLibrary from "@/pages/gentlepulse/library";
import GentlePulseFavorites from "@/pages/gentlepulse/favorites";
import GentlePulseSupport from "@/pages/gentlepulse/support";
import GentlePulseSettings from "@/pages/gentlepulse/settings";
import GentlePulseAdmin from "@/pages/gentlepulse/admin";
import GentlePulseAdminAnnouncements from "@/pages/gentlepulse/admin-announcements";
import { GentlePulseBottomNav } from "@/components/gentlepulse/bottom-nav";

// Protected route wrapper that redirects unauthenticated users
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { _clerk, user, isLoading } = useAuth();
  const needsApproval = user && !user.isApproved && !user.isAdmin;

  // If Clerk is still loading, show loading indicator
  if (!_clerk.clerkLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If not signed in, redirect to landing
  if (!_clerk.isSignedIn) {
    return <Redirect to="/" />;
  }

  // If needs approval, show waiting message
  if (needsApproval) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your account is pending approval. An administrator will review your request shortly.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

// Landing/root route handler
function RootRoute() {
  const { _clerk, user, isLoading } = useAuth();
  const needsApproval = user && !user.isApproved && !user.isAdmin;

  // If Clerk is still loading, show loading indicator
  if (!_clerk.clerkLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If signed in, wait for DB user to load before redirecting
  if (_clerk.isSignedIn) {
    // Still loading DB user, show loading indicator
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      );
    }
    
    // If needs approval, show waiting message
    if (needsApproval) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Access Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Your account is pending approval. An administrator will review your request shortly.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    // Signed in and approved - show home dashboard
    // Don't redirect to avoid infinite loop, just render Home
    return <Home />;
  }

  // Show landing page for unauthenticated users
  return <Landing />;
}

function Router() {
  return (
    <Switch>
      {/* Publicly viewable Directory profiles */}
      <Route path="/apps/directory/public" component={PublicDirectoryList} />
      <Route path="/apps/directory/public/:id" component={PublicDirectoryProfile} />
      {/* Publicly viewable SocketRelay requests */}
      <Route path="/apps/socketrelay/public" component={PublicSocketRelayList} />
      <Route path="/apps/socketrelay/public/:id" component={PublicSocketRelayRequest} />
      
      {/* Root route - handles landing vs redirect */}
      <Route path="/">
        <RootRoute />
      </Route>
      
      {/* Protected routes - always rendered, but wrapped with auth checks */}
      <Route path="/services">
        <ProtectedRoute>
          <Services />
        </ProtectedRoute>
      </Route>
      <Route path="/payments">
        <ProtectedRoute>
          <UserPayments />
        </ProtectedRoute>
      </Route>
      <Route path="/account/delete">
        <ProtectedRoute>
          <DeleteAccount />
        </ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/users">
        <ProtectedRoute>
          <AdminUsers />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/payments">
        <ProtectedRoute>
          <AdminPayments />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/pricing">
        <ProtectedRoute>
          <AdminPricingTiers />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/activity">
        <ProtectedRoute>
          <AdminActivity />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/weekly-performance">
        <ProtectedRoute>
          <AdminWeeklyPerformance />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/video-to-gif">
        <ProtectedRoute>
          <VideoToGifConverter />
        </ProtectedRoute>
      </Route>
      {/* Mini-app routes - all protected */}
      <Route path="/apps/supportmatch">
        <ProtectedRoute>
          <SupportMatchDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/supportmatch/profile">
        <ProtectedRoute>
          <SupportMatchProfile />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/supportmatch/partnership">
        <ProtectedRoute>
          <SupportMatchPartnership />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/supportmatch/announcements">
        <ProtectedRoute>
          <SupportMatchAnnouncements />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/supportmatch/history">
        <ProtectedRoute>
          <SupportMatchHistory />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/supportmatch/safety">
        <ProtectedRoute>
          <SupportMatchSafety />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/supportmatch/admin">
        <ProtectedRoute>
          <SupportMatchAdmin />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/supportmatch/admin/announcements">
        <ProtectedRoute>
          <SupportMatchAdminAnnouncements />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/supportmatch/admin/users">
        <ProtectedRoute>
          <SupportMatchAdminUsers />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/supportmatch/admin/partnerships">
        <ProtectedRoute>
          <SupportMatchAdminPartnerships />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/supportmatch/admin/reports">
        <ProtectedRoute>
          <SupportMatchAdminReports />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/sleepstories">
        <ProtectedRoute>
          <SleepStoriesLibrary />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/sleepstories/admin">
        <ProtectedRoute>
          <SleepStoriesAdmin />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/sleepstories/admin/announcements">
        <ProtectedRoute>
          <SleepStoriesAdminAnnouncements />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/sleepstories/:id">
        <ProtectedRoute>
          <SleepStoryPlayer />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/sleepstories/announcements">
        <ProtectedRoute>
          <SleepStoriesAnnouncements />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/lighthouse">
        <ProtectedRoute>
          <LighthouseDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/lighthouse/profile">
        <ProtectedRoute>
          <LighthouseProfile />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/lighthouse/browse">
        <ProtectedRoute>
          <LighthouseBrowse />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/lighthouse/my-properties">
        <ProtectedRoute>
          <LighthouseMyProperties />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/lighthouse/property/new">
        <ProtectedRoute>
          <LighthousePropertyForm />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/lighthouse/property/edit/:id">
        <ProtectedRoute>
          <LighthousePropertyForm />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/lighthouse/property/:id">
        <ProtectedRoute>
          <LighthousePropertyDetail />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/lighthouse/matches">
        <ProtectedRoute>
          <LighthouseMatches />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/lighthouse/admin">
        <ProtectedRoute>
          <LighthouseAdmin />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/lighthouse/admin/profile/:id">
        <ProtectedRoute>
          <LighthouseAdminProfileView />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/lighthouse/admin/announcements">
        <ProtectedRoute>
          <LighthouseAdminAnnouncements />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/lighthouse/announcements">
        <ProtectedRoute>
          <LighthouseAnnouncements />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/socketrelay">
        <ProtectedRoute>
          <SocketRelayDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/socketrelay/profile">
        <ProtectedRoute>
          <SocketRelayProfile />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/socketrelay/announcements">
        <ProtectedRoute>
          <SocketRelayAnnouncements />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/socketrelay/chat/:id">
        <ProtectedRoute>
          <SocketRelayChat />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/socketrelay/admin">
        <ProtectedRoute>
          <SocketRelayAdmin />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/socketrelay/admin/announcements">
        <ProtectedRoute>
          <SocketRelayAdminAnnouncements />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/directory">
        <ProtectedRoute>
          <DirectoryDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/directory/profile">
        <ProtectedRoute>
          <DirectoryProfile />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/directory/announcements">
        <ProtectedRoute>
          <DirectoryAnnouncements />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/directory/admin">
        <ProtectedRoute>
          <DirectoryAdmin />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/directory/admin/announcements">
        <ProtectedRoute>
          <DirectoryAdminAnnouncements />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/chatgroups">
        <ProtectedRoute>
          <ChatGroups />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/chatgroups/announcements">
        <ProtectedRoute>
          <ChatGroupsAnnouncements />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/chatgroups/admin">
        <ProtectedRoute>
          <ChatGroupsAdmin />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/chatgroups/admin/announcements">
        <ProtectedRoute>
          <ChatGroupsAdminAnnouncements />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/trusttransport">
        <ProtectedRoute>
          <TrustTransportDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/trusttransport/profile">
        <ProtectedRoute>
          <TrustTransportProfile />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/trusttransport/browse">
        <ProtectedRoute>
          <TrustTransportBrowse />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/trusttransport/request/new">
        <ProtectedRoute>
          <TrustTransportRequestNew />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/trusttransport/request/:id">
        <ProtectedRoute>
          <TrustTransportRequestDetail />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/trusttransport/my-requests">
        <ProtectedRoute>
          <TrustTransportMyRequests />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/trusttransport/my-claimed">
        <ProtectedRoute>
          <TrustTransportMyClaimed />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/trusttransport/announcements">
        <ProtectedRoute>
          <TrustTransportAnnouncements />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/trusttransport/admin">
        <ProtectedRoute>
          <TrustTransportAdmin />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/trusttransport/admin/announcements">
        <ProtectedRoute>
          <TrustTransportAdminAnnouncements />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/mechanicmatch">
        <ProtectedRoute>
          <MechanicMatchDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/mechanicmatch/profile">
        <ProtectedRoute>
          <MechanicMatchProfile />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/mechanicmatch/vehicles">
        <ProtectedRoute>
          <MechanicMatchVehicles />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/mechanicmatch/request-new">
        <ProtectedRoute>
          <MechanicMatchRequestNew />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/mechanicmatch/admin">
        <ProtectedRoute>
          <MechanicMatchAdmin />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/mechanicmatch/admin/announcements">
        <ProtectedRoute>
          <MechanicMatchAdminAnnouncements />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/lostmail">
        <ProtectedRoute>
          <LostMailDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/lostmail/report">
        <ProtectedRoute>
          <LostMailReport />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/lostmail/incident/:id">
        <ProtectedRoute>
          <LostMailIncidentDetail />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/lostmail/admin">
        <ProtectedRoute>
          <LostMailAdmin />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/lostmail/admin/announcements">
        <ProtectedRoute>
          <LostMailAdminAnnouncements />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/research">
        <ProtectedRoute>
          <ResearchTimeline />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/research/item/:id">
        <ProtectedRoute>
          <ResearchItemView />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/research/new">
        <ProtectedRoute>
          <NewResearchItem />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/research/admin">
        <ProtectedRoute>
          <ResearchAdmin />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/research/admin/announcements">
        <ProtectedRoute>
          <ResearchAdminAnnouncements />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/research/admin/reports">
        <ProtectedRoute>
          <ResearchAdminReports />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/gentlepulse">
        <ProtectedRoute>
          <>
            <GentlePulseLibrary />
            <GentlePulseBottomNav />
          </>
        </ProtectedRoute>
      </Route>
      <Route path="/apps/gentlepulse/favorites">
        <ProtectedRoute>
          <>
            <GentlePulseFavorites />
            <GentlePulseBottomNav />
          </>
        </ProtectedRoute>
      </Route>
      <Route path="/apps/gentlepulse/support">
        <ProtectedRoute>
          <>
            <GentlePulseSupport />
            <GentlePulseBottomNav />
          </>
        </ProtectedRoute>
      </Route>
      <Route path="/apps/gentlepulse/settings">
        <ProtectedRoute>
          <>
            <GentlePulseSettings />
            <GentlePulseBottomNav />
          </>
        </ProtectedRoute>
      </Route>
      <Route path="/apps/gentlepulse/admin">
        <ProtectedRoute>
          <GentlePulseAdmin />
        </ProtectedRoute>
      </Route>
      <Route path="/apps/gentlepulse/admin/announcements">
        <ProtectedRoute>
          <GentlePulseAdminAnnouncements />
        </ProtectedRoute>
      </Route>
      
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
      {!isLoading && isAuthenticated && !needsApproval ? (
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
      {isAuthenticated && <NpsSurveyManager />}
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppContent />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
