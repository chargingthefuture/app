import { 
  Home, 
  Users, 
  Ticket, 
  DollarSign, 
  FileText,
  LogOut,
  UserCheck
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const adminMenuItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: Home,
    testId: "link-admin-dashboard",
  },
  {
    title: "User Management",
    url: "/admin/users",
    icon: Users,
    testId: "link-admin-users",
  },
  {
    title: "Invite Codes",
    url: "/admin/invites",
    icon: Ticket,
    testId: "link-admin-invites",
  },
  {
    title: "Payments",
    url: "/admin/payments",
    icon: DollarSign,
    testId: "link-admin-payments",
  },
  {
    title: "Activity Log",
    url: "/admin/activity",
    icon: FileText,
    testId: "link-admin-activity",
  },
  {
    title: "SupportMatch Admin",
    url: "/apps/supportmatch/admin",
    icon: UserCheck,
    testId: "link-supportmatch-admin",
  },
];

const userMenuItems = [
  {
    title: "SupportMatch",
    url: "/apps/supportmatch",
    icon: UserCheck,
    testId: "link-supportmatch",
  },
  {
    title: "My Payments",
    url: "/payments",
    icon: DollarSign,
    testId: "link-payments",
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { isAdmin } = useAuth();
  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-semibold text-primary px-4 py-4">
            Support Platform
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} data-testid={item.testId}>
                      <Link href={item.url}>
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => window.location.href = '/api/logout'}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Log Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
