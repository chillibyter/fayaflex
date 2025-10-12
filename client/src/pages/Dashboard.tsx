import DashboardStats from "@/components/DashboardStats";
import ProgressChart from "@/components/ProgressChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Apple, Activity } from "lucide-react";
import { SiGarmin } from "react-icons/si";
import { Link } from "wouter";

export default function Dashboard() {
  const chartData = [
    { date: "Week 1", calories: 7200 },
    { date: "Week 2", calories: 8500 },
    { date: "Week 3", calories: 7800 },
    { date: "Week 4", calories: 9200 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's your fitness progress for this month.
        </p>
      </div>

      <DashboardStats calories={28500} steps={145000} workouts={18} rank={3} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProgressChart data={chartData} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Connected Devices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
              <div className="flex items-center gap-3">
                <Apple className="h-5 w-5" />
                <div>
                  <p className="font-medium">Apple Health</p>
                  <p className="text-sm text-muted-foreground">Connected</p>
                </div>
              </div>
              <Badge variant="default" className="bg-green-500">Active</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
              <div className="flex items-center gap-3">
                <SiGarmin className="h-5 w-5" />
                <div>
                  <p className="font-medium">Garmin Connect</p>
                  <p className="text-sm text-muted-foreground">Not connected</p>
                </div>
              </div>
              <Button variant="outline" size="sm" data-testid="button-connect-garmin">
                Connect
              </Button>
            </div>

            <div className="pt-2">
              <Button asChild variant="ghost" className="w-full" data-testid="button-manual-entry">
                <Link href="/track">
                  <Activity className="h-4 w-4 mr-2" />
                  Manual Entry
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { date: "Today", activity: "Running", calories: 450, time: "30 min" },
              { date: "Yesterday", activity: "Cycling", calories: 380, time: "45 min" },
              { date: "2 days ago", activity: "Weightlifting", calories: 320, time: "60 min" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-md hover-elevate"
              >
                <div>
                  <p className="font-medium">{item.activity}</p>
                  <p className="text-sm text-muted-foreground">{item.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{item.calories} cal</p>
                  <p className="text-sm text-muted-foreground">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
