import { Health } from 'capacitor-health';
import { Capacitor } from '@capacitor/core';

export interface HealthDataPoint {
  date: string; // YYYY-MM-DD
  calories: number;
  steps: number;
  workouts: number;
}

class HealthService {
  async isAvailable(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }
    
    try {
      const result = await Health.isHealthAvailable();
      return result.available;
    } catch (error) {
      console.error('Error checking health availability:', error);
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      console.log('[HealthService] Requesting health permissions...');
      const isIOS = Capacitor.getPlatform() === 'ios';
      // iOS uses READ_WORKOUTS, Android uses READ_EXERCISE
      const permissions = isIOS 
        ? ['READ_STEPS', 'READ_ACTIVE_CALORIES', 'READ_WORKOUTS']
        : ['READ_STEPS', 'READ_ACTIVE_CALORIES', 'READ_EXERCISE'];
      console.log('[HealthService] Requesting permissions:', permissions);
      const result = await Health.requestHealthPermissions({
        permissions: permissions as any
      });
      
      console.log('[HealthService] Permission request result:', JSON.stringify(result));
      
      // iOS PRIVACY NOTE: Apple HealthKit does NOT tell apps whether permissions were granted
      // The authorization status is intentionally hidden for privacy reasons
      // On iOS, we must assume permissions were granted after showing the dialog
      // and verify by actually trying to read data
      if (Capacitor.getPlatform() === 'ios') {
        console.log('[HealthService] iOS platform - assuming permissions granted after dialog shown');
        // On iOS, if no error was thrown, the dialog was shown and user made a choice
        // We can't know what they chose, so we return true and try to read data
        return true;
      }
      
      // Android: Check if permissions were actually granted
      if (result.permissions && result.permissions.length > 0) {
        const permissions = result.permissions[0];
        const hasAnyPermission = Object.values(permissions).some(granted => granted === true);
        console.log('[HealthService] Has any permission granted:', hasAnyPermission);
        return hasAnyPermission;
      }
      
      // Fallback: verify by checking permissions
      const verified = await this.checkPermissions();
      console.log('[HealthService] Verified permissions:', verified);
      return verified;
    } catch (error) {
      console.error('[HealthService] Error requesting health permissions:', error);
      return false;
    }
  }

  async checkPermissions(): Promise<boolean> {
    try {
      const isIOS = Capacitor.getPlatform() === 'ios';
      
      // iOS PRIVACY NOTE: HealthKit doesn't reveal authorization status
      // We can't reliably check permissions on iOS, so return true and let data query fail if denied
      if (isIOS) {
        console.log('[HealthService] iOS - cannot reliably check permissions, returning true');
        return true;
      }
      
      // iOS uses READ_WORKOUTS, Android uses READ_EXERCISE
      const permissions = isIOS 
        ? ['READ_STEPS', 'READ_ACTIVE_CALORIES', 'READ_WORKOUTS']
        : ['READ_STEPS', 'READ_ACTIVE_CALORIES', 'READ_EXERCISE'];
      const result = await Health.checkHealthPermissions({
        permissions: permissions as any
      });
      
      // Check if at least one permission is granted
      if (result.permissions && result.permissions.length > 0) {
        const permissions = result.permissions[0];
        return Object.values(permissions).some(granted => granted === true);
      }
      
      return false;
    } catch (error) {
      console.error('Error checking health permissions:', error);
      return false;
    }
  }

  async getHealthData(startDate: Date, endDate: Date): Promise<HealthDataPoint[]> {
    try {
      console.log('[HealthService] Fetching health data from', startDate.toISOString(), 'to', endDate.toISOString());
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();
      const isIOS = Capacitor.getPlatform() === 'ios';

      // Fetch steps data
      let stepsResult: any = { aggregatedData: [] };
      try {
        stepsResult = await Health.queryAggregated({
          startDate: startDateStr,
          endDate: endDateStr,
          dataType: 'steps',
          bucket: 'day'
        });
        console.log('[HealthService] Steps result:', stepsResult.aggregatedData?.length || 0, 'records');
      } catch (stepsError) {
        console.warn('[HealthService] Failed to fetch steps, continuing:', stepsError);
      }

      // Fetch calories data
      let caloriesResult: any = { aggregatedData: [] };
      try {
        caloriesResult = await Health.queryAggregated({
          startDate: startDateStr,
          endDate: endDateStr,
          dataType: 'active-calories',
          bucket: 'day'
        });
        console.log('[HealthService] Calories result:', caloriesResult.aggregatedData?.length || 0, 'records');
      } catch (caloriesError) {
        console.warn('[HealthService] Failed to fetch calories, continuing:', caloriesError);
      }

      // Fetch exercise/workout data - iOS uses different API than Android
      let workoutsResult: any = { aggregatedData: [] };
      try {
        if (isIOS) {
          // iOS: Query workouts using the workouts API
          console.log('[HealthService] iOS - querying workouts...');
          const workoutsResponse = await (Health as any).queryWorkouts({
            startDate: startDateStr,
            endDate: endDateStr
          });
          // Convert workout sessions to daily counts
          const workoutsByDay: Record<string, number> = {};
          if (workoutsResponse?.workouts) {
            for (const workout of workoutsResponse.workouts) {
              const day = new Date(workout.startDate).toISOString().split('T')[0];
              workoutsByDay[day] = (workoutsByDay[day] || 0) + 1;
            }
          }
          workoutsResult.aggregatedData = Object.entries(workoutsByDay).map(([date, count]) => ({
            startDate: date,
            value: count
          }));
          console.log('[HealthService] iOS workouts result:', workoutsResult.aggregatedData.length, 'days');
        } else {
          // Android: Query exercise sessions using aggregated API
          workoutsResult = await (Health as any).queryAggregated({
            startDate: startDateStr,
            endDate: endDateStr,
            dataType: 'exercise',
            bucket: 'day'
          });
          console.log('[HealthService] Exercise/workouts result:', workoutsResult?.aggregatedData?.length || 0, 'records');
        }
      } catch (workoutError) {
        // Exercise data may not be available on all devices - gracefully handle
        console.log('[HealthService] Exercise query not supported, skipping:', workoutError);
      }

      // Combine data by date
      const dataByDate = new Map<string, HealthDataPoint>();

      // Helper to initialize a date entry
      const getOrCreate = (date: string): HealthDataPoint => {
        if (!dataByDate.has(date)) {
          dataByDate.set(date, { date, calories: 0, steps: 0, workouts: 0 });
        }
        return dataByDate.get(date)!;
      };

      // Process steps
      for (const sample of stepsResult.aggregatedData || []) {
        const date = this.extractDate(sample.startDate);
        const point = getOrCreate(date);
        point.steps += Math.round(sample.value);
      }

      // Process calories
      for (const sample of caloriesResult.aggregatedData || []) {
        const date = this.extractDate(sample.startDate);
        const point = getOrCreate(date);
        point.calories += Math.round(sample.value);
      }

      // Process workouts (count number of exercise sessions per day)
      for (const sample of workoutsResult.aggregatedData || []) {
        const date = this.extractDate(sample.startDate);
        const point = getOrCreate(date);
        // Each aggregated exercise record counts as 1 workout
        point.workouts += 1;
      }

      const result = Array.from(dataByDate.values()).sort((a, b) => 
        a.date.localeCompare(b.date)
      );
      console.log('[HealthService] Total health data points:', result.length);
      return result;
    } catch (error) {
      console.error('[HealthService] Error fetching health data:', error);
      throw error;
    }
  }

  private extractDate(isoString: string): string {
    return isoString.split('T')[0];
  }

  async detectManufacturer(): Promise<string> {
    // Detect Huawei devices
    if (Capacitor.getPlatform() === 'android') {
      try {
        // Check for Huawei manufacturer via Device plugin if available
        // For now, we'll check if HMS Core is available
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('huawei') || userAgent.includes('honor')) {
          return 'huawei';
        }
      } catch (error) {
        console.error('Error detecting manufacturer:', error);
      }
    }
    return 'standard';
  }

  async getProviderName(): Promise<'apple_health' | 'android_health' | 'huawei_health'> {
    const platform = Capacitor.getPlatform();
    
    if (platform === 'ios') {
      return 'apple_health';
    } else if (platform === 'android') {
      const manufacturer = await this.detectManufacturer();
      return manufacturer === 'huawei' ? 'huawei_health' : 'android_health';
    }
    
    return 'android_health'; // Default
  }

  async openHealthSettings(): Promise<void> {
    try {
      if (Capacitor.getPlatform() === 'ios') {
        await Health.openAppleHealthSettings();
      } else {
        await Health.openHealthConnectSettings();
      }
    } catch (error) {
      console.error('[HealthService] Error opening health settings:', error);
    }
  }

  async showPermissionsRationale(): Promise<void> {
    try {
      console.log('[HealthService] Opening permissions rationale...');
      if (Capacitor.getPlatform() === 'android') {
        // Try to launch the ACTION_SHOW_PERMISSIONS_RATIONALE intent as per PDF requirements
        // This intent is declared in AndroidManifest.xml and handled by PermissionsRationaleActivity
        try {
          // Attempt to open Health Connect with rationale flow
          // The registered PermissionsRationaleActivity in AndroidManifest will handle this
          await Health.openHealthConnectSettings();
        } catch (intentError) {
          console.log('[HealthService] Could not launch rationale, falling back to Play Store');
          // If Health Connect is not installed, open Play Store to install it
          window.open('https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata', '_system');
        }
      } else if (Capacitor.getPlatform() === 'ios') {
        await Health.openAppleHealthSettings();
      }
    } catch (error) {
      console.error('[HealthService] Error showing permissions rationale:', error);
    }
  }
}

export const healthService = new HealthService();
