import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { MeditationCard } from "@/components/gentlepulse/meditation-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClientId } from "@/hooks/useClientId";
import { useEffect, useState, useMemo } from "react";
import type { GentlepulseMeditation } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { PaginationControls } from "@/components/pagination-controls";
import { GentlePulseDesktopNav } from "@/components/gentlepulse/desktop-nav";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GentlePulseFavorites() {
  const clientId = useClientId();
  const [meditations, setMeditations] = useState<GentlepulseMeditation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data: favoriteIds = [] } = useQuery<string[]>({
    queryKey: [`/api/gentlepulse/favorites?clientId=${clientId}`],
    enabled: !!clientId,
  });

  useEffect(() => {
    if (favoriteIds.length === 0) {
      setMeditations([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    Promise.all(
      favoriteIds.map(id => 
        apiRequest<GentlepulseMeditation>("GET", `/api/gentlepulse/meditations/${id}`)
      )
    ).then(results => {
      setMeditations(results.filter((m): m is GentlepulseMeditation => m !== undefined));
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });
  }, [favoriteIds]);

  // Sort meditations
  const sortedMeditations = useMemo(() => {
    const sorted = [...meditations];
    if (sortBy === "newest") {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "most-rated") {
      sorted.sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0));
    } else if (sortBy === "highest-rating") {
      sorted.sort((a, b) => (Number(b.averageRating) || 0) - (Number(a.averageRating) || 0));
    }
    return sorted;
  }, [meditations, sortBy]);

  // Apply pagination
  const paginatedMeditations = useMemo(() => {
    const start = page * limit;
    const end = start + limit;
    return sortedMeditations.slice(start, end);
  }, [sortedMeditations, page, limit]);

  const total = sortedMeditations.length;

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading favorites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 pb-24">
      <div className="flex items-center gap-4">
        <Link href="/apps/gentlepulse" className="sm:hidden">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold mb-2">My Favorites</h1>
          <p className="text-muted-foreground">
            Your saved meditations ({total})
          </p>
        </div>
      </div>

      <GentlePulseDesktopNav />

      <AnnouncementBanner
        apiEndpoint="/api/gentlepulse/announcements"
        queryKey="/api/gentlepulse/announcements"
      />

      {meditations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">You haven't saved any favorites yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Tap the heart icon on any meditation to save it here
            </p>
            <Link href="/apps/gentlepulse">
              <Button variant="outline" data-testid="button-browse-library">
                Browse Library
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Sort Filter */}
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
          </div>

          {/* Meditation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedMeditations.map((meditation) => (
              <MeditationCard key={meditation.id} meditation={meditation} />
            ))}
          </div>

          {/* Pagination */}
          {total > limit && (
            <PaginationControls
              currentPage={page}
              totalItems={total}
              itemsPerPage={limit}
              onPageChange={setPage}
              className="mt-6"
            />
          )}
        </>
      )}
    </div>
  );
}
