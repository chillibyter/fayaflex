import { Flame, Footprints, Dumbbell, Trophy, TrendingUp, TrendingDown, Award } from 'lucide-react';

const stats = {
  totalCalories: 12450,
  totalSteps: 87300,
  workoutCount: 18,
  rank: 23,
  percentile: 15,
  caloriesTrend: 12.5,
  stepsTrend: -3.2,
  badgeCount: 5,
  personalBests: {
    calories: 1850,
    steps: 15200,
    score: 17050
  }
};

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Calories */}
      <StatCard
        icon={<Flame className="w-6 h-6 text-orange-500" />}
        label="Total Calories"
        value={stats.totalCalories.toLocaleString()}
        trend={stats.caloriesTrend}
        color="bg-orange-50"
        personalBest={stats.personalBests.calories}
      />

      {/* Steps */}
      <StatCard
        icon={<Footprints className="w-6 h-6 text-blue-500" />}
        label="Total Steps"
        value={stats.totalSteps.toLocaleString()}
        trend={stats.stepsTrend}
        color="bg-blue-50"
        personalBest={stats.personalBests.steps}
      />

      {/* Workouts */}
      <StatCard
        icon={<Dumbbell className="w-6 h-6 text-purple-500" />}
        label="Workout Days"
        value={stats.workoutCount.toString()}
        color="bg-purple-50"
        subtitle="This month"
      />

      {/* Rank */}
      <StatCard
        icon={<Trophy className="w-6 h-6 text-yellow-500" />}
        label="Global Rank"
        value={`#${stats.rank}`}
        color="bg-yellow-50"
        subtitle={`Top ${stats.percentile}%`}
      />
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: number;
  color: string;
  personalBest?: number;
  subtitle?: string;
}

function StatCard({ icon, label, value, trend, color, personalBest, subtitle }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <div className={`${color} p-3 rounded-lg`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${
            trend >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend >= 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      
      <div className="text-gray-500 text-sm mb-1">{label}</div>
      <div className="text-gray-900 mb-2">{value}</div>
      
      {personalBest && (
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <Award className="w-3 h-3" />
          <span>Best: {personalBest.toLocaleString()}</span>
        </div>
      )}
      
      {subtitle && (
        <div className="text-xs text-gray-600">{subtitle}</div>
      )}
    </div>
  );
}
