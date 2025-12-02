import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { ArrowLeft, Download, TrendingUp } from "lucide-react";
import type { SummaryReport } from "./dashboard";

export default function ReportsPage() {
  const { data: report, isLoading } = useQuery<SummaryReport>({
    queryKey: ["/api/workforce-recruiter/reports/summary"],
  });

  const handleExport = async () => {
    try {
      const res = await fetch("/api/workforce-recruiter/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `workforce-recruiter-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error("Export error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">No report data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/apps/workforce-recruiter">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold">Reports</h1>
            <p className="text-muted-foreground">Comprehensive workforce recruitment analysis</p>
          </div>
        </div>
        <Button onClick={handleExport} variant="outline" data-testid="button-export">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Workforce Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.totalWorkforceTarget.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Current Recruited</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.totalCurrentRecruited.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Percent Recruited</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.percentRecruited.toFixed(1)}%</div>
            <Progress value={report.percentRecruited} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Remaining Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(report.totalWorkforceTarget - report.totalCurrentRecruited).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sector Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Sector Breakdown</CardTitle>
          <CardDescription>Recruitment status by economic sector</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {report.sectorBreakdown.map((sector) => (
              <div key={sector.sector} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{sector.sector}</span>
                    <Badge variant="outline">{sector.percent.toFixed(1)}%</Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {sector.recruited.toLocaleString()} / {sector.target.toLocaleString()}
                  </span>
                </div>
                <Progress value={sector.percent} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Skill Level Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Skill Level Breakdown</CardTitle>
          <CardDescription>Recruitment status by skill level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {report.skillLevelBreakdown.map((skill) => (
              <div key={skill.skillLevel} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={skill.skillLevel === "High" ? "default" : skill.skillLevel === "Medium" ? "secondary" : "outline"}>
                      {skill.skillLevel}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{skill.percent.toFixed(1)}%</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {skill.recruited.toLocaleString()} / {skill.target.toLocaleString()}
                  </span>
                </div>
                <Progress value={skill.percent} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Annual Training Gap */}
      <Card>
        <CardHeader>
          <CardTitle>Annual Training Gap Analysis</CardTitle>
          <CardDescription>Top occupations with training capacity gaps (last 12 months)</CardDescription>
        </CardHeader>
        <CardContent>
          {report.annualTrainingGap.length === 0 ? (
            <p className="text-sm text-muted-foreground">No training gaps identified</p>
          ) : (
            <div className="space-y-3">
              {report.annualTrainingGap.map((item) => (
                <div key={item.occupationId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{item.occupationTitle}</div>
                    <div className="text-sm text-muted-foreground">{item.sector}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-destructive">
                      Gap: {item.gap.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.actual.toLocaleString()} / {item.target.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}





