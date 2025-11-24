import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PrivacyField } from "@/components/ui/privacy-field";
import { AlertCircle, DollarSign } from "lucide-react";
import type { User } from "@shared/schema";

interface DelinquentUser {
  user: User;
  missedMonths: string[];
  amountOwed: string;
  lastPaymentDate: string | null;
}

export default function DelinquentPayments() {
  const { data: delinquentUsers, isLoading } = useQuery<DelinquentUser[]>({
    queryKey: ["/api/admin/payments/delinquent"],
  });

  const formatMonth = (monthKey: string) => {
    try {
      const [year, month] = monthKey.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } catch {
      return monthKey;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const totalAmountOwed = delinquentUsers?.reduce((sum, item) => {
    return sum + parseFloat(item.amountOwed);
  }, 0) || 0;

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-2">Delinquent Payments</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Users with missing payments who need follow-up
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Delinquent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold" data-testid="stat-delinquent-count">
              {isLoading ? "..." : delinquentUsers?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Users with missing payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Total Amount Owed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums" data-testid="stat-total-owed">
              {isLoading ? "..." : `$${totalAmountOwed.toFixed(2)}`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Outstanding payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Delinquent Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Delinquent Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading delinquent users...
            </div>
          ) : !delinquentUsers || delinquentUsers.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Delinquent Users</h3>
              <p className="text-muted-foreground">
                All users are up to date with their payments
              </p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Missed Months</TableHead>
                    <TableHead>Amount Owed</TableHead>
                    <TableHead>Last Payment</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {delinquentUsers.map((item) => (
                    <TableRow key={item.user.id} data-testid={`row-delinquent-${item.user.id}`}>
                      <TableCell>
                        <div className="font-medium">
                          {item.user.firstName && item.user.lastName
                            ? `${item.user.firstName} ${item.user.lastName}`
                            : "User"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <PrivacyField
                          value={item.user.email || ""}
                          type="email"
                          testId={`privacy-email-${item.user.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.missedMonths.map((month) => (
                            <Badge
                              key={month}
                              variant="outline"
                              className="text-xs"
                              data-testid={`badge-missed-month-${month}`}
                            >
                              {formatMonth(month)}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.missedMonths.length} month{item.missedMonths.length !== 1 ? "s" : ""} missed
                        </p>
                      </TableCell>
                      <TableCell className="font-mono font-semibold tabular-nums">
                        ${parseFloat(item.amountOwed).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(item.lastPaymentDate)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={item.user.subscriptionStatus === "overdue" ? "destructive" : "secondary"}
                          data-testid={`badge-status-${item.user.id}`}
                        >
                          {item.user.subscriptionStatus || "active"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Text */}
      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 dark:border-amber-900">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500" />
            <CardTitle className="text-base">About Delinquent Payments</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Users are considered delinquent if they have missed payments for one or more months.
            The system checks the last 3 months (including the current month) for missing payments.
          </p>
          <p>
            A 5-day grace period applies at the beginning of each month. Users are only marked as
            delinquent after the grace period has passed.
          </p>
          <p>
            <strong>Note:</strong> When contacting users about delinquent payments, use trauma-informed
            language and offer supportive options (payment plans, grace extensions, etc.).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


