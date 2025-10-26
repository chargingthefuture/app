import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Info, Wrench, Bell, Megaphone } from "lucide-react";
import type { Announcement } from "@shared/schema";
import { format } from "date-fns";

export default function SupportMatchAnnouncements() {
  const { data: announcements, isLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/supportmatch/announcements"],
  });

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case "maintenance":
        return <Wrench className="w-5 h-5 text-blue-600" />;
      case "update":
        return <Bell className="w-5 h-5 text-green-600" />;
      case "promotion":
        return <Megaphone className="w-5 h-5 text-purple-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getAnnouncementBadgeVariant = (type: string) => {
    switch (type) {
      case "warning":
        return "destructive" as const;
      case "maintenance":
        return "secondary" as const;
      case "update":
        return "default" as const;
      default:
        return "secondary" as const;
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="text-center py-8 sm:py-12">
          <p className="text-muted-foreground">Loading announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-2">Announcements</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Stay updated with platform news and important notifications
        </p>
      </div>

      {!announcements || announcements.length === 0 ? (
        <Card>
          <CardContent className="py-8 sm:py-12 text-center">
            <p className="text-muted-foreground">No announcements at this time.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id} data-testid={`announcement-${announcement.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {getAnnouncementIcon(announcement.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg mb-2">
                        {announcement.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={getAnnouncementBadgeVariant(announcement.type)} className="text-xs">
                          {announcement.type}
                        </Badge>
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {format(new Date(announcement.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap text-sm sm:text-base">
                  {announcement.content}
                </p>
                {announcement.expiresAt && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4">
                    Expires: {format(new Date(announcement.expiresAt), "MMM d, yyyy")}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
