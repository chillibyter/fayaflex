import { Card } from "@/components/ui/card";
import { Flame, TrendingUp, Footprints, Dumbbell } from "lucide-react";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  trend?: string;
}

function StatCard({ icon, label, value, unit, trend }: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-2">{label}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold tracking-tight" data-testid={`stat-${label.toLowerCase().replace(/\s/g, '-')}`}>
              {value}
            </h3>
            {unit && <span className="text-lg text-muted-foreground">{unit}</span>}
          </div>
          {trend && (
            <p className="text-sm text-primary mt-2 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              {trend}
            </p>
          )}
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
}

export default function DashboardStats({ calories, steps, workouts, rank }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<Flame className="h-8 w-8" />}
        label="Total Calories"
        value={calories.toLocaleString()}
        unit="cal"
        trend="+12% this week"
      />
      <StatCard
        icon={<Footprints className="h-8 w-8" />}
        label="Total Steps"
        value={steps.toLocaleString()}
        unit="steps"
      />
      <StatCard
        icon={<Dumbbell className="h-8 w-8" />}
        label="Workouts"
        value={workouts}
        unit="this month"
      />
      <StatCard
        icon={<TrendingUp className="h-8 w-8" />}
        label="Your Rank"
        value={`#${rank}`}
        trend="Top 10%"
      />
    </div>
  );
}
