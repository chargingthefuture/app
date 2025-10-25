import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Package, Clock, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow, isPast } from "date-fns";
import type { SocketrelayRequest } from "@shared/schema";
import { Link } from "wouter";

export default function SocketRelayDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newRequest, setNewRequest] = useState("");

  const { data: requests = [], isLoading: requestsLoading } = useQuery<SocketrelayRequest[]>({
    queryKey: ['/api/socketrelay/requests'],
  });

  const { data: myRequests = [] } = useQuery<SocketrelayRequest[]>({
    queryKey: ['/api/socketrelay/my-requests'],
  });

  const { data: myFulfillments = [] } = useQuery<any[]>({
    queryKey: ['/api/socketrelay/my-fulfillments'],
  });

  const createMutation = useMutation({
    mutationFn: async (description: string) => {
      return await apiRequest('POST', '/api/socketrelay/requests', { description });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/socketrelay/requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/socketrelay/my-requests'] });
      setNewRequest("");
      toast({
        title: "Request created",
        description: "Your request has been posted and will expire in 14 days.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create request",
        variant: "destructive",
      });
    },
  });

  const fulfillMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return await apiRequest('POST', `/api/socketrelay/requests/${requestId}/fulfill`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/socketrelay/requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/socketrelay/my-fulfillments'] });
      toast({
        title: "Request accepted",
        description: "You can now chat with the requester.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to fulfill request",
        variant: "destructive",
      });
    },
  });

  const handleCreateRequest = () => {
    if (newRequest.trim().length === 0) {
      toast({
        title: "Error",
        description: "Please enter a description",
        variant: "destructive",
      });
      return;
    }

    if (newRequest.trim().length > 140) {
      toast({
        title: "Error",
        description: "Description must be 140 characters or less",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(newRequest.trim());
  };

  const handleFulfill = (requestId: string) => {
    fulfillMutation.mutate(requestId);
  };

  const activeRequests = requests.filter(r => r.status === 'active' && !isPast(new Date(r.expiresAt)));
  const otherRequests = activeRequests.filter(r => r.userId !== user?.id);

  const activeFulfillments = myFulfillments.filter(f => f.status === 'active');
  const successfulFulfillments = myFulfillments.filter(f => f.status === 'completed_success');
  const failedFulfillments = myFulfillments.filter(f => f.status === 'completed_failure');
  const cancelledFulfillments = myFulfillments.filter(f => f.status === 'cancelled');

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold mb-2">SocketRelay</h1>
        <p className="text-muted-foreground">
          Request items you need and help others find what they're looking for
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Requests</CardTitle>
          <CardDescription>
            Click "Fulfill" to help someone and start a chat
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {requestsLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading requests...</p>
          ) : otherRequests.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No active requests available</p>
          ) : (
            otherRequests.map((request: SocketrelayRequest) => (
              <Card key={request.id} data-testid={`card-request-${request.id}`}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <p>{request.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Expires {formatDistanceToNow(new Date(request.expiresAt), { addSuffix: true })}
                      </span>
                      <Button
                        onClick={() => handleFulfill(request.id)}
                        disabled={fulfillMutation.isPending}
                        data-testid={`button-fulfill-${request.id}`}
                      >
                        {fulfillMutation.isPending ? "Fulfilling..." : "Fulfill"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Active Requests</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{activeRequests.length}</div>
            <p className="text-sm text-muted-foreground">Available to fulfill</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-lg">My Requests</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{myRequests.length}</div>
            <p className="text-sm text-muted-foreground">Waiting for fulfillment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-lg">My Fulfillments</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{myFulfillments.length}</div>
            <p className="text-sm text-muted-foreground">Helping others</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create a Request</CardTitle>
          <CardDescription>
            Post what you're looking for (140 characters max, expires in 14 days)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              value={newRequest}
              onChange={(e) => setNewRequest(e.target.value)}
              placeholder="I'm looking for..."
              maxLength={140}
              rows={3}
              data-testid="input-request-description"
            />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {newRequest.length}/140 characters
              </span>
              <Button
                onClick={handleCreateRequest}
                disabled={createMutation.isPending || newRequest.trim().length === 0}
                data-testid="button-create-request"
              >
                {createMutation.isPending ? "Posting..." : "Post Request"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {myRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>My Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {myRequests.map((request: SocketrelayRequest) => (
              <Card key={request.id} data-testid={`card-my-request-${request.id}`}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <p className="flex-1">{request.description}</p>
                      <Badge variant={request.status === 'active' ? 'default' : 'secondary'}>
                        {request.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Expires {formatDistanceToNow(new Date(request.expiresAt), { addSuffix: true })}</span>
                      <span>Posted {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {myFulfillments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>My Active Fulfillments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {activeFulfillments.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Active</h3>
                {activeFulfillments.map((fulfillment: any) => (
                  <Link key={fulfillment.id} href={`/apps/socketrelay/chat/${fulfillment.id}`}>
                    <Card className="hover-elevate" data-testid={`card-fulfillment-${fulfillment.id}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Fulfillment #{fulfillment.id.slice(0, 8)}</p>
                            <p className="text-sm text-muted-foreground">
                              Started {formatDistanceToNow(new Date(fulfillment.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <Button variant="outline" data-testid={`button-chat-${fulfillment.id}`}>View Chat</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {successfulFulfillments.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Completed Successfully</h3>
                {successfulFulfillments.map((fulfillment: any) => (
                  <Link key={fulfillment.id} href={`/apps/socketrelay/chat/${fulfillment.id}`}>
                    <Card className="hover-elevate" data-testid={`card-fulfillment-${fulfillment.id}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Fulfillment #{fulfillment.id.slice(0, 8)}</p>
                            <p className="text-sm text-muted-foreground">
                              Started {formatDistanceToNow(new Date(fulfillment.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <Button variant="outline" data-testid={`button-chat-${fulfillment.id}`}>View Chat</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {failedFulfillments.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Completed - Did Not Work Out</h3>
                {failedFulfillments.map((fulfillment: any) => (
                  <Link key={fulfillment.id} href={`/apps/socketrelay/chat/${fulfillment.id}`}>
                    <Card className="hover-elevate" data-testid={`card-fulfillment-${fulfillment.id}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Fulfillment #{fulfillment.id.slice(0, 8)}</p>
                            <p className="text-sm text-muted-foreground">
                              Started {formatDistanceToNow(new Date(fulfillment.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <Button variant="outline" data-testid={`button-chat-${fulfillment.id}`}>View Chat</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {cancelledFulfillments.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Cancelled</h3>
                {cancelledFulfillments.map((fulfillment: any) => (
                  <Link key={fulfillment.id} href={`/apps/socketrelay/chat/${fulfillment.id}`}>
                    <Card className="hover-elevate" data-testid={`card-fulfillment-${fulfillment.id}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Fulfillment #{fulfillment.id.slice(0, 8)}</p>
                            <p className="text-sm text-muted-foreground">
                              Started {formatDistanceToNow(new Date(fulfillment.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <Button variant="outline" data-testid={`button-chat-${fulfillment.id}`}>View Chat</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
