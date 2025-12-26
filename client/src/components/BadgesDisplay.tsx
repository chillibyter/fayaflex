import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Target
} from "lucide-react";
import { format } from "date-fns";

type UserBadge = {
  id: string;
  userId: string;
  badgeType: string;
  earnedAt: string;
  metadata?: any;
};

const BADGE_CONFIG: { [key: string]: { name: string; description: string; icon: any; color: string } } = {
  first_activity: {
    name: "First Steps",
    description: "Logged your first activity",
    icon: Star,
    color: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
  },
  streak_3: {
    name: "3-Day Streak",
    description: "Logged activities 3 days in a row",
    icon: Zap,
    color: "bg-orange-500/20 text-orange-600 dark:text-orange-400",
  },
  streak_7: {
    name: "Week Warrior",
    description: "Logged activities 7 days in a row",
    icon: Zap,
    color: "bg-orange-500/20 text-orange-600 dark:text-orange-400",
  },
  streak_30: {
    name: "Monthly Master",
    description: "Logged activities 30 days in a row",
    icon: Calendar,
    color: "bg-purple-500/20 text-purple-600 dark:text-purple-400",
  },
  steps_10k: {
    name: "10K Steps",
    description: "Walked 10,000 steps in a single day",
    icon: Footprints,
    color: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  },
  calories_1k: {
    name: "Calorie Crusher",
    description: "Burned 1,000 calories in a single day",
    icon: Flame,
    color: "bg-red-500/20 text-red-600 dark:text-red-400",
  },
  workouts_10: {
    name: "Workout Pro",
    description: "Completed 10 workout days",
    icon: Dumbbell,
    color: "bg-green-500/20 text-green-600 dark:text-green-400",
  },
  top_10: {
    name: "Top 10",
    description: "Reached top 10 on the leaderboard",
    icon: Trophy,
    color: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
  },
  champion: {
    name: "Champion",
    description: "Won a monthly challenge",
    icon: Award,
    color: "bg-primary/20 text-primary",
  },
};

interface BadgesDisplayProps {
  compact?: boolean;
}

export default function BadgesDisplay({ compact = false }: BadgesDisplayProps) {
  const { data: badges = [], isLoading } = useQuery<UserBadge[]>({
    queryKey: ['/api/badges'],
  });

  // Also trigger badge check on mount
  useQuery({
    queryKey: ['/api/badges/check'],
    staleTime: 60000, // Only check once per minute
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (badges.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No badges earned yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Log activities to unlock achievements!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {badges.slice(0, 5).map((badge) => {
          const config = BADGE_CONFIG[badge.badgeType] || {
            name: badge.badgeType,
            icon: Award,
            color: "bg-muted text-muted-foreground",
          };
          const Icon = config.icon;
          return (
            <Badge
              key={badge.id}
              variant="secondary"
              className={`${config.color} gap-1`}
              data-testid={`badge-${badge.badgeType}`}
            >
              <Icon className="h-3 w-3" />
              {config.name}
            </Badge>
          );
        })}
        {badges.length > 5 && (
          <Badge variant="outline">+{badges.length - 5} more</Badge>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Achievements ({badges.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {badges.map((badge) => {
            const config = BADGE_CONFIG[badge.badgeType] || {
              name: badge.badgeType,
              description: "Achievement unlocked",
              icon: Award,
              color: "bg-muted text-muted-foreground",
            };
            const Icon = config.icon;
            return (
              <div
                key={badge.id}
                className={`p-4 rounded-lg ${config.color} flex items-start gap-3`}
                data-testid={`badge-card-${badge.badgeType}`}
              >
                <div className="p-2 rounded-full bg-background/50">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{config.name}</p>
                  <p className="text-xs opacity-80 line-clamp-2">{config.description}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {format(new Date(badge.earnedAt), 'MMM d, yyyy')}
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
