import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PaginationControls } from "@/components/pagination-controls";
import { useFuzzySearch } from "@/hooks/useFuzzySearch";
import type { WorkforceRecruiterOccupation } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

interface PaginatedResponse {
  items: WorkforceRecruiterOccupation[];
  total: number;
}

const ITEMS_PER_PAGE = 20;

export default function WorkforceRecruiterOccupations() {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const queryKey = `/api/workforce-recruiter/occupations?limit=${ITEMS_PER_PAGE}&offset=${page * ITEMS_PER_PAGE}&search=${encodeURIComponent(searchTerm)}`;

  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: [queryKey],
  });

  const occupations = data?.items ?? [];
  const filtered = useFuzzySearch(occupations, searchTerm, {
    searchFields: ["title", "sector", "description", "locations"],
    threshold: 0.35,
  });

  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-4 sm:p-6 md:p-8">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Curated opportunities</p>
        <h1 className="text-3xl font-semibold">Occupations Directory</h1>
        <p className="text-muted-foreground">
          Roles vetted for safety, living wage commitments, and trauma-informed supervision.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={searchTerm}
          onChange={(event) => {
            setSearchTerm(event.target.value);
            setPage(0);
          }}
          placeholder="Search by title, sector, or location"
          className="sm:w-80"
          data-testid="input-search-occupations"
        />
        <Button variant="outline" onClick={() => setSearchTerm("")} data-testid="button-clear-search">
          Clear search
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">Loading opportunities…</CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            No occupations match your filters yet. Try a different keyword or check back soon.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((occupation) => (
            <Card key={occupation.id} className="border-l-4 border-l-primary">
              <CardHeader className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <CardTitle className="text-xl text-foreground">{occupation.title}</CardTitle>
                  <Badge variant="secondary">{occupation.sector}</Badge>
                  {occupation.demandLevel === "urgent" && (
                    <Badge variant="destructive">Urgent need</Badge>
                  )}
                </div>
                <CardDescription>
                  {occupation.isRemoteFriendly ? "Remote friendly" : "On-site"} · {occupation.locations || "Global"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>{occupation.description}</p>
                {occupation.skillsEmphasis && (
                  <p>
                    <span className="font-medium text-foreground">Skills focus:</span> {occupation.skillsEmphasis}
                  </p>
                )}
                {occupation.trainingResources && (
                  <p>
                    <span className="font-medium text-foreground">Training:</span> {occupation.trainingResources}
                  </p>
                )}
                {occupation.supportNotes && (
                  <p>
                    <span className="font-medium text-foreground">Support notes:</span> {occupation.supportNotes}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>{occupation.openRoles ?? 0} open roles</span>
                  {typeof occupation.annualCompensationUsd === "number" && (
                    <span>${occupation.annualCompensationUsd.toLocaleString()} USD</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PaginationControls
        currentPage={page}
        totalItems={data?.total ?? 0}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setPage}
      />
    </div>
  );
}
