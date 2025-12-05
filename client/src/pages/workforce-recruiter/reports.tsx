import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { BarChart3, ArrowLeft } from "lucide-react";
import { AnnouncementBanner } from "@/components/announcement-banner";
import type { WorkforceRecruiterConfig } from "@shared/schema";
import { Progress } from "@/components/ui/progress";

interface SummaryReport {
  totalWorkforceTarget: number;
  totalCurrentRecruited: number;
  percentRecruited: number;
  sectorBreakdown: Array<{ sector: string; target: number; recruited: number; percent: number }>;
  skillLevelBreakdown: Array<{ skillLevel: string; target: number; recruited: number; percent: number }>;
  annualTrainingGap: Array<{ occupationId: string; occupationTitle: string; sector: string; target: number; actual: number; gap: number }>;
}

export default function WorkforceRecruiterReports() {
  const { data: config, isLoading: configLoading } = useQuery<WorkforceRecruiterConfig>({
    queryKey: ["/api/workforce-recruiter/config"],
  });

  const { data: summaryReport, isLoading: reportLoading } = useQuery<SummaryReport>({
    queryKey: ["/api/workforce-recruiter/reports/summary"],
  });

  if (configLoading || reportLoading) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const workforceTotal = config
    ? Math.round(config.population * parseFloat(config.workforceParticipationRate))
    : 2500000;
  const remainingCapacity = config
    ? config.maxRecruitable - (summaryReport?.totalCurrentRecruited || 0)
    : 0;

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/apps/workforce-recruiter">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold mb-2">Recruitment Reports</h1>
          <p className="text-muted-foreground">
            Detailed recruitment and workforce distribution reports
          </p>
        </div>
      </div>

      <AnnouncementBanner
        apiEndpoint="/api/workforce-recruiter/announcements"
        queryKey="/api/workforce-recruiter/announcements"
      />

      {/* Top-line Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Population</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{config?.population.toLocaleString() || "5,000,000"}</div>
            <p className="text-xs text-muted-foreground mt-1">Community size</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Workforce Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workforceTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {config ? `${(parseFloat(config.workforceParticipationRate) * 100).toFixed(0)}% participation rate` : "50% participation rate"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Headcount Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryReport?.totalWorkforceTarget.toLocaleString() || "0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Target positions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Recruited</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryReport?.totalCurrentRecruited.toLocaleString() || "0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summaryReport ? `${summaryReport.percentRecruited.toFixed(1)}% of target` : "0% of target"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Recruitment Progress</CardTitle>
          <CardDescription>Overall progress toward workforce targets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span className="font-medium">
                  {summaryReport?.percentRecruited.toFixed(1) || "0"}%
                </span>
              </div>
              <Progress value={summaryReport?.percentRecruited || 0} className="h-3" />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Remaining Capacity: </span>
                <span className="font-medium">{remainingCapacity.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Min Recruitable: </span>
                <span className="font-medium">{config?.minRecruitable.toLocaleString() || "2,000,000"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sector Breakdown - Full List */}
      <Card>
        <CardHeader>
          <CardTitle>Sector Distribution</CardTitle>
          <CardDescription>Complete breakdown of target vs recruited by sector</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summaryReport?.sectorBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sector data available</p>
            ) : (
              summaryReport?.sectorBreakdown.map((sector) => (
                <div key={sector.sector} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{sector.sector}</span>
                    <span className="text-muted-foreground">
                      {sector.recruited.toLocaleString()} / {sector.target.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={sector.percent} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {sector.percent.toFixed(1)}% filled
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Skill Level Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Skill Level Breakdown</CardTitle>
          <CardDescription>Recruitment progress by skill level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {summaryReport?.skillLevelBreakdown.map((skill) => (
              <Link
                key={skill.skillLevel}
                href={`/apps/workforce-recruiter/skill-level/${encodeURIComponent(skill.skillLevel)}`}
                className="block"
              >
                <div className="space-y-2 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors" data-testid={`skill-level-${skill.skillLevel}`}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{skill.skillLevel}</span>
                    <span className="text-muted-foreground">
                      {skill.recruited.toLocaleString()} / {skill.target.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={skill.percent} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {skill.percent.toFixed(1)}% filled
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Training Gaps - Full List */}
      <Card>
        <CardHeader>
          <CardTitle>Annual Training Gaps</CardTitle>
          <CardDescription>All occupations with training gaps identified</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summaryReport?.annualTrainingGap.length === 0 ? (
              <p className="text-sm text-muted-foreground">No training gaps identified</p>
            ) : (
              summaryReport?.annualTrainingGap.map((gap) => (
                <div key={gap.occupationId} className="border-b pb-3 last:border-0">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex-1">
                      <Link href={`/apps/workforce-recruiter/occupations/${gap.occupationId}`}>
                        <p className="text-sm font-medium hover:underline">{gap.occupationTitle}</p>
                      </Link>
                      <p className="text-xs text-muted-foreground">{gap.sector}</p>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      Gap: {gap.gap.toLocaleString()}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Target: {gap.target.toLocaleString()} | Actual: {gap.actual.toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


