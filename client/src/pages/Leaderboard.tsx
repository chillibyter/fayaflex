import LeaderboardCard from "@/components/LeaderboardCard";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Trophy, Flame, Footprints, Dumbbell } from "lucide-react";

type LeaderboardEntry = {
  rank: number;
  name: string;
  teamName?: string;
  calories: number;
  steps?: number;
  workouts?: number;
  value?: number;
  goalPercentage: number;
  userId?: string;
  teamId?: string;
  avatarId?: string;
};

export default function Leaderboard() {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const monthName = format(new Date(currentYear, currentMonth - 1), "MMMM yyyy");

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

  const { 
    data: caloriesLeaderboard = [], 
    isLoading: isLoadingCalories,
    isError: isErrorCalories,
    refetch: refetchCalories 
  } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard/category', 'calories', { month: currentMonth, year: currentYear }],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard/category/calories?month=${currentMonth}&year=${currentYear}`);
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return res.json();
    },
  });

  const { 
    data: stepsLeaderboard = [], 
    isLoading: isLoadingSteps,
    isError: isErrorSteps,
    refetch: refetchSteps 
  } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard/category', 'steps', { month: currentMonth, year: currentYear }],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard/category/steps?month=${currentMonth}&year=${currentYear}`);
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return res.json();
    },
  });

  const { 
    data: workoutsLeaderboard = [], 
    isLoading: isLoadingWorkouts,
    isError: isErrorWorkouts,
    refetch: refetchWorkouts 
  } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/leaderboard/category', 'workouts', { month: currentMonth, year: currentYear }],
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard/category/workouts?month=${currentMonth}&year=${currentYear}`);
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return res.json();
    },
  });

  const renderLeaderboardContent = (
    data: LeaderboardEntry[],
    isLoading: boolean,
    isError: boolean,
    refetch: () => void,
    valueLabel: string,
    valueKey: 'calories' | 'steps' | 'workouts' | 'value'
  ) => {
    if (isError) {
      return (
        <div className="text-center py-12 space-y-4">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
          <p className="text-muted-foreground">Failed to load leaderboard</p>
          <Button onClick={() => refetch()} variant="outline" data-testid="button-retry">
            Try Again
          </Button>
        </div>
      );
    }

    if (isLoading) {
      return (
        <>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </>
      );
    }

    if (data.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          No rankings yet. Start logging activities to appear on the leaderboard!
        </div>
      );
    }

    return data.map((entry) => (
      <LeaderboardCard 
        key={`${entry.rank}-${entry.userId || entry.teamId}`} 
        {...entry}
        calories={valueKey === 'calories' ? entry.calories : 
                  valueKey === 'steps' ? (entry.steps || 0) :
                  valueKey === 'workouts' ? (entry.workouts || 0) :
                  (entry.value || entry.calories)}
      />
    ));
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2 text-white">Leaderboard</h1>
            <p className="text-yellow-50">
              Rankings reset on the 1st of each month
            </p>
          </div>
          <Badge className="bg-white/20 text-white border-white/30 text-base px-4 py-2" data-testid="badge-current-month">
            {monthName}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="teams" className="w-full">
        <div className="flex gap-2 overflow-x-auto pb-2" data-testid="leaderboard-tabs">
          <TabsList className="bg-transparent p-0 h-auto gap-2">
            <TabsTrigger 
              value="teams" 
              className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground bg-muted" 
              data-testid="tab-teams"
            >
              <Trophy className="w-4 h-4" />
              <span>Teams</span>
            </TabsTrigger>
            <TabsTrigger 
              value="calories" 
              className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground bg-muted" 
              data-testid="tab-calories"
            >
              <Flame className="w-4 h-4" />
              <span>Calories</span>
            </TabsTrigger>
            <TabsTrigger 
              value="steps" 
              className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground bg-muted" 
              data-testid="tab-steps"
            >
              <Footprints className="w-4 h-4" />
              <span>Steps</span>
            </TabsTrigger>
            <TabsTrigger 
              value="workouts" 
              className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground bg-muted" 
              data-testid="tab-workouts"
            >
              <Dumbbell className="w-4 h-4" />
              <span>Workouts</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="teams" className="space-y-4 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Team Rankings</h2>
          </div>
          {renderLeaderboardContent(teamLeaderboard, isLoadingTeams, isErrorTeams, refetchTeams, 'Avg Daily Cal', 'calories')}
        </TabsContent>

        <TabsContent value="calories" className="space-y-4 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold">Calories Burned</h2>
          </div>
          {renderLeaderboardContent(caloriesLeaderboard, isLoadingCalories, isErrorCalories, refetchCalories, 'Calories', 'calories')}
        </TabsContent>

        <TabsContent value="steps" className="space-y-4 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Footprints className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Steps Taken</h2>
          </div>
          {renderLeaderboardContent(stepsLeaderboard, isLoadingSteps, isErrorSteps, refetchSteps, 'Steps', 'steps')}
        </TabsContent>

        <TabsContent value="workouts" className="space-y-4 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Dumbbell className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold">Workout Days</h2>
          </div>
          {renderLeaderboardContent(workoutsLeaderboard, isLoadingWorkouts, isErrorWorkouts, refetchWorkouts, 'Workouts', 'workouts')}
        </TabsContent>
      </Tabs>
    </div>
  );
}
