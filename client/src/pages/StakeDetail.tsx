import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/UserAvatar";
import PageHeader from "@/components/PageHeader";
import { Target, Flame, Trophy, Clock, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { Stake, Team } from "@shared/schema";

interface DetailResponse {
  stake: Stake;
  hostTeam: Team | null;
  opponentTeam: Team | null;
  participants: Array<{
    userId: string;
    teamId: string;
    joinedAt: string;
    firstName: string | null;
    lastName: string | null;
    username: string;
    avatarId: string | null;
    profileImageUrl: string | null;
  }>;
  individualScores: Array<{ userId: string; teamId: string; score: number }>;
  teamTotals: Record<string, number>;
}

function name(p: { firstName: string | null; lastName: string | null; username: string }) {
  const full = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
  return full || p.username;
}

export default function StakeDetail() {
  const [, params] = useRoute("/stakes/:id");
  const id = params?.id;
  const { toast } = useToast();
  const { user } = useAuth();

  const { data, isLoading } = useQuery<DetailResponse>({
    queryKey: ["/api/stakes", id],
    enabled: !!id,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/stakes/${id}/join`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stakes", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/stakes"] });
      toast({ title: "You're in!", description: "Good luck out there." });
    },
    onError: (e: any) => toast({ title: "Error", description: e?.message || "Failed to join", variant: "destructive" }),
  });

  const acceptMutation = useMutation({
    mutationFn: async (accept: boolean) => {
      const res = await apiRequest("POST", `/api/stakes/${id}/accept`, { accept });
      return await res.json();
    },
    onSuccess: (_d, accept) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stakes", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/stakes"] });
      toast({ title: accept ? "Challenge accepted" : "Challenge declined" });
    },
    onError: (e: any) => toast({ title: "Error", description: e?.message || "Failed", variant: "destructive" }),
  });

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <PageHeader title="Stake" backPath="/stakes" />
        <div className="px-4 py-4 max-w-screen-lg mx-auto space-y-3">
          <Skeleton className="h-24 w-full rounded-md" />
          <Skeleton className="h-48 w-full rounded-md" />
        </div>
      </div>
    );
  }

  const { stake, hostTeam, opponentTeam, participants, individualScores, teamTotals } = data;
  const isInterTeam = !!stake.opponentTeamId;
  const myParticipant = participants.find(p => p.userId === user?.id);
  const isPending = stake.status === "pending";
  const isActive = stake.status === "active";

  // Only members of the opposing team see Accept/Decline. The backend
  // enforces this too, but the UI shouldn't invite an avoidable 403.
  const myUserId = user?.id;
  const isOpponentTeamMember =
    !!myUserId &&
    !!opponentTeam &&
    participants.some(p => p.userId === myUserId && p.teamId === opponentTeam.id);
  // Owner can also see (via their host membership) but cannot accept their own challenge.
  const canRespondToPending = isPending && isInterTeam && isOpponentTeamMember;

  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(stake.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Stake" backPath="/stakes" />
      <div className="px-4 py-4 max-w-screen-lg mx-auto space-y-4">
        {/* Header card */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{stake.status}</Badge>
                <Badge variant="outline" className="text-[10px]">
                  {isInterTeam ? "Inter-team" : "Intra-team"}
                </Badge>
                {isActive && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {daysLeft}d left
                  </span>
                )}
              </div>
              <h1 className="text-lg font-bold mt-1" data-testid="text-stake-detail-title">{stake.title}</h1>
              {stake.stakeAmount && (
                <p className="text-sm text-muted-foreground mt-0.5">{stake.stakeAmount}</p>
              )}
              {stake.description && (
                <p className="text-sm mt-2">{stake.description}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Inter-team score */}
        {isInterTeam && hostTeam && opponentTeam && (
          <Card className="p-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">Team score</p>
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 text-center">
                <p className="font-semibold truncate">{hostTeam.name}</p>
                <p className="text-2xl font-bold text-primary mt-1" data-testid="text-host-total">
                  {(teamTotals[hostTeam.id] || 0).toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground">cal</p>
              </div>
              <div className="text-xs text-muted-foreground font-bold">vs</div>
              <div className="flex-1 text-center">
                <p className="font-semibold truncate">{opponentTeam.name}</p>
                <p className="text-2xl font-bold text-primary mt-1" data-testid="text-opp-total">
                  {(teamTotals[opponentTeam.id] || 0).toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground">cal</p>
              </div>
            </div>
          </Card>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {isActive && !myParticipant && (
            <Button
              className="flex-1"
              onClick={() => joinMutation.mutate()}
              disabled={joinMutation.isPending}
              data-testid="button-join-stake"
            >
              {joinMutation.isPending ? "Joining..." : "Join stake"}
            </Button>
          )}
          {canRespondToPending && (
            <>
              <Button
                className="flex-1"
                onClick={() => acceptMutation.mutate(true)}
                disabled={acceptMutation.isPending}
                data-testid="button-accept-stake"
              >
                Accept
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => acceptMutation.mutate(false)}
                disabled={acceptMutation.isPending}
                data-testid="button-decline-stake"
              >
                Decline
              </Button>
            </>
          )}
          {isPending && isInterTeam && !canRespondToPending && (
            <p className="text-xs text-muted-foreground text-center w-full">
              Waiting on {opponentTeam?.name || "the other team"} to accept.
            </p>
          )}
        </div>

        {/* Leaderboard */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-primary" />
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Leaderboard</p>
          </div>
          {individualScores.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No participants yet.</p>
          ) : (
            <div className="space-y-2">
              {individualScores.map((s, idx) => {
                const p = participants.find(pp => pp.userId === s.userId);
                if (!p) return null;
                return (
                  <div
                    key={s.userId}
                    className="flex items-center gap-3 py-2"
                    data-testid={`row-leaderboard-${s.userId}`}
                  >
                    <span className="text-sm font-bold text-muted-foreground w-5 text-center">
                      {idx + 1}
                    </span>
                    <UserAvatar user={p} className="h-8 w-8" />
                    <span className="flex-1 text-sm font-medium truncate">{name(p)}</span>
                    <span className="text-sm font-bold flex items-center gap-1">
                      <Flame className="h-3 w-3 text-primary" />
                      {s.score.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Participants count */}
        <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
          <Users className="h-3 w-3" /> {participants.length} participant{participants.length === 1 ? "" : "s"}
        </p>
      </div>
    </div>
  );
}
