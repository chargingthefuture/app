import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Settings, Megaphone, ClipboardList } from "lucide-react";

const adminSections = [
  {
    title: "Configuration",
    description: "Pause intake, adjust capacity, and set trauma-informed guardrails.",
    icon: Settings,
    href: "/apps/workforce-recruiter/admin/config",
    testId: "link-workforce-config",
  },
  {
    title: "Announcements",
    description: "Share safety alerts, recruitment drives, or downtime notices.",
    icon: Megaphone,
    href: "/apps/workforce-recruiter/admin/announcements",
    testId: "link-workforce-announcements",
  },
  {
    title: "Occupations",
    description: "Curate equitable roles, note support pathways, and retire stale postings.",
    icon: ClipboardList,
    href: "/apps/workforce-recruiter/admin/occupations",
    testId: "link-workforce-occupations",
  },
];

export default function WorkforceRecruiterAdmin() {
  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-4 sm:p-6 md:p-8">
      <div>
        <p className="text-sm text-muted-foreground">Admin workspace</p>
        <h1 className="text-3xl font-semibold tracking-tight">Workforce Recruiter Admin</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Protect survivor data, manage employer communications, and keep the intake pipeline aligned with healing timelines.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {adminSections.map((section) => (
          <Card key={section.title} className="flex flex-col justify-between">
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <section.icon className="h-10 w-10 text-primary" />
                <div>
                  <CardTitle>{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" data-testid={section.testId}>
                <Link href={section.href}>Manage {section.title}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
