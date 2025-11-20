import { Health } from 'capacitor-health';
import { Capacitor } from '@capacitor/core';

export interface HealthDataPoint {
  date: string; // YYYY-MM-DD
  calories: number;
  steps: number;
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
      const result = await Health.requestHealthPermissions({
        permissions: ['READ_STEPS', 'READ_ACTIVE_CALORIES', 'READ_WORKOUTS']
      });
      
      // iOS always returns true if permissions were requested
      // Android returns actual permission status
      return true;
    } catch (error) {
      console.error('Error requesting health permissions:', error);
      return false;
    }
  }

  async checkPermissions(): Promise<boolean> {
    try {
      const result = await Health.checkHealthPermissions({
        permissions: ['READ_STEPS', 'READ_ACTIVE_CALORIES', 'READ_WORKOUTS']
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
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();

      // Fetch steps data
      const stepsResult = await Health.queryAggregated({
        startDate: startDateStr,
        endDate: endDateStr,
        dataType: 'steps',
        bucket: 'day'
      });

      // Fetch calories data
      const caloriesResult = await Health.queryAggregated({
        startDate: startDateStr,
        endDate: endDateStr,
        dataType: 'active-calories',
        bucket: 'day'
      });

      // Combine data by date
      const dataByDate = new Map<string, HealthDataPoint>();

      // Process steps
      for (const sample of stepsResult.aggregatedData || []) {
        const date = this.extractDate(sample.startDate);
        if (!dataByDate.has(date)) {
          dataByDate.set(date, { date, calories: 0, steps: 0 });
        }
        const point = dataByDate.get(date)!;
        point.steps += Math.round(sample.value);
      }

      // Process calories
      for (const sample of caloriesResult.aggregatedData || []) {
        const date = this.extractDate(sample.startDate);
        if (!dataByDate.has(date)) {
          dataByDate.set(date, { date, calories: 0, steps: 0 });
        }
        const point = dataByDate.get(date)!;
        point.calories += Math.round(sample.value);
      }

      return Array.from(dataByDate.values()).sort((a, b) => 
        a.date.localeCompare(b.date)
      );
    } catch (error) {
      console.error('Error fetching health data:', error);
      throw error;
    }
  }

  private extractDate(isoString: string): string {
    return isoString.split('T')[0];
  }

  getProviderName(): 'apple_health' | 'android_health' {
    return Capacitor.getPlatform() === 'ios' ? 'apple_health' : 'android_health';
  }

  async openHealthSettings(): Promise<void> {
    try {
      if (Capacitor.getPlatform() === 'ios') {
        await Health.openAppleHealthSettings();
      } else {
        await Health.openHealthConnectSettings();
      }
    } catch (error) {
      console.error('Error opening health settings:', error);
    }
  }
}

export const healthService = new HealthService();
