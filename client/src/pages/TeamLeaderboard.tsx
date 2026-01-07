import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowLeft, Lock, Users } from "lucide-react";
import LeaderboardCard from "@/components/LeaderboardCard";
import { Card, CardContent } from "@/components/ui/card";
import { TeamChat } from "@/components/TeamChat";
import { format } from "date-fns";

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
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const monthName = format(new Date(currentYear, currentMonth - 1), "MMMM yyyy");

  const { 
    data: leaderboard = [], 
    isLoading,
    isError,
    error,
    refetch 
  } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard/team', teamId, { month: currentMonth, year: currentYear }],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard/team/${teamId}?month=${currentMonth}&year=${currentYear}`);
      if (!res.ok) {
        const errorText = await res.text();
        const errorData = { status: res.status, message: errorText };
        throw errorData;
      }
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
                Individual rankings for this team. Scores reset on the 1st of each month.
              </p>
            </div>
          </div>
        </div>
        <Badge variant="outline" className="text-base px-4 py-2" data-testid="badge-month">
          {monthName}
        </Badge>
      </div>

      <div className="space-y-4">
        {isError ? (
          <>
            {(error as any)?.status === 403 ? (
              <Card className="border-yellow-500/20 bg-yellow-500/5">
                <CardContent className="py-12">
                  <div className="text-center space-y-4">
                    <Lock className="h-16 w-16 mx-auto text-yellow-600" />
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Team Members Only</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        This leaderboard is only available to team members. Join this team to view their rankings and compete together!
                      </p>
                    </div>
                    <div className="flex gap-3 justify-center flex-wrap">
                      <Button variant="outline" asChild data-testid="button-back-to-teams">
                        <Link href="/teams">
                          <Users className="h-4 w-4 mr-2" />
                          View My Teams
                        </Link>
                      </Button>
                      <Button asChild data-testid="button-go-to-leaderboard">
                        <Link href="/leaderboard">
                          View Leaderboard
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-12 space-y-4">
                <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
                <p className="text-muted-foreground">Failed to load team leaderboard</p>
                <Button onClick={() => refetch()} variant="outline" data-testid="button-retry">
                  Try Again
                </Button>
              </div>
            )}
          </>
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

      {!isError && teamId && (
        <TeamChat teamId={teamId} teamName={teamData?.name || 'Team'} />
      )}
    </div>
  );
}
