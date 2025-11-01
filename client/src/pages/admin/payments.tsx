import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PrivacyField } from "@/components/ui/privacy-field";
import type { User, Payment } from "@shared/schema";
import { DollarSign } from "lucide-react";

export default function AdminPayments() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [notes, setNotes] = useState("");

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ["/api/admin/payments"],
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async () => {
      // Validate required fields
      if (!selectedUserId) {
        throw new Error("Please select a user");
      }
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        throw new Error("Please enter a valid amount");
      }
      
      const payload = {
        userId: selectedUserId,
        amount: amount, // Send as string, not parseFloat(amount)
        paymentDate: new Date().toISOString(), // Send as ISO string
        paymentMethod,
        billingPeriod,
        notes: notes || null,
      };
      
      console.log("Payment payload:", payload);
      console.log("Payload types:", {
        userId: typeof payload.userId,
        amount: typeof payload.amount,
        paymentDate: typeof payload.paymentDate,
        paymentMethod: typeof payload.paymentMethod,
        notes: typeof payload.notes,
      });
      
      return await apiRequest("POST", "/api/admin/payments", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsDialogOpen(false);
      setSelectedUserId("");
      setAmount("");
      setBillingPeriod("monthly");
      setNotes("");
      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
    },
    onError: (error: Error) => {
      console.error("Payment submission error:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getUserName = (userId: string) => {
    const user = users?.find(u => u.id === userId);
    if (!user) return "Unknown User";
    return user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user.email || "User";
  };

  const getUserDisplayName = (userId: string) => {
    const user = users?.find(u => u.id === userId);
    if (!user) return "Unknown User";
    return user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`
      : "User";
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-2">Payment Tracking</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Record and manage manual payments from various sources
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} data-testid="button-record-payment" className="w-full sm:w-auto">
          <DollarSign className="w-4 h-4 mr-2" />
          Record Payment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading payments...
            </div>
          ) : !payments || payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payments recorded yet
            </div>
          ) : (
            <>
              <div className="hidden md:block rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Payment Date</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                        <TableCell className="font-medium">
                          <div className="space-y-1">
                            <div>{getUserDisplayName(payment.userId)}</div>
                            <PrivacyField 
                              value={users?.find(u => u.id === payment.userId)?.email || ""} 
                              type="email"
                              testId={`payment-email-${payment.id}`}
                              className="text-xs"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">
                          ${parseFloat(payment.amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">{payment.billingPeriod || 'monthly'}</span>
                        </TableCell>
                        <TableCell className="capitalize">
                          {payment.paymentMethod.replace(/-/g, ' ')}
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

              <div className="md:hidden space-y-3">
                {payments.map((payment) => (
                  <Card key={payment.id} data-testid={`row-payment-${payment.id}`}>
                    <CardContent className="p-4 space-y-2">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{getUserDisplayName(payment.userId)}</span>
                          <div className="text-right">
                            <span className="font-mono font-semibold">
                              ${parseFloat(payment.amount).toFixed(2)}
                            </span>
                            <span className="ml-2 text-xs text-muted-foreground capitalize">
                              {payment.billingPeriod || 'monthly'}
                            </span>
                          </div>
                        </div>
                        <PrivacyField 
                          value={users?.find(u => u.id === payment.userId)?.email || ""} 
                          type="email"
                          testId={`payment-email-mobile-${payment.id}`}
                          className="text-xs"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Method</span>
                          <p className="capitalize">{payment.paymentMethod.replace(/-/g, ' ')}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date</span>
                          <p>{new Date(payment.paymentDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      {payment.notes && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Notes: </span>
                          <span>{payment.notes}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a manual payment received from a user
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user">User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="user" data-testid="select-user">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users?.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex flex-col">
                        <span>
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}`
                            : "User"}
                        </span>
                        <PrivacyField 
                          value={user.email || ""} 
                          type="email"
                          testId={`select-email-${user.id}`}
                          className="text-xs"
                        />
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                data-testid="input-amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="payment-method" data-testid="select-payment-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amazon-gift-card">Amazon Gift Card</SelectItem>
                  <SelectItem value="apple-gift-card">Apple Gift Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="chime">Chime</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="venmo">Venmo</SelectItem>
                  <SelectItem value="walmart-onepay">Walmart OnePay</SelectItem>
                  <SelectItem value="wise">Wise</SelectItem>
                  <SelectItem value="zelle">Zelle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing-period">Billing Period</Label>
              <Select value={billingPeriod} onValueChange={(value) => setBillingPeriod(value as "monthly" | "yearly")}>
                <SelectTrigger id="billing-period" data-testid="select-billing-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                data-testid="input-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => recordPaymentMutation.mutate()}
              disabled={!selectedUserId || !amount || recordPaymentMutation.isPending}
              data-testid="button-submit-payment"
            >
              {recordPaymentMutation.isPending ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
