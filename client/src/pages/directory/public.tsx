import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DirectoryProfile } from "@shared/schema";
import { ExternalLink } from "lucide-react";
import { VerifiedBadge } from "@/components/verified-badge";

export default function PublicDirectoryProfile() {
  const { id } = useParams<{ id: string }>();
  const { data: profile, isLoading, error } = useQuery<DirectoryProfile | null>({
    queryKey: ["/api/directory/public", id],
    queryFn: async () => {
      const res = await fetch(`/api/directory/public/${id}`);
      if (!res.ok) throw new Error(await res.text());
      return await res.json();
    }
  });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="text-center py-8 sm:py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="text-center py-8 sm:py-12">
          <p className="text-muted-foreground">Profile not found or not public</p>
        </div>
      </div>
    );
  }

  const userIsVerified = (profile as any).userIsVerified || false;

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-2">Directory Profile</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Public profile</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-lg sm:text-xl">
                {(profile as any).displayName || profile.nickname || profile.firstName || 'Directory Profile'}
              </CardTitle>
              {(profile as any).userId && <VerifiedBadge isVerified={userIsVerified} testId="badge-verified-public" />}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Description</p>
            <p className="text-base">{profile.description}</p>
          </div>

          {profile.skills?.length ? (
            <div>
              <p className="text-sm text-muted-foreground">Skills</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {profile.skills.map(s => (
                  <Badge key={s} variant="secondary">{s}</Badge>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Intentionally hide Signal link on public profile */}
            <div />
            {profile.quoraUrl ? (
              <a className="text-primary inline-flex items-center gap-2" href={profile.quoraUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" /> Quora profile
              </a>
            ) : <div />}
            <div className="text-sm text-muted-foreground">
              {profile.city || profile.state || profile.country ? (
                <span>{[profile.city, profile.state, profile.country].filter(Boolean).join(', ')}</span>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
