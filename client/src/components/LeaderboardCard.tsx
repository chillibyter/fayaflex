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
  steps?: number;
  workouts?: number;
  goalPercentage: number;
  userId?: string;
  teamId?: string;
  avatarId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  memberCount?: number;
}

function CircularProgress({ percentage, size = 56 }: { percentage: number; size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;
  
  const getColor = () => {
    if (percentage >= 80) return "#22c55e";
    if (percentage >= 50) return "#22c55e";
    return "#22c55e";
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-bold">{percentage}%</span>
        <span className="text-[8px] text-muted-foreground">of goal</span>
      </div>
    </div>
  );
}

export default function LeaderboardCard({
  rank,
  name,
  teamName,
  calories,
  steps,
  workouts,
  goalPercentage,
  userId,
  teamId,
  avatarId,
  firstName,
  lastName,
  memberCount,
}: LeaderboardCardProps) {
  const getMedalIcon = () => {
    if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />;
    if (rank === 3) return <Medal className="h-4 w-4 text-amber-600" />;
    return null;
  };

  const getAvatarColor = () => {
    const colors = [
      "bg-blue-500",
      "bg-green-500", 
      "bg-orange-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-teal-500",
    ];
    return colors[rank % colors.length];
  };

  const userForAvatar = userId ? {
    id: userId,
    avatarId: avatarId || null,
    firstName: firstName || null,
    lastName: lastName || null,
    username: name,
    email: "",
    profileImageUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    password: null,
  } : null;

  const href = userId ? `/users/${userId}/profile` : teamId ? `/teams/${teamId}` : undefined;

  const content = (
    <div className="flex items-center gap-3">
      <span className="text-lg font-bold text-muted-foreground w-6">{rank}</span>
      
      {userForAvatar ? (
        <UserAvatar 
          user={userForAvatar} 
          className="h-12 w-12 flex-shrink-0"
          iconClassName="h-6 w-6"
        />
      ) : (
        <div className={`h-12 w-12 flex-shrink-0 rounded-full ${getAvatarColor()} flex items-center justify-center`}>
          <span className="text-lg font-bold text-white">
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold truncate text-sm" data-testid={`text-name-${rank}`}>{name}</h4>
          {getMedalIcon()}
        </div>
        {memberCount !== undefined && (
          <p className="text-xs text-muted-foreground">{memberCount} members</p>
        )}
        {teamName && <p className="text-xs text-muted-foreground truncate">{teamName}</p>}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-bold text-orange-500">{calories?.toLocaleString() || 0}</span>
          <span className="text-sm font-bold text-green-500">{steps?.toLocaleString() || 0}</span>
          <span className="text-sm font-bold text-purple-500">{workouts || 0}</span>
        </div>
      </div>
      
      <CircularProgress percentage={goalPercentage} />
    </div>
  );

  if (href) {
    return (
      <Link href={href}>
        <Card className="p-4 hover-elevate cursor-pointer transition-all" data-testid={`card-leaderboard-${rank}`}>
          {content}
        </Card>
      </Link>
    );
  }

  return (
    <Card className="p-4" data-testid={`card-leaderboard-${rank}`}>
      {content}
    </Card>
  );
}
