import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Users, TrendingUp, Target, AlertCircle, BarChart3, Briefcase } from "lucide-react";
import { AnnouncementBanner } from "@/components/announcement-banner";
import type { WorkforceRecruiterConfig, WorkforceRecruiterOccupation } from "@shared/schema";
import { Progress } from "@/components/ui/progress";

interface SummaryReport {
  totalWorkforceTarget: number;
  totalCurrentRecruited: number;
  percentRecruited: number;
  sectorBreakdown: Array<{ sector: string; target: number; recruited: number; percent: number }>;
  skillLevelBreakdown: Array<{ skillLevel: string; target: number; recruited: number; percent: number }>;
  annualTrainingGap: Array<{ occupationId: string; occupationTitle: string; sector: string; target: number; actual: number; gap: number }>;
}

export default function WorkforceRecruiterDashboard() {
  const { data: config, isLoading: configLoading } = useQuery<WorkforceRecruiterConfig | null>({
    queryKey: ["/api/workforce-recruiter/config"],
  });

  const { data: report, isLoading: reportLoading } = useQuery<SummaryReport>({
    queryKey: ["/api/workforce-recruiter/reports/summary"],
  });

  const workforceTotal = config ? Math.round(Number(config.population) * Number(config.workforceParticipationRate)) : 0;
  const remainingCapacity = report ? workforceTotal - report.totalCurrentRecruited : 0;

  if (configLoading || reportLoading) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold mb-2">Workforce Recruiter Tracker</h1>
          <p className="text-muted-foreground">
            Track recruitment and distribution of workforce for the community
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/apps/workforce-recruiter/occupations">
            <Button variant="outline" data-testid="button-view-occupations">
              <Briefcase className="w-4 h-4 mr-2" />
              View Occupations
            </Button>
          </Link>
          <Link href="/apps/workforce-recruiter/reports">
            <Button variant="outline" data-testid="button-view-reports">
              <BarChart3 className="w-4 h-4 mr-2" />
              Reports
            </Button>
          </Link>
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
            <div className="text-2xl font-bold">{config?.population.toLocaleString() || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Workforce Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workforceTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {config ? `${(Number(config.workforceParticipationRate) * 100).toFixed(0)}% participation rate` : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Headcount Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report?.totalWorkforceTarget.toLocaleString() || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Recruited</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report?.totalCurrentRecruited.toLocaleString() || 0}</div>
            <div className="mt-2">
              <Progress value={report?.percentRecruited || 0} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {report?.percentRecruited.toFixed(1) || 0}% recruited
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Remaining Capacity */}
      <Card>
        <CardHeader>
          <CardTitle>Remaining Capacity</CardTitle>
          <CardDescription>Available workforce capacity for recruitment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold mb-2">{remainingCapacity.toLocaleString()}</div>
          <p className="text-sm text-muted-foreground">
            {config && (
              <>
                Min recruitable: {Number((config as any).minRecruitable ?? 2000000).toLocaleString()} | 
                Max recruitable: {Number((config as any).maxRecruitable ?? 5000000).toLocaleString()}
              </>
            )}
          </p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Sector Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Sector Distribution</CardTitle>
            <CardDescription>Target vs Recruited by Sector</CardDescription>
          </CardHeader>
          <CardContent>
            {report?.sectorBreakdown && report.sectorBreakdown.length > 0 ? (
              <div className="space-y-4">
                {report.sectorBreakdown.slice(0, 8).map((sector) => (
                  <div key={sector.sector} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{sector.sector}</span>
                      <span className="text-muted-foreground">
                        {sector.recruited.toLocaleString()} / {sector.target.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={sector.percent} className="h-2" />
                    <p className="text-xs text-muted-foreground">{sector.percent.toFixed(1)}% filled</p>
                  </div>
                ))}
                {report.sectorBreakdown.length > 8 && (
                  <Link href="/apps/workforce-recruiter/reports">
                    <Button variant="outline" className="w-full" size="sm">
                      View All Sectors
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No sector data available</p>
            )}
          </CardContent>
        </Card>

        {/* Skill Level Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Skill Level Breakdown</CardTitle>
            <CardDescription>Recruitment by Skill Level</CardDescription>
          </CardHeader>
          <CardContent>
            {report?.skillLevelBreakdown && report.skillLevelBreakdown.length > 0 ? (
              <div className="space-y-4">
                {report.skillLevelBreakdown.map((skill) => (
                  <div key={skill.skillLevel} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{skill.skillLevel}</span>
                      <span className="text-muted-foreground">
                        {skill.recruited.toLocaleString()} / {skill.target.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={skill.percent} className="h-2" />
                    <p className="text-xs text-muted-foreground">{skill.percent.toFixed(1)}% filled</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No skill level data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top 10 Occupations by Gap */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Occupations by Gap</CardTitle>
          <CardDescription>Occupations with the largest recruitment gaps</CardDescription>
        </CardHeader>
        <CardContent>
          {report?.annualTrainingGap && report.annualTrainingGap.length > 0 ? (
            <div className="space-y-3">
              {report.annualTrainingGap.map((item, index) => (
                <div key={item.occupationId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <span className="font-medium text-sm">{item.occupationTitle}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{item.sector}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-destructive">
                      Gap: {item.gap.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.actual.toLocaleString()} / {item.target.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No gap data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
