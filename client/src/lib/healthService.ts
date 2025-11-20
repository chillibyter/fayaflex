import { CapacitorHealth, RecordType, RecordData, TimeRangedQuery } from 'capacitor-health';
import { Capacitor } from '@capacitor/core';

export interface HealthDataPoint {
  date: string; // YYYY-MM-DD
  calories: number;
  steps: number;
  workoutType?: string;
}

class HealthService {
  async isAvailable(): Promise<boolean> {
    return Capacitor.isNativePlatform();
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const result = await CapacitorHealth.requestAuthorization({
        read: [
          RecordType.Steps,
          RecordType.ActiveEnergyBurned,
          RecordType.ExerciseSession,
          RecordType.Distance
        ],
        write: []
      });
      return result.granted;
    } catch (error) {
      console.error('Error requesting health permissions:', error);
      return false;
    }
  }

  async checkPermissions(): Promise<boolean> {
    try {
      const result = await CapacitorHealth.checkPermissions({
        read: [
          RecordType.Steps,
          RecordType.ActiveEnergyBurned,
          RecordType.ExerciseSession
        ]
      });
      return result.granted;
    } catch (error) {
      console.error('Error checking health permissions:', error);
      return false;
    }
  }

  async getHealthData(startDate: Date, endDate: Date): Promise<HealthDataPoint[]> {
    try {
      const query: TimeRangedQuery = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };

      // Fetch steps
      const stepsData = await CapacitorHealth.queryRecords({
        recordType: RecordType.Steps,
        ...query
      });

      // Fetch calories
      const caloriesData = await CapacitorHealth.queryRecords({
        recordType: RecordType.ActiveEnergyBurned,
        ...query
      });

      // Aggregate data by date
      const dataByDate = new Map<string, HealthDataPoint>();

      // Process steps
      for (const record of stepsData.records || []) {
        const date = this.extractDate(record.startDate);
        if (!dataByDate.has(date)) {
          dataByDate.set(date, { date, calories: 0, steps: 0 });
        }
        const point = dataByDate.get(date)!;
        point.steps += Math.round(this.getNumericValue(record));
      }

      // Process calories
      for (const record of caloriesData.records || []) {
        const date = this.extractDate(record.startDate);
        if (!dataByDate.has(date)) {
          dataByDate.set(date, { date, calories: 0, steps: 0 });
        }
        const point = dataByDate.get(date)!;
        point.calories += Math.round(this.getNumericValue(record));
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

  private getNumericValue(record: RecordData): number {
    if (typeof record.value === 'number') {
      return record.value;
    }
    if (typeof record.value === 'string') {
      return parseFloat(record.value) || 0;
    }
    return 0;
  }

  getProviderName(): 'apple_health' | 'android_health' {
    return Capacitor.getPlatform() === 'ios' ? 'apple_health' : 'android_health';
  }
}

export const healthService = new HealthService();
