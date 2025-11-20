import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Smartphone, Activity, RefreshCw, CheckCircle, XCircle, Loader2, Settings } from 'lucide-react';
import { healthService } from '@/lib/healthService';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Capacitor } from '@capacitor/core';

interface DeviceConnection {
  provider: string;
  isConnected: boolean;
  lastSyncAt: Date | null;
}

export function HealthDevices() {
  const { toast } = useToast();
  const [nativeAvailable, setNativeAvailable] = useState(false);
  const [nativePermissionsGranted, setNativePermissionsGranted] = useState(false);
  const [isNativePlatform, setIsNativePlatform] = useState(false);
  const [providerName, setProviderName] = useState<'apple_health' | 'android_health' | 'huawei_health'>('android_health');

  const { data: devices, isLoading } = useQuery<DeviceConnection[]>({
    queryKey: ['/api/devices']
  });

  useEffect(() => {
    checkNativeHealth();
  }, []);

  async function checkNativeHealth() {
    const isNative = Capacitor.isNativePlatform();
    setIsNativePlatform(isNative);
    
    if (!isNative) {
      return;
    }

    const provider = await healthService.getProviderName();
    setProviderName(provider);

    // Huawei Health Kit requires HMS SDK integration
    if (provider === 'huawei_health') {
      setNativeAvailable(false);
      return;
    }

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

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const healthData = await healthService.getHealthData(startDate, endDate);

      const provider = await healthService.getProviderName();
      await apiRequest('POST', '/api/devices/sync', {
        provider,
        activities: healthData
      });

      return provider;
    },
    onSuccess: (provider) => {
      const displayName = provider === 'apple_health' ? 'Apple Health' : 
                         provider === 'huawei_health' ? 'Huawei Health' : 'Health Connect';
      toast({
        title: 'Connected!',
        description: `Successfully connected to ${displayName} and synced your fitness data`,
      });
      setNativePermissionsGranted(true);
      queryClient.invalidateQueries({ queryKey: ['/api/devices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
    },
    onError: (error) => {
      toast({
        title: 'Connection failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const healthData = await healthService.getHealthData(startDate, endDate);
      const provider = await healthService.getProviderName();

      return await apiRequest('POST', '/api/devices/sync', {
        provider,
        activities: healthData
      });
    },
    onSuccess: () => {
      const displayName = providerName === 'apple_health' ? 'Apple Health' :
                         providerName === 'huawei_health' ? 'Huawei Health' : 'Health Connect';
      toast({
        title: 'Synced!',
        description: `Successfully synced data from ${displayName}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/devices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
    },
    onError: (error) => {
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const provider = await healthService.getProviderName();
      return await apiRequest('POST', '/api/devices/toggle', {
        provider,
        isConnected: false
      });
    },
    onSuccess: () => {
      const displayName = providerName === 'apple_health' ? 'Apple Health' :
                         providerName === 'huawei_health' ? 'Huawei Health' : 'Health Connect';
      toast({
        title: 'Disconnected',
        description: `Disconnected from ${displayName}`,
      });
      setNativePermissionsGranted(false);
      queryClient.invalidateQueries({ queryKey: ['/api/devices'] });
    },
    onError: (error) => {
      toast({
        title: 'Disconnect failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    }
  });

  const handleOpenSettings = async () => {
    try {
      await healthService.openHealthSettings();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to open health settings',
        variant: 'destructive'
      });
    }
  };

  const getDeviceConnection = () => {
    return devices?.find(d => d.provider === providerName);
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

  if (!isNativePlatform) {
    return (
      <Card data-testid="card-native-not-available">
        <CardHeader>
          <CardTitle>Native Health Integration</CardTitle>
          <CardDescription>
            Health tracking is only available on iOS and Android mobile apps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Download the UFC mobile app to automatically sync your fitness data from Apple Health or Health Connect.
          </p>
        </CardContent>
      </Card>
    );
  }

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
    ? 'Connect to Apple Health to automatically sync your fitness data'
    : isHuawei 
      ? 'Connect to Huawei Health to automatically sync your fitness data'
      : 'Connect to Health Connect to automatically sync your fitness data';

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Health Tracking</h2>
        <p className="text-muted-foreground">
          Automatically sync your fitness data from your device
        </p>
      </div>

      <Card data-testid="card-native-health">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Icon className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>{displayName}</CardTitle>
                <CardDescription>{description}</CardDescription>
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
                  <p className="text-muted-foreground text-xs italic mt-2">
                    Note: This feature requires additional development setup and is currently in progress.
                  </p>
                </div>
              )}
              {!isIOS && !isHuawei && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={handleOpenSettings}
                  data-testid="button-install-health-connect"
                >
                  Install Health Connect
                </Button>
              )}
            </div>
          ) : (
            <>
              {nativePermissionsGranted && getDeviceConnection()?.lastSyncAt && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4" />
                  <span data-testid="text-native-last-sync">
                    Last synced: {formatLastSync(getDeviceConnection()?.lastSyncAt || null)}
                  </span>
                </div>
              )}
              
              <div className="flex gap-2 flex-wrap">
                {!nativePermissionsGranted ? (
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

              {nativePermissionsGranted && (
                <div className="rounded-md bg-muted p-4 space-y-2">
                  <h4 className="font-medium text-sm">How it works:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>UFC reads your daily steps and calories from {displayName}</li>
                    <li>Your data stays on your device until you sync</li>
                    <li>Tap "Sync Now" whenever you want to update your activities</li>
                    <li>Data syncs for the last 30 days</li>
                  </ul>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
