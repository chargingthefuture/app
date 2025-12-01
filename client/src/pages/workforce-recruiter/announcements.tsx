import { useQuery } from "@tanstack/react-query";
import { AnnouncementDisplay } from "@/components/announcement-display";
import type { WorkforceRecruiterAnnouncement } from "@shared/schema";

export default function WorkforceRecruiterAnnouncementsPage() {
  const { data: announcements, isLoading } = useQuery<WorkforceRecruiterAnnouncement[]>({
    queryKey: ["/api/workforce-recruiter/announcements"],
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-4">
      <div>
        <h1 className="text-3xl font-semibold">Workforce Recruiter Updates</h1>
        <p className="text-muted-foreground">
          Critical reminders, intake windows, and platform maintenance relevant to placements.
        </p>
      </div>
      {isLoading ? (
        <p className="text-muted-foreground">Loading announcements...</p>
      ) : announcements && announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <AnnouncementDisplay
              key={announcement.id}
              id={announcement.id}
              title={announcement.title}
              content={announcement.content}
              type={announcement.type}
              createdAt={announcement.createdAt ?? new Date().toISOString()}
              expiresAt={announcement.expiresAt ?? undefined}
              showExpiration
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No announcements available right now.</p>
      )}
    </div>
  );
}
