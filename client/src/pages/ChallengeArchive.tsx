import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, 
  Calendar, 
  Flame, 
  ArrowLeft, 
  Users, 
  Crown,
  TrendingUp,
  Award,
  Star
} from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";

type ArchiveWinner = {
  id: string;
  teamId: string;
  userId: string;
  userName: string;
  userAvatarId?: string;
  userProfileImageUrl?: string;
  month: number;
  year: number;
  totalCalories: number;
  teamName: string;
  isCurrentUser: boolean;
};

type MonthlyStats = {
  month: number;
  year: number;
  totalCalories: number;
  winnersCount: number;
  teams: string[];
};

type ArchiveData = {
  winners: ArchiveWinner[];
  monthlyStats: MonthlyStats[];
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function ChallengeArchive() {
  const { 
    data, 
    isLoading,
    isError,
    refetch 
  } = useQuery<ArchiveData>({
    queryKey: ['/api/challenge-archive'],
  });

  const winners = data?.winners || [];
  const monthlyStats = data?.monthlyStats || [];

  const userWins = winners.filter(w => w.isCurrentUser);
  const totalCaloriesBurned = winners.reduce((sum, w) => sum + w.totalCalories, 0);
  const uniqueMonths = new Set(winners.map(w => `${w.year}-${w.month}`)).size;

  const groupedByMonth = winners.reduce((acc, winner) => {
    const key = `${winner.year}-${winner.month}`;
    if (!acc[key]) {
      acc[key] = {
        month: winner.month,
        year: winner.year,
        winners: [],
      };
    }
    acc[key].winners.push(winner);
    return acc;
  }, {} as Record<string, { month: number; year: number; winners: ArchiveWinner[] }>);

  const sortedMonths = Object.values(groupedByMonth).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild data-testid="button-back">
          <Link href="/teams">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="h-7 w-7 text-yellow-500" />
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
              Challenge Archive
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Past monthly competition results
          </p>
        </div>
      </div>

      {isError ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Trophy className="h-16 w-16 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Failed to load archive</p>
              <Button onClick={() => refetch()} variant="outline" data-testid="button-retry">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : winners.length > 0 ? (
        <Tabs defaultValue="timeline" className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Card data-testid="stat-your-wins">
              <CardContent className="p-4 text-center">
                <Crown className="h-6 w-6 mx-auto mb-1 text-yellow-500" />
                <p className="text-2xl font-bold">{userWins.length}</p>
                <p className="text-xs text-muted-foreground">Your Wins</p>
              </CardContent>
            </Card>
            <Card data-testid="stat-total-months">
              <CardContent className="p-4 text-center">
                <Calendar className="h-6 w-6 mx-auto mb-1 text-primary" />
                <p className="text-2xl font-bold">{uniqueMonths}</p>
                <p className="text-xs text-muted-foreground">Months</p>
              </CardContent>
            </Card>
            <Card data-testid="stat-total-calories">
              <CardContent className="p-4 text-center">
                <Flame className="h-6 w-6 mx-auto mb-1 text-orange-500" />
                <p className="text-2xl font-bold">{(totalCaloriesBurned / 1000).toFixed(0)}k</p>
                <p className="text-xs text-muted-foreground">Total Cal</p>
              </CardContent>
            </Card>
          </div>

          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="timeline" data-testid="tab-timeline">
              <Calendar className="h-4 w-4 mr-2" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="stats" data-testid="tab-stats">
              <TrendingUp className="h-4 w-4 mr-2" />
              Statistics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-4">
            {sortedMonths.map(({ month, year, winners: monthWinners }) => (
              <Card key={`${year}-${month}`} data-testid={`card-month-${year}-${month}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      {monthNames[month - 1]} {year}
                    </CardTitle>
                    <Badge variant="secondary">
                      {monthWinners.length} {monthWinners.length === 1 ? 'team' : 'teams'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {monthWinners.map((winner) => (
                    <div 
                      key={winner.id} 
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        winner.isCurrentUser ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                      }`}
                      data-testid={`winner-${winner.id}`}
                    >
                      <div className="relative">
                        <UserAvatar 
                          user={{ 
                            avatarId: winner.userAvatarId, 
                            profileImageUrl: winner.userProfileImageUrl,
                            firstName: winner.userName.split(' ')[0],
                            lastName: winner.userName.split(' ')[1]
                          }} 
                          size="md"
                        />
                        {winner.isCurrentUser && (
                          <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5">
                            <Star className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate" data-testid={`text-winner-name-${winner.id}`}>
                            {winner.userName}
                            {winner.isCurrentUser && <span className="text-primary ml-1">(You)</span>}
                          </p>
                          <Trophy className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {winner.teamName}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-orange-500" data-testid={`text-calories-${winner.id}`}>
                          {winner.totalCalories.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">calories</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Your Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userWins.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-3xl font-bold text-yellow-500">{userWins.length}</p>
                        <p className="text-sm text-muted-foreground">Total Wins</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-3xl font-bold text-orange-500">
                          {userWins.reduce((sum, w) => sum + w.totalCalories, 0).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">Winning Calories</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Winning Months:</p>
                      <div className="flex flex-wrap gap-2">
                        {userWins.map((win) => (
                          <Badge key={win.id} variant="secondary">
                            <Trophy className="h-3 w-3 mr-1 text-yellow-500" />
                            {monthNames[win.month - 1]} {win.year}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No wins yet</p>
                    <p className="text-sm text-muted-foreground">Keep pushing to become a monthly champion!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Monthly Leaderboard History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {monthlyStats.map((stat) => (
                    <div 
                      key={`${stat.year}-${stat.month}`} 
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      data-testid={`stat-row-${stat.year}-${stat.month}`}
                    >
                      <div>
                        <p className="font-medium">{monthNames[stat.month - 1]} {stat.year}</p>
                        <p className="text-sm text-muted-foreground">
                          {stat.teams.length} {stat.teams.length === 1 ? 'team' : 'teams'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-orange-500">
                          {stat.totalCalories.toLocaleString()} cal
                        </p>
                        <p className="text-xs text-muted-foreground">
                          total burned
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Trophy className="h-16 w-16 mx-auto text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No Past Challenges Yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Monthly challenge results will appear here after team owners calculate winners at the end of each month.
                </p>
              </div>
              <Button asChild variant="outline" data-testid="button-view-teams">
                <Link href="/teams">
                  <Users className="h-4 w-4 mr-2" />
                  View My Teams
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
