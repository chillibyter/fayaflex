import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Flame, Footprints, Dumbbell, TrendingUp, Sparkles } from "lucide-react";

type SuggestedGoalsData = {
  activityLevel: 'beginner' | 'moderate' | 'active' | 'athlete';
  activityDescription: string;
  daysAnalyzed: number;
  averages: {
    calories: number;
    steps: number;
    workoutsPerWeek: number;
  };
  suggestedGoals: {
    dailyCalories: number;
    dailySteps: number;
    weeklyWorkouts: number;
  };
  todayProgress: {
    calories: number;
    steps: number;
    hasWorkout: boolean;
  };
};

const activityLevelColors = {
  beginner: '#94a3b8',
  moderate: '#22c55e',
  active: '#f97316',
  athlete: '#ef4444',
};

function DonutChart({ 
  current, 
  target, 
  color,
  size = 80,
}: { 
  current: number; 
  target: number; 
  color: string;
  size?: number;
}) {
  const percentage = Math.min(100, Math.round((current / target) * 100));
  const remaining = Math.max(0, 100 - percentage);
  
  const data = [
    { name: 'progress', value: percentage },
    { name: 'remaining', value: remaining },
  ];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size * 0.35}
            outerRadius={size * 0.45}
            paddingAngle={2}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            <Cell fill={color} />
            <Cell fill="hsl(var(--muted))" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold">{percentage}%</span>
      </div>
    </div>
  );
}

export default function SmartGoals() {
  const { data, isLoading, error } = useQuery<SuggestedGoalsData>({
    queryKey: ['/api/goals/suggested'],
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return null;
  }

  const { activityLevel, activityDescription, suggestedGoals, todayProgress, daysAnalyzed } = data;

  // Count today as a workout day if has explicit workout OR any activity
  const hasWorkoutToday = todayProgress.hasWorkout || todayProgress.calories > 0 || todayProgress.steps > 0;

  const goals = [
    {
      label: 'Calories',
      icon: Flame,
      current: todayProgress.calories,
      target: suggestedGoals.dailyCalories,
      color: '#f97316',
      unit: 'cal',
    },
    {
      label: 'Steps',
      icon: Footprints,
      current: todayProgress.steps,
      target: suggestedGoals.dailySteps,
      color: '#3b82f6',
      unit: 'steps',
    },
    {
      label: 'Workout',
      icon: Dumbbell,
      current: hasWorkoutToday ? 1 : 0,
      target: 1,
      color: '#a855f7',
      unit: 'today',
    },
  ];

  return (
    <Card data-testid="card-smart-goals">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-primary" />
          Today's Goals
        </CardTitle>
        <Badge 
          variant="secondary" 
          className="text-xs"
          style={{ 
            backgroundColor: `${activityLevelColors[activityLevel]}20`,
            color: activityLevelColors[activityLevel],
          }}
          data-testid="badge-activity-level"
        >
          <TrendingUp className="w-3 h-3 mr-1" />
          {activityDescription}
        </Badge>
      </CardHeader>
      <CardContent>
        {daysAnalyzed < 3 && (
          <p className="text-xs text-muted-foreground mb-3">
            Goals based on recommended targets. Log more activities for personalized goals.
          </p>
        )}
        <div className="grid grid-cols-3 gap-2">
          {goals.map((goal) => {
            const Icon = goal.icon;
            return (
              <div 
                key={goal.label} 
                className="flex flex-col items-center text-center"
                data-testid={`goal-${goal.label.toLowerCase()}`}
              >
                <DonutChart 
                  current={goal.current} 
                  target={goal.target} 
                  color={goal.color}
                  size={70}
                />
                <div className="mt-2">
                  <div className="flex items-center justify-center gap-1">
                    <Icon className="w-3.5 h-3.5" style={{ color: goal.color }} />
                    <span className="text-xs font-medium">{goal.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {goal.current.toLocaleString()}/{goal.target.toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
