import { Health } from 'capacitor-health';
import { Capacitor, registerPlugin } from '@capacitor/core';

export interface HealthDataPoint {
  date: string; // YYYY-MM-DD
  calories: number;
  steps: number;
  workouts: number;
}

interface HealthKitPluginInterface {
  isAvailable(): Promise<{ available: boolean }>;
  requestPermissions(): Promise<{ granted: boolean; error?: string }>;
  getDailyTotals(): Promise<{ steps: number; calories: number }>;
  getWorkouts(options?: { limit?: number }): Promise<{ workouts: any[] }>;
  getHealthData(options: { startDate: string; endDate: string }): Promise<{ data: HealthDataPoint[] }>;
}

const HealthKit = registerPlugin<HealthKitPluginInterface>('HealthKit');

class HealthService {
  private isIOS(): boolean {
    return Capacitor.getPlatform() === 'ios';
  }

  async isAvailable(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }
    
    try {
      if (this.isIOS()) {
        const result = await HealthKit.isAvailable();
        console.log('[HealthService] iOS HealthKit available:', result.available);
        return result.available;
      }
      const result = await Health.isHealthAvailable();
      return result.available;
    } catch (error) {
      console.error('Error checking health availability:', error);
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const platform = Capacitor.getPlatform();
      console.log('[HealthService] Platform detected:', platform);
      
      // iOS: Use native HealthKit plugin
      if (this.isIOS()) {
        console.log('[HealthService] iOS - Requesting HealthKit permissions...');
        const result = await HealthKit.requestPermissions();
        console.log('[HealthService] iOS permission result:', JSON.stringify(result));
        // Note: iOS HealthKit doesn't reveal if user granted or denied
        // We return true if no error, and verify by trying to read data
        return result.granted !== false;
      }
      
      // Android: Use capacitor-health plugin
      // Request ALL permissions at once so user sees a single dialog with all data types
      // Permission names must match the CapHealthPermission enum in the plugin:
      // READ_STEPS, READ_WORKOUTS, READ_HEART_RATE, READ_ROUTE, READ_ACTIVE_CALORIES, READ_TOTAL_CALORIES, READ_DISTANCE
      const permissions = [
        'READ_STEPS',
        'READ_ACTIVE_CALORIES',
        'READ_TOTAL_CALORIES',
        'READ_DISTANCE',
        'READ_HEART_RATE',
        'READ_WORKOUTS'
      ];
      console.log('[HealthService] Android - Requesting ALL permissions in single dialog:', permissions);
      
      const result = await Health.requestHealthPermissions({
        permissions: permissions as any
      });
      
      console.log('[HealthService] Permission request result:', JSON.stringify(result));
      
      // Android: Check if permissions were actually granted
      // The plugin returns: { permissions: { READ_STEPS: true, READ_ACTIVE_CALORIES: false, ... } }
      console.log('[HealthService] Full permission result:', JSON.stringify(result));
      
      if (result.permissions && typeof result.permissions === 'object') {
        // Handle both object and array formats
        const permsObj = Array.isArray(result.permissions) ? result.permissions[0] : result.permissions;
        if (permsObj && typeof permsObj === 'object') {
          const permValues = Object.values(permsObj);
          const hasAnyPermission = permValues.some(granted => granted === true);
          console.log('[HealthService] Permission values:', permValues, 'Has any granted:', hasAnyPermission);
          return hasAnyPermission;
        }
      }
      
      // Fallback: verify by checking permissions (Android only)
      console.log('[HealthService] Fallback: checking permissions via checkPermissions()');
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
      const platform = Capacitor.getPlatform();
      console.log('[HealthService] checkPermissions - platform:', platform);
      
      // iOS: We cannot reliably check permissions due to Apple's privacy restrictions
      // Return true and let data query fail if permissions weren't granted
      if (this.isIOS()) {
        console.log('[HealthService] iOS - skipping permission check (Apple privacy restriction)');
        return true;
      }
      
      // Android only: check permissions
      // Permission names must match the CapHealthPermission enum in the plugin
      const permissions = [
        'READ_STEPS',
        'READ_ACTIVE_CALORIES',
        'READ_TOTAL_CALORIES',
        'READ_DISTANCE',
        'READ_HEART_RATE',
        'READ_WORKOUTS'
      ];
      const result = await Health.checkHealthPermissions({
        permissions: permissions as any
      });
      
      console.log('[HealthService] checkPermissions result:', JSON.stringify(result));
      
      // The plugin returns: { permissions: { READ_STEPS: true, READ_ACTIVE_CALORIES: false, ... } }
      if (result.permissions && typeof result.permissions === 'object') {
        // Handle both object and array formats
        const permsObj = Array.isArray(result.permissions) ? result.permissions[0] : result.permissions;
        if (permsObj && typeof permsObj === 'object') {
          const hasAnyPermission = Object.values(permsObj).some(granted => granted === true);
          console.log('[HealthService] checkPermissions has any granted:', hasAnyPermission);
          return hasAnyPermission;
        }
      }
      
      return false;
    } catch (error: any) {
      console.error('Error checking health permissions:', error);
      return false;
    }
  }

  private isAndroid(): boolean {
    return Capacitor.getPlatform() === 'android';
  }

  async getHealthData(startDate: Date, endDate: Date, userBmr?: number | null): Promise<HealthDataPoint[]> {
    try {
      console.log('[HealthService] Fetching health data from', startDate.toISOString(), 'to', endDate.toISOString());
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();

      // iOS: Use native HealthKit plugin
      if (this.isIOS()) {
        console.log('[HealthService] iOS - Using native HealthKit plugin');
        const result = await HealthKit.getHealthData({
          startDate: startDateStr,
          endDate: endDateStr
        });
        console.log('[HealthService] iOS HealthKit data:', result.data?.length || 0, 'days');
        return result.data || [];
      }

      // Android: Use capacitor-health plugin
      console.log('[HealthService] Android - Using capacitor-health plugin');
      
      // Fetch steps data
      let stepsResult: any = { aggregatedData: [] };
      try {
        const rawSteps: any = await Health.queryAggregated({
          startDate: startDateStr,
          endDate: endDateStr,
          dataType: 'steps',
          bucket: 'day'
        });
        stepsResult.aggregatedData = rawSteps?.aggregatedData || rawSteps?.data || rawSteps || [];
        console.log('[HealthService] Steps processed:', stepsResult.aggregatedData?.length || 0, 'records');
      } catch (stepsError) {
        console.warn('[HealthService] Failed to fetch steps, continuing:', stepsError);
      }

      // Fetch calories - try multiple data types to capture all calories
      // Android Health Connect has: ActiveCaloriesBurnedRecord, TotalCaloriesBurnedRecord, BasalMetabolicRateRecord
      // IMPORTANT: Prioritize active-calories for fitness tracking (exercise calories, not total/basal)
      let caloriesResult: any = { aggregatedData: [] };
      let usedCalorieDataType = '';
      
      // Try different calorie data types in order of preference
      // Samsung Health writes to TotalCaloriesBurnedRecord, so try total-calories first
      // active-calories (ActiveCaloriesBurnedRecord) is often empty on Samsung devices
      const calorieDataTypes = ['total-calories', 'active-calories'];
      
      for (const dataType of calorieDataTypes) {
        try {
          console.log(`[HealthService] Trying calorie dataType: ${dataType}`);
          const rawCalories: any = await Health.queryAggregated({
            startDate: startDateStr,
            endDate: endDateStr,
            dataType: dataType,
            bucket: 'day'
          });
          const data = rawCalories?.aggregatedData || rawCalories?.data || rawCalories || [];
          const total = data.reduce((sum: number, s: any) => sum + (s?.value ?? s?.quantity ?? 0), 0);
          console.log(`[HealthService] ${dataType}: ${data.length} records, total=${Math.round(total)}`);
          
          if (data.length > 0) {
            console.log(`[HealthService] ${dataType} sample:`, JSON.stringify(data[0]));
          }
          
          // Use this data type if it has meaningful data
          if (total > 0) {
            caloriesResult.aggregatedData = data;
            usedCalorieDataType = dataType;
            console.log(`[HealthService] Using ${dataType} for calories (total: ${Math.round(total)})`);
            break;
          }
        } catch (err) {
          console.log(`[HealthService] ${dataType} not available:`, err);
        }
      }
      
      // If no aggregated calories, try querying individual records
      if (caloriesResult.aggregatedData.length === 0) {
        console.log('[HealthService] Trying individual calorie records query...');
        try {
          const individualCalories: any = await Health.query({
            startDate: startDateStr,
            endDate: endDateStr,
            dataType: 'total-calories'
          });
          const records = individualCalories?.records || individualCalories?.data || [];
          console.log(`[HealthService] Individual calorie records: ${records.length}`);
          if (records.length > 0) {
            console.log('[HealthService] Individual record sample:', JSON.stringify(records[0]));
            // Group by date
            const byDate = new Map<string, number>();
            for (const record of records) {
              const date = this.extractDate(record?.startDate || record?.start || record?.date);
              if (date) {
                const value = record?.value ?? record?.energy ?? record?.calories ?? 0;
                byDate.set(date, (byDate.get(date) || 0) + value);
              }
            }
            caloriesResult.aggregatedData = Array.from(byDate.entries()).map(([date, value]) => ({
              startDate: date,
              value: value
            }));
            console.log('[HealthService] Grouped individual records:', caloriesResult.aggregatedData.length);
          }
        } catch (queryErr) {
          console.log('[HealthService] Individual query not available:', queryErr);
        }
      }
      
      console.log('[HealthService] Final calories result:', caloriesResult.aggregatedData?.length || 0, 'records');

      // Fetch workouts (contains calories per workout as fallback)
      let workoutsData: any[] = [];
      try {
        const workoutsResponse: any = await Health.queryWorkouts({
          startDate: startDateStr,
          endDate: endDateStr,
          includeHeartRate: false,
          includeRoute: false,
          includeSteps: false
        });
        workoutsData = workoutsResponse?.workouts || [];
        console.log('[HealthService] Workouts fetched:', workoutsData?.length || 0);
        if (workoutsData?.length > 0) {
          const totalWorkoutCalories = workoutsData.reduce((sum, w) => sum + (w.calories || 0), 0);
          console.log('[HealthService] Total workout calories:', totalWorkoutCalories);
        }
      } catch (workoutError) {
        console.log('[HealthService] queryWorkouts not available:', workoutError);
      }

      // Check if aggregated calories returned nothing - use workout calories as fallback
      const aggregatedCaloriesTotal = (caloriesResult.aggregatedData || []).reduce(
        (sum: number, s: any) => sum + (s?.value ?? s?.quantity ?? 0), 0
      );
      const useWorkoutCaloriesFallback = aggregatedCaloriesTotal === 0 && workoutsData.length > 0;
      if (useWorkoutCaloriesFallback) {
        console.log('[HealthService] Using workout calories as fallback (aggregated returned 0)');
      }

      // Combine data by date
      const dataByDate = new Map<string, HealthDataPoint>();

      const getOrCreate = (date: string): HealthDataPoint => {
        if (!dataByDate.has(date)) {
          dataByDate.set(date, { date, calories: 0, steps: 0, workouts: 0 });
        }
        return dataByDate.get(date)!;
      };

      const getSampleDate = (sample: any): string | null => {
        const dateStr = sample?.startDate || sample?.start || sample?.date;
        if (!dateStr) return null;
        return this.extractDate(dateStr);
      };

      const getSampleValue = (sample: any): number => {
        const value = sample?.value ?? sample?.quantity ?? sample?.count ?? 0;
        return typeof value === 'number' ? Math.round(value) : 0;
      };

      // Process steps
      for (const sample of stepsResult.aggregatedData || []) {
        const date = getSampleDate(sample);
        if (!date) continue;
        getOrCreate(date).steps += getSampleValue(sample);
      }

      // Android: Convert total calories → active calories using BMR formula.
      // Formula: Active Cal = max(0, Total × 1.2 − BMR)
      // ONLY applied when: Android + total-calories data + user has EXPLICITLY set their BMR.
      // Without a user-set BMR we use the raw total-calories value as-is — showing the
      // fallback-converted result produced zeros mid-day (threshold = BMR/1.2 ≈ 1296 kcal).
      const needsAndroidConversion = this.isAndroid() && usedCalorieDataType === 'total-calories' && !!userBmr;
      const effectiveBmr = userBmr ?? 0;
      if (needsAndroidConversion) {
        console.log(`[HealthService] Android: Converting total → active calories (user BMR: ${userBmr})`);
      } else if (this.isAndroid() && usedCalorieDataType === 'total-calories') {
        console.log('[HealthService] Android: No BMR set — using raw total-calories (set BMR in profile to see active-only)');
      }

      // Process calories - use aggregated data, or workout calories as fallback
      if (!useWorkoutCaloriesFallback) {
        for (const sample of caloriesResult.aggregatedData || []) {
          const date = getSampleDate(sample);
          if (!date) continue;
          let calorieValue = getSampleValue(sample);
          
          if (needsAndroidConversion && calorieValue > 0) {
            const originalValue = calorieValue;
            calorieValue = Math.max(0, Math.round(calorieValue * 1.2 - effectiveBmr));
            console.log(`[HealthService] Android calorie conversion: ${originalValue} total -> ${calorieValue} active (BMR: ${effectiveBmr})`);
          }
          
          getOrCreate(date).calories += calorieValue;
        }
      }

      // Process workouts - count them, and use their calories if fallback is needed
      for (const workout of workoutsData || []) {
        const date = getSampleDate(workout);
        if (!date) continue;
        getOrCreate(date).workouts += 1;
        
        // Use workout calories as fallback when aggregated returns 0
        if (useWorkoutCaloriesFallback) {
          const workoutCalories = workout?.calories || 0;
          if (workoutCalories > 0) {
            getOrCreate(date).calories += Math.round(workoutCalories);
          }
        }
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
    try {
      // Already in YYYY-MM-DD format — return as-is
      if (/^\d{4}-\d{2}-\d{2}$/.test(isoString)) return isoString;

      const date = new Date(isoString);
      if (isNaN(date.getTime())) throw new Error('Invalid date');

      // Health Connect returns bucket START times at UTC midnight (e.g. "2026-04-03T00:00:00Z").
      // Converting UTC midnight directly to local time fails for UTC- users:
      //   UTC-5: "2026-04-03T00:00:00Z" → "2026-04-02T19:00:00" → April 2 (yesterday!) ✗
      // Fix: shift to UTC NOON (+12h) before reading the local date. Noon UTC always
      // maps to the correct local date for every timezone from UTC-11 to UTC+11.
      //   UTC-5: "2026-04-03T12:00:00Z" → "2026-04-03T07:00:00" → April 3 ✓
      //   UTC+8: "2026-04-03T12:00:00Z" → "2026-04-03T20:00:00" → April 3 ✓
      const noonUTC = new Date(date.getTime() + 12 * 60 * 60 * 1000);
      const y = noonUTC.getFullYear();
      const m = String(noonUTC.getMonth() + 1).padStart(2, '0');
      const d = String(noonUTC.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    } catch {
      console.warn('[HealthService] Failed to parse date:', isoString);
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
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
