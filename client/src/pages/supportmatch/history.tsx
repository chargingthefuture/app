import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Partnership } from "@shared/schema";
import { format } from "date-fns";

export default function SupportMatchHistory() {
  const { data: partnerships, isLoading } = useQuery<Partnership[]>({
    queryKey: ["/api/supportmatch/partnership/history"],
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default" as const;
      case "completed":
        return "secondary" as const;
      case "ended_early":
        return "destructive" as const;
      case "cancelled":
        return "secondary" as const;
      default:
        return "secondary" as const;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ended_early":
        return "Ended Early";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold mb-2">Partnership History</h1>
        <p className="text-muted-foreground">
          View your past accountability partnerships
        </p>
      </div>

      {!partnerships || partnerships.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No partnership history yet. You'll see your partnerships here once you're matched.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {partnerships.map((partnership) => (
            <Card key={partnership.id} data-testid={`partnership-${partnership.id}`}>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <CardTitle>Partnership</CardTitle>
                  <Badge variant={getStatusVariant(partnership.status)}>
                    {getStatusLabel(partnership.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium">
                      {format(new Date(partnership.startDate), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p className="font-medium">
                      {format(new Date(partnership.endDate), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
