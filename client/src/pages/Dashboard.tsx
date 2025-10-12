import DashboardStats from "@/components/DashboardStats";
import ProgressChart from "@/components/ProgressChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Apple, Activity, AlertCircle, Smartphone } from "lucide-react";
import { SiGarmin } from "react-icons/si";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Activity as ActivityType, DeviceConnection } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { format, formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type DashboardStats = {
  calories: number;
  steps: number;
  workouts: number;
  rank: number;
};

type ChartData = {
  date: string;
  calories: number;
};

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const {
    data: deviceConnections = [],
    isLoading: isLoadingDevices
  } = useQuery<DeviceConnection[]>({
    queryKey: ['/api/devices'],
  });

  const toggleDeviceMutation = useMutation({
    mutationFn: async (data: { provider: string; isConnected: boolean }) => {
      return await apiRequest('POST', '/api/devices/toggle', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/devices'] });
      toast({
        title: "Device connection updated",
        description: "Your device connection has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update device connection",
        variant: "destructive",
      });
    },
  });

  const handleToggleDevice = (provider: string, currentStatus: boolean) => {
    toggleDeviceMutation.mutate({ provider, isConnected: !currentStatus });
  };

  // Get top 3 most recent activities
  const topActivities = recentActivities.slice(0, 3);

  const appleHealth = deviceConnections.find(d => d.provider === 'apple_health');
  const garmin = deviceConnections.find(d => d.provider === 'garmin');
  const androidHealth = deviceConnections.find(d => d.provider === 'android_health');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's your fitness progress for this month.
        </p>
      </div>

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

        <Card>
          <CardHeader>
            <CardTitle>Connected Devices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingDevices ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : (
              <>
                <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Apple className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Apple Health</p>
                      <p className="text-sm text-muted-foreground">
                        {appleHealth?.isConnected ? (
                          appleHealth.lastSyncAt ? (
                            `Last synced ${formatDistanceToNow(new Date(appleHealth.lastSyncAt), { addSuffix: true })}`
                          ) : (
                            'Connected'
                          )
                        ) : (
                          'Not connected'
                        )}
                      </p>
                    </div>
                  </div>
                  {appleHealth?.isConnected ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      data-testid="button-disconnect-apple"
                      onClick={() => handleToggleDevice('apple_health', true)}
                      disabled={toggleDeviceMutation.isPending}
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button 
                      variant="default" 
                      size="sm" 
                      data-testid="button-connect-apple"
                      onClick={() => handleToggleDevice('apple_health', false)}
                      disabled={toggleDeviceMutation.isPending}
                    >
                      Connect
                    </Button>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Google Fit / Android Health</p>
                      <p className="text-sm text-muted-foreground">
                        {androidHealth?.isConnected ? (
                          androidHealth.lastSyncAt ? (
                            `Last synced ${formatDistanceToNow(new Date(androidHealth.lastSyncAt), { addSuffix: true })}`
                          ) : (
                            'Connected'
                          )
                        ) : (
                          'Not connected'
                        )}
                      </p>
                    </div>
                  </div>
                  {androidHealth?.isConnected ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      data-testid="button-disconnect-android"
                      onClick={() => handleToggleDevice('android_health', true)}
                      disabled={toggleDeviceMutation.isPending}
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button 
                      variant="default" 
                      size="sm" 
                      data-testid="button-connect-android"
                      onClick={() => handleToggleDevice('android_health', false)}
                      disabled={toggleDeviceMutation.isPending}
                    >
                      Connect
                    </Button>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                  <div className="flex items-center gap-3">
                    <SiGarmin className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Garmin Connect</p>
                      <p className="text-sm text-muted-foreground">
                        {garmin?.isConnected ? (
                          garmin.lastSyncAt ? (
                            `Last synced ${formatDistanceToNow(new Date(garmin.lastSyncAt), { addSuffix: true })}`
                          ) : (
                            'Connected'
                          )
                        ) : (
                          'Not connected'
                        )}
                      </p>
                    </div>
                  </div>
                  {garmin?.isConnected ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      data-testid="button-disconnect-garmin"
                      onClick={() => handleToggleDevice('garmin', true)}
                      disabled={toggleDeviceMutation.isPending}
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button 
                      variant="default" 
                      size="sm" 
                      data-testid="button-connect-garmin"
                      onClick={() => handleToggleDevice('garmin', false)}
                      disabled={toggleDeviceMutation.isPending}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </>
            )}

            <div className="pt-2">
              <Button asChild variant="ghost" className="w-full" data-testid="button-manual-entry">
                <Link href="/track">
                  <Activity className="h-4 w-4 mr-2" />
                  Manual Entry
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
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
              topActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 rounded-md hover-elevate"
                  data-testid={`activity-${activity.id}`}
                >
                  <div>
                    <p className="font-medium">{activity.workoutType || 'General Activity'}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{activity.calories} cal</p>
                    <p className="text-sm text-muted-foreground">{activity.steps} steps</p>
                  </div>
                </div>
              ))
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
