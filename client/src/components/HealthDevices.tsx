import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Smartphone, Activity, RefreshCw, CheckCircle, XCircle, Loader2,
  Settings, Footprints, Flame, Dumbbell, Heart, MapPin, Shield,
  Info, Watch, ExternalLink
} from 'lucide-react';
import { healthService } from '@/lib/healthService';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Capacitor } from '@capacitor/core';
import { Link } from 'wouter';

interface DeviceConnection {
  provider: string;
  isConnected: boolean;
  lastSyncAt: Date | null;
  accessToken?: string | null;
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

function formatLastSync(lastSyncAt: Date | null): string {
  if (!lastSyncAt) return 'Never synced';
  const date = new Date(lastSyncAt);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

// ─── Garmin Connect card ─────────────────────────────────────────────────────

function GarminCard({
  devices,
  isNative,
  nativeProviderName,
}: {
  devices: DeviceConnection[] | undefined;
  isNative: boolean;
  nativeProviderName: string;
}) {
  const { toast } = useToast();

  const { data: garminStatus } = useQuery<{ enabled: boolean }>({
    queryKey: ['/api/garmin/status'],
    staleTime: 60_000,
  });

  const garminConn = devices?.find(d => d.provider === 'garmin_connect');
  const isConnected = garminConn?.isConnected ?? false;
  const isEnabled = garminStatus?.enabled ?? false;

  const syncMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/garmin/sync', { days: 30 }),
    onSuccess: () => {
      toast({ title: 'Synced!', description: 'Garmin data updated successfully.' });
      queryClient.invalidateQueries({ queryKey: ['/api/devices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/progress/chart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/goals/suggested'] });
    },
    onError: (err: any) => {
      toast({ title: 'Sync failed', description: err.message ?? 'Could not sync Garmin data', variant: 'destructive' });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/garmin/disconnect'),
    onSuccess: () => {
      toast({ title: 'Disconnected', description: 'Garmin Connect has been disconnected.' });
      queryClient.invalidateQueries({ queryKey: ['/api/devices'] });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message ?? 'Could not disconnect', variant: 'destructive' });
    },
  });

  function handleConnect() {
    if (isNative) {
      // Open the OAuth flow in the system browser; app will auto-refresh on return
      window.open('https://www.fayaflex.com/api/garmin/connect', '_system');
    } else {
      window.location.href = '/api/garmin/connect';
    }
  }

  // Tip for native users: remind them about the simpler bridge option
  const bridgeName = nativeProviderName === 'apple_health' ? 'Apple Health' : 'Health Connect';

  return (
    <Card data-testid="card-garmin-connect">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Watch className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>Garmin Connect</CardTitle>
              <CardDescription>
                Sync steps, active calories, and workouts directly from your Garmin device
              </CardDescription>
            </div>
          </div>
          {isConnected ? (
            <Badge className="gap-1" data-testid="badge-garmin-connected">
              <CheckCircle className="h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1" data-testid="badge-garmin-disconnected">
              <XCircle className="h-3 w-3" />
              Not Connected
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!isEnabled ? (
          // Server doesn't have Garmin API keys configured yet
          <div className="rounded-md bg-muted p-4 space-y-3">
            <p className="text-sm font-medium">Garmin direct integration coming soon</p>
            <p className="text-sm text-muted-foreground">
              The Garmin Connect direct sync requires an approved Garmin developer API key.
              In the meantime, most Garmin users can get their data into FayaFlex right now
              by enabling the Garmin → {bridgeName} bridge in the Garmin Connect app.
            </p>
            {isNative && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Enable the bridge in 3 steps:</p>
                <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1 ml-1">
                  <li>Open the <strong>Garmin Connect</strong> app on your phone</li>
                  <li>
                    Go to <strong>Settings → Health Snapshot</strong> (iOS) or{' '}
                    <strong>More → Connected Apps → {bridgeName}</strong> (Android)
                  </li>
                  <li>Turn on <strong>Sync to {bridgeName}</strong> and connect your Garmin account</li>
                </ol>
                <p className="text-xs text-muted-foreground mt-2">
                  Once the bridge is active your Garmin data flows into {bridgeName}, and FayaFlex
                  reads it automatically each time you tap Sync above.
                </p>
              </div>
            )}
            {!isNative && (
              <p className="text-xs text-muted-foreground">
                On iOS, open Garmin Connect → More → Health Snapshot → Connect Apple Health.
                On Android, open Garmin Connect → More → Connected Apps → Health Connect.
              </p>
            )}
          </div>
        ) : isConnected ? (
          // Connected — show sync / disconnect controls
          <>
            {garminConn?.lastSyncAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4" />
                <span data-testid="text-garmin-last-sync">
                  Last synced: {formatLastSync(garminConn.lastSyncAt)}
                </span>
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                data-testid="button-garmin-sync"
              >
                {syncMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Sync Now
              </Button>
              <Button
                variant="outline"
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
                data-testid="button-garmin-disconnect"
              >
                Disconnect
              </Button>
            </div>
            <div className="rounded-md bg-muted p-4 space-y-1">
              <h4 className="font-medium text-sm">Data synced from Garmin:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Active calories (from daily summaries)</li>
                <li>Step count</li>
                <li>Workout / activity sessions</li>
                <li>Last 30 days of history</li>
              </ul>
            </div>
          </>
        ) : (
          // Not connected — show connect button
          <>
            <div className="rounded-md bg-muted p-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                Connect your Garmin account to automatically pull daily active calories, steps, and
                workout data into FayaFlex. You'll be taken to Garmin Connect to authorise access.
              </p>
            </div>
            <Button onClick={handleConnect} data-testid="button-garmin-connect">
              <ExternalLink className="mr-2 h-4 w-4" />
              Connect Garmin
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main HealthDevices component ────────────────────────────────────────────

export function HealthDevices() {
  const { toast } = useToast();
  const [nativeAvailable, setNativeAvailable] = useState(false);
  const [isNativePlatform, setIsNativePlatform] = useState(false);
  const [providerName, setProviderName] = useState<'apple_health' | 'android_health' | 'huawei_health'>('android_health');

  const { data: currentUser } = useQuery<any>({ queryKey: ['/api/auth/user'] });

  const { data: devices, isLoading } = useQuery<DeviceConnection[]>({
    queryKey: ['/api/devices'],
    // Re-fetch when window/app gains focus (catches Garmin OAuth callback on native)
    refetchOnWindowFocus: true,
  });

  // Show Garmin OAuth result if we were redirected back with a query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('garmin_connected') === '1') {
      toast({
        title: 'Garmin Connected!',
        description: 'Your Garmin account has been connected and your data is syncing.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/devices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/goals/suggested'] });
      // Clean up the URL param without a full reload
      const url = new URL(window.location.href);
      url.searchParams.delete('garmin_connected');
      window.history.replaceState({}, '', url.toString());
    } else if (params.get('garmin_error')) {
      const msg = decodeURIComponent(params.get('garmin_error') ?? 'Unknown error');
      toast({ title: 'Garmin Connection Failed', description: msg, variant: 'destructive' });
      const url = new URL(window.location.href);
      url.searchParams.delete('garmin_error');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  useEffect(() => {
    checkNativeHealth();
  }, []);

  async function checkNativeHealth() {
    const isNative = Capacitor.isNativePlatform();
    setIsNativePlatform(isNative);
    if (!isNative) return;

    const provider = await healthService.getProviderName();
    setProviderName(provider);

    if (provider === 'huawei_health') {
      setNativeAvailable(false);
      return;
    }

    const available = await healthService.isAvailable();
    setNativeAvailable(available);
  }

  const getDeviceConnection = () => devices?.find(d => d.provider === providerName);
  const isConnected = getDeviceConnection()?.isConnected ?? false;

  const connectNativeMutation = useMutation({
    mutationFn: async () => {
      const provider = await healthService.getProviderName();
      const displayName = provider === 'apple_health' ? 'Apple Health' :
                         provider === 'huawei_health' ? 'Huawei Health' : 'Health Connect';

      const isAvailable = await healthService.isAvailable();
      if (!isAvailable) {
        await healthService.showPermissionsRationale();
        if (provider === 'android_health') {
          throw new Error('Health Connect is not installed or not available. Please install Health Connect from the Play Store, then try again.');
        } else if (provider === 'apple_health') {
          throw new Error('Apple Health is not available on this device. Please ensure HealthKit is enabled in Settings.');
        }
        throw new Error(`${displayName} is not available on this device.`);
      }

      await healthService.checkPermissions();
      await healthService.requestPermissions();

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      let healthData;
      try {
        healthData = await healthService.getHealthData(startDate, endDate, currentUser?.bmr);
      } catch (dataError) {
        throw new Error(`Could not read health data from ${displayName}. The app may need to collect more data first.`);
      }

      const isAndroid = provider === 'android_health';
      const totalCalories = healthData.reduce((sum: number, day: any) => sum + (day.calories || 0), 0);
      const hasZeroCalories = isAndroid && totalCalories === 0 && healthData.length > 0;

      const detailedWorkouts = await healthService.getDetailedWorkouts(30).catch(() => []);
      await apiRequest('POST', '/api/devices/sync', { provider, activities: healthData, workouts: detailedWorkouts });
      return { provider, hasZeroCalories };
    },
    onSuccess: (result) => {
      const { provider, hasZeroCalories } = result;
      const displayName = provider === 'apple_health' ? 'Apple Health' :
                         provider === 'huawei_health' ? 'Huawei Health' : 'Health Connect';
      if (hasZeroCalories) {
        toast({
          title: 'Connected - Calorie Permission Needed',
          description: 'Steps synced but calories show 0. Please enable "Active energy burned" in Health Connect permissions.',
          variant: 'destructive',
          duration: 10000,
        });
        setTimeout(() => {
          toast({
            title: 'How to fix:',
            description: 'Go to Settings → Health Connect → App permissions → FayaFlex → Enable "Active energy burned"',
            duration: 15000,
          });
        }, 1000);
      } else {
        toast({ title: 'Connected!', description: `Successfully connected to ${displayName} and synced your fitness data` });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/devices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/progress/chart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/goals/suggested'] });
    },
    onError: (error) => {
      toast({
        title: 'Connection failed',
        description: error instanceof Error ? error.message : 'Could not connect to health service',
        variant: 'destructive',
      });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const provider = await healthService.getProviderName();
      const deviceConnection = devices?.find(d => d.provider === provider);
      const lastSyncAt = deviceConnection?.lastSyncAt;

      const endDate = new Date();
      let startDate: Date;
      if (lastSyncAt) {
        startDate = new Date(lastSyncAt);
        startDate.setDate(startDate.getDate() - 1);
      } else {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
      }

      const healthData = await healthService.getHealthData(startDate, endDate, currentUser?.bmr);
      const isAndroid = provider === 'android_health';
      const totalCalories = healthData.reduce((sum: number, day: any) => sum + (day.calories || 0), 0);
      const hasZeroCalories = isAndroid && totalCalories === 0 && healthData.length > 0;

      const detailedWorkouts = await healthService.getDetailedWorkouts(30).catch(() => []);
      await apiRequest('POST', '/api/devices/sync', { provider, activities: healthData, workouts: detailedWorkouts });
      return { provider, hasZeroCalories };
    },
    onSuccess: (result) => {
      const { provider, hasZeroCalories } = result as { provider: string; hasZeroCalories: boolean };
      const displayName = provider === 'apple_health' ? 'Apple Health' :
                         provider === 'huawei_health' ? 'Huawei Health' : 'Health Connect';
      if (hasZeroCalories) {
        toast({
          title: 'Synced - Calorie Permission Needed',
          description: 'Steps synced but calories show 0. Enable "Active energy burned" in Health Connect.',
          variant: 'destructive',
          duration: 10000,
        });
      } else {
        toast({ title: 'Synced!', description: `Successfully synced data from ${displayName}` });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/devices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/progress/chart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/goals/suggested'] });
    },
    onError: (error) => {
      toast({ title: 'Sync failed', description: error instanceof Error ? error.message : 'Unknown error', variant: 'destructive' });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const provider = await healthService.getProviderName();
      return await apiRequest('POST', '/api/devices/toggle', { provider, isConnected: false });
    },
    onSuccess: () => {
      const displayName = providerName === 'apple_health' ? 'Apple Health' :
                         providerName === 'huawei_health' ? 'Huawei Health' : 'Health Connect';
      toast({ title: 'Disconnected', description: `Disconnected from ${displayName}` });
      queryClient.invalidateQueries({ queryKey: ['/api/devices'] });
    },
    onError: (error) => {
      toast({ title: 'Disconnect failed', description: error instanceof Error ? error.message : 'Unknown error', variant: 'destructive' });
    },
  });

  const handleOpenSettings = async () => {
    try {
      await healthService.openHealthSettings();
    } catch {
      toast({ title: 'Error', description: 'Failed to open health settings', variant: 'destructive' });
    }
  };

  const handleInstallHealthConnect = () => {
    window.open('https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata', '_system');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" data-testid="loader-devices" />
      </div>
    );
  }

  const platform = Capacitor.getPlatform();
  const isIOS = platform === 'ios';
  const isHuawei = providerName === 'huawei_health';
  const displayName = isIOS ? 'Apple Health' : isHuawei ? 'Huawei Health' : 'Health Connect';
  const Icon = isIOS ? Smartphone : Activity;
  const description = isIOS
    ? 'Powered by HealthKit - Sync steps, calories, and workouts from Apple Health'
    : isHuawei
      ? 'Connect to Huawei Health to automatically sync your fitness data'
      : 'Connect to Health Connect to automatically sync your fitness data';

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Health Tracking</h2>
        <p className="text-muted-foreground">
          Connect your fitness devices and health apps to automatically sync your data
        </p>
      </div>

      {/* Native health section (iOS / Android / Huawei) */}
      {!isNativePlatform ? (
        <Card data-testid="card-native-not-available">
          <CardHeader>
            <CardTitle>Native Health Integration</CardTitle>
            <CardDescription>
              Health tracking is only available on iOS and Android mobile apps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Download the FayaFlex mobile app to automatically sync your fitness data from Apple Health or Health Connect.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card data-testid="card-native-health">
          {isIOS && (
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-t-lg bg-primary/10 border-b border-primary/20"
              data-testid="banner-healthkit-disclosure"
            >
              <Heart className="h-4 w-4 text-primary shrink-0" />
              <p className="text-xs font-medium text-primary">
                This app uses Apple HealthKit to read your fitness data
              </p>
              <Link href="/health-data" className="ml-auto text-xs text-primary underline shrink-0" data-testid="link-healthkit-learn-more">
                Learn more
              </Link>
            </div>
          )}
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Icon className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>{displayName}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </div>
              </div>
              {isConnected ? (
                <Badge className="gap-1" data-testid="badge-native-connected">
                  <CheckCircle className="h-3 w-3" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1" data-testid="badge-native-disconnected">
                  <XCircle className="h-3 w-3" />
                  Not Connected
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!nativeAvailable ? (
              <div className="rounded-md bg-muted p-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  {isIOS
                    ? 'Apple Health is not available on this device.'
                    : isHuawei
                      ? 'Huawei Health Kit integration requires HMS Core SDK setup.'
                      : 'Health Connect is not installed. Please install it from the Play Store.'}
                </p>
                {isHuawei && (
                  <div className="text-sm space-y-2">
                    <p className="font-medium">To enable Huawei Health:</p>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                      <li>Install Huawei Health app from AppGallery</li>
                      <li>Enable HMS Core on your device</li>
                      <li>Developer: Configure HMS Health Kit SDK</li>
                    </ol>
                  </div>
                )}
                {!isIOS && !isHuawei && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={handleInstallHealthConnect}
                    data-testid="button-install-health-connect"
                  >
                    Install Health Connect
                  </Button>
                )}
              </div>
            ) : (
              <>
                {isConnected && getDeviceConnection()?.lastSyncAt && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw className="h-4 w-4" />
                    <span data-testid="text-native-last-sync">
                      Last synced: {formatLastSync(getDeviceConnection()?.lastSyncAt ?? null)}
                    </span>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  {!isConnected ? (
                    <Button
                      onClick={() => connectNativeMutation.mutate()}
                      disabled={connectNativeMutation.isPending}
                      data-testid="button-connect-native"
                    >
                      {connectNativeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Connect {displayName}
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={() => syncMutation.mutate()}
                        disabled={syncMutation.isPending}
                        data-testid="button-sync-native"
                      >
                        {syncMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Sync Now
                      </Button>
                      <Button
                        onClick={handleOpenSettings}
                        variant="outline"
                        data-testid="button-open-settings"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Button>
                      <Button
                        onClick={() => disconnectMutation.mutate()}
                        disabled={disconnectMutation.isPending}
                        variant="outline"
                        data-testid="button-disconnect-native"
                      >
                        Disconnect
                      </Button>
                    </>
                  )}
                </div>

                {isConnected && (
                  <div className="rounded-md bg-muted p-4 space-y-2">
                    <h4 className="font-medium text-sm">How it works:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      {isIOS ? (
                        <>
                          <li>FayaFlex uses Apple HealthKit to read your daily steps and calories</li>
                          <li>Your HealthKit data stays on your device until you sync</li>
                          <li>Tap "Sync Now" to upload your HealthKit data to FayaFlex</li>
                          <li>HealthKit data syncs for the last 30 days</li>
                        </>
                      ) : (
                        <>
                          <li>FayaFlex reads your daily steps and calories from {displayName}</li>
                          <li>Your data stays on your device until you sync</li>
                          <li>Tap "Sync Now" whenever you want to update your activities</li>
                          <li>Data syncs for the last 30 days</li>
                        </>
                      )}
                    </ul>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Garmin Connect card — always visible on all platforms */}
      <GarminCard
        devices={devices}
        isNative={isNativePlatform}
        nativeProviderName={providerName}
      />

      {/* Health Data Disclosure */}
      {isNativePlatform && (
        <Card data-testid="card-health-data-disclosure">
          <CardHeader className="pb-2 pt-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold">
                {isIOS ? 'Apple HealthKit — Health Data Access' : 'Health Data We Access'}
              </CardTitle>
            </div>
            {isIOS && (
              <CardDescription className="mt-1">
                FayaFlex uses Apple HealthKit APIs to read your fitness data. This data stays on your device until you choose to sync.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="pt-0 pb-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="gap-1 text-xs">
                <Footprints className="h-3 w-3" /> Steps
              </Badge>
              <Badge variant="secondary" className="gap-1 text-xs">
                <Flame className="h-3 w-3" /> Active Calories
              </Badge>
              <Badge variant="secondary" className="gap-1 text-xs">
                <Dumbbell className="h-3 w-3" /> Workouts
              </Badge>
              <Badge variant="secondary" className="gap-1 text-xs">
                <MapPin className="h-3 w-3" /> Distance
              </Badge>
              <Badge variant="secondary" className="gap-1 text-xs">
                <Heart className="h-3 w-3" /> Heart Rate
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Your health data is used only to calculate fitness scores and team leaderboard rankings. We never sell or share your data with third parties.
            </p>
            <div className="flex gap-4">
              <Link href="/health-data" data-testid="link-health-data-details">
                <Button variant="outline" size="sm">
                  <Info className="mr-1 h-3 w-3" />
                  Health Data Details
                </Button>
              </Link>
              <Link href="/privacy" data-testid="link-health-privacy">
                <Button variant="ghost" size="sm">
                  Privacy Policy
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
