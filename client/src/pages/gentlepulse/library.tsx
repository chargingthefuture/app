import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { MeditationCard } from "@/components/gentlepulse/meditation-card";
import { MoodCheckDialog, SafetyMessageDialog } from "@/components/gentlepulse/mood-check-dialog";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { PaginationControls } from "@/components/pagination-controls";
import { useClientId } from "@/hooks/useClientId";
import type { GentlepulseMeditation } from "@shared/schema";

export default function GentlePulseLibrary() {
  const clientId = useClientId();
  const [sortBy, setSortBy] = useState("newest");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [showMoodDialog, setShowMoodDialog] = useState(false);
  const [showSafetyMessage, setShowSafetyMessage] = useState(false);
  const [page, setPage] = useState(0);
  const limit = 20;

  // Check if mood check should be shown
  const { data: moodEligible } = useQuery<{ eligible: boolean }>({
    queryKey: [`/api/gentlepulse/mood/check-eligible?clientId=${clientId}`],
    enabled: !!clientId,
    refetchInterval: 60000, // Check every minute
  });

  useEffect(() => {
    // Show mood dialog if eligible and hasn't been shown today
    if (moodEligible?.eligible) {
      const lastShown = localStorage.getItem("gentlepulse_mood_last_shown");
      const today = new Date().toDateString();
      if (lastShown !== today) {
        setShowMoodDialog(true);
      }
    }
  }, [moodEligible]);

  const { data, isLoading } = useQuery<{ meditations: GentlepulseMeditation[]; total: number }>({
    queryKey: [`/api/gentlepulse/meditations?sortBy=${sortBy}&tag=${tagFilter}&limit=${limit}&offset=${page * limit}`],
  });

  const meditations = data?.meditations || [];
  const total = data?.total || 0;

  // Get unique tags from all meditations
  const allTags = new Set<string>();
  meditations.forEach((m) => {
    if (m.tags) {
      try {
        const tags = JSON.parse(m.tags);
        tags.forEach((tag: string) => allTags.add(tag));
      } catch (e) {
        // ignore
      }
    }
  });

  const handleMoodSubmitted = (showSafety: boolean) => {
    localStorage.setItem("gentlepulse_mood_last_shown", new Date().toDateString());
    if (showSafety) {
      setShowSafetyMessage(true);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading meditations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 pb-24">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold mb-2">GentlePulse</h1>
        <p className="text-muted-foreground">
          Guided meditations for peace and healing
        </p>
      </div>

      <AnnouncementBanner
        apiEndpoint="/api/gentlepulse/announcements"
        queryKey="/api/gentlepulse/announcements"
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="most-rated">Most Rated</SelectItem>
            <SelectItem value="highest-rating">Highest Rating</SelectItem>
          </SelectContent>
        </Select>

        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-tag">
            <SelectValue placeholder="All Tags" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Tags</SelectItem>
            {Array.from(allTags).map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Meditation Grid */}
      {meditations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No meditations found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meditations.map((meditation) => (
              <MeditationCard key={meditation.id} meditation={meditation} />
            ))}
          </div>

          {/* Pagination */}
          <PaginationControls
            currentPage={page}
            totalItems={total}
            itemsPerPage={limit}
            onPageChange={setPage}
            className="mt-6"
          />
        </>
      )}

      {/* Mood Check Dialog */}
      <MoodCheckDialog
        open={showMoodDialog}
        onOpenChange={setShowMoodDialog}
        onMoodSubmitted={handleMoodSubmitted}
      />

      {/* Safety Message Dialog */}
      <SafetyMessageDialog
        open={showSafetyMessage}
        onOpenChange={setShowSafetyMessage}
      />
    </div>
  );
}
