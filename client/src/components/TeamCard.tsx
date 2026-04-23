import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, UserPlus, Flame, Footprints, Dumbbell, Users, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { FITNESS_AVATARS } from "@/lib/avatars";
import { Icon3D } from "@/components/Icon3D";
import { MAX_TEAM_MEMBERS } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

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
  lastMessage?: {
    id: string;
    content: string;
    createdAt: string;
    userFirstName: string | null;
  } | null;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
  return num.toString();
};

// Cinematic dark hero gradient — top accent shifts subtly with rank.
function heroGradientForRank(rank: number): string {
  if (rank === 1) {
    // Champion — warm gold rim over deep black.
    return "bg-[radial-gradient(ellipse_at_top_right,_rgba(251,191,36,0.35),_transparent_60%),_radial-gradient(ellipse_at_bottom_left,_rgba(249,115,22,0.18),_transparent_55%),_linear-gradient(135deg,_#0a0a0a_0%,_#1a1a1a_100%)]";
  }
  if (rank === 2) {
    return "bg-[radial-gradient(ellipse_at_top_right,_rgba(229,231,235,0.28),_transparent_60%),_linear-gradient(135deg,_#0c0c0c_0%,_#1c1c1c_100%)]";
  }
  if (rank === 3) {
    return "bg-[radial-gradient(ellipse_at_top_right,_rgba(217,119,6,0.28),_transparent_60%),_linear-gradient(135deg,_#0c0c0c_0%,_#1c1c1c_100%)]";
  }
  return "bg-[radial-gradient(ellipse_at_top_right,_rgba(249,115,22,0.18),_transparent_60%),_linear-gradient(135deg,_#0c0c0c_0%,_#1c1c1c_100%)]";
}

function MemberBubble({ member }: { member: MemberAvatar }) {
  return (
    <Avatar className="h-8 w-8 border-2 border-white/40 shadow-sm">
      {member.profileImageUrl ? (
        <AvatarImage src={member.profileImageUrl} alt="" />
      ) : member.avatarId ? (
        (() => {
          const avatar = FITNESS_AVATARS.find((a) => a.id === member.avatarId);
          if (avatar) {
            const spriteSize = 96;
            return (
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: `url(/avatars-sprite.webp)`,
                  backgroundPosition: `-${avatar.col * spriteSize}px -${avatar.row * spriteSize}px`,
                  backgroundSize: `${spriteSize * 5}px ${spriteSize * 5}px`,
                  backgroundColor: avatar.color,
                }}
              />
            );
          }
          return (
            <AvatarFallback className="text-xs bg-white/20 text-white">
              {member.firstName?.[0] || "?"}
            </AvatarFallback>
          );
        })()
      ) : (
        <AvatarFallback className="text-xs bg-white/20 text-white">
          {member.firstName?.[0] || "?"}
        </AvatarFallback>
      )}
    </Avatar>
  );
}

export default function TeamCard({
  teamId,
  name,
  memberCount,
  totalCalories,
  totalSteps,
  totalWorkouts,
  rank,
  memberAvatars,
  onInvite,
  lastMessage,
}: TeamCardProps) {
  const extraMembers = memberCount > 4 ? memberCount - 4 : 0;
  const heroBg = heroGradientForRank(rank);

  // Client-side last-seen tracking so we can show an unread dot when there
  // are new messages since the user last opened this team's chat.
  let isUnread = false;
  if (lastMessage && typeof window !== "undefined") {
    try {
      const seenKey = `fayaflex_team_chat_seen_${teamId}`;
      const seenIso = window.localStorage.getItem(seenKey);
      const lastMs = new Date(lastMessage.createdAt).getTime();
      isUnread = !seenIso || lastMs > new Date(seenIso).getTime();
    } catch { /* localStorage unavailable */ }
  }

  return (
    <Card className="overflow-hidden hover-elevate" data-testid={`card-team-${teamId}`}>
      <Link href={`/teams/${teamId}`}>
        <div className={`relative px-5 py-5 text-white ${heroBg}`}>
          {/* Soft photographic light orbs */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-12 -right-10 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-white/5 blur-3xl" />
          </div>

          {/* Top row: Rank pill + name */}
          <div className="relative flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/60 font-semibold mb-1">
                <Users className="h-3 w-3" />
                {memberCount}/{MAX_TEAM_MEMBERS} members
              </div>
              <h3 className="text-2xl font-extrabold tracking-tight leading-tight truncate" data-testid="text-team-name">
                {name}
              </h3>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              {rank === 1 ? (
                <Icon3D name="crown" size={40} alt="Rank 1" />
              ) : rank === 2 ? (
                <Icon3D name="medal-silver" size={36} alt="Rank 2" />
              ) : rank === 3 ? (
                <Icon3D name="medal-bronze" size={36} alt="Rank 3" />
              ) : (
                <div className="h-9 px-2.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm flex items-center justify-center text-sm font-bold">
                  #{rank}
                </div>
              )}
              <span className="text-[10px] uppercase tracking-wider text-white/60 font-semibold">
                Rank
              </span>
            </div>
          </div>

          {/* Member avatars */}
          <div className="relative flex items-center gap-2">
            <div className="flex -space-x-2">
              {memberAvatars.slice(0, 4).map((m) => (
                <MemberBubble key={m.id} member={m} />
              ))}
              {extraMembers > 0 && (
                <div className="h-8 w-8 rounded-full bg-white/15 border-2 border-white/40 flex items-center justify-center text-xs font-bold text-white backdrop-blur-sm">
                  +{extraMembers}
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>

      <CardContent className="pt-4 pb-4">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="flex flex-col items-center text-center">
            <Icon3D name="flame" size={36} alt="Calories" />
            <p className="text-lg font-extrabold mt-1" data-testid="text-team-calories">
              {formatNumber(totalCalories)}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              calories
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <Icon3D name="sneaker" size={36} alt="Steps" />
            <p className="text-lg font-extrabold mt-1" data-testid="text-team-steps">
              {formatNumber(totalSteps)}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              steps
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <Icon3D name="dumbbell" size={36} alt="Workouts" />
            <p className="text-lg font-extrabold mt-1" data-testid="text-team-workouts">
              {totalWorkouts}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              workouts
            </p>
          </div>
        </div>

        {/* Latest team-chat message preview — surfaces the chat without
            requiring the user to scroll to the bottom of the team page. */}
        <Link href={`/teams/${teamId}#chat`}>
          <div
            className="flex items-start gap-2 mb-3 p-2.5 rounded-md bg-muted/40 hover-elevate"
            data-testid={`link-team-chat-${teamId}`}
          >
            <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              {lastMessage ? (
                <>
                  <p className="text-xs text-foreground truncate" data-testid={`text-team-last-message-${teamId}`}>
                    <span className="font-semibold">
                      {lastMessage.userFirstName || "Teammate"}:
                    </span>{" "}
                    {lastMessage.content}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })}
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Open team chat — no messages yet
                </p>
              )}
            </div>
            {isUnread && (
              <span
                className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5"
                data-testid={`indicator-unread-team-${teamId}`}
                aria-label="Unread messages"
              />
            )}
          </div>
        </Link>

        <div className="flex gap-2">
          <Link href={`/teams/${teamId}/victory-wall`} className="flex-1">
            <Button variant="outline" className="w-full" data-testid="button-victory-wall">
              <Trophy className="h-4 w-4 mr-2 text-amber-500" />
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
            Invite
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
