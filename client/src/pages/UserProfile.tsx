import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Dumbbell, Flame } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import type { User as UserType, Activity } from "@shared/schema";
import { useLocation } from "wouter";
import { UserAvatar } from "@/components/UserAvatar";

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const [, setLocation] = useLocation();

  const { data: user, isLoading: isLoadingUser } = useQuery<UserType>({
    queryKey: [`/api/users/${userId}/profile`],
  });

  const { data: activities = [], isLoading: isLoadingActivities } = useQuery<Activity[]>({
    queryKey: [`/api/users/${userId}/activities`],
  });

  const getUserInitials = () => {
    if (!user) return "?";
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || user.email?.[0]?.toUpperCase() || "?";
  };

  const getUserFullName = () => {
    if (!user) return "Loading...";
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    // Extract from email
    if (user.email) {
      const emailUsername = user.email.split('@')[0];
      return emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1);
    }
    return "User";
  };

  const totalCalories = activities.reduce((sum, act) => sum + act.calories, 0);
  const totalSteps = activities.reduce((sum, act) => sum + act.steps, 0);

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
                <p className="text-muted-foreground mb-3">
                  {user?.email}
                </p>
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
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Flame className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-total-calories">
                  {totalCalories}
                </p>
                <p className="text-sm text-muted-foreground">Total Calories</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-total-workouts">
                  {activities.length}
                </p>
                <p className="text-sm text-muted-foreground">Total Workouts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Dumbbell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-total-steps">
                  {totalSteps.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Steps</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingActivities ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity) => (
                <Card key={activity.id} className="hover-elevate" data-testid={`activity-${activity.id}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{activity.workoutType}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(activity.date), 'MMMM d, yyyy')}
                          </span>
                        </div>
                        <div className="flex gap-6 text-sm">
                          <div>
                            <span className="text-muted-foreground">Calories:</span>{' '}
                            <span className="font-semibold">{activity.calories}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Steps:</span>{' '}
                            <span className="font-semibold">{activity.steps}</span>
                          </div>
                        </div>
                      </div>
                      {activity.attachmentUrl && (
                        <div className="w-32 h-32 rounded-md overflow-hidden">
                          <img
                            src={activity.attachmentUrl}
                            alt="Activity evidence"
                            className="w-full h-full object-cover"
                            data-testid="activity-attachment"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No activities logged yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
