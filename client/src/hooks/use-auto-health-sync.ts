import { useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { healthService } from '@/lib/healthService';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

const SYNC_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes cooldown between syncs
const LAST_SYNC_KEY = 'ufc_last_auto_sync';

export function useAutoHealthSync() {
  const { user } = useAuth();
  const isSyncingRef = useRef(false);

  const performSync = useCallback(async () => {
    // Only sync on native platforms
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // Don't sync if not logged in
    if (!user) {
      console.log('[AutoSync] No user logged in, skipping sync');
      return;
    }

    // Check cooldown to prevent excessive syncing
    const lastSyncTime = localStorage.getItem(LAST_SYNC_KEY);
    if (lastSyncTime) {
      const timeSinceLastSync = Date.now() - parseInt(lastSyncTime, 10);
      if (timeSinceLastSync < SYNC_COOLDOWN_MS) {
        console.log('[AutoSync] Within cooldown period, skipping sync');
        return;
      }
    }

    // Prevent concurrent syncs
    if (isSyncingRef.current) {
      console.log('[AutoSync] Sync already in progress, skipping');
      return;
    }

    try {
      isSyncingRef.current = true;
      console.log('[AutoSync] Starting automatic health sync...');

      // Check if health is available
      const isAvailable = await healthService.isAvailable();
      if (!isAvailable) {
        console.log('[AutoSync] Health service not available');
        return;
      }

      // Get the provider name
      const provider = await healthService.getProviderName();
      console.log('[AutoSync] Provider:', provider);

      // Fetch health data for the last 7 days (incremental sync)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      console.log('[AutoSync] Fetching health data from', startDate.toISOString(), 'to', endDate.toISOString());
      
      const healthData = await healthService.getHealthData(startDate, endDate);
      
      if (healthData.length === 0) {
        console.log('[AutoSync] No health data to sync');
        localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
        return;
      }

      console.log('[AutoSync] Syncing', healthData.length, 'days of health data');

      // Send to backend
      await apiRequest('POST', '/api/devices/sync', {
        provider,
        activities: healthData
      });

      console.log('[AutoSync] Health data synced successfully');

      // Update last sync time
      localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());

      // Invalidate relevant queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['/api/devices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/progress/chart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/daily-breakdown'] });

    } catch (error) {
      console.error('[AutoSync] Failed to sync health data:', error);
      // Don't throw - this is a background operation
    } finally {
      isSyncingRef.current = false;
    }
  }, [user]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // Sync on initial app load
    const initialSyncTimeout = setTimeout(() => {
      performSync();
    }, 2000); // Small delay to let the app fully initialize

    // Listen for app state changes (resume from background)
    let appStateListener: any;
    
    const setupAppStateListener = async () => {
      try {
        appStateListener = await App.addListener('appStateChange', (state) => {
          console.log('[AutoSync] App state changed:', state.isActive ? 'active' : 'background');
          if (state.isActive) {
            // App came to foreground - sync health data
            performSync();
          }
        });
      } catch (error) {
        console.error('[AutoSync] Failed to setup app state listener:', error);
      }
    };

    setupAppStateListener();

    // Cleanup
    return () => {
      clearTimeout(initialSyncTimeout);
      if (appStateListener) {
        appStateListener.remove();
      }
    };
  }, [performSync]);

  // Return a manual sync function for edge cases
  return { syncNow: performSync };
}
