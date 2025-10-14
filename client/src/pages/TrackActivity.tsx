import DataEntryForm from "@/components/DataEntryForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Apple, Activity as ActivityIcon, Smartphone } from "lucide-react";
import { SiGarmin } from "react-icons/si";
import { useQuery } from "@tanstack/react-query";
import type { Activity, DeviceConnection } from "@shared/schema";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function TrackActivity() {
  const today = format(new Date(), "yyyy-MM-dd");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
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

  // Calculate today's totals
  const todayActivities = activities.filter(activity => activity.date === today);
  const todayCalories = todayActivities.reduce((sum, act) => sum + act.calories, 0);
  const todaySteps = todayActivities.reduce((sum, act) => sum + act.steps, 0);
  const todayWorkouts = todayActivities.filter(act => act.workoutType).length;

  const appleHealth = deviceConnections.find(d => d.provider === 'apple_health');
  const garmin = deviceConnections.find(d => d.provider === 'garmin');
  const androidHealth = deviceConnections.find(d => d.provider === 'android_health');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Track Activity</h1>
        <p className="text-muted-foreground">
          Log your daily fitness activities and track your progress.
        </p>
      </div>

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="manual" data-testid="tab-manual-entry">Manual Entry</TabsTrigger>
          <TabsTrigger value="devices" data-testid="tab-fitness-devices">Fitness Devices</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-6 mt-6">
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
        </TabsContent>

        <TabsContent value="devices" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Connected Fitness Devices</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Connect your fitness devices for automatic activity syncing. Once connected, your mobile app or wearable will sync activities automatically.
              </p>
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
                              'Connected - awaiting first sync'
                            )
                          ) : (
                            'Not connected'
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
                              'Connected - awaiting first sync'
                            )
                          ) : (
                            'Not connected'
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
                              'Connected - awaiting first sync'
                            )
                          ) : (
                            'Not connected'
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
                  </div>

                  <div className="mt-4 p-4 rounded-md bg-primary/10 border border-primary/20">
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">How it works:</strong> Once you connect a device, use the UFC mobile app or our API to sync activities automatically. Data will appear in your dashboard as it syncs.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
