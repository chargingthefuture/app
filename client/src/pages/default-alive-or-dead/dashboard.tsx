import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import type { DefaultAliveOrDeadEbitdaSnapshot } from "@shared/schema";
import { format } from "date-fns";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

export default function DefaultAliveOrDeadDashboard() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [currentFunding, setCurrentFunding] = useState<string>("");
  const [weekStartDate, setWeekStartDate] = useState<string>(() => {
    // Default to current week's Saturday
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToSaturday = dayOfWeek === 6 ? 0 : (6 - dayOfWeek) % 7;
    const saturday = new Date(today);
    saturday.setDate(saturday.getDate() - daysToSaturday);
    saturday.setHours(0, 0, 0, 0);
    return format(saturday, "yyyy-MM-dd");
  });

  const { data: currentStatus, isLoading: statusLoading } = useQuery<{
    currentSnapshot: DefaultAliveOrDeadEbitdaSnapshot | null;
    isDefaultAlive: boolean;
    projectedProfitabilityDate: Date | null;
    projectedCapitalNeeded: number | null;
    weeksUntilProfitability: number | null;
  }>({
    queryKey: ["/api/default-alive-or-dead/current-status"],
    enabled: isAdmin === true,
  });

  const { data: weeklyTrends, isLoading: trendsLoading } = useQuery<DefaultAliveOrDeadEbitdaSnapshot[]>({
    queryKey: ["/api/default-alive-or-dead/weekly-trends?weeks=12"],
    enabled: isAdmin === true,
  });

  const calculateMutation = useMutation({
    mutationFn: async ({ weekStartDate, currentFunding }: { weekStartDate: string; currentFunding?: number }) => {
      return apiRequest("POST", "/api/default-alive-or-dead/calculate-ebitda", {
        weekStartDate,
        currentFunding,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/default-alive-or-dead/current-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/default-alive-or-dead/weekly-trends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/default-alive-or-dead/ebitda-snapshots"] });
      toast({
        title: "EBITDA Calculated",
        description: "EBITDA snapshot has been calculated and stored successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to calculate EBITDA",
        variant: "destructive",
      });
    },
  });

  if (!isAdmin) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This page is only accessible to administrators.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCalculate = () => {
    const funding = currentFunding ? parseFloat(currentFunding) : undefined;
    if (funding !== undefined && (isNaN(funding) || funding < 0)) {
      toast({
        title: "Invalid Funding",
        description: "Current funding must be a positive number",
        variant: "destructive",
      });
      return;
    }
    calculateMutation.mutate({ weekStartDate, currentFunding: funding });
  };

  const snapshot = currentStatus?.currentSnapshot;
  const isDefaultAlive = currentStatus?.isDefaultAlive ?? false;
  const ebitda = snapshot ? parseFloat(snapshot.ebitda) : 0;
  const revenue = snapshot ? parseFloat(snapshot.revenue) : 0;
  const operatingExpenses = snapshot ? parseFloat(snapshot.operatingExpenses) : 0;
  const depreciation = snapshot ? parseFloat(snapshot.depreciation) : 0;
  const amortization = snapshot ? parseFloat(snapshot.amortization) : 0;

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-2">
          Default Alive or Dead Dashboard
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Track your startup's financial health and EBITDA
        </p>
      </div>

      <AnnouncementBanner 
        apiEndpoint="/api/default-alive-or-dead/announcements"
        queryKey="/api/default-alive-or-dead/announcements"
      />

      {/* Default Alive/Dead Status */}
      <Card className={isDefaultAlive ? "border-green-500" : "border-red-500"}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg sm:text-xl">Status</CardTitle>
            <Badge 
              variant={isDefaultAlive ? "default" : "destructive"} 
              className="text-sm sm:text-base px-3 py-1"
              data-testid="badge-status"
            >
              {isDefaultAlive ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Default Alive
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Default Dead
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {statusLoading ? (
            <p className="text-muted-foreground">Loading status...</p>
          ) : snapshot ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Projected Profitability Date</p>
                  <p className="text-lg font-semibold">
                    {currentStatus?.projectedProfitabilityDate
                      ? format(new Date(currentStatus.projectedProfitabilityDate), "MMM d, yyyy")
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Projected Capital Needed</p>
                  <p className="text-lg font-semibold">
                    {currentStatus?.projectedCapitalNeeded !== null
                      ? `$${currentStatus.projectedCapitalNeeded.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "N/A"}
                  </p>
                </div>
                {currentStatus?.weeksUntilProfitability !== null && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Weeks Until Profitability</p>
                    <p className="text-lg font-semibold">{currentStatus.weeksUntilProfitability} weeks</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">No EBITDA data available. Calculate EBITDA to see status.</p>
          )}
        </CardContent>
      </Card>

      {/* Current EBITDA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Current EBITDA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {snapshot ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Week of</p>
                  <p className="text-lg font-semibold">
                    {format(new Date(snapshot.weekStartDate), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">EBITDA</p>
                  <p className={`text-2xl font-bold ${ebitda >= 0 ? "text-green-600" : "text-red-600"}`}>
                    ${ebitda.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Breakdown */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Revenue</span>
                  <span className="font-medium">${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Operating Expenses</span>
                  <span className="font-medium text-red-600">-${operatingExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Depreciation</span>
                  <span className="font-medium text-green-600">+${depreciation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amortization</span>
                  <span className="font-medium text-green-600">+${amortization.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">No EBITDA data available. Calculate EBITDA to see current values.</p>
          )}
        </CardContent>
      </Card>

      {/* Calculate EBITDA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Calculate EBITDA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="week-start-date">Week Start Date (Saturday)</Label>
              <Input
                id="week-start-date"
                type="date"
                value={weekStartDate}
                onChange={(e) => setWeekStartDate(e.target.value)}
                data-testid="input-week-start-date"
              />
            </div>
            <div>
              <Label htmlFor="current-funding">Current Funding (Optional)</Label>
              <Input
                id="current-funding"
                type="number"
                step="0.01"
                min="0"
                value={currentFunding}
                onChange={(e) => setCurrentFunding(e.target.value)}
                placeholder="Enter current funding"
                data-testid="input-current-funding"
              />
            </div>
          </div>
          <Button
            onClick={handleCalculate}
            disabled={calculateMutation.isPending}
            className="w-full"
            data-testid="button-calculate-ebitda"
          >
            {calculateMutation.isPending ? "Calculating..." : "Calculate EBITDA"}
          </Button>
        </CardContent>
      </Card>

      {/* Weekly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Weekly Trends</CardTitle>
        </CardHeader>
        <CardContent>
          {trendsLoading ? (
            <p className="text-muted-foreground">Loading trends...</p>
          ) : weeklyTrends && weeklyTrends.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Week</th>
                      <th className="text-right p-2">Revenue</th>
                      <th className="text-right p-2">Expenses</th>
                      <th className="text-right p-2">EBITDA</th>
                      <th className="text-center p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyTrends.map((snapshot) => {
                      const ebitdaValue = parseFloat(snapshot.ebitda);
                      return (
                        <tr key={snapshot.id} className="border-b">
                          <td className="p-2">
                            {format(new Date(snapshot.weekStartDate), "MMM d, yyyy")}
                          </td>
                          <td className="text-right p-2">
                            ${parseFloat(snapshot.revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="text-right p-2">
                            ${parseFloat(snapshot.operatingExpenses).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className={`text-right p-2 font-medium ${ebitdaValue >= 0 ? "text-green-600" : "text-red-600"}`}>
                            ${ebitdaValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="text-center p-2">
                            <Badge variant={snapshot.isDefaultAlive ? "default" : "destructive"} className="text-xs">
                              {snapshot.isDefaultAlive ? "Alive" : "Dead"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No trend data available. Calculate EBITDA for multiple weeks to see trends.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

