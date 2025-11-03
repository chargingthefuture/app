import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { InviteCode } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminInvites() {
  const { toast } = useToast();
  const [maxUses, setMaxUses] = useState("1");
  const [expiresIn, setExpiresIn] = useState("never");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: invites, isLoading } = useQuery<InviteCode[]>({
    queryKey: ["/api/admin/invites"],
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const data: any = {
        maxUses: parseInt(maxUses),
      };

      if (expiresIn !== "never") {
        const days = parseInt(expiresIn);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);
        data.expiresAt = expiresAt.toISOString();
      }

      return await apiRequest("POST", "/api/admin/invites", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invites"] });
      toast({
        title: "Success",
        description: "Invite code generated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({
      title: "Copied",
      description: "Invite code copied to clipboard",
    });
  };

  const getStatusBadge = (invite: InviteCode) => {
    if (!invite.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (invite.currentUses >= invite.maxUses) {
      return <Badge variant="secondary">Fully Used</Badge>;
    }
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-2">Invite Code Management</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Generate and manage invite codes for platform access
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Generate New Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="max-uses">Maximum Uses</Label>
              <Select value={maxUses} onValueChange={setMaxUses}>
                <SelectTrigger id="max-uses" data-testid="select-max-uses">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 use</SelectItem>
                  <SelectItem value="5">5 uses</SelectItem>
                  <SelectItem value="10">10 uses</SelectItem>
                  <SelectItem value="25">25 uses</SelectItem>
                  <SelectItem value="100">100 uses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires-in">Expiration</Label>
              <Select value={expiresIn} onValueChange={setExpiresIn}>
                <SelectTrigger id="expires-in" data-testid="select-expiration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never expires</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="w-full"
              data-testid="button-generate-invite"
            >
              {generateMutation.isPending ? "Generating..." : "Generate Code"}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Recent Invite Codes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading invite codes...
              </div>
            ) : !invites || invites.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No invite codes generated yet
              </div>
            ) : (
              <>
                <div className="hidden md:block rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Usage</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invites.slice(0, 10).map((invite) => (
                        <TableRow key={invite.id} data-testid={`row-invite-${invite.id}`}>
                          <TableCell>
                            <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                              {invite.code}
                            </code>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 min-w-[120px]">
                              <div className="flex justify-between text-sm">
                                <span>{invite.currentUses} / {invite.maxUses}</span>
                                <span className="text-muted-foreground">
                                  {Math.round((invite.currentUses / invite.maxUses) * 100)}%
                                </span>
                              </div>
                              <Progress
                                value={(invite.currentUses / invite.maxUses) * 100}
                                className="h-2"
                              />
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(invite)}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {invite.expiresAt 
                              ? new Date(invite.expiresAt).toLocaleDateString()
                              : "Never"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyCode(invite.code)}
                              data-testid={`button-copy-${invite.id}`}
                            >
                              {copiedCode === invite.code ? (
                                <Check className="w-4 h-4 text-primary" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="md:hidden space-y-3">
                  {invites.slice(0, 10).map((invite) => (
                    <Card key={invite.id} data-testid={`row-invite-${invite.id}`}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <code className="font-mono text-xs sm:text-sm bg-muted px-2 py-1 rounded break-all">
                            {invite.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyCode(invite.code)}
                            data-testid={`button-copy-${invite.id}`}
                            className="flex-shrink-0"
                          >
                            {copiedCode === invite.code ? (
                              <Check className="w-4 h-4 text-primary" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Status</span>
                            {getStatusBadge(invite)}
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Usage</span>
                              <span>{invite.currentUses} / {invite.maxUses} ({Math.round((invite.currentUses / invite.maxUses) * 100)}%)</span>
                            </div>
                            <Progress
                              value={(invite.currentUses / invite.maxUses) * 100}
                              className="h-2"
                            />
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Expires</span>
                            <span>
                              {invite.expiresAt 
                                ? new Date(invite.expiresAt).toLocaleDateString()
                                : "Never"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
