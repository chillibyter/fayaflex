import DashboardStats from "@/components/DashboardStats";
import ProgressChart from "@/components/ProgressChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Smartphone, Edit3, Dumbbell, Footprints, Flame, ArrowRight, Trophy, Target, Sparkles } from "lucide-react";
import { SiGarmin, SiApple } from "react-icons/si";
import { useQuery } from "@tanstack/react-query";
import type { Activity as ActivityType } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import ActivityReactions from "@/components/ActivityReactions";
import ActivityComments from "@/components/ActivityComments";
import { Link } from "wouter";

type DashboardStats = {
  calories: number;
  steps: number;
  workouts: number;
  rank: number;
  totalActiveUsers: number;
  percentile: number;
  caloriesTrend?: number;
  stepsTrend?: number;
  personalBests?: { [key: string]: number };
  badgeCount?: number;
};

type ChartData = {
  date: string;
  calories: number;
};

// Helper function to get source icon and label
function getSourceInfo(source?: string | null) {
  switch (source) {
    case 'apple_health':
      return { icon: SiApple, label: 'Apple Health', color: 'text-foreground' };
    case 'garmin':
      return { icon: SiGarmin, label: 'Garmin', color: 'text-foreground' };
    case 'android_health':
      return { icon: Smartphone, label: 'Android Health', color: 'text-foreground' };
    case 'manual':
    default:
      return { icon: Edit3, label: 'Manual Entry', color: 'text-foreground' };
  }
}

export default function Dashboard() {
  const { 
    data: stats, 
    isLoading: isLoadingStats,
    isError: isErrorStats,
    refetch: refetchStats 
  } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { 
    data: chartData = [], 
    isLoading: isLoadingChart,
    isError: isErrorChart,
    refetch: refetchChart 
  } = useQuery<ChartData[]>({
    queryKey: ['/api/progress/chart'],
  });

  const { 
    data: recentActivities = [], 
    isLoading: isLoadingActivities,
    isError: isErrorActivities,
    refetch: refetchActivities 
  } = useQuery<ActivityType[]>({
    queryKey: ['/api/activities'],
  });

  // Get top 3 most recent activities
  const topActivities = recentActivities.slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's your fitness progress for this month.
        </p>
      </div>

      {!isLoadingActivities && recentActivities.length === 0 && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-lg font-semibold">Ready to start your fitness journey?</h3>
                  <p className="text-muted-foreground">
                    Log your first activity to appear on the leaderboard and start competing with your team!
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href="/track">
                    <Button data-testid="button-quickstart-track">
                      <Dumbbell className="w-4 h-4 mr-2" />
                      Log Your First Activity
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/how-it-works">
                    <Button variant="outline" data-testid="button-quickstart-learn">
                      <Target className="w-4 h-4 mr-2" />
                      Learn How Scoring Works
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-primary/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="font-medium">Track Calories</p>
                  <p className="text-sm text-muted-foreground">1 point per calorie</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Footprints className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">Log Steps</p>
                  <p className="text-sm text-muted-foreground">1 point per step</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="font-medium">Climb Rankings</p>
                  <p className="text-sm text-muted-foreground">Compete monthly</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isErrorStats ? (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
            <p className="text-muted-foreground">Failed to load dashboard stats</p>
            <Button onClick={() => refetchStats()} variant="outline" data-testid="button-retry-stats">
              Try Again
            </Button>
          </div>
        </Card>
      ) : isLoadingStats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : stats ? (
        <DashboardStats {...stats} />
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {isErrorChart ? (
            <Card className="p-12">
              <div className="text-center space-y-4">
                <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
                <p className="text-muted-foreground">Failed to load progress chart</p>
                <Button onClick={() => refetchChart()} variant="outline" data-testid="button-retry-chart">
                  Try Again
                </Button>
              </div>
            </Card>
          ) : isLoadingChart ? (
            <Skeleton className="h-96 w-full" />
          ) : chartData.length > 0 ? (
            <ProgressChart data={chartData} />
          ) : (
            <Card className="h-96 flex items-center justify-center">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">No activity data yet</p>
                <p className="text-sm text-muted-foreground">Start logging activities to see your progress chart</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isErrorActivities ? (
              <div className="text-center py-8 space-y-4">
                <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
                <p className="text-muted-foreground">Failed to load recent activities</p>
                <Button onClick={() => refetchActivities()} variant="outline" data-testid="button-retry-activities">
                  Try Again
                </Button>
              </div>
            ) : isLoadingActivities ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : topActivities.length > 0 ? (
              topActivities.map((activity) => {
                const sourceInfo = getSourceInfo(activity.source);
                const SourceIcon = sourceInfo.icon;
                
                return (
                  <div
                    key={activity.id}
                    className="p-3 rounded-md hover-elevate space-y-3"
                    data-testid={`activity-${activity.id}`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{activity.workoutType || 'General Activity'}</p>
                          <Badge variant="outline" className="text-xs gap-1" data-testid={`activity-source-${activity.id}`}>
                            <SourceIcon className="h-3 w-3" />
                            {sourceInfo.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{activity.calories} cal</p>
                        <p className="text-sm text-muted-foreground">{activity.steps} steps</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 pt-2 border-t">
                      <ActivityReactions activityId={activity.id} />
                      <ActivityComments activityId={activity.id} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No recent activities. Start tracking to see your progress!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
