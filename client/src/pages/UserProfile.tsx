import { useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Dumbbell, Flame, Footprints } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import type { User as UserType, Activity } from "@shared/schema";
import { useLocation } from "wouter";
import { UserAvatar } from "@/components/UserAvatar";
import TeammateComparisonChart from "@/components/TeammateComparisonChart";
import UserBadgesDisplay from "@/components/UserBadgesDisplay";

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const [, setLocation] = useLocation();

  const { data: user, isLoading: isLoadingUser } = useQuery<UserType>({
    queryKey: [`/api/users/${userId}/profile`],
  });

  const { data: activities = [], isLoading: isLoadingActivities } = useQuery<Activity[]>({
    queryKey: [`/api/users/${userId}/activities`],
  });

  const getUserFullName = () => {
    if (!user) return "Loading...";
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    if (user.email) {
      const emailUsername = user.email.split('@')[0];
      return emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1);
    }
    return "User";
  };

  const totalCalories = activities.reduce((sum, act) => sum + act.calories, 0);
  const totalSteps = activities.reduce((sum, act) => sum + act.steps, 0);
  const workoutDays = new Set(activities.filter(a => a.workoutType).map(a => a.date)).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setLocation("/leaderboard")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Teammate Profile</h1>
          <p className="text-muted-foreground">
            View your teammate's fitness journey
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoadingUser ? (
            <div className="flex items-center gap-6 flex-wrap">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-36" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-6 flex-wrap">
              <UserAvatar 
                user={user} 
                className="h-24 w-24"
                iconClassName="h-12 w-12"
                fallbackClassName="text-2xl"
              />
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1" data-testid="text-user-name">
                  {getUserFullName()}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Member since {user?.createdAt ? format(new Date(user.createdAt), 'MMMM yyyy') : 'Unknown'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-orange-50 dark:bg-orange-950 flex items-center justify-center">
                <Flame className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-total-calories">
                  {isLoadingActivities ? "..." : totalCalories.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Calories</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
                <Footprints className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-total-steps">
                  {isLoadingActivities ? "..." : totalSteps.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Steps</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-50 dark:bg-purple-950 flex items-center justify-center">
                <Dumbbell className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-total-workouts">
                  {isLoadingActivities ? "..." : workoutDays}
                </p>
                <p className="text-sm text-muted-foreground">Workout Days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {userId && (
        <TeammateComparisonChart userId={userId} userName={getUserFullName()} />
      )}

      {userId && (
        <UserBadgesDisplay userId={userId} />
      )}
    </div>
  );
}
