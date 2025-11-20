import { google } from 'googleapis';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import type { Request, Response } from 'express';

export interface HealthActivity {
  date: string; // YYYY-MM-DD
  calories: number;
  steps: number;
  workoutType?: string;
}

export class GoogleFitService {
  private oauth2Client: any;

  constructor() {
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI) {
      this.oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );
    }
  }

  isConfigured(): boolean {
    return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  }

  getAuthUrl(state: string): string {
    if (!this.oauth2Client) {
      throw new Error('Google Fit not configured');
    }

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/fitness.activity.read',
        'https://www.googleapis.com/auth/fitness.body.read'
      ],
      state
    });
  }

  async getTokensFromCode(code: string) {
    if (!this.oauth2Client) {
      throw new Error('Google Fit not configured');
    }

    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  async refreshAccessToken(refreshToken: string) {
    if (!this.oauth2Client) {
      throw new Error('Google Fit not configured');
    }

    this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await this.oauth2Client.refreshAccessToken();
    return credentials;
  }

  async getHealthData(accessToken: string, startDate: Date, endDate: Date): Promise<HealthActivity[]> {
    if (!this.oauth2Client) {
      throw new Error('Google Fit not configured');
    }

    this.oauth2Client.setCredentials({ access_token: accessToken });
    const fitness = google.fitness({ version: 'v1', auth: this.oauth2Client });

    const startTimeMillis = startDate.getTime();
    const endTimeMillis = endDate.getTime();

    // Aggregate steps and calories by day
    const response = await fitness.users.dataset.aggregate({
      userId: 'me',
      requestBody: {
        aggregateBy: [
          { dataTypeName: 'com.google.step_count.delta' },
          { dataTypeName: 'com.google.calories.expended' }
        ],
        bucketByTime: { durationMillis: 86400000 }, // 1 day
        startTimeMillis,
        endTimeMillis
      }
    });

    const activities: HealthActivity[] = [];
    const buckets = response.data.bucket || [];

    for (const bucket of buckets) {
      const date = new Date(parseInt(bucket.startTimeMillis!));
      const dateStr = date.toISOString().split('T')[0];

      let steps = 0;
      let calories = 0;

      for (const dataset of bucket.dataset || []) {
        for (const point of dataset.point || []) {
          if (dataset.dataSourceId?.includes('step_count')) {
            steps += point.value?.[0]?.intVal || 0;
          } else if (dataset.dataSourceId?.includes('calories')) {
            calories += point.value?.[0]?.fpVal || 0;
          }
        }
      }

      if (steps > 0 || calories > 0) {
        activities.push({
          date: dateStr,
          calories: Math.round(calories),
          steps,
          workoutType: 'general'
        });
      }
    }

    return activities;
  }
}

export class GarminService {
  private oauth: any;

  constructor() {
    if (process.env.GARMIN_CONSUMER_KEY && process.env.GARMIN_CONSUMER_SECRET) {
      this.oauth = OAuth({
        consumer: {
          key: process.env.GARMIN_CONSUMER_KEY,
          secret: process.env.GARMIN_CONSUMER_SECRET
        },
        signature_method: 'HMAC-SHA1',
        hash_function(base_string: string, key: string) {
          return crypto
            .createHmac('sha1', key)
            .update(base_string)
            .digest('base64');
        }
      });
    }
  }

  isConfigured(): boolean {
    return !!(process.env.GARMIN_CONSUMER_KEY && process.env.GARMIN_CONSUMER_SECRET);
  }

  async getRequestToken(callbackUrl: string): Promise<{ token: string; tokenSecret: string }> {
    if (!this.oauth) {
      throw new Error('Garmin not configured');
    }

    const requestData = {
      url: 'https://connectapi.garmin.com/oauth-service/oauth/request_token',
      method: 'POST',
      data: { oauth_callback: callbackUrl }
    };

    const authHeader = this.oauth.toHeader(this.oauth.authorize(requestData));

    const response = await fetch(requestData.url, {
      method: 'POST',
      headers: {
        ...authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const text = await response.text();
    const params = new URLSearchParams(text);

    return {
      token: params.get('oauth_token')!,
      tokenSecret: params.get('oauth_token_secret')!
    };
  }

  getAuthUrl(requestToken: string): string {
    return `https://connect.garmin.com/oauthConfirm?oauth_token=${requestToken}`;
  }

  async getAccessToken(requestToken: string, tokenSecret: string, verifier: string): Promise<{ token: string; tokenSecret: string }> {
    if (!this.oauth) {
      throw new Error('Garmin not configured');
    }

    const requestData = {
      url: 'https://connectapi.garmin.com/oauth-service/oauth/access_token',
      method: 'POST'
    };

    const token = {
      key: requestToken,
      secret: tokenSecret
    };

    const authHeader = this.oauth.toHeader(
      this.oauth.authorize(requestData, token)
    );

    const response = await fetch(`${requestData.url}?oauth_verifier=${verifier}`, {
      method: 'POST',
      headers: {
        ...authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const text = await response.text();
    const params = new URLSearchParams(text);

    return {
      token: params.get('oauth_token')!,
      tokenSecret: params.get('oauth_token_secret')!
    };
  }

  async getHealthData(accessToken: string, accessTokenSecret: string, startDate: Date, endDate: Date): Promise<HealthActivity[]> {
    if (!this.oauth) {
      throw new Error('Garmin not configured');
    }

    const dateStr = startDate.toISOString().split('T')[0];

    const requestData = {
      url: `https://apis.garmin.com/wellness-api/rest/dailies`,
      method: 'GET'
    };

    const token = {
      key: accessToken,
      secret: accessTokenSecret
    };

    const authHeader = this.oauth.toHeader(
      this.oauth.authorize(requestData, token)
    );

    const response = await fetch(`${requestData.url}?uploadStartTimeInSeconds=${Math.floor(startDate.getTime() / 1000)}&uploadEndTimeInSeconds=${Math.floor(endDate.getTime() / 1000)}`, {
      method: 'GET',
      headers: authHeader
    });

    const data = await response.json();
    const activities: HealthActivity[] = [];

    for (const daily of data || []) {
      activities.push({
        date: daily.calendarDate,
        calories: daily.activeKilocalories || 0,
        steps: daily.totalSteps || 0,
        workoutType: 'general'
      });
    }

    return activities;
  }

  transformWebhookData(webhookData: any): HealthActivity[] {
    const activities: HealthActivity[] = [];

    for (const summary of webhookData.summaries || []) {
      if (summary.calendarDate) {
        activities.push({
          date: summary.calendarDate,
          calories: summary.activeKilocalories || 0,
          steps: summary.totalSteps || 0,
          workoutType: summary.activityType || 'general'
        });
      }
    }

    return activities;
  }
}

export const googleFitService = new GoogleFitService();
export const garminService = new GarminService();
