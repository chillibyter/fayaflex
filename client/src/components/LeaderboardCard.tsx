import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal } from "lucide-react";
import { Link } from "wouter";
import { UserAvatar } from "@/components/UserAvatar";

interface LeaderboardCardProps {
  rank: number;
  name: string;
  teamName?: string;
  calories: number;
  goalPercentage: number;
  userId?: string;
  teamId?: string;
  avatarId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

export default function LeaderboardCard({
  rank,
  name,
  teamName,
  calories,
  goalPercentage,
  userId,
  teamId,
  avatarId,
  firstName,
  lastName,
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

  // Create a partial user object for UserAvatar
  const userForAvatar = userId ? {
    id: userId,
    avatarId: avatarId || null,
    firstName: firstName || null,
    lastName: lastName || null,
    username: name,
    email: "",
    profileImageUrl: null,
    createdAt: new Date(),
    updatedAt: null,
    password: null,
    continentId: null,
    countryId: null,
    regionId: null,
    townId: null,
  } : null;

  const href = userId ? `/users/${userId}/profile` : teamId ? `/teams/${teamId}` : undefined;

  const content = (
    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-wrap">
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <Badge variant={getRankBadgeVariant()} className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm">
          {rank}
        </Badge>
        {userForAvatar ? (
          <UserAvatar 
            user={userForAvatar} 
            className="h-8 w-8 sm:h-10 sm:w-10 md:h-11 md:w-11 flex-shrink-0"
            iconClassName="h-4 w-4 sm:h-5 sm:w-5"
          />
        ) : (
          <div className="h-8 w-8 sm:h-10 sm:w-10 md:h-11 md:w-11 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs sm:text-sm font-medium">
              {name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 sm:gap-2">
            <h4 className="font-semibold truncate text-sm sm:text-base" data-testid={`text-name-${rank}`}>{name}</h4>
            {getMedalIcon()}
          </div>
          {teamName && <p className="text-xs sm:text-sm text-muted-foreground truncate">{teamName}</p>}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-lg sm:text-xl md:text-2xl font-bold" data-testid={`text-calories-${rank}`}>
          {calories.toLocaleString()}
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground">{goalPercentage}% of goal</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href}>
        <Card className="p-3 sm:p-4 md:p-5 hover-elevate cursor-pointer transition-all" data-testid={`card-leaderboard-${rank}`}>
          {content}
        </Card>
      </Link>
    );
  }

  return (
    <Card className="p-3 sm:p-4 md:p-5" data-testid={`card-leaderboard-${rank}`}>
      {content}
    </Card>
  );
}
