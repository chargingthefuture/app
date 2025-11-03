import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Clock, Play, Moon } from "lucide-react";
import type { SleepStory } from "@shared/schema";
import { AnnouncementBanner } from "@/components/announcement-banner";

export default function SleepStoriesLibrary() {
  const { data: stories, isLoading } = useQuery<SleepStory[]>({
    queryKey: ["/api/sleepstories"],
  });

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      nature: "bg-green-500/10 text-green-700 dark:text-green-400",
      fantasy: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
      meditation: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
      bedtime: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
      general: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
    };
    return colors[category] || colors.general;
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Moon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold">
              Sleep Stories
            </h1>
            <p className="text-muted-foreground">
              Calming stories to help you relax and drift off to sleep
            </p>
          </div>
        </div>
      </div>

      <AnnouncementBanner 
        apiEndpoint="/api/sleepstories/announcements"
        queryKey="/api/sleepstories/announcements"
      />

      {!stories || stories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Moon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No sleep stories available yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <Link key={story.id} href={`/apps/sleepstories/${story.id}`}>
              <Card className="hover-elevate h-full" data-testid={`story-card-${story.id}`}>
                {story.thumbnailUrl && (
                  <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                    <img 
                      src={story.thumbnailUrl} 
                      alt={story.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{story.title}</CardTitle>
                    <Play className="w-5 h-5 text-primary flex-shrink-0" />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getCategoryColor(story.category)} data-testid={`badge-category-${story.id}`}>
                      {story.category}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {formatDuration(story.duration)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="line-clamp-3">
                    {story.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
