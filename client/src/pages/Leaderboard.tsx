import LeaderboardCard from "@/components/LeaderboardCard";
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
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          No rankings yet. Start logging activities!
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {data.map((entry) => (
          <LeaderboardCard 
            key={`${entry.rank}-${entry.userId || entry.teamId}`} 
            {...entry}
            calories={valueKey === 'calories' ? entry.calories : 
                      valueKey === 'steps' ? (entry.steps || 0) :
                      valueKey === 'workouts' ? (entry.workouts || 0) :
                      (entry.value || entry.calories)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-yellow-400 via-orange-400 to-orange-500 text-white px-4 pt-6 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src="/fayaflex-logo.png" alt="" className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Leaderboard</h1>
        </div>
        <p className="text-center text-white text-lg font-medium">{monthName}</p>
        <p className="text-center text-white/80 text-sm mt-1">Rankings reset on the 1st of each month.</p>
      </header>

      <div className="px-4 -mt-4">
        <Tabs defaultValue="teams" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-card shadow-md rounded-xl p-1">
            <TabsTrigger 
              value="teams" 
              className="rounded-lg text-xs data-[state=active]:bg-primary data-[state=active]:text-white" 
              data-testid="tab-teams"
            >
              Teams
            </TabsTrigger>
            <TabsTrigger 
              value="calories" 
              className="rounded-lg text-xs data-[state=active]:bg-primary data-[state=active]:text-white" 
              data-testid="tab-calories"
            >
              Calories
            </TabsTrigger>
            <TabsTrigger 
              value="steps" 
              className="rounded-lg text-xs data-[state=active]:bg-primary data-[state=active]:text-white" 
              data-testid="tab-steps"
            >
              Steps
            </TabsTrigger>
            <TabsTrigger 
              value="workouts" 
              className="rounded-lg text-xs data-[state=active]:bg-primary data-[state=active]:text-white" 
              data-testid="tab-workouts"
            >
              Workouts
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="teams" className="mt-0">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Team Rankings</h2>
              </div>
              {renderLeaderboardContent(teamLeaderboard, isLoadingTeams, isErrorTeams, refetchTeams, 'calories')}
            </TabsContent>

            <TabsContent value="calories" className="mt-0">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold">Calories Burned</h2>
              </div>
              {renderLeaderboardContent(caloriesLeaderboard, isLoadingCalories, isErrorCalories, refetchCalories, 'calories')}
            </TabsContent>

            <TabsContent value="steps" className="mt-0">
              <div className="flex items-center gap-2 mb-4">
                <Footprints className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold">Steps Taken</h2>
              </div>
              {renderLeaderboardContent(stepsLeaderboard, isLoadingSteps, isErrorSteps, refetchSteps, 'steps')}
            </TabsContent>

            <TabsContent value="workouts" className="mt-0">
              <div className="flex items-center gap-2 mb-4">
                <Dumbbell className="w-5 h-5 text-purple-500" />
                <h2 className="text-lg font-semibold">Workout Days</h2>
              </div>
              {renderLeaderboardContent(workoutsLeaderboard, isLoadingWorkouts, isErrorWorkouts, refetchWorkouts, 'workouts')}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
