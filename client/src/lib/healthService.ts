import { Health } from 'capacitor-health';
import { Capacitor, registerPlugin } from '@capacitor/core';

export interface HealthDataPoint {
  date: string; // YYYY-MM-DD
  calories: number;
  steps: number;
  workouts: number;
}

export interface DetailedWorkout {
  externalId: string;
  workoutType: string;
  calories?: number | null;
  durationMinutes?: number | null;
  distanceMeters?: number | null;
  avgHeartRate?: number | null;
  elevationGainMeters?: number | null;
}

// iOS HealthKit plugin (custom native Swift plugin)
interface HealthKitPluginInterface {
  isAvailable(): Promise<{ available: boolean }>;
  requestPermissions(): Promise<{ granted: boolean; error?: string }>;
  getDailyTotals(): Promise<{ steps: number; calories: number }>;
  getWorkouts(options?: { limit?: number }): Promise<{ workouts: any[] }>;
  getHealthData(options: { startDate: string; endDate: string }): Promise<{ data: HealthDataPoint[] }>;
}

// Huawei HMS Health Kit plugin (custom native Kotlin plugin)
interface HuaweiHealthPluginInterface {
  isAvailable(): Promise<{ available: boolean }>;
  requestPermissions(): Promise<{ granted: boolean; error?: string }>;
  getHealthData(options: { startDate: string; endDate: string }): Promise<{ data: HealthDataPoint[] }>;
  openHealthSettings(): Promise<void>;
}

