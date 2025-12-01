import { Link, useLocation } from "wouter";
import { Briefcase, UserCog, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    icon: Briefcase,
    label: "Dashboard",
    path: "/apps/workforce-recruiter",
    testId: "nav-workforce-dashboard",
  },
  {
    icon: UserCog,
    label: "Profile",
    path: "/apps/workforce-recruiter/profile",
    testId: "nav-workforce-profile",
  },
  {
    icon: Bell,
    label: "Updates",
    path: "/apps/workforce-recruiter/announcements",
    testId: "nav-workforce-announcements",
  },
];

export function WorkforceRecruiterBottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t z-50 sm:hidden">
      <div className="grid grid-cols-3 gap-1 p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location === item.path || (location?.startsWith(item.path) ?? false);
          return (
            <Link key={item.path} href={item.path}>
              <button
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-primary",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
                data-testid={item.testId}
                aria-label={item.label}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
