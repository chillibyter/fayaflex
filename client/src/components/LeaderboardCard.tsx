import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal } from "lucide-react";

interface LeaderboardCardProps {
  rank: number;
  name: string;
  teamName: string;
  calories: number;
  goalPercentage: number;
}

export default function LeaderboardCard({
  rank,
  name,
  teamName,
  calories,
  goalPercentage,
}: LeaderboardCardProps) {
  const getMedalIcon = () => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return null;
  };

  const getRankBadgeVariant = () => {
    if (rank <= 3) return "default";
    return "secondary";
  };

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="p-4 hover-elevate" data-testid={`leaderboard-card-${rank}`}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Badge variant={getRankBadgeVariant()} className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
            {rank}
          </Badge>
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold truncate" data-testid={`text-name-${rank}`}>{name}</h4>
              {getMedalIcon()}
            </div>
            <p className="text-sm text-muted-foreground truncate">{teamName}</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-2xl font-bold" data-testid={`text-calories-${rank}`}>
            {calories.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">{goalPercentage}% of goal</p>
        </div>
      </div>
    </Card>
  );
}
