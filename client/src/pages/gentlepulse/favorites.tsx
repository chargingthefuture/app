import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { MeditationCard } from "@/components/gentlepulse/meditation-card";
import { useClientId } from "@/hooks/useClientId";
import { useEffect, useState } from "react";
import type { GentlepulseMeditation } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function GentlePulseFavorites() {
  const clientId = useClientId();
  const [meditations, setMeditations] = useState<GentlepulseMeditation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold mb-2">My Favorites</h1>
        <p className="text-muted-foreground">
          Your saved meditations
        </p>
      </div>

      {meditations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">You haven't saved any favorites yet</p>
            <p className="text-sm text-muted-foreground">
              Tap the heart icon on any meditation to save it here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meditations.map((meditation) => (
            <MeditationCard key={meditation.id} meditation={meditation} />
          ))}
        </div>
      )}
    </div>
  );
}
