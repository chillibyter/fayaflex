import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { Flame, Footprints, Dumbbell, TrendingUp, Users, Globe, Trophy } from "lucide-react";

interface DailyDataPoint {
  date: string;
  day: number;
  userCalories: number;
  userSteps: number;
  userWorkouts: number;
}

interface ComparisonStats {
  targetUser: { calories: number; steps: number; workouts: number };
  bestGlobal: { calories: number; steps: number; workouts: number };
  globalAvg: { calories: number; steps: number; workouts: number };
  teamAvg: { calories: number; steps: number; workouts: number };
  dailyData: DailyDataPoint[];
  daysInMonth: number;
}

interface TeammateComparisonChartProps {
  userId: string;
  userName: string;
}

type MetricType = "calories" | "steps" | "workouts";

export default function TeammateComparisonChart({ userId, userName }: TeammateComparisonChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("calories");

  const { data: stats, isLoading, error } = useQuery<ComparisonStats>({
    queryKey: [`/api/users/${userId}/comparison-stats`],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            {error ? "Unable to load comparison data" : "No comparison data available"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const getMetricData = () => {
    return {
      user: stats.targetUser[selectedMetric],
      bestGlobal: stats.bestGlobal[selectedMetric],
      globalAvg: stats.globalAvg[selectedMetric],
      teamAvg: stats.teamAvg[selectedMetric],
    };
  };

  const metricData = getMetricData();

  const getMetricIcon = () => {
    switch (selectedMetric) {
      case "calories":
        return <Flame className="h-4 w-4" />;
      case "steps":
        return <Footprints className="h-4 w-4" />;
      case "workouts":
        return <Dumbbell className="h-4 w-4" />;
    }
  };

  const getMetricLabel = () => {
    switch (selectedMetric) {
      case "calories":
        return "cal/day";
      case "steps":
        return "steps/day";
      case "workouts":
        return "workouts/day";
    }
  };

  const formatValue = (val: number) => {
    if (selectedMetric === "workouts") {
      return val.toFixed(1);
    }
    return val.toLocaleString();
  };

  // Transform daily data based on selected metric
  const chartData = stats.dailyData.map((d) => {
    let userValue: number;
    switch (selectedMetric) {
      case "calories":
        userValue = d.userCalories;
        break;
      case "steps":
        userValue = d.userSteps;
        break;
      case "workouts":
        userValue = d.userWorkouts;
        break;
    }
    return {
      day: d.day,
      date: d.date,
      user: userValue,
    };
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Daily Average Comparison
          </CardTitle>
          <Tabs value={selectedMetric} onValueChange={(v) => setSelectedMetric(v as MetricType)}>
            <TabsList>
              <TabsTrigger value="calories" data-testid="tab-calories" className="gap-1">
                <Flame className="h-4 w-4" />
                <span className="hidden sm:inline">Calories</span>
              </TabsTrigger>
              <TabsTrigger value="steps" data-testid="tab-steps" className="gap-1">
                <Footprints className="h-4 w-4" />
                <span className="hidden sm:inline">Steps</span>
              </TabsTrigger>
              <TabsTrigger value="workouts" data-testid="tab-workouts" className="gap-1">
                <Dumbbell className="h-4 w-4" />
                <span className="hidden sm:inline">Workouts</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              {getMetricIcon()}
              <span className="truncate">{userName}</span>
            </div>
            <p className="text-lg font-bold text-primary" data-testid="stat-user-avg">
              {formatValue(metricData.user)}
            </p>
            <p className="text-xs text-muted-foreground">{getMetricLabel()}</p>
          </div>
          
          <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span>Best Global</span>
            </div>
            <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400" data-testid="stat-best-global">
              {formatValue(metricData.bestGlobal)}
            </p>
            <p className="text-xs text-muted-foreground">{getMetricLabel()}</p>
          </div>
          
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Globe className="h-4 w-4 text-blue-500" />
              <span>Global Avg</span>
            </div>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400" data-testid="stat-global-avg">
              {formatValue(metricData.globalAvg)}
            </p>
            <p className="text-xs text-muted-foreground">{getMetricLabel()}</p>
          </div>
          
          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Users className="h-4 w-4 text-purple-500" />
              <span>Team Avg</span>
            </div>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400" data-testid="stat-team-avg">
              {formatValue(metricData.teamAvg)}
            </p>
            <p className="text-xs text-muted-foreground">{getMetricLabel()}</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="day" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }}
                label={{ value: 'Day of Month', position: 'insideBottom', offset: -5, fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }}
                tickFormatter={(val) => selectedMetric === "workouts" ? val.toFixed(0) : val.toLocaleString()}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                labelFormatter={(day) => `Day ${day}`}
                formatter={(value: number, name: string) => [
                  formatValue(value), 
                  name === 'user' ? userName : name
                ]}
              />
              <Legend 
                formatter={(value) => value === 'user' ? userName : value}
              />
              <ReferenceLine 
                y={metricData.bestGlobal} 
                stroke="#eab308" 
                strokeDasharray="5 5" 
                strokeWidth={2}
                label={{ value: 'Best', position: 'right', fill: '#eab308', fontSize: 10 }}
              />
              <ReferenceLine 
                y={metricData.globalAvg} 
                stroke="#3b82f6" 
                strokeDasharray="5 5" 
                strokeWidth={2}
                label={{ value: 'Global', position: 'right', fill: '#3b82f6', fontSize: 10 }}
              />
              <ReferenceLine 
                y={metricData.teamAvg} 
                stroke="#a855f7" 
                strokeDasharray="5 5" 
                strokeWidth={2}
                label={{ value: 'Team', position: 'right', fill: '#a855f7', fontSize: 10 }}
              />
              <Line 
                type="monotone" 
                dataKey="user" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
                name="user"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-8 h-0.5 bg-yellow-500" style={{ borderStyle: 'dashed' }} />
            <span>Best Global ({formatValue(metricData.bestGlobal)})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-8 h-0.5 bg-blue-500" style={{ borderStyle: 'dashed' }} />
            <span>Global Avg ({formatValue(metricData.globalAvg)})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-8 h-0.5 bg-purple-500" style={{ borderStyle: 'dashed' }} />
            <span>Team Avg ({formatValue(metricData.teamAvg)})</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
