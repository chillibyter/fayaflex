import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowLeft, Trophy, Calendar, Flame, Lock, Users, Crown } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { Icon3D } from "@/components/Icon3D";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";

type MonthlyWinner = {
  id: string;
  teamId: string;
  userId: string;
  userName: string;
  userAvatarId?: string;
  profileImageUrl?: string | null;
  month: number;
  year: number;
  totalCalories: number;
};

type Team = {
  id: string;
  name: string;
  ownerId: string;
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function VictoryWall() {
  const params = useParams();
  const teamId = params.teamId;
  const { toast } = useToast();
  const [calculatingMonth, setCalculatingMonth] = useState<string | null>(null);

  const { 
    data: winners = [], 
    isLoading,
    isError,
    error,
    refetch 
  } = useQuery<MonthlyWinner[]>({
    queryKey: ['/api/teams', teamId, 'victory-wall'],
  });

  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ['/api/teams'],
  });

  const teamData = teams.find(t => t.id === teamId);

  const { data: user } = useQuery<{ id: string }>({
    queryKey: ['/api/user'],
  });

  const isOwner = user && teamData && user.id === teamData.ownerId;

  const calculateWinnerMutation = useMutation<
    MonthlyWinner & { userName: string },
    Error,
    { month: number; year: number }
  >({
    mutationFn: async ({ month, year }: { month: number; year: number }) => {
      const res = await apiRequest('POST', `/api/teams/${teamId}/calculate-winner`, { month, year });
      return await res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams', teamId, 'victory-wall'] });
      toast({
        title: "Winner Calculated",
        description: `${data.userName} is the winner for ${monthNames[variables.month - 1]} ${variables.year}!`,
      });
      setCalculatingMonth(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to calculate winner",
        variant: "destructive",
      });
      setCalculatingMonth(null);
    },
  });

  const handleCalculateWinner = (month: number, year: number) => {
    setCalculatingMonth(`${month}-${year}`);
    calculateWinnerMutation.mutate({ month, year });
  };

  const getCurrentMonthYear = () => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  };

  const getPreviousMonth = () => {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  };

  const previousMonth = getPreviousMonth();
  const hasCurrentMonthWinner = winners.some(
    w => w.month === previousMonth.month && w.year === previousMonth.year
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild data-testid="button-back-to-teams">
              <Link href="/teams">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="h-8 w-8 text-yellow-500" />
                <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
                  Victory Wall
                </h1>
              </div>
              <p className="text-muted-foreground">
                {teamData?.name || 'Team'} - Monthly Champions
              </p>
            </div>
          </div>
        </div>
        {isOwner && !hasCurrentMonthWinner && (
          <Button 
            onClick={() => handleCalculateWinner(previousMonth.month, previousMonth.year)}
            disabled={calculateWinnerMutation.isPending}
            data-testid="button-calculate-winner"
          >
            <Crown className="h-4 w-4 mr-2" />
            {calculateWinnerMutation.isPending ? "Calculating..." : `Calculate ${monthNames[previousMonth.month - 1]} Winner`}
          </Button>
        )}
      </div>

      {isError ? (
        <>
          {(error as any)?.status === 403 ? (
            <Card className="border-yellow-500/20 bg-yellow-500/5">
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <Lock className="h-16 w-16 mx-auto text-yellow-600" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Team Members Only</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      This victory wall is only available to team members. Join this team to view their champions!
                    </p>
                  </div>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <Button variant="outline" asChild data-testid="button-back-to-teams">
                      <Link href="/teams">
                        <Users className="h-4 w-4 mr-2" />
                        View My Teams
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12 space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
              <p className="text-muted-foreground">Failed to load victory wall</p>
              <Button onClick={() => refetch()} variant="outline" data-testid="button-retry">
                Try Again
              </Button>
            </div>
          )}
        </>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : winners.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {winners.map((winner) => (
            <Card key={winner.id} className="hover-elevate" data-testid={`card-winner-${winner.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="text-sm" data-testid={`badge-month-${winner.id}`}>
                    <Calendar className="h-3 w-3 mr-1" />
                    {monthNames[winner.month - 1]} {winner.year}
                  </Badge>
                  <Icon3D name="crown" size={36} alt="Champion crown" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    user={{
                      profileImageUrl: winner.profileImageUrl ?? null,
                      avatarId: winner.userAvatarId ?? null,
                      username: winner.userName,
                      firstName: null,
                      lastName: null,
                      email: null,
                    } as any}
                    className="h-16 w-16"
                    data-testid={`avatar-${winner.id}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">Champion</p>
                    <h3 className="font-semibold truncate" data-testid={`text-winner-name-${winner.id}`}>
                      {winner.userName}
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="font-medium" data-testid={`text-calories-${winner.id}`}>
                    {winner.totalCalories.toLocaleString()} calories
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Trophy className="h-16 w-16 mx-auto text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No Champions Yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {isOwner 
                    ? "As the team owner, you can calculate monthly winners when the month ends. The victory wall will showcase your team's champions!" 
                    : "Your team hasn't crowned any champions yet. Keep competing and check back when the team owner calculates the monthly winners!"
                  }
                </p>
              </div>
              {isOwner && (
                <Button 
                  onClick={() => handleCalculateWinner(previousMonth.month, previousMonth.year)}
                  disabled={calculateWinnerMutation.isPending}
                  data-testid="button-calculate-first-winner"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  {calculateWinnerMutation.isPending ? "Calculating..." : `Calculate ${monthNames[previousMonth.month - 1]} Winner`}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
