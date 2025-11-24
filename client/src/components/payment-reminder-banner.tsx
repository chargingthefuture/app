import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, Clock, ChevronDown, ChevronUp, X } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface PaymentStatus {
  isDelinquent: boolean;
  missedMonths: string[];
  amountOwed: string;
  nextBillingDate: string | null;
  gracePeriodEnds: string | null;
}

interface PaymentReminderBannerProps {
  className?: string;
}

export function PaymentReminderBanner({ className }: PaymentReminderBannerProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const { data: paymentStatus, isLoading } = useQuery<PaymentStatus>({
    queryKey: ["/api/payments/status"],
  });

  // Don't show if not delinquent, loading, or dismissed
  if (isLoading || !paymentStatus?.isDelinquent || isDismissed) {
    return null;
  }

  const formatMonth = (monthKey: string) => {
    try {
      const [year, month] = monthKey.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } catch {
      return monthKey;
    }
  };

  const latestMissedMonth = paymentStatus.missedMonths[0];
  const monthDisplay = latestMissedMonth ? formatMonth(latestMissedMonth) : "recent month";

  // Minimized view (small pill)
  if (isMinimized) {
    return (
      <div className={cn("sticky top-0 z-40", className)}>
        <Card className="border-amber-200 bg-amber-50/80 dark:bg-amber-950/20 dark:border-amber-900">
          <CardContent className="p-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                <span className="text-amber-900 dark:text-amber-100">
                  Payment not received for {monthDisplay}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(false)}
                  className="h-7 px-2 text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200"
                  data-testid="button-expand-payment-reminder"
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDismissed(true)}
                  className="h-7 px-2 text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200"
                  data-testid="button-dismiss-payment-reminder"
                  aria-label="Dismiss payment reminder"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Full view
  return (
    <div className={cn("sticky top-0 z-40", className)}>
      <Alert className="border-amber-200 bg-amber-50/90 dark:bg-amber-950/20 dark:border-amber-900">
        <Wallet className="h-4 w-4 text-amber-600 dark:text-amber-500" />
        <AlertDescription className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Payment not received for {monthDisplay}
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Need help updating payment or changing plan?
              </p>
              {paymentStatus.missedMonths.length > 1 && (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  {paymentStatus.missedMonths.length} months outstanding • ${paymentStatus.amountOwed} owed
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(true)}
              className="h-7 w-7 p-0 text-amber-700 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200"
              data-testid="button-minimize-payment-reminder"
              aria-label="Minimize payment reminder"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/payments">
              <Button
                variant="outline"
                size="sm"
                className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100 dark:hover:bg-amber-900/50"
                data-testid="button-update-payment"
              >
                Update payment
              </Button>
            </Link>
            <Link href="/payments">
              <Button
                variant="ghost"
                size="sm"
                className="text-amber-900 hover:bg-amber-100/50 dark:text-amber-200 dark:hover:bg-amber-900/30"
                data-testid="button-get-help"
              >
                Get help
              </Button>
            </Link>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}


