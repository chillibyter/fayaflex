import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Clock, CheckCircle2, XCircle, Flame, Footprints, Dumbbell, ChevronRight } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format, differenceInDays } from "date-fns";
import { UserAvatar } from "@/components/UserAvatar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import type { User as UserType, Challenge } from "@shared/schema";

interface EnrichedChallenge extends Challenge {
  challenger: UserType | null;
  opponent: UserType | null;
  winner: UserType | null;
  currentScores: { challengerScore: number; opponentScore: number } | null;
}

export default function Challenges() {
  const { toast } = useToast();

  const { data: currentUser } = useQuery<UserType>({
    queryKey: ['/api/auth/user'],
  });

  const { data: challenges = [], isLoading } = useQuery<EnrichedChallenge[]>({
    queryKey: ['/api/challenges'],
  });

  const { data: pendingChallenges = [] } = useQuery<EnrichedChallenge[]>({
    queryKey: ['/api/challenges/pending'],
  });

  const respondMutation = useMutation({
    mutationFn: async ({ challengeId, accept }: { challengeId: string; accept: boolean }) => {
      return await apiRequest('POST', `/api/challenges/${challengeId}/respond`, { accept });
    },
    onSuccess: (_, { accept }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/challenges'] });
      queryClient.invalidateQueries({ queryKey: ['/api/challenges/pending'] });
      toast({ 
        title: accept ? "Challenge accepted!" : "Challenge declined",
        description: accept ? "Game on! The challenge has started." : "You've declined the challenge.",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'calories': return <Flame className="h-5 w-5 text-orange-500" />;
      case 'steps': return <Footprints className="h-5 w-5 text-emerald-500" />;
      case 'workouts': return <Dumbbell className="h-5 w-5 text-purple-500" />;
      default: return <Trophy className="h-5 w-5" />;
    }
  };

  const getMetricColor = (metric: string) => {
    switch (metric) {
      case 'calories': return 'bg-orange-100 dark:bg-orange-950';
      case 'steps': return 'bg-emerald-100 dark:bg-emerald-950';
      case 'workouts': return 'bg-purple-100 dark:bg-purple-950';
      default: return 'bg-muted';
    }
  };

  const formatScore = (score: number, metric: string) => {
    if (metric === 'workouts') return score.toString();
    if (score >= 1000) return `${(score / 1000).toFixed(1)}k`;
    return score.toLocaleString();
  };

  const getOpponent = (challenge: EnrichedChallenge) => {
    if (!currentUser) return null;
    return challenge.challengerId === currentUser.id ? challenge.opponent : challenge.challenger;
  };

  const getUserName = (user: UserType | null) => {
    if (!user) return "Unknown";
    if (user.firstName) return user.firstName;
    if (user.email) return user.email.split('@')[0];
    return "User";
  };

  const getMyScore = (challenge: EnrichedChallenge) => {
    if (!currentUser || !challenge.currentScores) return 0;
    return challenge.challengerId === currentUser.id 
      ? challenge.currentScores.challengerScore 
      : challenge.currentScores.opponentScore;
  };

  const getOpponentScore = (challenge: EnrichedChallenge) => {
    if (!currentUser || !challenge.currentScores) return 0;
    return challenge.challengerId === currentUser.id 
      ? challenge.currentScores.opponentScore 
      : challenge.currentScores.challengerScore;
  };

  const activeChallenges = challenges.filter(c => c.status === 'active');
  const completedChallenges = challenges.filter(c => c.status === 'completed');

  const renderChallengeCard = (challenge: EnrichedChallenge) => {
    const opponent = getOpponent(challenge);
    const daysLeft = challenge.endDate ? differenceInDays(new Date(challenge.endDate), new Date()) : 0;
    const myScore = getMyScore(challenge);
    const opponentScore = getOpponentScore(challenge);
    const totalScore = myScore + opponentScore || 1;
    const myPercentage = (myScore / totalScore) * 100;

    return (
      <Card key={challenge.id} className="overflow-hidden" data-testid={`challenge-card-${challenge.id}`}>
        <div className={`h-1 ${myScore > opponentScore ? 'bg-emerald-500' : myScore < opponentScore ? 'bg-red-500' : 'bg-yellow-500'}`} />
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getMetricColor(challenge.metric)}`}>
                {getMetricIcon(challenge.metric)}
              </div>
              <div>
                <p className="font-semibold capitalize">{challenge.metric} Challenge</p>
                <p className="text-xs text-muted-foreground">
                  {challenge.status === 'active' && daysLeft > 0 
                    ? `${daysLeft} days left` 
                    : challenge.status === 'completed'
                    ? `Ended ${challenge.completedAt ? format(new Date(challenge.completedAt), 'MMM d') : ''}`
                    : 'Ending today'}
                </p>
              </div>
            </div>
            <UserAvatar user={opponent} className="h-10 w-10" iconClassName="h-5 w-5" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">You: {formatScore(myScore, challenge.metric)}</span>
              <span className="text-muted-foreground">{getUserName(opponent)}: {formatScore(opponentScore, challenge.metric)}</span>
            </div>
            <div className="relative h-3 bg-red-200 dark:bg-red-900/30 rounded-full overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${myPercentage}%` }}
              />
            </div>
          </div>

          {challenge.status === 'completed' && challenge.winnerId && (
            <div className={`mt-3 p-2 rounded-lg text-center text-sm font-medium ${
              challenge.winnerId === currentUser?.id 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' 
                : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
            }`}>
              {challenge.winnerId === currentUser?.id ? "You won!" : `${getUserName(challenge.winner)} won`}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderPendingCard = (challenge: EnrichedChallenge) => {
    return (
      <Card key={challenge.id} className="overflow-hidden" data-testid={`pending-challenge-${challenge.id}`}>
        <div className="h-1 bg-yellow-500" />
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <UserAvatar user={challenge.challenger} className="h-12 w-12" iconClassName="h-6 w-6" />
            <div className="flex-1">
              <p className="font-semibold">{getUserName(challenge.challenger)} challenged you!</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {getMetricIcon(challenge.metric)}
                <span className="capitalize">{challenge.metric}</span>
                <span>•</span>
                <span>{challenge.durationDays} days</span>
              </div>
            </div>
          </div>

          {challenge.message && (
            <p className="text-sm text-muted-foreground mb-3 italic">"{challenge.message}"</p>
          )}

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => respondMutation.mutate({ challengeId: challenge.id, accept: false })}
              disabled={respondMutation.isPending}
              data-testid={`button-decline-challenge-${challenge.id}`}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Decline
            </Button>
            <Button 
              className="flex-1 bg-emerald-500 hover:bg-emerald-600"
              onClick={() => respondMutation.mutate({ challengeId: challenge.id, accept: true })}
              disabled={respondMutation.isPending}
              data-testid={`button-accept-challenge-${challenge.id}`}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Accept
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
          <Trophy className="h-8 w-8 text-orange-500" />
          Challenges
        </h1>
        <p className="text-muted-foreground">
          Compete with teammates in friendly fitness battles
        </p>
      </div>

      {pendingChallenges.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            Pending Invites ({pendingChallenges.length})
          </h2>
          {pendingChallenges.map(renderPendingCard)}
        </div>
      )}

      <Tabs defaultValue="active" className="w-full" data-testid="tabs-challenges">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active" data-testid="tab-active-challenges">Active ({activeChallenges.length})</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-challenge-history">History ({completedChallenges.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-3 mt-4">
          {isLoading ? (
            <>
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </>
          ) : activeChallenges.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium">No active challenges</p>
                <p className="text-sm text-muted-foreground">
                  Challenge a teammate from their profile to start competing!
                </p>
              </CardContent>
            </Card>
          ) : (
            activeChallenges.map(renderChallengeCard)
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-3 mt-4">
          {completedChallenges.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium">No completed challenges yet</p>
                <p className="text-sm text-muted-foreground">
                  Your challenge history will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            completedChallenges.map(renderChallengeCard)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
