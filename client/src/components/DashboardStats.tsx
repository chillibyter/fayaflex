import { Card } from "@/components/ui/card";
import { Flame, TrendingUp, TrendingDown, Footprints, Dumbbell, Minus } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  trend?: number | null;
  trendLabel?: string;
  onClick?: () => void;
}

function StatCard({ icon, label, value, unit, trend, trendLabel, onClick }: StatCardProps) {
  const getTrendDisplay = () => {
    if (trend === null || trend === undefined) return null;
    
    if (trend > 0) {
      return (
        <p className="text-sm text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
          <TrendingUp className="h-4 w-4" />
          +{trend}% {trendLabel || 'vs last month'}
        </p>
      );
    } else if (trend < 0) {
      return (
        <p className="text-sm text-red-500 dark:text-red-400 mt-2 flex items-center gap-1">
          <TrendingDown className="h-4 w-4" />
          {trend}% {trendLabel || 'vs last month'}
        </p>
      );
    } else {
      return (
        <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
          <Minus className="h-4 w-4" />
          No change
        </p>
      );
    }
  };

  return (
    <Card 
      className={`p-6 ${onClick ? 'cursor-pointer hover-elevate active-elevate-2' : ''}`}
      onClick={onClick}
      data-testid={`card-${label.toLowerCase().replace(/\s/g, '-')}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-2">{label}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold tracking-tight" data-testid={`stat-${label.toLowerCase().replace(/\s/g, '-')}`}>
              {value}
            </h3>
            {unit && <span className="text-lg text-muted-foreground">{unit}</span>}
          </div>
          {getTrendDisplay()}
        </div>
        <div className="text-primary">{icon}</div>
      </div>
    </Card>
  );
}

interface DashboardStatsProps {
  calories: number;
  steps: number;
  workouts: number;
  rank: number;
  totalActiveUsers: number;
  percentile: number;
  caloriesTrend?: number;
  stepsTrend?: number;
  personalBests?: { [key: string]: number };
}

type DailyData = {
  date: string;
  fullDate: string;
  value: number;
};

type WorkoutDay = {
  date: string;
  workouts: number;
  types: string[];
  totalCalories: number;
};

export default function DashboardStats({ calories, steps, workouts, rank, totalActiveUsers, percentile, caloriesTrend, stepsTrend, personalBests }: DashboardStatsProps) {
  const [caloriesDialogOpen, setCaloriesDialogOpen] = useState(false);
  const [stepsDialogOpen, setStepsDialogOpen] = useState(false);
  const [workoutsDialogOpen, setWorkoutsDialogOpen] = useState(false);

  const { data: caloriesData = [], isLoading: isLoadingCalories } = useQuery<DailyData[]>({
    queryKey: ['/api/stats/daily-breakdown', 'calories'],
    queryFn: async () => {
      const res = await fetch('/api/stats/daily-breakdown?metric=calories', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch calories data');
      return res.json();
    },
    enabled: caloriesDialogOpen,
  });

  const { data: stepsData = [], isLoading: isLoadingSteps } = useQuery<DailyData[]>({
    queryKey: ['/api/stats/daily-breakdown', 'steps'],
    queryFn: async () => {
      const res = await fetch('/api/stats/daily-breakdown?metric=steps', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch steps data');
      return res.json();
    },
    enabled: stepsDialogOpen,
  });

  const { data: workoutDays = [], isLoading: isLoadingWorkouts } = useQuery<WorkoutDay[]>({
    queryKey: ['/api/stats/workout-calendar'],
    enabled: workoutsDialogOpen,
  });

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Flame className="h-8 w-8" />}
          label="Total Calories"
          value={calories.toLocaleString()}
          unit="cal"
          trend={caloriesTrend}
          onClick={() => setCaloriesDialogOpen(true)}
        />
        <StatCard
          icon={<Footprints className="h-8 w-8" />}
          label="Total Steps"
          value={steps.toLocaleString()}
          unit="steps"
          trend={stepsTrend}
          onClick={() => setStepsDialogOpen(true)}
        />
        <StatCard
          icon={<Dumbbell className="h-8 w-8" />}
          label="Workouts"
          value={workouts}
          unit="this month"
          onClick={() => setWorkoutsDialogOpen(true)}
        />
        {rank > 0 ? (
          <Card className="p-6" data-testid="card-your-rank">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">Your Rank</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-bold tracking-tight" data-testid="stat-your-rank">
                    #{rank}
                  </h3>
                </div>
                <p className="text-sm text-primary mt-2 flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  Top {percentile}%
                </p>
              </div>
              <div className="text-primary"><TrendingUp className="h-8 w-8" /></div>
            </div>
          </Card>
        ) : (
          <Card className="p-6" data-testid="card-your-rank">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">Your Rank</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-bold tracking-tight" data-testid="stat-your-rank">
                    Not ranked
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Log activities to compete!
                </p>
              </div>
              <div className="text-primary"><TrendingUp className="h-8 w-8" /></div>
            </div>
          </Card>
        )}
      </div>

      {/* Calories Dialog */}
      <Dialog open={caloriesDialogOpen} onOpenChange={setCaloriesDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Daily Calories - Last 30 Days</DialogTitle>
          </DialogHeader>
          {isLoadingCalories ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={caloriesData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                    name="Calories"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Steps Dialog */}
      <Dialog open={stepsDialogOpen} onOpenChange={setStepsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Daily Steps - Last 30 Days</DialogTitle>
          </DialogHeader>
          {isLoadingSteps ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stepsData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                    name="Steps"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Workouts Calendar Dialog */}
      <Dialog open={workoutsDialogOpen} onOpenChange={setWorkoutsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Workout Calendar - This Month</DialogTitle>
          </DialogHeader>
          {isLoadingWorkouts ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <div className="grid grid-cols-7 gap-2 p-4">
              {/* Calendar Header */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-semibold text-sm text-muted-foreground p-2">
                  {day}
                </div>
              ))}
              
              {/* Calendar Days */}
              {(() => {
                const now = new Date();
                const year = now.getFullYear();
                const month = now.getMonth();
                const firstDay = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const days = [];

                // Empty cells before first day
                for (let i = 0; i < firstDay; i++) {
                  days.push(<div key={`empty-${i}`} className="p-2" />);
                }

                // Actual days
                for (let day = 1; day <= daysInMonth; day++) {
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const workoutDay = workoutDays.find(w => w.date === dateStr);
                  const isToday = day === now.getDate();

                  days.push(
                    <div 
                      key={day} 
                      className={`
                        p-3 rounded-md text-center relative
                        ${isToday ? 'bg-primary/20 font-bold' : ''}
                        ${workoutDay ? 'bg-primary/10 border-2 border-primary' : 'border border-muted'}
                      `}
                      data-testid={`calendar-day-${day}`}
                    >
                      <div className="text-sm">{day}</div>
                      {workoutDay && (
                        <div className="mt-1">
                          <div className="text-xs font-semibold text-primary">
                            {workoutDay.workouts} {workoutDay.workouts === 1 ? 'workout' : 'workouts'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {workoutDay.totalCalories} cal
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return days;
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
