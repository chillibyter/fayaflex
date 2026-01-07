import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, UserPlus, Flame, Footprints, Dumbbell } from "lucide-react";
import { Link } from "wouter";
import { FITNESS_AVATARS } from "@/lib/avatars";

type MemberAvatar = {
  id: string;
  profileImageUrl?: string | null;
  avatarId?: string | null;
  firstName?: string | null;
};

interface TeamCardProps {
  teamId: string;
  name: string;
  memberCount: number;
  totalCalories: number;
  totalSteps: number;
  totalWorkouts: number;
  rank: number;
  memberAvatars: MemberAvatar[];
  isOwner?: boolean;
  onInvite?: () => void;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
  return num.toString();
};

export default function TeamCard({
  teamId,
  name,
  memberCount,
  totalCalories,
  totalSteps,
  totalWorkouts,
  rank,
  memberAvatars,
  isOwner = false,
  onInvite,
}: TeamCardProps) {
  const extraMembers = memberCount > 3 ? memberCount - 3 : 0;

  return (
    <Card className="overflow-hidden hover-elevate" data-testid={`card-team-${teamId}`}>
      <Link href={`/teams/${teamId}`}>
        <div
          className="px-4 py-4 text-white"
          style={{
            background: "linear-gradient(135deg, #10B981 0%, #06B6D4 100%)",
          }}
        >
          <h3 className="text-xl font-bold mb-3" data-testid="text-team-name">
            {name}
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {memberAvatars.map((member, idx) => (
                  <Avatar key={member.id} className="h-8 w-8 border-2 border-white/30">
                    {member.profileImageUrl ? (
                      <AvatarImage src={member.profileImageUrl} alt="" />
                    ) : member.avatarId ? (
                      (() => {
                        const avatar = FITNESS_AVATARS.find(a => a.id === member.avatarId);
                        if (avatar) {
                          const Icon = avatar.icon;
                          return (
                            <div className={`flex items-center justify-center w-full h-full bg-gradient-to-br ${avatar.gradient}`}>
                              <Icon className="h-4 w-4 text-white" />
                            </div>
                          );
                        }
                        return <AvatarFallback className="text-xs bg-white/20 text-white">{member.firstName?.[0] || '?'}</AvatarFallback>;
                      })()
                    ) : (
                      <AvatarFallback className="text-xs bg-white/20 text-white">
                        {member.firstName?.[0] || '?'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                ))}
                {extraMembers > 0 && (
                  <div className="h-8 w-8 rounded-full bg-white/30 border-2 border-white/30 flex items-center justify-center text-xs font-medium text-white">
                    +{extraMembers}
                  </div>
                )}
              </div>
              <span className="text-sm text-white/90">{memberCount} members</span>
            </div>
            <div className="flex items-center gap-1 text-white">
              <Trophy className="h-4 w-4" />
              <span className="font-semibold">Rank {rank}</span>
            </div>
          </div>
        </div>
      </Link>

      <CardContent className="pt-4 pb-4">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-1">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <p className="text-lg font-bold" data-testid="text-team-calories">{formatNumber(totalCalories)}</p>
            <p className="text-xs text-muted-foreground">calories</p>
          </div>
          <div className="text-center">
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-1">
              <Footprints className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-lg font-bold" data-testid="text-team-steps">{formatNumber(totalSteps)}</p>
            <p className="text-xs text-muted-foreground">steps</p>
          </div>
          <div className="text-center">
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-1">
              <Dumbbell className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-lg font-bold" data-testid="text-team-workouts">{totalWorkouts}</p>
            <p className="text-xs text-muted-foreground">workouts</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/teams/${teamId}/victory-wall`} className="flex-1">
            <Button
              variant="outline"
              className="w-full"
              data-testid="button-victory-wall"
            >
              <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
              Victory Wall
            </Button>
          </Link>
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onInvite?.();
            }}
            variant="default"
            className="flex-1"
            data-testid="button-invite-members"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Members
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
