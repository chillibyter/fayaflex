import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Award, 
  Flame, 
  Footprints, 
  Dumbbell, 
  Calendar, 
  Trophy, 
  Star,
  Zap,
  Target,
  Medal,
  Crown
} from "lucide-react";
import { format } from "date-fns";

type UserBadge = {
  id: string;
  userId: string;
  badgeType: string;
  earnedAt: string;
  metadata?: any;
};

const BADGE_CONFIG: { [key: string]: { name: string; description: string; icon: any; bgColor: string; iconColor: string } } = {
  first_activity: {
    name: "First Steps",
    description: "Logged your first activity",
    icon: Star,
    bgColor: "bg-gradient-to-br from-yellow-400 to-amber-500",
    iconColor: "text-white",
  },
  streak_3: {
    name: "3-Day Streak",
    description: "Logged activities 3 days in a row",
    icon: Flame,
    bgColor: "bg-gradient-to-br from-orange-400 to-red-500",
    iconColor: "text-white",
  },
  streak_7: {
    name: "Week Warrior",
    description: "Logged activities 7 days in a row",
    icon: Zap,
    bgColor: "bg-gradient-to-br from-orange-500 to-red-600",
    iconColor: "text-white",
  },
  streak_30: {
    name: "Monthly Master",
    description: "Logged activities 30 days in a row",
    icon: Crown,
    bgColor: "bg-gradient-to-br from-purple-500 to-indigo-600",
    iconColor: "text-white",
  },
  steps_10k: {
    name: "10K Steps",
    description: "Walked 10,000 steps in a single day",
    icon: Footprints,
    bgColor: "bg-gradient-to-br from-blue-400 to-cyan-500",
    iconColor: "text-white",
  },
  calories_1k: {
    name: "Calorie Crusher",
    description: "Burned 1,000 calories in a single day",
    icon: Flame,
    bgColor: "bg-gradient-to-br from-red-500 to-pink-500",
    iconColor: "text-white",
  },
  workouts_10: {
    name: "Workout Pro",
    description: "Completed 10 workout days",
    icon: Dumbbell,
    bgColor: "bg-gradient-to-br from-green-500 to-emerald-600",
    iconColor: "text-white",
  },
  top_10: {
    name: "Top 10",
    description: "Reached top 10 on the leaderboard",
    icon: Medal,
    bgColor: "bg-gradient-to-br from-amber-400 to-yellow-500",
    iconColor: "text-white",
  },
  champion: {
    name: "Champion",
    description: "Won a monthly challenge",
    icon: Trophy,
    bgColor: "bg-gradient-to-br from-yellow-400 to-amber-500",
    iconColor: "text-white",
  },
};

interface BadgesDisplayProps {
  compact?: boolean;
}

export default function BadgesDisplay({ compact = false }: BadgesDisplayProps) {
  const { data: badges = [], isLoading } = useQuery<UserBadge[]>({
    queryKey: ['/api/badges'],
  });

  useQuery({
    queryKey: ['/api/badges/check'],
    staleTime: 60000,
  });

  if (isLoading) {
    return (
      <div className="mb-6">
        <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Award className="h-5 w-5" />
          Achievements
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (badges.length === 0) {
    return (
      <div className="mb-6">
        <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Award className="h-5 w-5" />
          Achievements
        </h3>
        <Card className="bg-muted/50">
          <CardContent className="py-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-muted mb-3">
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">No badges earned yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Log activities to unlock achievements!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {badges.slice(0, 5).map((badge) => {
          const config = BADGE_CONFIG[badge.badgeType] || {
            name: badge.badgeType,
            icon: Award,
            bgColor: "bg-muted",
            iconColor: "text-muted-foreground",
          };
          const Icon = config.icon;
          return (
            <div
              key={badge.id}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${config.bgColor} shadow-sm`}
              data-testid={`badge-${badge.badgeType}`}
            >
              <Icon className={`h-4 w-4 ${config.iconColor}`} />
              <span className="text-xs font-medium text-white">{config.name}</span>
            </div>
          );
        })}
        {badges.length > 5 && (
          <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
            +{badges.length - 5} more
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
        <Award className="h-5 w-5 text-amber-500" />
        Achievements ({badges.length})
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {badges.map((badge) => {
          const config = BADGE_CONFIG[badge.badgeType] || {
            name: badge.badgeType,
            description: "Achievement unlocked",
            icon: Award,
            bgColor: "bg-muted",
            iconColor: "text-muted-foreground",
          };
          const Icon = config.icon;
          return (
            <div
              key={badge.id}
              className="flex flex-col items-center p-3 rounded-xl bg-card border hover-elevate"
              data-testid={`badge-card-${badge.badgeType}`}
            >
              <div className={`h-12 w-12 rounded-full ${config.bgColor} flex items-center justify-center mb-2 shadow-md`}>
                <Icon className={`h-6 w-6 ${config.iconColor}`} />
              </div>
              <p className="text-xs font-semibold text-center leading-tight">{config.name}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {format(new Date(badge.earnedAt), 'MMM d')}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
