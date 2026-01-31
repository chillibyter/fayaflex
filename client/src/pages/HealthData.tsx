import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Shield, Footprints, Flame, Dumbbell, Heart, MapPin, Lock, Eye, Trash2, Info } from "lucide-react";
import { Link } from "wouter";
import { Capacitor } from "@capacitor/core";

export default function HealthData() {
  const isIOS = Capacitor.getPlatform() === 'ios';
  const platformName = isIOS ? 'Apple HealthKit' : 'Health Connect';
  
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/profile">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <img 
              src="/fayaflex-logo.webp" 
              alt="FayaFlex" 
              className="h-8 w-8 rounded-md"
            />
            <span className="font-semibold">Health Data</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Health Data Usage</h1>
          <p className="text-muted-foreground">
            How FayaFlex uses {platformName} to track your fitness
          </p>
        </div>

        <Card data-testid="card-healthkit-overview">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>{platformName} Integration</CardTitle>
            </div>
            <CardDescription>
              FayaFlex integrates with {platformName} to automatically sync your fitness data, making it easy to track your progress and compete with your team.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm font-medium text-primary">
                {isIOS 
                  ? 'FayaFlex uses Apple HealthKit APIs to read health and fitness data from your device.'
                  : 'FayaFlex uses Health Connect APIs to read health and fitness data from your device.'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-data-types">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              <CardTitle>Data Types We Access</CardTitle>
            </div>
            <CardDescription>
              The following health data types are read from {platformName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-start gap-4 p-4 rounded-lg border">
                <Footprints className="h-6 w-6 text-blue-500 shrink-0" />
                <div>
                  <h3 className="font-medium">Step Count</h3>
                  <p className="text-sm text-muted-foreground">
                    We read your daily step count to track your movement activity. Steps are used to calculate your fitness score and display on personal and team leaderboards.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>{isIOS ? 'HealthKit Type:' : 'Health Connect Type:'}</strong> {isIOS ? 'HKQuantityTypeIdentifierStepCount' : 'Steps'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg border">
                <Flame className="h-6 w-6 text-orange-500 shrink-0" />
                <div>
                  <h3 className="font-medium">Active Calories Burned</h3>
                  <p className="text-sm text-muted-foreground">
                    We read calories burned through physical activity (not resting calories). This data is essential for calculating your daily fitness score.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>{isIOS ? 'HealthKit Type:' : 'Health Connect Type:'}</strong> {isIOS ? 'HKQuantityTypeIdentifierActiveEnergyBurned' : 'ActiveCaloriesBurned'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg border">
                <Dumbbell className="h-6 w-6 text-green-500 shrink-0" />
                <div>
                  <h3 className="font-medium">Workouts / Exercise Sessions</h3>
                  <p className="text-sm text-muted-foreground">
                    We read your completed workouts including the workout type, duration, and calories burned. Workouts contribute to your team's competition score.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>{isIOS ? 'HealthKit Type:' : 'Health Connect Type:'}</strong> {isIOS ? 'HKWorkoutType' : 'ExerciseSession'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg border">
                <MapPin className="h-6 w-6 text-purple-500 shrink-0" />
                <div>
                  <h3 className="font-medium">Distance</h3>
                  <p className="text-sm text-muted-foreground">
                    We read walking and running distance to provide additional insights into your activity levels.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>{isIOS ? 'HealthKit Type:' : 'Health Connect Type:'}</strong> {isIOS ? 'HKQuantityTypeIdentifierDistanceWalkingRunning' : 'Distance'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg border">
                <Heart className="h-6 w-6 text-red-500 shrink-0" />
                <div>
                  <h3 className="font-medium">Heart Rate</h3>
                  <p className="text-sm text-muted-foreground">
                    We read heart rate data recorded during workouts to provide fitness insights and verify workout intensity.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>{isIOS ? 'HealthKit Type:' : 'Health Connect Type:'}</strong> {isIOS ? 'HKQuantityTypeIdentifierHeartRate' : 'HeartRate'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-data-usage">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              <CardTitle>How We Use Your Data</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Calculate Fitness Scores:</strong> Your steps, calories, and workouts are combined to calculate your daily fitness score, which determines your position on leaderboards.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Team Competitions:</strong> Your fitness data contributes to your team's total score in monthly challenges.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Personal Progress:</strong> Track your workout history, view trends, and earn badges based on your achievements.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Motivational Features:</strong> Receive personalized encouragement based on your activity patterns.
                </p>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card data-testid="card-data-protection">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <CardTitle>Your Data Protection</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500 mt-2 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Read-Only Access:</strong> FayaFlex only reads data from {platformName}. We never write or modify your health records.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500 mt-2 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">On-Device Until Synced:</strong> Health data stays on your device until you explicitly tap "Sync Now".
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500 mt-2 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Encrypted Transmission:</strong> All data is transmitted securely using HTTPS encryption.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500 mt-2 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">No Third-Party Sharing:</strong> Your health data is never sold or shared with advertisers or third parties.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500 mt-2 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">You Control Permissions:</strong> You can revoke {platformName} access at any time through your device settings.
                </p>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card data-testid="card-disconnect">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-primary" />
              <CardTitle>Disconnecting & Data Deletion</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You can disconnect {platformName} at any time from the Health Tracking section in your Profile. When you disconnect:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• FayaFlex will no longer sync data from {platformName}</li>
              <li>• Previously synced fitness activities remain in your FayaFlex account</li>
              <li>• To delete all your data, use the "Delete Account" option in Settings</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-4">
              To revoke FayaFlex's access to {platformName} completely:
            </p>
            {isIOS ? (
              <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                <li>Open the <strong>Settings</strong> app on your iPhone</li>
                <li>Tap <strong>Health</strong> → <strong>Data Access & Devices</strong></li>
                <li>Tap <strong>FayaFlex</strong></li>
                <li>Toggle off all permissions or tap <strong>Delete All Data from FayaFlex</strong></li>
              </ol>
            ) : (
              <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
                <li>Open the <strong>Health Connect</strong> app</li>
                <li>Tap <strong>App permissions</strong></li>
                <li>Find <strong>FayaFlex</strong> and tap it</li>
                <li>Revoke all permissions</li>
              </ol>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col items-center gap-3 pt-4">
          <Link href="/privacy">
            <Button variant="outline" data-testid="button-view-privacy">
              View Full Privacy Policy
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="ghost" data-testid="button-back-profile">
              Back to Profile
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
