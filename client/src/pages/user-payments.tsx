import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, Calendar, CheckCircle, Mail, CreditCard, Copy, Check, AlertCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PrivacyField } from "@/components/ui/privacy-field";
import { PaymentReminderBanner } from "@/components/payment-reminder-banner";
import type { Payment } from "@shared/schema";

const PAYMENT_ACKNOWLEDGMENT_KEY = "payment-person-acknowledged";

// Check if acknowledgment is valid for current month
const isAcknowledgmentValid = (): boolean => {
  const stored = localStorage.getItem(PAYMENT_ACKNOWLEDGMENT_KEY);
  if (!stored) return false;

  try {
    const storedDate = new Date(stored);
    const now = new Date();
    
    // Check if stored date is from the current month and year
    return (
      storedDate.getMonth() === now.getMonth() &&
      storedDate.getFullYear() === now.getFullYear()
    );
  } catch {
    return false;
  }
};

export default function UserPayments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState<boolean>(false);

  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const { data: paymentStatus } = useQuery<{
    isDelinquent: boolean;
    missedMonths: string[];
    amountOwed: string;
    nextBillingDate: string | null;
    gracePeriodEnds: string | null;
  }>({
    queryKey: ["/api/payments/status"],
  });

  // Check localStorage on mount - validate if acknowledgment is for current month
  useEffect(() => {
    const isValid = isAcknowledgmentValid();
    setAcknowledged(isValid);
    
    // Clean up invalid (old month) acknowledgments
    if (!isValid) {
      localStorage.removeItem(PAYMENT_ACKNOWLEDGMENT_KEY);
    }
  }, []);

  const handleAcknowledgmentChange = (checked: boolean) => {
    setAcknowledged(checked);
    if (checked) {
      // Store current date when acknowledged
      const now = new Date();
      localStorage.setItem(PAYMENT_ACKNOWLEDGMENT_KEY, now.toISOString());
    } else {
      localStorage.removeItem(PAYMENT_ACKNOWLEDGMENT_KEY);
    }
  };

  const getStatusBadge = () => {
    const status = user?.subscriptionStatus || 'active';
    if (status === 'active') {
      return <Badge variant="default">Active</Badge>;
    } else if (status === 'overdue') {
      return <Badge variant="destructive">Payment Overdue</Badge>;
    }
    return <Badge variant="secondary">Inactive</Badge>;
  };

  const copyToClipboard = async (text: string, id: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const formatBillingMonth = (billingMonth: string | null) => {
    if (!billingMonth) return "-";
    try {
      const [year, month] = billingMonth.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } catch {
      return billingMonth;
    }
  };

  const formatYearlyPeriod = (startMonth: string | null, endMonth: string | null) => {
    if (!startMonth || !endMonth) return "-";
    try {
      const start = formatBillingMonth(startMonth);
      const end = formatBillingMonth(endMonth);
      return `${start} - ${end}`;
    } catch {
      return `${startMonth} - ${endMonth}`;
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Payment Reminder Banner */}
      <PaymentReminderBanner />

      <div>
        <h1 className="text-3xl md:text-4xl font-semibold mb-2">My Payments</h1>
        <p className="text-muted-foreground">
          View your payment history and subscription status
        </p>
      </div>

      {/* Subscription overview */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">
              Monthly Rate
            </CardTitle>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums" data-testid="text-monthly-rate">
              ${user?.pricingTier}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per month (your forever pricing)
            </p>
          </CardContent>
        </Card>

        <Card className={paymentStatus?.isDelinquent ? "border-amber-200 bg-amber-50/30 dark:bg-amber-950/10 dark:border-amber-900" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">
              Status
            </CardTitle>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              {paymentStatus?.isDelinquent ? (
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-500" />
              ) : (
                <CheckCircle className="w-5 h-5 text-primary" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
            </div>
            {paymentStatus?.isDelinquent ? (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  Payment not received for {paymentStatus.missedMonths.length > 0 
                    ? new Date(paymentStatus.missedMonths[0] + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })
                    : "recent month"}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Amount owed: ${paymentStatus.amountOwed}
                </p>
                {paymentStatus.nextBillingDate && (
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Next billing: {new Date(paymentStatus.nextBillingDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                )}
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-amber-300 bg-white text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100 dark:hover:bg-amber-900/50"
                    data-testid="button-update-payment-inline"
                  >
                    Update payment
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-amber-900 hover:bg-amber-100/50 dark:text-amber-200 dark:hover:bg-amber-900/30"
                    data-testid="button-get-help-inline"
                  >
                    Get help
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">
                Subscription status
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">
              Total Payments
            </CardTitle>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums" data-testid="text-total-payments">
              {payments?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Recorded payments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Acknowledgment */}
      {!acknowledged && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important Payment Instructions</AlertTitle>
              <AlertDescription>
                <p className="mt-2">
                  When sending payments through Venmo, PayPal, Zelle, or other payment apps, please ensure you are sending the payment <strong>to a person</strong>, not to a business account.
                </p>
                <p className="mt-2">
                  Some payment apps have different flows for personal vs. business payments. To ensure your payment is processed correctly, always select the option to pay "to a person" or "friends and family" when available.
                </p>
              </AlertDescription>
            </Alert>
            <div className="flex items-start space-x-3 pt-2">
              <Checkbox
                id="payment-acknowledgment"
                checked={acknowledged}
                onCheckedChange={(checked) => handleAcknowledgmentChange(checked === true)}
                data-testid="checkbox-payment-acknowledgment"
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="payment-acknowledgment"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  I understand that I should send payments to a person, not a business account
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Options */}
      {acknowledged && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="payment-options-list">
            <div className="flex items-start gap-3 p-4 rounded-lg border">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold mb-1">Amazon Gift Card</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <PrivacyField
                    value={import.meta.env.VITE_PAYMENT_EMAIL || ""}
                    type="email"
                    testId="privacy-amazon-email"
                    className="break-all"
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => copyToClipboard(import.meta.env.VITE_PAYMENT_EMAIL || "", "amazon-email", "Email address")}
                data-testid="button-copy-amazon"
                aria-label="Copy Amazon gift card email"
              >
                {copiedId === "amazon-email" ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold mb-1">Apple Gift Card</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <PrivacyField
                    value={import.meta.env.VITE_PAYMENT_EMAIL || ""}
                    type="email"
                    testId="privacy-apple-email"
                    className="break-all"
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => copyToClipboard(import.meta.env.VITE_PAYMENT_EMAIL || "", "apple-email", "Email address")}
                data-testid="button-copy-apple"
                aria-label="Copy Apple gift card email"
              >
                {copiedId === "apple-email" ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold mb-1">Venmo</p>
                <div className="text-sm text-muted-foreground">
                  <PrivacyField
                    value={import.meta.env.VITE_VENMO_USERNAME || ""}
                    type="text"
                    testId="privacy-venmo"
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => copyToClipboard(import.meta.env.VITE_VENMO_USERNAME || "", "venmo", "Venmo username")}
                data-testid="button-copy-venmo"
                aria-label="Copy Venmo username"
              >
                {copiedId === "venmo" ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold mb-1">PayPal</p>
                <div className="text-sm text-muted-foreground">
                  <PrivacyField
                    value={import.meta.env.VITE_PAYPAL_USERNAME || ""}
                    type="text"
                    testId="privacy-paypal"
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => copyToClipboard(import.meta.env.VITE_PAYPAL_USERNAME || "", "paypal", "PayPal username")}
                data-testid="button-copy-paypal"
                aria-label="Copy PayPal username"
              >
                {copiedId === "paypal" ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold mb-1">Walmart OnePay</p>
                <div className="text-sm text-muted-foreground">
                  <PrivacyField
                    value={import.meta.env.VITE_WALMART_USERNAME || ""}
                    type="text"
                    testId="privacy-walmart"
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => copyToClipboard(import.meta.env.VITE_WALMART_USERNAME || "", "walmart", "Walmart OnePay username")}
                data-testid="button-copy-walmart"
                aria-label="Copy Walmart OnePay username"
              >
                {copiedId === "walmart" ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold mb-1">Chime</p>
                <div className="text-sm text-muted-foreground">
                  <PrivacyField
                    value={import.meta.env.VITE_CHIME_USERNAME || ""}
                    type="text"
                    testId="privacy-chime"
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => copyToClipboard(import.meta.env.VITE_CHIME_USERNAME || "", "chime", "Chime username")}
                data-testid="button-copy-chime"
                aria-label="Copy Chime username"
              >
                {copiedId === "chime" ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold mb-1">Wise</p>
                <div className="text-sm text-muted-foreground">
                  <PrivacyField
                    value={import.meta.env.VITE_WISE_USERNAME || ""}
                    type="text"
                    testId="privacy-wise"
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => copyToClipboard(import.meta.env.VITE_WISE_USERNAME || "", "wise", "Wise username")}
                data-testid="button-copy-wise"
                aria-label="Copy Wise username"
              >
                {copiedId === "wise" ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg border">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold mb-1">Zelle</p>
                <div className="text-sm text-muted-foreground">
                  <PrivacyField
                    value={import.meta.env.VITE_ZELLE_EMAIL || ""}
                    type="email"
                    testId="privacy-zelle"
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => copyToClipboard(import.meta.env.VITE_ZELLE_EMAIL || "", "zelle", "Zelle email")}
                data-testid="button-copy-zelle"
                aria-label="Copy Zelle email"
              >
                {copiedId === "zelle" ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Payment history */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading payment history...
            </div>
          ) : !payments || payments.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No payments yet</h3>
              <p className="text-muted-foreground">
                Your payment history will appear here once payments are recorded
              </p>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Amount</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Billing Month</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                      <TableCell className="font-mono font-semibold">
                        ${parseFloat(payment.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">{payment.billingPeriod || 'monthly'}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {payment.billingPeriod === "monthly" 
                          ? formatBillingMonth(payment.billingMonth)
                          : payment.billingPeriod === "yearly"
                          ? formatYearlyPeriod(payment.yearlyStartMonth, payment.yearlyEndMonth)
                          : "-"}
                      </TableCell>
                      <TableCell className="capitalize">
                        {payment.paymentMethod}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {payment.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
