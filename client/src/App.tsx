import { Switch, Route } from "wouter";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";
import { NpsSurveyManager } from "@/components/nps-survey-manager";
import { ErrorBoundary } from "@/components/error-boundary";
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
import AdminWeeklyPerformance from "@/pages/admin/weekly-performance";
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

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Check if user needs to provide invite code
  const needsInviteCode = user && !user.inviteCodeUsed && !user.isAdmin;

  return (
    <Switch>
      {/* Clerk authentication routes */}
      <Route path="/sign-in">
        <div className="min-h-screen flex items-center justify-center p-4">
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            afterSignInUrl="/"
          />
        </div>
      </Route>
      <Route path="/sign-up">
        <div className="min-h-screen flex items-center justify-center p-4">
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            afterSignUpUrl="/"
          />
        </div>
      </Route>
      {/* Publicly viewable Directory profiles */}
      <Route path="/apps/directory/public" component={PublicDirectoryList} />
      <Route path="/apps/directory/public/:id" component={PublicDirectoryProfile} />
      {/* Publicly viewable SocketRelay requests */}
      <Route path="/apps/socketrelay/public" component={PublicSocketRelayList} />
      <Route path="/apps/socketrelay/public/:id" component={PublicSocketRelayRequest} />
      {/* Show landing page for unauthenticated users (including during loading) */}
      {!isAuthenticated || isLoading ? (
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
          <Route path="/admin/weekly-performance" component={AdminWeeklyPerformance} />
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
          <Route path="/apps/lighthouse/admin/profile/:id" component={LighthouseAdminProfileView} />
          <Route path="/apps/lighthouse/admin/announcements" component={LighthouseAdminAnnouncements} />
          <Route path="/apps/socketrelay" component={SocketRelayDashboard} />
          <Route path="/apps/socketrelay/profile" component={SocketRelayProfile} />
          <Route path="/apps/socketrelay/announcements" component={SocketRelayAnnouncements} />
          <Route path="/apps/socketrelay/chat/:id" component={SocketRelayChat} />
          <Route path="/apps/socketrelay/admin" component={SocketRelayAdmin} />
          <Route path="/apps/socketrelay/admin/announcements" component={SocketRelayAdminAnnouncements} />
          {/* Directory routes */}
          <Route path="/apps/directory" component={DirectoryDashboard} />
          <Route path="/apps/directory/profile" component={DirectoryProfile} />
          <Route path="/apps/directory/announcements" component={DirectoryAnnouncements} />
          <Route path="/apps/directory/admin" component={DirectoryAdmin} />
          <Route path="/apps/directory/admin/announcements" component={DirectoryAdminAnnouncements} />
          {/* Chat Groups routes */}
          <Route path="/apps/chatgroups" component={ChatGroups} />
          <Route path="/apps/chatgroups/announcements" component={ChatGroupsAnnouncements} />
          <Route path="/apps/chatgroups/admin" component={ChatGroupsAdmin} />
          <Route path="/apps/chatgroups/admin/announcements" component={ChatGroupsAdminAnnouncements} />
          {/* LightHouse routes - announcements */}
          <Route path="/apps/lighthouse/announcements" component={LighthouseAnnouncements} />
          {/* SleepStories routes - announcements */}
          <Route path="/apps/sleepstories/announcements" component={SleepStoriesAnnouncements} />
          {/* TrustTransport routes */}
          <Route path="/apps/trusttransport" component={TrustTransportDashboard} />
          <Route path="/apps/trusttransport/profile" component={TrustTransportProfile} />
          <Route path="/apps/trusttransport/browse" component={TrustTransportBrowse} />
          <Route path="/apps/trusttransport/request/new" component={TrustTransportRequestNew} />
          <Route path="/apps/trusttransport/request/:id" component={TrustTransportRequestDetail} />
          <Route path="/apps/trusttransport/my-requests" component={TrustTransportMyRequests} />
          <Route path="/apps/trusttransport/my-claimed" component={TrustTransportMyClaimed} />
          <Route path="/apps/trusttransport/announcements" component={TrustTransportAnnouncements} />
          <Route path="/apps/trusttransport/admin" component={TrustTransportAdmin} />
          <Route path="/apps/trusttransport/admin/announcements" component={TrustTransportAdminAnnouncements} />
          {/* MechanicMatch routes */}
          <Route path="/apps/mechanicmatch" component={MechanicMatchDashboard} />
          <Route path="/apps/mechanicmatch/profile" component={MechanicMatchProfile} />
          <Route path="/apps/mechanicmatch/vehicles" component={MechanicMatchVehicles} />
          <Route path="/apps/mechanicmatch/request-new" component={MechanicMatchRequestNew} />
          <Route path="/apps/mechanicmatch/admin" component={MechanicMatchAdmin} />
          <Route path="/apps/mechanicmatch/admin/announcements" component={MechanicMatchAdminAnnouncements} />
          {/* LostMail routes */}
          <Route path="/apps/lostmail" component={LostMailDashboard} />
          <Route path="/apps/lostmail/report" component={LostMailReport} />
          <Route path="/apps/lostmail/incident/:id" component={LostMailIncidentDetail} />
          <Route path="/apps/lostmail/admin" component={LostMailAdmin} />
          <Route path="/apps/lostmail/admin/announcements" component={LostMailAdminAnnouncements} />
          {/* Research routes */}
          <Route path="/apps/research" component={ResearchTimeline} />
          <Route path="/apps/research/item/:id" component={ResearchItemView} />
          <Route path="/apps/research/new" component={NewResearchItem} />
                <Route path="/apps/research/admin" component={ResearchAdmin} />
                <Route path="/apps/research/admin/announcements" component={ResearchAdminAnnouncements} />
                <Route path="/apps/research/admin/reports" component={ResearchAdminReports} />
                {/* GentlePulse Routes */}
                <Route path="/apps/gentlepulse" component={() => (
                  <>
                    <GentlePulseLibrary />
                    <GentlePulseBottomNav />
                  </>
                )} />
                <Route path="/apps/gentlepulse/favorites" component={() => (
                  <>
                    <GentlePulseFavorites />
                    <GentlePulseBottomNav />
                  </>
                )} />
                <Route path="/apps/gentlepulse/support" component={() => (
                  <>
                    <GentlePulseSupport />
                    <GentlePulseBottomNav />
                  </>
                )} />
                <Route path="/apps/gentlepulse/settings" component={() => (
                  <>
                    <GentlePulseSettings />
                    <GentlePulseBottomNav />
                  </>
                )} />
                <Route path="/apps/gentlepulse/admin" component={GentlePulseAdmin} />
                <Route path="/apps/gentlepulse/admin/announcements" component={GentlePulseAdminAnnouncements} />
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
