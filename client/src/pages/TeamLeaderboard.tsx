import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowLeft } from "lucide-react";
import LeaderboardCard from "@/components/LeaderboardCard";

type LeaderboardEntry = {
  rank: number;
  name: string;
  calories: number;
  goalPercentage: number;
  userId?: string;
};

export default function TeamLeaderboard() {
  const params = useParams();
  const teamId = params.teamId;

  const { 
    data: leaderboard = [], 
    isLoading,
    isError,
    refetch 
  } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard/team', teamId],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard/team/${teamId}`);
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return res.json();
    },
  });

  const { data: teamData } = useQuery({
    queryKey: ['/api/teams'],
    select: (teams: any[]) => teams.find(t => t.id === teamId),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild data-testid="button-back-to-teams">
              <Link href="/teams">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight" data-testid="text-team-name">
                {teamData?.name || 'Team'} Leaderboard
              </h1>
              <p className="text-muted-foreground">
                Individual rankings for this team
              </p>
            </div>
          </div>
        </div>
        <Badge variant="secondary" className="text-sm px-4 py-2" data-testid="badge-month">
          October 2025
        </Badge>
      </div>

      <div className="space-y-4">
        {isError ? (
          <div className="text-center py-12 space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
            <p className="text-muted-foreground">Failed to load team leaderboard</p>
            <Button onClick={() => refetch()} variant="outline" data-testid="button-retry">
              Try Again
            </Button>
          </div>
        ) : isLoading ? (
          <>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        ) : leaderboard.length > 0 ? (
          leaderboard.map((entry) => (
            <LeaderboardCard key={entry.rank} {...entry} />
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No rankings yet. Team members need to log activities to appear on the leaderboard!
          </div>
        )}
      </div>
    </div>
  );
}
