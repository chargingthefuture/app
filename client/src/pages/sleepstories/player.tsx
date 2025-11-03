import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Download } from "lucide-react";
import type { SleepStory } from "@shared/schema";

export default function SleepStoryPlayer() {
  const [, params] = useRoute("/apps/sleepstories/:id");
  const storyId = params?.id;

  const { data: story, isLoading } = useQuery<SleepStory>({
    queryKey: ["/api/sleepstories", storyId],
    enabled: !!storyId,
  });

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minutes`;
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

  if (!story) {
    return (
      <div className="p-6 md:p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Story not found</p>
            <Link href="/apps/sleepstories">
              <Button variant="outline" className="mt-4" data-testid="button-back-to-library">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Library
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Back button */}
      <Link href="/apps/sleepstories">
        <Button variant="ghost" data-testid="button-back">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Library
        </Button>
      </Link>

      {/* Story info */}
      <div>
        <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold mb-2" data-testid="text-story-title">
              {story.title}
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className={getCategoryColor(story.category)} data-testid="badge-category">
                {story.category}
              </Badge>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(story.duration)}</span>
              </div>
            </div>
          </div>
          
          {story.downloadUrl && (
            <a href={story.downloadUrl} download target="_blank" rel="noopener noreferrer">
              <Button variant="outline" data-testid="button-download">
                <Download className="w-4 h-4 mr-2" />
                Download for Offline
              </Button>
            </a>
          )}
        </div>
        
        <p className="text-muted-foreground max-w-3xl">
          {story.description}
        </p>
      </div>

      {/* Wistia player */}
      <Card>
        <CardHeader>
          <CardTitle>Audio Player</CardTitle>
          <CardDescription>
            Press play and relax. Close your eyes and let the story guide you to sleep.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="wistia_responsive_padding" 
            style={{ padding: "56.25% 0 0 0", position: "relative" }}
          >
            <div 
              className="wistia_responsive_wrapper" 
              style={{ height: "100%", left: 0, position: "absolute", top: 0, width: "100%" }}
            >
              <div 
                className={`wistia_embed wistia_async_${story.wistiaMediaId} seo=true videoFoam=true`}
                style={{ height: "100%", position: "relative", width: "100%" }}
                data-testid="wistia-player"
              >
                <div 
                  className="wistia_swatch" 
                  style={{ 
                    height: "100%", 
                    left: 0, 
                    opacity: 0, 
                    overflow: "hidden", 
                    position: "absolute", 
                    top: 0, 
                    transition: "opacity 200ms", 
                    width: "100%" 
                  }}
                >
                  <img 
                    src={`https://fast.wistia.com/embed/medias/${story.wistiaMediaId}/swatch`}
                    style={{ filter: "blur(5px)", height: "100%", objectFit: "contain", width: "100%" }} 
                    alt="" 
                    aria-hidden="true" 
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Wistia script */}
      <script src="https://fast.wistia.com/assets/external/E-v1.js" async></script>
    </div>
  );
}
