import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import type { DefaultAliveOrDeadEbitdaSnapshot, DefaultAliveOrDeadFinancialEntry } from "@shared/schema";
import { format } from "date-fns";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

const financialEntryFormSchema = z.object({
  weekStartDate: z.string().min(1, "Week start date is required"),
  operatingExpenses: z.coerce.number().min(0, "Operating expenses must be non-negative"),
  depreciation: z.coerce.number().min(0, "Depreciation must be non-negative").optional().default(0),
  amortization: z.coerce.number().min(0, "Amortization must be non-negative").optional().default(0),
  notes: z.string().optional().nullable(),
});

type FinancialEntryFormValues = z.infer<typeof financialEntryFormSchema>;

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

  const financialEntryForm = useForm<FinancialEntryFormValues>({
    resolver: zodResolver(financialEntryFormSchema),
    defaultValues: {
      weekStartDate: weekStartDate,
      operatingExpenses: 0,
      depreciation: 0,
      amortization: 0,
      notes: "",
    },
  });

  // Sync form weekStartDate with state
  useEffect(() => {
    financialEntryForm.setValue("weekStartDate", weekStartDate);
  }, [weekStartDate]);

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

  const [selectedWeek, setSelectedWeek] = useState<string>(() => {
    // Default to current week's Saturday
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToSaturday = dayOfWeek === 6 ? 0 : (6 - dayOfWeek) % 7;
    const saturday = new Date(today);
    saturday.setDate(saturday.getDate() - daysToSaturday);
    saturday.setHours(0, 0, 0, 0);
    return format(saturday, "yyyy-MM-dd");
  });

  const { data: weekComparison, isLoading: comparisonLoading } = useQuery<{
    currentWeek: {
      snapshot: DefaultAliveOrDeadEbitdaSnapshot | null;
      weekStart: string;
      weekEnd: string;
    };
    previousWeek: {
      snapshot: DefaultAliveOrDeadEbitdaSnapshot | null;
      weekStart: string;
      weekEnd: string;
    };
    comparison: {
      revenueChange: number;
      ebitdaChange: number;
      operatingExpensesChange: number;
      growthRate: number;
    };
  }>({
    queryKey: [`/api/default-alive-or-dead/week-comparison?weekStart=${selectedWeek}`],
    enabled: isAdmin === true,
  });

  const { data: weeklyTrends, isLoading: trendsLoading } = useQuery<DefaultAliveOrDeadEbitdaSnapshot[]>({
    queryKey: ["/api/default-alive-or-dead/weekly-trends?weeks=12"],
    enabled: isAdmin === true,
  });

  const createFinancialEntryMutation = useMutation({
    mutationFn: async (data: FinancialEntryFormValues) => {
      return apiRequest("POST", "/api/default-alive-or-dead/financial-entries", {
        weekStartDate: data.weekStartDate,
        operatingExpenses: data.operatingExpenses,
        depreciation: data.depreciation || 0,
        amortization: data.amortization || 0,
        notes: data.notes || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/default-alive-or-dead/financial-entries"] });
      financialEntryForm.reset();
      toast({
        title: "Financial Entry Created",
        description: "Financial entry has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create financial entry",
        variant: "destructive",
      });
    },
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
      queryClient.invalidateQueries({ queryKey: ["/api/default-alive-or-dead/week-comparison"] });
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

      {/* Week Over Week Comparison */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg sm:text-xl">Week Over Week Comparison</CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="week-selector" className="text-sm">Week:</Label>
              <Input
                id="week-selector"
                type="date"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="w-auto"
                data-testid="input-week-selector"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {comparisonLoading ? (
            <p className="text-muted-foreground">Loading comparison...</p>
          ) : weekComparison ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Week */}
                <div>
                  <h3 className="font-semibold mb-2">
                    Current Week ({format(new Date(weekComparison.currentWeek.weekStart), "MMM d")} - {format(new Date(weekComparison.currentWeek.weekEnd), "MMM d, yyyy")})
                  </h3>
                  {weekComparison.currentWeek.snapshot ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Revenue</span>
                        <span className="font-medium">
                          ${parseFloat(weekComparison.currentWeek.snapshot.revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Operating Expenses</span>
                        <span className="font-medium text-red-600">
                          ${parseFloat(weekComparison.currentWeek.snapshot.operatingExpenses).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">EBITDA</span>
                        <span className={`font-bold ${parseFloat(weekComparison.currentWeek.snapshot.ebitda) >= 0 ? "text-green-600" : "text-red-600"}`}>
                          ${parseFloat(weekComparison.currentWeek.snapshot.ebitda).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No data for this week</p>
                  )}
                </div>

                {/* Previous Week */}
                <div>
                  <h3 className="font-semibold mb-2">
                    Previous Week ({format(new Date(weekComparison.previousWeek.weekStart), "MMM d")} - {format(new Date(weekComparison.previousWeek.weekEnd), "MMM d, yyyy")})
                  </h3>
                  {weekComparison.previousWeek.snapshot ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Revenue</span>
                        <span className="font-medium">
                          ${parseFloat(weekComparison.previousWeek.snapshot.revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Operating Expenses</span>
                        <span className="font-medium text-red-600">
                          ${parseFloat(weekComparison.previousWeek.snapshot.operatingExpenses).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">EBITDA</span>
                        <span className={`font-bold ${parseFloat(weekComparison.previousWeek.snapshot.ebitda) >= 0 ? "text-green-600" : "text-red-600"}`}>
                          ${parseFloat(weekComparison.previousWeek.snapshot.ebitda).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No data for previous week</p>
                  )}
                </div>
              </div>

              {/* Comparison Metrics */}
              {weekComparison.currentWeek.snapshot && weekComparison.previousWeek.snapshot && (
                <div className="border-t pt-4 space-y-2">
                  <h4 className="font-semibold text-sm">Week Over Week Changes</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Revenue Change</p>
                      <p className={`text-sm font-semibold ${weekComparison.comparison.revenueChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {weekComparison.comparison.revenueChange >= 0 ? "+" : ""}{weekComparison.comparison.revenueChange.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">EBITDA Change</p>
                      <p className={`text-sm font-semibold ${weekComparison.comparison.ebitdaChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {weekComparison.comparison.ebitdaChange >= 0 ? "+" : ""}{weekComparison.comparison.ebitdaChange.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Expenses Change</p>
                      <p className={`text-sm font-semibold ${weekComparison.comparison.operatingExpensesChange >= 0 ? "text-red-600" : "text-green-600"}`}>
                        {weekComparison.comparison.operatingExpensesChange >= 0 ? "+" : ""}{weekComparison.comparison.operatingExpensesChange.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Growth Rate</p>
                      <p className={`text-sm font-semibold ${weekComparison.comparison.growthRate >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {weekComparison.comparison.growthRate >= 0 ? "+" : ""}{(weekComparison.comparison.growthRate * 100).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">No comparison data available. Calculate EBITDA for multiple weeks to see comparisons.</p>
          )}
        </CardContent>
      </Card>

      {/* Current EBITDA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Latest EBITDA Snapshot</CardTitle>
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

      {/* Financial Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Enter Financial Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...financialEntryForm}>
            <form
              onSubmit={financialEntryForm.handleSubmit((data) => createFinancialEntryMutation.mutate(data))}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={financialEntryForm.control}
                  name="weekStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Week Start Date (Saturday)</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          data-testid="input-financial-entry-week-start"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={financialEntryForm.control}
                  name="operatingExpenses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Operating Expenses *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...field}
                          placeholder="0.00"
                          data-testid="input-operating-expenses"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={financialEntryForm.control}
                  name="depreciation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Depreciation</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...field}
                          value={field.value || 0}
                          placeholder="0.00"
                          data-testid="input-depreciation"
                        />
                      </FormControl>
                      <FormDescription>Optional: Enter depreciation amount</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={financialEntryForm.control}
                  name="amortization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amortization</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...field}
                          value={field.value || 0}
                          placeholder="0.00"
                          data-testid="input-amortization"
                        />
                      </FormControl>
                      <FormDescription>Optional: Enter amortization amount</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={financialEntryForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        placeholder="Add any notes about this financial entry..."
                        rows={3}
                        data-testid="textarea-financial-entry-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={createFinancialEntryMutation.isPending}
                className="w-full"
                data-testid="button-submit-financial-entry"
              >
                {createFinancialEntryMutation.isPending ? "Creating..." : "Create Financial Entry"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Calculate EBITDA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Calculate EBITDA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            After entering financial data above, calculate EBITDA for a specific week. Revenue is automatically calculated from payments.
          </p>
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

