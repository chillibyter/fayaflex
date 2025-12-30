import { useState } from "react";
import LeaderboardCard from "@/components/LeaderboardCard";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Trophy, Flame, Footprints, Dumbbell, Globe, MapPin } from "lucide-react";
import type { User } from "@shared/schema";

type LocationScope = "global" | "continent" | "country" | "region" | "town";

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
  const [locationScope, setLocationScope] = useState<LocationScope>("global");
  const [activeTab, setActiveTab] = useState<string>("teams");

  // Get current user's location for filtering
  const { data: user } = useQuery<User>({
    queryKey: ['/api/auth/user'],
  });

  // Build scope query params - use user's location IDs
  const getScopeParams = (scope: LocationScope, currentUser: User | undefined) => {
    if (scope === "global") return "";
    if (!currentUser) return "";
    
    switch (scope) {
      case "continent":
        return currentUser.continentId ? `&scope=continent&locationId=${currentUser.continentId}` : "";
      case "country":
        return currentUser.countryId ? `&scope=country&locationId=${currentUser.countryId}` : "";
      case "region":
        return currentUser.regionId ? `&scope=region&locationId=${currentUser.regionId}` : "";
      case "town":
        return currentUser.townId ? `&scope=town&locationId=${currentUser.townId}` : "";
      default:
        return "";
    }
  };

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
    queryKey: ['/api/leaderboard/category', 'calories', { month: currentMonth, year: currentYear, scope: locationScope, userLocation: user?.continentId }],
    queryFn: async () => {
      const scopeParams = getScopeParams(locationScope, user);
      const res = await fetch(`/api/leaderboard/category/calories?month=${currentMonth}&year=${currentYear}${scopeParams}`);
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
    queryKey: ['/api/leaderboard/category', 'steps', { month: currentMonth, year: currentYear, scope: locationScope, userLocation: user?.continentId }],
    queryFn: async () => {
      const scopeParams = getScopeParams(locationScope, user);
      const res = await fetch(`/api/leaderboard/category/steps?month=${currentMonth}&year=${currentYear}${scopeParams}`);
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
    queryKey: ['/api/leaderboard/category', 'workouts', { month: currentMonth, year: currentYear, scope: locationScope, userLocation: user?.continentId }],
    queryFn: async () => {
      const scopeParams = getScopeParams(locationScope, user);
      const res = await fetch(`/api/leaderboard/category/workouts?month=${currentMonth}&year=${currentYear}${scopeParams}`);
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

  // Helper to check if scope is available
  const isScopeAvailable = (scope: LocationScope) => {
    if (scope === "global") return true;
    if (!user) return false;
    switch (scope) {
      case "continent": return !!user.continentId;
      case "country": return !!user.countryId;
      case "region": return !!user.regionId;
      case "town": return !!user.townId;
      default: return false;
    }
  };

  const getScopeLabel = (scope: LocationScope) => {
    switch (scope) {
      case "global": return "Global";
      case "continent": return "Continent";
      case "country": return "Country";
      case "region": return "Region";
      case "town": return "Town";
      default: return "Global";
    }
  };

  // Fetch location name for current scope
  const getLocationId = (scope: LocationScope) => {
    if (!user) return null;
    switch (scope) {
      case "continent": return user.continentId;
      case "country": return user.countryId;
      case "region": return user.regionId;
      case "town": return user.townId;
      default: return null;
    }
  };

  const { data: locationData } = useQuery<{ id: string; name: string }>({
    queryKey: ['/api/locations', getLocationId(locationScope)],
    queryFn: async () => {
      const id = getLocationId(locationScope);
      if (!id) return null;
      const res = await fetch(`/api/locations/${id}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: locationScope !== "global" && !!getLocationId(locationScope),
  });

  const getScopeDisplayName = () => {
    if (locationScope === "global") return "Global";
    return locationData?.name || getScopeLabel(locationScope);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-orange-400 to-orange-500 text-white px-4 pt-6 pb-8 rounded-b-3xl">
        <h1 className="text-3xl font-bold text-center mb-1">Leaderboard</h1>
        <p className="text-center text-orange-100 text-lg">{monthName}</p>
        <p className="text-center text-orange-200 text-sm mt-1">Rankings reset on the 1st of each month</p>
        
        {activeTab !== "teams" && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="flex items-center gap-1 text-sm text-orange-100">
              {locationScope === "global" ? <Globe className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
              <span>Scope:</span>
            </div>
            <Select value={locationScope} onValueChange={(v) => setLocationScope(v as LocationScope)}>
              <SelectTrigger 
                className="w-32 h-8 bg-white/20 border-white/30 text-white text-sm" 
                data-testid="select-location-scope"
              >
                <SelectValue placeholder="Scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global</SelectItem>
                <SelectItem value="continent" disabled={!isScopeAvailable("continent")}>
                  Continent {!isScopeAvailable("continent") && "(Set in Profile)"}
                </SelectItem>
                <SelectItem value="country" disabled={!isScopeAvailable("country")}>
                  Country {!isScopeAvailable("country") && "(Set in Profile)"}
                </SelectItem>
                <SelectItem value="region" disabled={!isScopeAvailable("region")}>
                  Region {!isScopeAvailable("region") && "(Set in Profile)"}
                </SelectItem>
                <SelectItem value="town" disabled={!isScopeAvailable("town")}>
                  Town {!isScopeAvailable("town") && "(Set in Profile)"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </header>

      <div className="px-4 -mt-4">
        <Tabs defaultValue="teams" className="w-full" onValueChange={setActiveTab}>
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
                <h2 className="text-lg font-semibold">
                  Team Rankings
                  <span className="text-muted-foreground font-normal text-sm ml-1">
                    (Global)
                  </span>
                </h2>
              </div>
              {renderLeaderboardContent(teamLeaderboard, isLoadingTeams, isErrorTeams, refetchTeams, 'calories')}
            </TabsContent>

            <TabsContent value="calories" className="mt-0">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold">
                  Calories Burned
                  <span className="text-muted-foreground font-normal text-sm ml-1">
                    ({getScopeDisplayName()})
                  </span>
                </h2>
              </div>
              {renderLeaderboardContent(caloriesLeaderboard, isLoadingCalories, isErrorCalories, refetchCalories, 'calories')}
            </TabsContent>

            <TabsContent value="steps" className="mt-0">
              <div className="flex items-center gap-2 mb-4">
                <Footprints className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold">
                  Steps Taken
                  <span className="text-muted-foreground font-normal text-sm ml-1">
                    ({getScopeDisplayName()})
                  </span>
                </h2>
              </div>
              {renderLeaderboardContent(stepsLeaderboard, isLoadingSteps, isErrorSteps, refetchSteps, 'steps')}
            </TabsContent>

            <TabsContent value="workouts" className="mt-0">
              <div className="flex items-center gap-2 mb-4">
                <Dumbbell className="w-5 h-5 text-purple-500" />
                <h2 className="text-lg font-semibold">
                  Workout Days
                  <span className="text-muted-foreground font-normal text-sm ml-1">
                    ({getScopeDisplayName()})
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
