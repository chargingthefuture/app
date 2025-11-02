import { useQuery } from "@tanstack/react-query";
import type { ResearchCard } from "@shared/schema";

interface ResearchColumnCardsProps {
  columnId: string;
  columnName: string;
}

export default function ResearchColumnCards({ columnId, columnName }: ResearchColumnCardsProps) {
  const { data: cards = [] } = useQuery<ResearchCard[]>({
    queryKey: [`/api/research/columns/${columnId}/cards`],
    enabled: !!columnId,
  });

  return (
    <div className="min-w-[250px] bg-muted rounded-lg p-3">
      <h4 className="font-medium mb-3">{columnName}</h4>
      <div className="space-y-2">
        {cards.map((card) => (
          <div key={card.id} className="bg-background p-2 rounded border text-sm">
            {card.title}
          </div>
        ))}
        {cards.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No cards</p>
        )}
      </div>
    </div>
  );
}
