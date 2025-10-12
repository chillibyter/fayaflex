import DataEntryForm from "@/components/DataEntryForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Apple, Activity } from "lucide-react";
import { SiGarmin } from "react-icons/si";

export default function TrackActivity() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Track Activity</h1>
        <p className="text-muted-foreground">
          Log your daily fitness activities and track your progress.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DataEntryForm />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex gap-3">
                <Calendar className="h-5 w-5 text-primary flex-shrink-0" />
                <p className="text-muted-foreground">
                  Submit your activities daily for the most accurate tracking
                </p>
              </div>
              <div className="flex gap-3">
                <Apple className="h-5 w-5 text-primary flex-shrink-0" />
                <p className="text-muted-foreground">
                  Connect Apple Health or Garmin for automatic syncing
                </p>
              </div>
              <div className="flex gap-3">
                <Activity className="h-5 w-5 text-primary flex-shrink-0" />
                <p className="text-muted-foreground">
                  Use quick increment buttons to enter data faster
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today's Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Calories</span>
                <span className="font-semibold">0 cal</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Steps</span>
                <span className="font-semibold">0 steps</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Workouts</span>
                <Badge variant="secondary">0</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
