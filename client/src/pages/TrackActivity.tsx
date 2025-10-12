import DataEntryForm from "@/components/DataEntryForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Apple, Activity as ActivityIcon } from "lucide-react";
import { SiGarmin } from "react-icons/si";
import { useQuery } from "@tanstack/react-query";
import type { Activity } from "@shared/schema";
import { format } from "date-fns";

export default function TrackActivity() {
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  // Calculate today's totals
  const todayActivities = activities.filter(activity => activity.date === today);
  const todayCalories = todayActivities.reduce((sum, act) => sum + act.calories, 0);
  const todaySteps = todayActivities.reduce((sum, act) => sum + act.steps, 0);
  const todayWorkouts = todayActivities.filter(act => act.workoutType).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Track Activity</h1>
        <p className="text-muted-foreground">
          Log your daily fitness activities and track your progress.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DataEntryForm />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex gap-3">
                <Calendar className="h-5 w-5 text-primary flex-shrink-0" />
                <p className="text-muted-foreground">
                  Submit your activities daily for the most accurate tracking
                </p>
              </div>
              <div className="flex gap-3">
                <Apple className="h-5 w-5 text-primary flex-shrink-0" />
                <p className="text-muted-foreground">
                  Connect Apple Health or Garmin for automatic syncing
                </p>
              </div>
              <div className="flex gap-3">
                <ActivityIcon className="h-5 w-5 text-primary flex-shrink-0" />
                <p className="text-muted-foreground">
                  Use quick increment buttons to enter data faster
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today's Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Calories</span>
                <span className="font-semibold" data-testid="text-today-calories">
                  {isLoading ? "..." : `${todayCalories} cal`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Steps</span>
                <span className="font-semibold" data-testid="text-today-steps">
                  {isLoading ? "..." : `${todaySteps} steps`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Workouts</span>
                <Badge variant="secondary" data-testid="text-today-workouts">
                  {isLoading ? "..." : todayWorkouts}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
