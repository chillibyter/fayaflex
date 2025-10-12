import LeaderboardCard from "@/components/LeaderboardCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

type LeaderboardEntry = {
  rank: number;
  name: string;
  teamName: string;
  calories: number;
  goalPercentage: number;
};

export default function Leaderboard() {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const monthName = format(new Date(currentYear, currentMonth - 1), "MMMM yyyy");

  const { 
    data: personalLeaderboard = [], 
    isLoading: isLoadingPersonal,
    isError: isErrorPersonal,
    refetch: refetchPersonal 
  } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard/personal', { month: currentMonth, year: currentYear }],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard/personal?month=${currentMonth}&year=${currentYear}`);
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return res.json();
    },
  });

  const { 
    data: teamLeaderboard = [], 
    isLoading: isLoadingTeams,
    isError: isErrorTeams,
    refetch: refetchTeams 
  } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard/teams', { month: currentMonth, year: currentYear }],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard/teams?month=${currentMonth}&year=${currentYear}`);
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Leaderboard</h1>
          <p className="text-muted-foreground">
            See how you and your team rank this month.
          </p>
        </div>
        <Badge variant="outline" className="text-base px-4 py-2" data-testid="badge-current-month">
          {monthName}
        </Badge>
      </div>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="personal" data-testid="tab-personal">Personal</TabsTrigger>
          <TabsTrigger value="teams" data-testid="tab-teams">Teams</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          {isErrorPersonal ? (
            <div className="text-center py-12 space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
              <p className="text-muted-foreground">Failed to load personal leaderboard</p>
              <Button onClick={() => refetchPersonal()} variant="outline" data-testid="button-retry-personal">
                Try Again
              </Button>
            </div>
          ) : isLoadingPersonal ? (
            <>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </>
          ) : personalLeaderboard.length > 0 ? (
            personalLeaderboard.map((entry) => (
              <LeaderboardCard key={entry.rank} {...entry} />
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No personal rankings yet. Start logging activities to appear on the leaderboard!
            </div>
          )}
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          {isErrorTeams ? (
            <div className="text-center py-12 space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
              <p className="text-muted-foreground">Failed to load team leaderboard</p>
              <Button onClick={() => refetchTeams()} variant="outline" data-testid="button-retry-teams">
                Try Again
              </Button>
            </div>
          ) : isLoadingTeams ? (
            <>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </>
          ) : teamLeaderboard.length > 0 ? (
            teamLeaderboard.map((entry) => (
              <LeaderboardCard key={entry.rank} {...entry} />
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No team rankings yet. Teams need to log activities to appear on the leaderboard!
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
