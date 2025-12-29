import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Dumbbell, Footprints, Flame, Calendar, ArrowRight, ArrowUp, Trophy, Edit3, Smartphone, Sparkles, Medal } from "lucide-react";
import { SiApple } from "react-icons/si";
import { useQuery } from "@tanstack/react-query";
import type { Activity as ActivityType } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import OnboardingTutorial from "@/components/OnboardingTutorial";
import { useAuth } from "@/hooks/use-auth";
import GoalJourneys from "@/components/GoalJourneys";

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

type Notification = {
  id: string;
  message: string;
  type: string;
  date: string;
};

function getSourceInfo(source?: string | null) {
  switch (source) {
    case 'apple_health':
      return { icon: SiApple, label: 'Apple Health' };
    case 'android_health':
      return { icon: Smartphone, label: 'Android Health' };
    case 'manual':
    default:
      return { icon: Edit3, label: 'Manual' };
  }
}

export default function Dashboard() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { user } = useAuth();

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
  } = useQuery<ChartData[]>({
    queryKey: ['/api/progress/chart'],
  });

  const { 
    data: recentActivities = [], 
    isLoading: isLoadingActivities,
  } = useQuery<ActivityType[]>({
    queryKey: ['/api/activities'],
  });

  const { 
    data: notifications = [],
    isLoading: isLoadingNotifications,
  } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
  });

  useEffect(() => {
    if (user?.id && !isLoadingActivities) {
      const onboardingKey = `ufc_onboarding_seen_${user.id}`;
      const hasSeenOnboarding = localStorage.getItem(onboardingKey);
      if (!hasSeenOnboarding && recentActivities.length === 0) {
        setShowOnboarding(true);
      }
    }
  }, [user?.id, isLoadingActivities, recentActivities.length]);

  const handleOnboardingComplete = () => {
    if (user?.id) {
      localStorage.setItem(`ufc_onboarding_seen_${user.id}`, 'true');
    }
    setShowOnboarding(false);
  };

  const topActivities = recentActivities.slice(0, 5);
  const dailyMotivation = notifications.find(n => n.type === 'motivation') || notifications[0];

  const formattedChartData = chartData.slice(-10).map(d => ({
    ...d,
    label: d.date.startsWith('Week') ? d.date : new Date(d.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
  }));

  return (
    <div className="min-h-screen bg-background">
      {showOnboarding && (
        <OnboardingTutorial 
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingComplete}
        />
      )}

      <header className="bg-gradient-to-br from-green-500 to-green-600 text-white px-4 pt-4 pb-6 rounded-b-3xl">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">UFC</span>
          </div>
          <h1 className="text-xl font-bold">UFC Dashboard</h1>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Link href="/daily-chart?metric=calories">
            <div className="bg-card text-card-foreground rounded-xl p-3 text-center cursor-pointer hover-elevate shadow-sm" data-testid="stat-calories">
              <Flame className="h-6 w-6 text-orange-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Total Calories</p>
              <p className="text-2xl font-bold">{stats?.calories?.toLocaleString() || 0}</p>
              <p className="text-xs text-muted-foreground">kcal</p>
            </div>
          </Link>
          <Link href="/daily-chart?metric=steps">
            <div className="bg-card text-card-foreground rounded-xl p-3 text-center cursor-pointer hover-elevate shadow-sm" data-testid="stat-steps">
              <Footprints className="h-6 w-6 text-green-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Total Steps</p>
              <p className="text-2xl font-bold">{stats?.steps?.toLocaleString() || 0}</p>
              <p className="text-xs text-muted-foreground">steps</p>
            </div>
          </Link>
          <Link href="/track">
            <div className="bg-card text-card-foreground rounded-xl p-3 text-center cursor-pointer hover-elevate shadow-sm" data-testid="stat-workouts">
              <Calendar className="h-6 w-6 text-green-600 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Workout Days</p>
              <p className="text-2xl font-bold">{stats?.workouts || 0}</p>
              <p className="text-xs text-muted-foreground">days</p>
            </div>
          </Link>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {isErrorStats && (
          <Card className="p-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
              <p className="text-muted-foreground">Failed to load dashboard stats</p>
              <Button onClick={() => refetchStats()} variant="outline" data-testid="button-retry-stats">
                Try Again
              </Button>
            </div>
          </Card>
        )}

        {isLoadingStats && (
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        )}

        {dailyMotivation && (
          <Card className="border-yellow-200 dark:border-yellow-800 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-800/50 flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-yellow-800 dark:text-yellow-200 mb-1">Daily Motivation</h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300" data-testid="text-daily-motivation">{dailyMotivation.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Link href="/leaderboard">
          <Card className="cursor-pointer hover-elevate border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                    <Medal className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Global Ranking</h3>
                    <p className="text-sm text-muted-foreground">
                      {stats?.totalActiveUsers ? `Out of ${stats.totalActiveUsers} active users` : 'View your position'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary" data-testid="text-global-rank">
                    #{stats?.rank || '-'}
                  </p>
                  {stats?.percentile && stats.percentile > 0 && (
                    <Badge variant="secondary" className="mt-1">
                      Top {Math.round(stats.percentile)}%
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <GoalJourneys />

        {!isLoadingActivities && recentActivities.length === 0 && (
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-5">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Start your fitness journey!</h3>
                  <p className="text-sm text-muted-foreground">Log your first activity to compete on the leaderboard</p>
                </div>
                <Link href="/track">
                  <Button data-testid="button-quickstart-track">
                    <Dumbbell className="w-4 h-4 mr-2" />
                    Log Activity
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Monthly Progress</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <ArrowUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingChart ? (
              <Skeleton className="h-48 w-full" />
            ) : formattedChartData.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formattedChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <XAxis 
                      dataKey="label" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Bar dataKey="calories" radius={[4, 4, 0, 0]}>
                      {formattedChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill="hsl(142, 76%, 36%)" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center">
                <p className="text-muted-foreground text-sm">No activity data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoadingActivities ? (
                <>
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </>
              ) : topActivities.length > 0 ? (
                topActivities.map((activity) => {
                  const sourceInfo = getSourceInfo(activity.source);
                  const SourceIcon = sourceInfo.icon;
                  
                  return (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between py-2"
                      data-testid={`activity-${activity.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Dumbbell className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{activity.workoutType || 'Activity'}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">+{activity.calories} kcal</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No recent activities
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
