import { useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { healthService } from '@/lib/healthService';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

const FULL_SYNC_COOLDOWN_MS  = 5 * 60 * 1000; // 5 min between full 7-day syncs
const TODAY_POLL_INTERVAL_MS = 60 * 1000;      // poll today's data every 60 seconds
const LAST_FULL_SYNC_KEY     = 'ufc_last_auto_sync';

export function useAutoHealthSync() {
  const { user } = useAuth();
  const isFullSyncingRef  = useRef(false);
  const isTodaySyncingRef = useRef(false);
  const todayIntervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const appActiveRef      = useRef(true);

  // ── helpers ────────────────────────────────────────────────────────────────

  const getProvider = useCallback(async () => {
    const isAvailable = await healthService.isAvailable();
    if (!isAvailable) return null;
    return healthService.getProviderName();
  }, []);

  const invalidateTodayQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/devices'] });
    queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
    queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
    queryClient.invalidateQueries({ queryKey: ['/api/progress/chart'] });
    queryClient.invalidateQueries({ queryKey: ['/api/stats/daily-breakdown'] });
  }, []);

  // ── Today-only sync (runs every 60 s while active) ─────────────────────────

  const performTodaySync = useCallback(async () => {
    if (!Capacitor.isNativePlatform() || !user || !appActiveRef.current) return;
    if (isTodaySyncingRef.current) return;

    try {
      isTodaySyncingRef.current = true;

      const provider = await getProvider();
      if (!provider) return;

      // Query only today
      const endDate   = new Date();
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0); // midnight today

      console.log('[TodaySync] Fetching today\'s health data...');
      const healthData = await healthService.getHealthData(startDate, endDate, (user as any)?.bmr);

      if (healthData.length === 0) {
        console.log('[TodaySync] No data for today yet');
        return;
      }

      const syncResponse = await apiRequest('POST', '/api/devices/sync', {
        provider,
        activities: healthData
      });

      if (syncResponse.ok) {
        console.log('[TodaySync] Today\'s data updated:', JSON.stringify(healthData));
        invalidateTodayQueries();
      }
    } catch (error) {
      console.error('[TodaySync] Failed:', error);
    } finally {
      isTodaySyncingRef.current = false;
    }
  }, [user, getProvider, invalidateTodayQueries]);

  // ── Full 7-day sync (runs on load + foreground resume, 5-min cooldown) ─────

  const performFullSync = useCallback(async () => {
    if (!Capacitor.isNativePlatform() || !user) return;
    if (isFullSyncingRef.current) return;

    const lastSyncTime = localStorage.getItem(LAST_FULL_SYNC_KEY);
    if (lastSyncTime) {
      const elapsed = Date.now() - parseInt(lastSyncTime, 10);
      if (elapsed < FULL_SYNC_COOLDOWN_MS) {
        console.log('[FullSync] Within cooldown, skipping');
        return;
      }
    }

    try {
      isFullSyncingRef.current = true;
      console.log('[FullSync] Starting 7-day health sync...');

      const provider = await getProvider();
      if (!provider) return;

      const endDate   = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const healthData = await healthService.getHealthData(startDate, endDate, (user as any)?.bmr);

      if (healthData.length === 0) {
        console.log('[FullSync] No health data');
        localStorage.setItem(LAST_FULL_SYNC_KEY, Date.now().toString());
        return;
      }

      console.log('[FullSync] Syncing', healthData.length, 'days');
      const syncResponse = await apiRequest('POST', '/api/devices/sync', {
        provider,
        activities: healthData
      });

      if (syncResponse.ok) {
        console.log('[FullSync] Sync complete');
      } else {
        console.warn('[FullSync] Sync response not ok:', syncResponse.status);
      }

      localStorage.setItem(LAST_FULL_SYNC_KEY, Date.now().toString());
      invalidateTodayQueries();

    } catch (error) {
      console.error('[FullSync] Failed:', error);
    } finally {
      isFullSyncingRef.current = false;
    }
  }, [user, getProvider, invalidateTodayQueries]);

  // ── Interval management ────────────────────────────────────────────────────

  const startTodayPolling = useCallback(() => {
    if (todayIntervalRef.current) return; // already running
    console.log('[TodaySync] Starting real-time polling (every 60 s)');
    todayIntervalRef.current = setInterval(performTodaySync, TODAY_POLL_INTERVAL_MS);
  }, [performTodaySync]);

  const stopTodayPolling = useCallback(() => {
    if (todayIntervalRef.current) {
      clearInterval(todayIntervalRef.current);
      todayIntervalRef.current = null;
      console.log('[TodaySync] Polling paused (app in background)');
    }
  }, []);

  // ── Effect: wires everything together ──────────────────────────────────────

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Initial load: full sync + first today-sync, then start polling
    const initialTimeout = setTimeout(async () => {
      await performFullSync();
      await performTodaySync();
      startTodayPolling();
    }, 2000);

    // Foreground / background transitions
    let appStateListener: any;
    const setupListener = async () => {
      try {
        appStateListener = await App.addListener('appStateChange', (state) => {
          appActiveRef.current = state.isActive;
          if (state.isActive) {
            console.log('[AutoSync] App foregrounded');
            performFullSync();
            performTodaySync();
            startTodayPolling();
          } else {
            console.log('[AutoSync] App backgrounded — pausing poll');
            stopTodayPolling();
          }
        });
      } catch (error) {
        console.error('[AutoSync] Failed to setup app state listener:', error);
      }
    };

    setupListener();

    return () => {
      clearTimeout(initialTimeout);
      stopTodayPolling();
      if (appStateListener) appStateListener.remove();
    };
  }, [performFullSync, performTodaySync, startTodayPolling, stopTodayPolling]);

  return { syncNow: performFullSync, syncToday: performTodaySync };
}
