import LeaderboardCard from "@/components/LeaderboardCard";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Trophy, Flame, Footprints, Dumbbell, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

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
  avatarId?: string | null;
  profileImageUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

export default function Leaderboard() {
  const [, setLocation] = useLocation();
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
      const res = await apiRequest("GET", `/api/leaderboard/teams?month=${currentMonth}&year=${currentYear}`);
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
      const res = await apiRequest("GET", `/api/leaderboard/category/calories?month=${currentMonth}&year=${currentYear}`);
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
      const res = await apiRequest("GET", `/api/leaderboard/category/steps?month=${currentMonth}&year=${currentYear}`);
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
      const res = await apiRequest("GET", `/api/leaderboard/category/workouts?month=${currentMonth}&year=${currentYear}`);
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
      <div className="space-y-2 sm:space-y-3">
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
      <header className="bg-gradient-to-r from-orange-400 to-orange-500 text-white px-4 md:px-6 pt-3 sm:pt-4 pb-6 sm:pb-8 rounded-b-3xl">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-1 sm:mb-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/")}
              className="text-white"
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Leaderboard</h1>
          </div>
          <p className="text-center text-orange-100 text-base sm:text-lg">{monthName}</p>
          <p className="text-center text-orange-200 text-xs sm:text-sm mt-1">Rankings reset on the 1st of each month</p>
        </div>
      </header>

      <div className="px-3 sm:px-4 md:px-6 -mt-4 max-w-3xl mx-auto">
        <Tabs defaultValue="teams" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-card shadow-md rounded-xl p-1 gap-1">
            <TabsTrigger 
              value="teams" 
              className="rounded-lg text-[11px] sm:text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-white" 
              data-testid="tab-teams"
            >
              Teams
            </TabsTrigger>
            <TabsTrigger 
              value="calories" 
              className="rounded-lg text-[11px] sm:text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-white" 
              data-testid="tab-calories"
            >
              Calories
            </TabsTrigger>
            <TabsTrigger 
              value="steps" 
              className="rounded-lg text-[11px] sm:text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-white" 
              data-testid="tab-steps"
            >
              Steps
            </TabsTrigger>
            <TabsTrigger 
              value="workouts" 
              className="rounded-lg text-[11px] sm:text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-white" 
              data-testid="tab-workouts"
            >
              Workouts
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 sm:mt-6">
            <TabsContent value="teams" className="mt-0">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <h2 className="text-base sm:text-lg font-semibold">
                  Team Rankings
                  <span className="text-muted-foreground font-normal text-xs sm:text-sm ml-1">
                    (Global)
                  </span>
                </h2>
              </div>
              {renderLeaderboardContent(teamLeaderboard, isLoadingTeams, isErrorTeams, refetchTeams, 'calories')}
            </TabsContent>

            <TabsContent value="calories" className="mt-0">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                <h2 className="text-base sm:text-lg font-semibold">
                  Calories Burned
                  <span className="text-muted-foreground font-normal text-xs sm:text-sm ml-1">
                    (Teammates)
                  </span>
                </h2>
              </div>
              {renderLeaderboardContent(caloriesLeaderboard, isLoadingCalories, isErrorCalories, refetchCalories, 'calories')}
            </TabsContent>

            <TabsContent value="steps" className="mt-0">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Footprints className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                <h2 className="text-base sm:text-lg font-semibold">
                  Steps Taken
                  <span className="text-muted-foreground font-normal text-xs sm:text-sm ml-1">
                    (Teammates)
                  </span>
                </h2>
              </div>
              {renderLeaderboardContent(stepsLeaderboard, isLoadingSteps, isErrorSteps, refetchSteps, 'steps')}
            </TabsContent>

            <TabsContent value="workouts" className="mt-0">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                <h2 className="text-base sm:text-lg font-semibold">
                  Workout Days
                  <span className="text-muted-foreground font-normal text-xs sm:text-sm ml-1">
                    (Teammates)
                  </span>
                </h2>
              </div>
              {renderLeaderboardContent(workoutsLeaderboard, isLoadingWorkouts, isErrorWorkouts, refetchWorkouts, 'workouts')}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
