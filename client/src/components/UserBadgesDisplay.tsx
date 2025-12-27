import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { 
  Award, 
  Flame, 
  Footprints, 
  Trophy, 
  Zap, 
  Target,
  Calendar,
  Star,
  Crown
} from "lucide-react";

interface UserBadge {
  id: string;
  userId: string;
  badgeType: string;
  earnedAt: string;
}

interface UserBadgesDisplayProps {
  userId: string;
  compact?: boolean;
}

const BADGE_CONFIG: Record<string, { name: string; icon: any; color: string }> = {
  first_activity: { name: "First Steps", icon: Zap, color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  streak_3: { name: "3-Day Streak", icon: Flame, color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
  streak_7: { name: "Week Warrior", icon: Flame, color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300" },
  streak_30: { name: "Monthly Master", icon: Calendar, color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  steps_10k: { name: "10K Steps", icon: Footprints, color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  calories_1k: { name: "1K Calories", icon: Flame, color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
  workouts_10: { name: "Workout Hero", icon: Star, color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
  top_10: { name: "Top 10", icon: Trophy, color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
  champion: { name: "Champion", icon: Crown, color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
};

export default function UserBadgesDisplay({ userId, compact = false }: UserBadgesDisplayProps) {
  const { data: badges = [], isLoading } = useQuery<UserBadge[]>({
    queryKey: [`/api/users/${userId}/badges`],
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
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-24" />
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
          <div className="text-center py-4">
            <Target className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No badges earned yet</p>
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
          Achievements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => {
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
                className={`${config.color} gap-1 py-1.5 px-3`}
                data-testid={`badge-${badge.badgeType}`}
              >
                <Icon className="h-4 w-4" />
                {config.name}
              </Badge>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
