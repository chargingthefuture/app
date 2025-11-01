import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";
import { Camera, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Users, DollarSign, TrendingUp, TrendingDown, Calendar, Target, Activity, Zap } from "lucide-react";
import { format, startOfWeek, addDays, parseISO } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

interface WeeklyPerformanceData {
  currentWeek: {
    startDate: string;
    endDate: string;
    newUsers: number;
    dailyActiveUsers: Array<{ date: string; count: number }>;
    revenue: number;
    dailyRevenue: Array<{ date: string; amount: number }>;
  };
  previousWeek: {
    startDate: string;
    endDate: string;
    newUsers: number;
    dailyActiveUsers: Array<{ date: string; count: number }>;
    revenue: number;
    dailyRevenue: Array<{ date: string; amount: number }>;
  };
  comparison: {
    newUsersChange: number;
    revenueChange: number;
  };
  metrics: {
    weeklyGrowthRate: number;
    mrr: number;
    arr: number;
    mrrGrowth: number;
    mau: number;
    churnRate: number;
    clv: number;
    retentionRate: number;
  };
}

export default function WeeklyPerformanceReview() {
  const { toast } = useToast();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  
  const [selectedWeek, setSelectedWeek] = useState<string>(() => {
    // Default to current week start (Monday)
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    return format(weekStart, "yyyy-MM-dd");
  });

  // Check if selected week is the current week (for real-time updates)
  const isCurrentWeek = useMemo(() => {
    const today = new Date();
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    const selectedWeekDate = parseISO(selectedWeek);
    return format(selectedWeekDate, "yyyy-MM-dd") === format(currentWeekStart, "yyyy-MM-dd");
  }, [selectedWeek]);

  const { data, isLoading, error } = useQuery<WeeklyPerformanceData>({
    queryKey: [`/api/admin/weekly-performance${selectedWeek ? `?weekStart=${selectedWeek}` : ""}`],
    // Real-time updates only for current week
    refetchInterval: isCurrentWeek ? 30000 : false, // Poll every 30 seconds for current week
    refetchOnWindowFocus: isCurrentWeek, // Refetch on window focus for current week only
  });

  // Debug: Log what we're receiving
  if (data && !data.metrics) {
    console.warn("Data received but no metrics property:", data);
    console.warn("Data keys:", Object.keys(data));
  }

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  const formatDateLabel = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "EEE M/d"); // Mon 1/15
    } catch {
      return dateString;
    }
  };

  // Prepare data for DAU chart (combine current and previous week)
  const dauChartData = data?.currentWeek.dailyActiveUsers.map((current, index) => {
    const previous = data.previousWeek.dailyActiveUsers[index];
    return {
      date: formatDateLabel(current.date),
      "This Week": current.count,
      "Last Week": previous?.count || 0,
    };
  }) || [];

  // Prepare data for revenue chart
  const revenueChartData = data?.currentWeek.dailyRevenue.map((current, index) => {
    const previous = data.previousWeek.dailyRevenue[index];
    return {
      date: formatDateLabel(current.date),
      "This Week": current.amount,
      "Last Week": previous?.amount || 0,
    };
  }) || [];

  const handleWeekChange = (dateString: string) => {
    setSelectedWeek(dateString);
  };

  const goToCurrentWeek = () => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    setSelectedWeek(format(weekStart, "yyyy-MM-dd"));
  };

  const goToPreviousWeek = () => {
    if (data?.currentWeek.startDate) {
      const currentStart = parseISO(data.currentWeek.startDate);
      const previousStart = addDays(currentStart, -7);
      setSelectedWeek(format(previousStart, "yyyy-MM-dd"));
    }
  };

  const goToNextWeek = () => {
    if (data?.currentWeek.startDate) {
      const currentStart = parseISO(data.currentWeek.startDate);
      const nextStart = addDays(currentStart, 7);
      // Don't allow future weeks
      if (nextStart <= new Date()) {
        setSelectedWeek(format(nextStart, "yyyy-MM-dd"));
      }
    }
  };

  const captureScreenshot = async () => {
    if (!dashboardRef.current) {
      toast({
        title: "Error",
        description: "Dashboard element not found",
        variant: "destructive",
      });
      return;
    }

    setIsCapturing(true);
    
    try {
      // Hide the week selector buttons temporarily for a cleaner screenshot
      const buttonsToHide = dashboardRef.current.querySelectorAll('button');
      const originalStyles: Array<{ element: HTMLElement; display: string }> = [];
      
      buttonsToHide.forEach(button => {
        const htmlButton = button as HTMLElement;
        originalStyles.push({ element: htmlButton, display: htmlButton.style.display });
        htmlButton.style.display = 'none';
      });

      // Capture the screenshot
      const canvas = await html2canvas(dashboardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
        windowWidth: dashboardRef.current.scrollWidth,
        windowHeight: dashboardRef.current.scrollHeight,
      });

      // Restore button visibility
      originalStyles.forEach(({ element, display }) => {
        element.style.display = display;
      });

      // Create download link
      const link = document.createElement('a');
      const weekLabel = data 
        ? `${format(parseISO(data.currentWeek.startDate), "MMM-d")}-to-${format(parseISO(data.currentWeek.endDate), "MMM-d-yyyy")}`
        : 'weekly-performance';
      link.download = `weekly-performance-${weekLabel}.png`;
      link.href = canvas.toDataURL('image/png');
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Screenshot captured",
        description: "Image saved successfully!",
      });
    } catch (error) {
      console.error("Error capturing screenshot:", error);
      toast({
        title: "Error",
        description: "Failed to capture screenshot. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div ref={dashboardRef} className="p-4 sm:p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold">
              Weekly Performance Review
            </h1>
            {isCurrentWeek && (
              <Badge variant="default" className="animate-pulse">
                Live
              </Badge>
            )}
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            Track key metrics week-over-week with calendar week comparison
            {isCurrentWeek && " (updating in real-time)"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousWeek}
            data-testid="button-previous-week"
          >
            ← Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToCurrentWeek}
            data-testid="button-current-week"
          >
            Current Week
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextWeek}
            data-testid="button-next-week"
            disabled={
              data?.currentWeek.startDate
                ? addDays(parseISO(data.currentWeek.startDate), 7) > new Date()
                : true
            }
          >
            Next →
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={captureScreenshot}
            disabled={isCapturing || !data}
            data-testid="button-capture-screenshot"
            className="gap-2"
          >
            {isCapturing ? (
              <>
                <Camera className="w-4 h-4 animate-pulse" />
                Capturing...
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                Capture Screenshot
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Week Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Select Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="space-y-2 flex-1">
              <Label htmlFor="week-start">Week Starting (Monday)</Label>
              <Input
                id="week-start"
                type="date"
                value={selectedWeek}
                onChange={(e) => handleWeekChange(e.target.value)}
                data-testid="input-week-selector"
                className="w-full sm:w-auto"
              />
            </div>
            {data && (
              <div className="text-sm text-muted-foreground">
                <div>
                  <strong>Current Week:</strong> {format(parseISO(data.currentWeek.startDate), "MMM d")} - {format(parseISO(data.currentWeek.endDate), "MMM d, yyyy")}
                </div>
                <div>
                  <strong>Previous Week:</strong> {format(parseISO(data.previousWeek.startDate), "MMM d")} - {format(parseISO(data.previousWeek.endDate), "MMM d, yyyy")}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading weekly performance data...
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive mb-4">
              Error loading data
            </p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Unknown error occurred"}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Check the browser console and server logs for details.
            </p>
          </CardContent>
        </Card>
      ) : !data ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No data available for the selected week
            </p>
            <p className="text-sm text-muted-foreground">
              Try selecting a different week or check back later when users and payments are recorded.
            </p>
          </CardContent>
        </Card>
      ) : !data?.metrics ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              Metrics not available
            </p>
            <p className="text-sm text-muted-foreground">
              The response did not include metrics data. Check server logs.
            </p>
            <p className="text-xs text-muted-foreground mt-2 font-mono">
              Response keys: {data ? Object.keys(data).join(", ") : "none"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Growth Metrics */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Growth Metrics</h2>
              <p className="text-sm text-muted-foreground">
                Key metrics to track growth and reporting
              </p>
            </div>

            {/* Growth Rate */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Growth Rate
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Weekly growth rate of <strong>5-7%</strong> is good, <strong>10%</strong> is exceptional
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-4">
                  <div className="text-4xl font-bold tabular-nums">
                    {formatPercentage(data.metrics?.weeklyGrowthRate ?? 0)}
                  </div>
                  <Badge
                    variant={
                      (data.metrics?.weeklyGrowthRate ?? 0) >= 10
                        ? "default"
                        : (data.metrics?.weeklyGrowthRate ?? 0) >= 5
                        ? "default"
                        : "secondary"
                    }
                    className="flex items-center gap-1"
                  >
                    {(data.metrics?.weeklyGrowthRate ?? 0) >= 10 ? (
                      <>
                        <Zap className="w-3 h-3" />
                        Exceptional
                      </>
                    ) : (data.metrics?.weeklyGrowthRate ?? 0) >= 5 ? (
                      <>
                        <TrendingUp className="w-3 h-3" />
                        Good
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-3 h-3" />
                        Needs Improvement
                      </>
                    )}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  New users this week vs. last week
                </p>
              </CardContent>
            </Card>

            {/* Revenue Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Revenue Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Monthly Recurring Revenue (MRR)</div>
                    <div className="text-2xl font-bold tabular-nums">{formatCurrency(data.metrics?.mrr ?? 0)}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant={(data.metrics?.mrrGrowth ?? 0) >= 0 ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {formatPercentage(data.metrics?.mrrGrowth ?? 0)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">vs last month</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Annual Recurring Revenue (ARR)</div>
                    <div className="text-2xl font-bold tabular-nums">{formatCurrency(data.metrics?.arr ?? 0)}</div>
                    <p className="text-xs text-muted-foreground mt-2">MRR × 12 + yearly payments</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">MRR Growth</div>
                    <div className="text-2xl font-bold tabular-nums">{formatPercentage(data.metrics?.mrrGrowth ?? 0)}</div>
                    <p className="text-xs text-muted-foreground mt-2">Month-over-month change</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Customer Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">New Customers (This Week)</div>
                    <div className="text-2xl font-bold tabular-nums">{data.currentWeek.newUsers}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant={data.comparison.newUsersChange >= 0 ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {formatPercentage(data.comparison.newUsersChange)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">vs last week</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Churn Rate</div>
                    <div className="text-2xl font-bold tabular-nums">{formatPercentage(data.metrics?.churnRate ?? 0)}</div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Users who paid last month but not this month
                    </p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Customer Lifetime Value (CLV)</div>
                    <div className="text-2xl font-bold tabular-nums">{formatCurrency(data.metrics?.clv ?? 0)}</div>
                    <p className="text-xs text-muted-foreground mt-2">Average revenue per customer</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 4. Engagement and Retention */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  4. Engagement and Retention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Monthly Active Users (MAU)</div>
                    <div className="text-2xl font-bold tabular-nums">{data.metrics?.mau ?? 0}</div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Users with payments in current month
                    </p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Retention Rate</div>
                    <div className="text-2xl font-bold tabular-nums">{formatPercentage(data.metrics?.retentionRate ?? 0)}</div>
                    <p className="text-xs text-muted-foreground mt-2">
                      % of last month&apos;s users still active
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>


          {/* Daily Active Users Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Active Users (DAU)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dauChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="This Week"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Last Week"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Daily Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar
                    dataKey="This Week"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="Last Week"
                    fill="hsl(var(--muted-foreground))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Detailed Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>Week-over-Week Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Metric</th>
                      <th className="text-right py-2 px-4">This Week</th>
                      <th className="text-right py-2 px-4">Last Week</th>
                      <th className="text-right py-2 px-4">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 px-4 font-medium">New Users</td>
                      <td className="text-right py-2 px-4" data-testid="table-new-users-current">
                        {data.currentWeek.newUsers}
                      </td>
                      <td className="text-right py-2 px-4" data-testid="table-new-users-previous">
                        {data.previousWeek.newUsers}
                      </td>
                      <td className="text-right py-2 px-4">
                        <Badge
                          variant={
                            data.comparison.newUsersChange >= 0
                              ? "default"
                              : "secondary"
                          }
                        >
                          {formatPercentage(data.comparison.newUsersChange)}
                        </Badge>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-4 font-medium">Total Revenue</td>
                      <td className="text-right py-2 px-4" data-testid="table-revenue-current">
                        {formatCurrency(data.currentWeek.revenue)}
                      </td>
                      <td className="text-right py-2 px-4" data-testid="table-revenue-previous">
                        {formatCurrency(data.previousWeek.revenue)}
                      </td>
                      <td className="text-right py-2 px-4">
                        <Badge
                          variant={
                            data.comparison.revenueChange >= 0
                              ? "default"
                              : "secondary"
                          }
                        >
                          {formatPercentage(data.comparison.revenueChange)}
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}