const HealthKit = registerPlugin<HealthKitPluginInterface>('HealthKit');
const HuaweiHealth = registerPlugin<HuaweiHealthPluginInterface>('HuaweiHealth');

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

      // Huawei devices: check HMS Core availability
      const provider = await this.getProviderName();
      if (provider === 'huawei_health') {
        const result = await HuaweiHealth.isAvailable();
        console.log('[HealthService] Huawei HMS available:', result.available);
        return result.available;
      }

      // Standard Android: Health Connect
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

      // Huawei: HMS sign-in with health scopes (replaces Health Connect permission dialog)
      const provider = await this.getProviderName();
      if (provider === 'huawei_health') {
        console.log('[HealthService] Huawei - Requesting HMS Health permissions via Huawei ID sign-in...');
        const result = await HuaweiHealth.requestPermissions();
        console.log('[HealthService] Huawei permission result:', JSON.stringify(result));
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

      // Huawei: treat similar to iOS — auth state is managed by the HMS sign-in result
      const provider = await this.getProviderName();
      if (provider === 'huawei_health') {
        console.log('[HealthService] Huawei - skipping explicit permission check (HMS auth manages this)');
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

      // Huawei: Use HMS Health Kit plugin (bypasses Health Connect entirely)
      const provider = await this.getProviderName();
      if (provider === 'huawei_health') {
        console.log('[HealthService] Huawei - Using HMS Health Kit plugin');
        const result = await HuaweiHealth.getHealthData({
          startDate: startDateStr,
          endDate: endDateStr
        });
        const data: HealthDataPoint[] = result.data || [];
        console.log('[HealthService] Huawei HMS data:', data.length, 'days');
        // HMS Health Kit returns activeKilocalories directly (no BMR subtraction needed)
        return data;
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

      // Android: Convert total calories → active calories by subtracting the prorated resting burn.
      //
      // Formula: Active Cal = max(0, Total − BMR_prorated)
      //   BMR source  : user's profile value if set, otherwise population average (1,555 kcal/day)
      //   BMR_prorated: BMR × (hoursElapsed / 24)  ← for today's partial-day bucket
      //                 BMR × 1                    ← for completed past-day buckets
      //
      // Why prorate?  BMR is a 24-hour number.  Subtracting the full value mid-day produced
      // zeros until >1,296 kcal had been burned.  Prorating by elapsed hours gives meaningful
      // active-calorie estimates at any time of day — even after just one hour of exercise.
      //
      // Example (BMR 1,600, sync at noon — 12 h elapsed):
      //   Total burned = 900 kcal  →  BMR deduction = 1600 × 12/24 = 800  →  active = 100 ✓
      const AVG_BMR = 1555; // kcal/day — population average when no user BMR is set
      const effectiveBmr = userBmr || AVG_BMR;
      const needsAndroidConversion = this.isAndroid() && usedCalorieDataType === 'total-calories';

      // Today's local date string — identifies the partial-day bucket.
      const todayLocalStr = (() => {
        const n = new Date();
        return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
      })();
      // Minutes elapsed since local midnight — 1,440 minutes in a full day.
      const minutesElapsedToday = (() => {
        const n = new Date();
        return n.getHours() * 60 + n.getMinutes() + n.getSeconds() / 60;
      })();
      const MINUTES_PER_DAY = 1440;

      if (needsAndroidConversion) {
        const bmrSource = userBmr ? `user BMR: ${userBmr}` : `avg BMR: ${AVG_BMR}`;
        console.log(`[HealthService] Android: prorated BMR subtraction (${bmrSource}, ${Math.round(minutesElapsedToday)}min elapsed today)`);
      }

      // Process calories - use aggregated data, or workout calories as fallback
      if (!useWorkoutCaloriesFallback) {
        for (const sample of caloriesResult.aggregatedData || []) {
          const date = getSampleDate(sample);
          if (!date) continue;
          let calorieValue = getSampleValue(sample);

          if (needsAndroidConversion && calorieValue > 0) {
            // Past completed days use the full daily BMR; today uses only the elapsed-minute fraction.
            const isToday = date === todayLocalStr;
            const bmrFraction = isToday ? minutesElapsedToday / MINUTES_PER_DAY : 1;
            const bmrToSubtract = Math.round(effectiveBmr * bmrFraction);
            const originalValue = calorieValue;
            calorieValue = Math.max(0, calorieValue - bmrToSubtract);
            // For past completed days: values < 50 kcal are within the noise floor of
            // the population-average BMR estimate (individual BMRs vary ±200+ kcal/day).
            // Zeroing them avoids micro-bars for rest days that look like data errors.
            if (!isToday && calorieValue < 50) {
              calorieValue = 0;
            }
            console.log(`[HealthService] Android calorie: ${originalValue} total - ${bmrToSubtract} resting${isToday ? ` (${Math.round(minutesElapsedToday)}min)` : ' (full day)'} = ${calorieValue} active`);
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

  /**
   * Returns individual workouts (last `daysBack` days) with rich per-workout
   * metadata (calories, distance, duration, etc.) for posting to the feed.
   * Each workout has a stable externalId so the server can dedupe across syncs.
   */
  async getDetailedWorkouts(daysBack: number = 30): Promise<DetailedWorkout[]> {
    if (!Capacitor.isNativePlatform()) return [];
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);
      const startStr = startDate.toISOString();
      const endStr = endDate.toISOString();

      const MAX_WORKOUTS = 100; // server caps at 100 per sync
      if (this.isIOS()) {
        const result = await HealthKit.getWorkouts({ limit: MAX_WORKOUTS });
        const raw = (result as any)?.workouts || [];
        const cutoff = startDate.getTime();
        // Map raw HKWorkoutActivityType integer to a friendly name. We do this
        // here (in JS, which auto-updates from fayaflex.com) instead of relying
        // on the native plugin's activityTypeName, which is baked into older
        // installed app builds and may return the generic fallback "workout"
        // for activity types that were added to the Swift switch later.
        const HK_ACTIVITY_NAMES: Record<number, string> = {
          1: 'american football', 2: 'archery', 3: 'australian football', 4: 'badminton',
          5: 'baseball', 6: 'basketball', 7: 'bowling', 8: 'boxing', 9: 'climbing',
          10: 'cricket', 11: 'cross training', 12: 'curling', 13: 'cycling', 14: 'dance',
          16: 'elliptical', 17: 'equestrian', 18: 'fencing', 19: 'fishing',
          20: 'weightlifting', 21: 'golf', 22: 'gymnastics', 23: 'handball',
          24: 'hiking', 25: 'hockey', 26: 'hunting', 27: 'lacrosse',
          28: 'martial arts', 29: 'mind and body', 31: 'paddle sports', 32: 'play',
          33: 'preparation and recovery', 34: 'racquetball', 35: 'rowing', 36: 'rugby',
          37: 'running', 38: 'sailing', 39: 'skating', 40: 'snow sports',
          41: 'soccer', 42: 'softball', 43: 'squash', 44: 'stair climbing',
          45: 'surfing', 46: 'swimming', 47: 'table tennis', 48: 'tennis',
          49: 'track and field', 50: 'weightlifting', 51: 'volleyball', 52: 'walking',
          53: 'water fitness', 54: 'water polo', 55: 'water sports', 56: 'wrestling',
          57: 'yoga', 58: 'barre', 59: 'core training', 60: 'cross country skiing',
          61: 'downhill skiing', 62: 'stretching', 63: 'HIIT', 64: 'jump rope',
          65: 'kickboxing', 66: 'pilates', 67: 'snowboarding', 68: 'stair climbing',
          69: 'step training', 70: 'wheelchair walk', 71: 'wheelchair run',
          72: 'tai chi', 73: 'cardio', 74: 'hand cycling', 75: 'disc sports',
          76: 'fitness gaming', 77: 'cardio dance', 78: 'social dance', 79: 'pickleball',
          80: 'cooldown', 82: 'swim bike run', 83: 'transition',
        };
        return raw
          .filter((w: any) => {
            const t = new Date(w?.startDate || w?.start || 0).getTime();
            return !isNaN(t) && t >= cutoff;
          })
          .map((w: any) => {
            const rawType = typeof w.activityType === 'number' ? w.activityType : null;
            const mappedFromInt = rawType != null ? HK_ACTIVITY_NAMES[rawType] : null;
            const nativeName = typeof w.activityTypeName === 'string' && w.activityTypeName.trim().toLowerCase() !== 'workout'
              ? w.activityTypeName
              : null;
            const workoutType = nativeName || mappedFromInt || 'workout';
            return {
            externalId: String(w.uuid || `${w.startDate}-${w.activityType}`),
            workoutType,
            startedAt: w.startDate || w.start || null,
            calories: typeof w.calories === 'number' ? w.calories : null,
            durationMinutes: typeof w.duration === 'number' ? Math.round(w.duration / 60) : null,
            distanceMeters: typeof w.distanceMeters === 'number' && w.distanceMeters > 0 ? w.distanceMeters : null,
            elevationGainMeters: typeof w.elevationGainMeters === 'number' && w.elevationGainMeters > 0 ? w.elevationGainMeters : null,
            avgHeartRate: typeof w.avgHeartRate === 'number' && w.avgHeartRate > 0 ? w.avgHeartRate : null,
            };
          });
      }

      // Huawei: HMS plugin doesn't expose per-workout metadata yet
      const provider = await this.getProviderName();
      if (provider === 'huawei_health') return [];

      // Android: capacitor-health queryWorkouts (with heart rate)
      const resp: any = await Health.queryWorkouts({
        startDate: startStr,
        endDate: endStr,
        includeHeartRate: true,
        includeRoute: false,
        includeSteps: false,
      });
      const raw: any[] = resp?.workouts || [];
      return raw.map((w: any) => {
        const start = w?.startDate || w?.start;
        const externalId = String(w?.id || w?.uuid || `${start}-${w?.workoutType || w?.type || 'workout'}`);
        const durationSec = typeof w?.duration === 'number' ? w.duration : null;
        const heartRates: number[] = Array.isArray(w?.heartRate)
          ? w.heartRate.map((h: any) => h?.bpm ?? h?.value).filter((v: any) => typeof v === 'number')
          : [];
        const avgHr = heartRates.length > 0
          ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length)
          : null;
        return {
          externalId,
          workoutType: String(w?.workoutType || w?.type || 'workout').toLowerCase().replace(/_/g, ' '),
          startedAt: start ? new Date(start).toISOString() : null,
          calories: typeof w?.calories === 'number' ? Math.round(w.calories) : null,
          durationMinutes: durationSec ? Math.round(durationSec / 60) : null,
          distanceMeters: typeof w?.distance === 'number' && w.distance > 0 ? Math.round(w.distance) : null,
          avgHeartRate: avgHr,
          elevationGainMeters: null,
        };
      });
    } catch (error) {
      console.error('[HealthService] getDetailedWorkouts failed:', error);
      return [];
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
    // Detect Huawei devices on Android
    if (Capacitor.getPlatform() === 'android') {
      try {
        // 1. Fast heuristic: check user agent string for Huawei/Honor brand
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('huawei') || userAgent.includes('honor')) {
          console.log('[HealthService] Huawei detected via user agent');
          return 'huawei';
        }

        // 2. Definitive check: ask the native HMS plugin directly.
        //    If HMS Core is installed and ready, this device is a Huawei/Honor device.
        const result = await HuaweiHealth.isAvailable();
        if (result.available) {
          console.log('[HealthService] Huawei detected via HMS isAvailable()');
          return 'huawei';
        }
      } catch (error) {
        // HMS plugin not present (GMS-only device) — continue to standard Android path
        console.log('[HealthService] HMS not available, treating as standard Android:', error);
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
        return;
      }
      const provider = await this.getProviderName();
      if (provider === 'huawei_health') {
        await HuaweiHealth.openHealthSettings();
        return;
      }
      await Health.openHealthConnectSettings();
    } catch (error) {
      console.error('[HealthService] Error opening health settings:', error);
    }
  }

  async showPermissionsRationale(): Promise<void> {
    try {
      console.log('[HealthService] Opening permissions rationale...');
      if (Capacitor.getPlatform() === 'ios') {
        await Health.openAppleHealthSettings();
        return;
      }
      const provider = await this.getProviderName();
      if (provider === 'huawei_health') {
        // For Huawei, open the Health app directly
        await HuaweiHealth.openHealthSettings();
        return;
      }
      // Standard Android: Health Connect
      try {
        await Health.openHealthConnectSettings();
      } catch (intentError) {
        console.log('[HealthService] Could not launch rationale, falling back to Play Store');
        window.open('https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata', '_system');
      }
    } catch (error) {
      console.error('[HealthService] Error showing permissions rationale:', error);
    }
  }
}

export const healthService = new HealthService();
