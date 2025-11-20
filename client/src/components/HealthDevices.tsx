import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Activity, Smartphone, Watch, RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { healthService } from '@/lib/healthService';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Capacitor } from '@capacitor/core';

interface DeviceConnection {
  provider: string;
  isConnected: boolean;
  lastSyncAt: Date | null;
}

const deviceInfo = {
  google_fit: {
    name: 'Google Fit',
    description: 'Connect your Google Fit account to sync fitness data',
    icon: Activity,
    color: 'text-green-600 dark:text-green-400'
  },
  apple_health: {
    name: 'Apple Health',
    description: 'Connect to Apple Health to sync your iOS health data',
    icon: Smartphone,
    color: 'text-blue-600 dark:text-blue-400'
  },
  android_health: {
    name: 'Health Connect',
    description: 'Connect to Android Health Connect for fitness tracking',
    icon: Activity,
    color: 'text-green-600 dark:text-green-400'
  },
  garmin: {
    name: 'Garmin Connect',
    description: 'Connect your Garmin device to automatically sync activities',
    icon: Watch,
    color: 'text-orange-600 dark:text-orange-400'
  }
};

export function HealthDevices() {
  const { toast } = useToast();
  const [nativeAvailable, setNativeAvailable] = useState(false);
  const [nativePermissionsGranted, setNativePermissionsGranted] = useState(false);

  const { data: devices, isLoading } = useQuery<DeviceConnection[]>({
    queryKey: ['/api/devices']
  });

  useEffect(() => {
    checkNativeHealth();
  }, []);

  async function checkNativeHealth() {
    const available = await healthService.isAvailable();
    setNativeAvailable(available);

    if (available) {
      const hasPermissions = await healthService.checkPermissions();
      setNativePermissionsGranted(hasPermissions);
    }
  }

  const connectNativeMutation = useMutation({
    mutationFn: async () => {
      const granted = await healthService.requestPermissions();
      if (!granted) {
        throw new Error('Health permissions not granted');
      }

      // Fetch last 30 days of health data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const healthData = await healthService.getHealthData(startDate, endDate);

      // Sync to backend
      const provider = healthService.getProviderName();
      await apiRequest('POST', '/api/devices/sync', {
        provider,
        activities: healthData
      });

      return provider;
    },
    onSuccess: (provider) => {
      toast({
        title: 'Connected!',
        description: `Successfully connected to ${deviceInfo[provider as keyof typeof deviceInfo]?.name || provider}`,
      });
      setNativePermissionsGranted(true);
      queryClient.invalidateQueries({ queryKey: ['/api/devices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Connection failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const connectGoogleFitMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/google-fit/connect', {
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      return data.authUrl;
    },
    onSuccess: (authUrl) => {
      window.location.href = authUrl;
    },
    onError: (error: Error) => {
      toast({
        title: 'Connection failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const connectGarminMutation = useMutation({
    mutationFn: async () => {
      window.location.href = '/api/garmin/connect';
    }
  });

  const syncMutation = useMutation({
    mutationFn: async (provider: string) => {
      if (provider === 'apple_health' || provider === 'android_health') {
        // Sync native health data
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const healthData = await healthService.getHealthData(startDate, endDate);

        return await apiRequest('POST', '/api/devices/sync', {
          provider,
          activities: healthData
        });
      } else {
        // Sync web-based provider (Google Fit, Garmin)
        return await apiRequest('POST', `/api/${provider.replace('_', '-')}/sync`, {});
      }
    },
    onSuccess: (_, provider) => {
      toast({
        title: 'Synced!',
        description: `Successfully synced data from ${deviceInfo[provider as keyof typeof deviceInfo]?.name || provider}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/devices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Sync failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: async (provider: string) => {
      return await apiRequest('POST', '/api/devices/toggle', {
        provider,
        isConnected: false
      });
    },
    onSuccess: (_, provider) => {
      toast({
        title: 'Disconnected',
        description: `Disconnected from ${deviceInfo[provider as keyof typeof deviceInfo]?.name || provider}`,
      });
      if (provider === 'apple_health' || provider === 'android_health') {
        setNativePermissionsGranted(false);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/devices'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Disconnect failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const getDeviceConnection = (provider: string) => {
    return devices?.find(d => d.provider === provider);
  };

  const formatLastSync = (lastSyncAt: Date | null) => {
    if (!lastSyncAt) return 'Never synced';
    const date = new Date(lastSyncAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" data-testid="loader-devices" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Health Device Connections</h2>
        <p className="text-muted-foreground">
          Connect your fitness devices and apps to automatically sync your activity data
        </p>
      </div>

      {/* Native Health (iOS/Android) */}
      {nativeAvailable && (
        <Card data-testid="card-native-health">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {Capacitor.getPlatform() === 'ios' ? (
                  <Smartphone className={deviceInfo.apple_health.color} />
                ) : (
                  <Activity className={deviceInfo.android_health.color} />
                )}
                <div>
                  <CardTitle>
                    {Capacitor.getPlatform() === 'ios' ? deviceInfo.apple_health.name : deviceInfo.android_health.name}
                  </CardTitle>
                  <CardDescription>
                    {Capacitor.getPlatform() === 'ios' ? deviceInfo.apple_health.description : deviceInfo.android_health.description}
                  </CardDescription>
                </div>
              </div>
              {nativePermissionsGranted ? (
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
          <CardContent className="space-y-3">
            {nativePermissionsGranted && getDeviceConnection(healthService.getProviderName())?.lastSyncAt && (
              <p className="text-sm text-muted-foreground" data-testid="text-native-last-sync">
                Last synced: {formatLastSync(getDeviceConnection(healthService.getProviderName())?.lastSyncAt || null)}
              </p>
            )}
            <div className="flex gap-2">
              {!nativePermissionsGranted ? (
                <Button
                  onClick={() => connectNativeMutation.mutate()}
                  disabled={connectNativeMutation.isPending}
                  data-testid="button-connect-native"
                >
                  {connectNativeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Connect
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => syncMutation.mutate(healthService.getProviderName())}
                    disabled={syncMutation.isPending}
                    variant="default"
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
                    onClick={() => disconnectMutation.mutate(healthService.getProviderName())}
                    disabled={disconnectMutation.isPending}
                    variant="outline"
                    data-testid="button-disconnect-native"
                  >
                    Disconnect
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Google Fit */}
      <Card data-testid="card-google-fit">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className={deviceInfo.google_fit.color} />
              <div>
                <CardTitle>{deviceInfo.google_fit.name}</CardTitle>
                <CardDescription>{deviceInfo.google_fit.description}</CardDescription>
              </div>
            </div>
            {getDeviceConnection('google_fit')?.isConnected ? (
              <Badge className="gap-1" data-testid="badge-google-fit-connected">
                <CheckCircle className="h-3 w-3" />
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1" data-testid="badge-google-fit-disconnected">
                <XCircle className="h-3 w-3" />
                Not Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {getDeviceConnection('google_fit')?.lastSyncAt && (
            <p className="text-sm text-muted-foreground" data-testid="text-google-fit-last-sync">
              Last synced: {formatLastSync(getDeviceConnection('google_fit')?.lastSyncAt || null)}
            </p>
          )}
          <div className="flex gap-2">
            {!getDeviceConnection('google_fit')?.isConnected ? (
              <Button
                onClick={() => connectGoogleFitMutation.mutate()}
                disabled={connectGoogleFitMutation.isPending}
                data-testid="button-connect-google-fit"
              >
                {connectGoogleFitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Connect
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => syncMutation.mutate('google_fit')}
                  disabled={syncMutation.isPending}
                  variant="default"
                  data-testid="button-sync-google-fit"
                >
                  {syncMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Sync Now
                </Button>
                <Button
                  onClick={() => disconnectMutation.mutate('google_fit')}
                  disabled={disconnectMutation.isPending}
                  variant="outline"
                  data-testid="button-disconnect-google-fit"
                >
                  Disconnect
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Garmin */}
      <Card data-testid="card-garmin">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Watch className={deviceInfo.garmin.color} />
              <div>
                <CardTitle>{deviceInfo.garmin.name}</CardTitle>
                <CardDescription>{deviceInfo.garmin.description}</CardDescription>
              </div>
            </div>
            {getDeviceConnection('garmin')?.isConnected ? (
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
        <CardContent className="space-y-3">
          {getDeviceConnection('garmin')?.lastSyncAt && (
            <p className="text-sm text-muted-foreground" data-testid="text-garmin-last-sync">
              Last synced: {formatLastSync(getDeviceConnection('garmin')?.lastSyncAt || null)}
            </p>
          )}
          <div className="flex gap-2">
            {!getDeviceConnection('garmin')?.isConnected ? (
              <Button
                onClick={() => connectGarminMutation.mutate()}
                disabled={connectGarminMutation.isPending}
                data-testid="button-connect-garmin"
              >
                {connectGarminMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Connect
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => syncMutation.mutate('garmin')}
                  disabled={syncMutation.isPending}
                  variant="default"
                  data-testid="button-sync-garmin"
                >
                  {syncMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Sync Now
                </Button>
                <Button
                  onClick={() => disconnectMutation.mutate('garmin')}
                  disabled={disconnectMutation.isPending}
                  variant="outline"
                  data-testid="button-disconnect-garmin"
                >
                  Disconnect
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
