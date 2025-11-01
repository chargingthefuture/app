import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Users, DollarSign, TrendingUp, TrendingDown, Calendar } from "lucide-react";
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
}

export default function WeeklyPerformanceReview() {
  const [selectedWeek, setSelectedWeek] = useState<string>(() => {
    // Default to current week start (Monday)
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    return format(weekStart, "yyyy-MM-dd");
  });

  const { data, isLoading } = useQuery<WeeklyPerformanceData>({
    queryKey: ["/api/admin/weekly-performance", selectedWeek],
    queryFn: async () => {
      const weekStartDate = selectedWeek ? `?weekStart=${selectedWeek}` : "";
      return apiRequest(`/api/admin/weekly-performance${weekStartDate}`);
    },
  });

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

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-2">
            Weekly Performance Review
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Track key metrics week-over-week with calendar week comparison
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
      ) : !data ? (
        <div className="text-center py-12 text-muted-foreground">
          No data available for the selected week
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* New Users */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Users</CardTitle>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tabular-nums" data-testid="stat-new-users-current">
                  {data.currentWeek.newUsers}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant={
                      data.comparison.newUsersChange >= 0
                        ? "default"
                        : "secondary"
                    }
                    className="flex items-center gap-1"
                  >
                    {data.comparison.newUsersChange >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {formatPercentage(data.comparison.newUsersChange)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    vs {data.previousWeek.newUsers} last week
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Revenue */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <div className="w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-chart-3" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tabular-nums" data-testid="stat-revenue-current">
                  {formatCurrency(data.currentWeek.revenue)}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant={
                      data.comparison.revenueChange >= 0
                        ? "default"
                        : "secondary"
                    }
                    className="flex items-center gap-1"
                  >
                    {data.comparison.revenueChange >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {formatPercentage(data.comparison.revenueChange)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    vs {formatCurrency(data.previousWeek.revenue)} last week
                  </span>
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

