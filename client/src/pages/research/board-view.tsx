import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ResearchBoard, ResearchColumn } from "@shared/schema";
import ResearchColumnCards from "./column-cards";

interface ResearchBoardViewProps {
  researchItemId: string;
}

export default function ResearchBoardView({ researchItemId }: ResearchBoardViewProps) {
  const { user } = useAuth();
  const [newColumnName, setNewColumnName] = useState("");

  // Get or create default board
  const { data: boards = [] } = useQuery<ResearchBoard[]>({
    queryKey: [`/api/research/items/${researchItemId}/boards`],
    enabled: !!user && !!researchItemId,
  });

  const board = boards[0];

  const { data: columns = [] } = useQuery<ResearchColumn[]>({
    queryKey: [`/api/research/boards/${board?.id}/columns`],
    enabled: !!board?.id,
  });

  // Simplified board view - will fetch cards on demand or in a combined query

  const createColumnMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!board) {
        // Create board first
        const newBoard = await apiRequest<ResearchBoard>("POST", "/api/research/boards", {
          researchItemId,
          name: "Research Board",
          position: 0,
        });
        return apiRequest("POST", "/api/research/columns", {
          boardId: newBoard.id,
          name,
          position: columns.length,
        });
      }
      return apiRequest("POST", "/api/research/columns", {
        boardId: board.id,
        name,
        position: columns.length,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/research/boards/${board?.id}/columns`] });
      setNewColumnName("");
    },
  });

  if (!user) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Sign in to use boards</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-4">Research Board</h3>
        
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="New column..."
            value={newColumnName}
            onChange={(e) => setNewColumnName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && newColumnName && createColumnMutation.mutate(newColumnName)}
            className="flex-1 px-3 py-1 border rounded text-sm"
            data-testid="input-new-column"
          />
          <Button
            size="sm"
            onClick={() => newColumnName && createColumnMutation.mutate(newColumnName)}
            disabled={!newColumnName || createColumnMutation.isPending}
            data-testid="button-add-column"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {columns.length === 0 ? (
          <p className="text-sm text-muted-foreground">No columns yet. Create one above.</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto">
            {columns.map((column) => (
              <ResearchColumnCards key={column.id} columnId={column.id} columnName={column.name} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
