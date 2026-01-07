import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Flame, Footprints, Dumbbell, Trophy, MessageCircle, ChevronRight, AlertCircle } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import type { User as UserType, Activity } from "@shared/schema";
import { useLocation } from "wouter";
import { UserAvatar } from "@/components/UserAvatar";
import TeammateComparisonChart from "@/components/TeammateComparisonChart";
import UserBadgesDisplay from "@/components/UserBadgesDisplay";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type UserStats = {
  totalWorkouts: number;
  currentStreak: number;
  totalCalories?: number;
  totalSteps?: number;
};

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<"calories" | "steps" | "workouts">("calories");
  const [selectedDuration, setSelectedDuration] = useState<number>(7);
  const [challengeMessage, setChallengeMessage] = useState("");

  const { data: user, isLoading: isLoadingUser } = useQuery<UserType>({
    queryKey: [`/api/users/${userId}/profile`],
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery<UserStats>({
    queryKey: [`/api/users/${userId}/stats`],
    enabled: !!userId,
  });

  const { data: activities = [], isLoading: isLoadingActivities } = useQuery<Activity[]>({
    queryKey: [`/api/users/${userId}/activities`],
  });

  const { data: currentUser } = useQuery<UserType>({
    queryKey: ['/api/auth/user'],
  });

  const createChallengeMutation = useMutation({
    mutationFn: async (data: { opponentId: string; metric: string; durationDays: number; message?: string }) => {
      return await apiRequest('POST', '/api/challenges', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/challenges'] });
      toast({ title: "Challenge sent!", description: "Your challenge has been sent to the teammate." });
      setIsChallengeModalOpen(false);
      setChallengeMessage("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to create challenge", variant: "destructive" });
    },
  });

  const getUserFullName = () => {
    if (!user) return "Loading...";
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    if (user.username) {
      return user.username;
    }
    return "User";
  };

  const getFirstName = () => {
    if (!user) return "User";
    if (user.firstName) return user.firstName;
    if (user.username) return user.username;
    return "User";
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toString();
  };

  const recentActivities = activities
    .filter(a => a.workoutType)
    .slice(0, 4);

  const handleCreateChallenge = () => {
    if (!userId) return;
    createChallengeMutation.mutate({
      opponentId: userId,
      metric: selectedMetric,
      durationDays: selectedDuration,
      message: challengeMessage || undefined,
    });
  };

  const isOwnProfile = currentUser?.id === userId;

  // Redirect to own profile page if viewing self
  useEffect(() => {
    if (currentUser && isOwnProfile) {
      setLocation("/profile");
    }
  }, [currentUser, isOwnProfile, setLocation]);

  // Show loading while checking if this is own profile
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Error state for unauthorized access
  if (stats === undefined && !isLoadingStats && !isOwnProfile) {
    return (
      <div className="min-h-screen bg-background p-4">
        <button
          onClick={() => setLocation("/leaderboard")}
          className="flex items-center gap-2 text-muted-foreground mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>
        <Card className="p-8">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">Unable to view this profile. You can only view profiles of teammates.</p>
            <Button onClick={() => setLocation("/leaderboard")} variant="outline">
              Back to Leaderboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div
        className="relative px-4 pt-4 pb-16 text-white"
        style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)" }}
      >
        <button
          onClick={() => setLocation("/leaderboard")}
          className="absolute top-3 left-3 p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center">
          {isLoadingUser ? (
            <Skeleton className="h-24 w-24 rounded-full" />
          ) : (
            <div className="relative">
              <UserAvatar 
                user={user} 
                className="h-24 w-24 border-4 border-white/30"
                iconClassName="h-12 w-12"
                fallbackClassName="text-2xl"
              />
              <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-orange-500 text-white shadow-lg">
                <Flame className="h-4 w-4" />
              </div>
            </div>
          )}

          <h2 className="text-2xl font-bold mt-4" data-testid="text-user-name">
            {getUserFullName()}
          </h2>
          <p className="text-white/80 text-sm">
            Member since {user?.createdAt ? format(new Date(user.createdAt), 'MMMM yyyy') : 'Unknown'}
          </p>

          {!isLoadingStats && (stats?.currentStreak || 0) > 0 && (
            <div className="flex items-center gap-2 mt-3 px-4 py-2 bg-black/20 rounded-full">
              <Flame className="h-5 w-5 text-orange-400" />
              <span className="font-semibold">{stats?.currentStreak} Day Streak</span>
            </div>
          )}

          {!isOwnProfile && userId && (
            <div className="flex gap-3 mt-4">
              <Button 
                variant="secondary" 
                className="bg-white text-gray-800 hover:bg-gray-100"
                onClick={() => setLocation(`/messages/${userId}`)}
                data-testid="button-message"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Button>
              <Button 
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => setIsChallengeModalOpen(true)}
                data-testid="button-challenge"
              >
                <Trophy className="h-4 w-4 mr-2" />
                Challenge
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="mb-6">
          <h3 className="text-base font-semibold mb-3">Monthly Stats</h3>
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-green-50 dark:bg-green-900/20 border-0">
              <CardContent className="py-3 px-3 text-center">
                <Flame className="h-6 w-6 text-orange-500 mx-auto mb-1" />
                <p className="text-lg font-bold" data-testid="text-total-calories">
                  {isLoadingStats ? "..." : formatNumber(stats?.totalCalories || 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total Calories</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 dark:bg-green-900/20 border-0">
              <CardContent className="py-3 px-3 text-center">
                <Footprints className="h-6 w-6 text-green-600 mx-auto mb-1" />
                <p className="text-lg font-bold" data-testid="text-total-steps">
                  {isLoadingStats ? "..." : formatNumber(stats?.totalSteps || 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total Steps</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 dark:bg-green-900/20 border-0">
              <CardContent className="py-3 px-3 text-center">
                <Dumbbell className="h-6 w-6 text-green-600 mx-auto mb-1" />
                <p className="text-lg font-bold" data-testid="text-total-workouts">
                  {isLoadingStats ? "..." : stats?.totalWorkouts || 0}
                </p>
                <p className="text-xs text-muted-foreground">Total Workouts</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {userId && (
          <TeammateComparisonChart userId={userId} userName={getUserFullName()} />
        )}

        {userId && (
          <UserBadgesDisplay userId={userId} />
        )}

        {recentActivities.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div 
                    key={activity.id || index} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    data-testid={`activity-item-${index}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        activity.workoutType?.toLowerCase().includes('run') ? 'bg-emerald-100 dark:bg-emerald-950' :
                        activity.workoutType?.toLowerCase().includes('strength') ? 'bg-purple-100 dark:bg-purple-950' :
                        'bg-orange-100 dark:bg-orange-950'
                      }`}>
                        {activity.workoutType?.toLowerCase().includes('run') ? (
                          <Footprints className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <Dumbbell className="h-5 w-5 text-purple-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{activity.workoutType || "Workout"}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(activity.date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="pb-24" />
      </div>

      <Dialog open={isChallengeModalOpen} onOpenChange={setIsChallengeModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-orange-500" />
              Challenge {getFirstName()}
            </DialogTitle>
            <DialogDescription>
              Start a friendly competition with your teammate
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">What do you want to compete on?</Label>
              <RadioGroup value={selectedMetric} onValueChange={(v) => setSelectedMetric(v as typeof selectedMetric)}>
                <div className="grid grid-cols-3 gap-2">
                  <Label 
                    className={`flex flex-col items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedMetric === 'calories' ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30' : 'border-muted'
                    }`}
                  >
                    <RadioGroupItem value="calories" className="sr-only" />
                    <Flame className={`h-6 w-6 mb-1 ${selectedMetric === 'calories' ? 'text-orange-500' : 'text-muted-foreground'}`} />
                    <span className="text-xs font-medium">Calories</span>
                  </Label>
                  <Label 
                    className={`flex flex-col items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedMetric === 'steps' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'border-muted'
                    }`}
                  >
                    <RadioGroupItem value="steps" className="sr-only" />
                    <Footprints className={`h-6 w-6 mb-1 ${selectedMetric === 'steps' ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                    <span className="text-xs font-medium">Steps</span>
                  </Label>
                  <Label 
                    className={`flex flex-col items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedMetric === 'workouts' ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30' : 'border-muted'
                    }`}
                  >
                    <RadioGroupItem value="workouts" className="sr-only" />
                    <Dumbbell className={`h-6 w-6 mb-1 ${selectedMetric === 'workouts' ? 'text-purple-500' : 'text-muted-foreground'}`} />
                    <span className="text-xs font-medium">Workouts</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Challenge Duration</Label>
              <RadioGroup value={selectedDuration.toString()} onValueChange={(v) => setSelectedDuration(parseInt(v))}>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 7, 14, 30].map(days => (
                    <Label 
                      key={days}
                      className={`flex flex-col items-center p-2 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedDuration === days ? 'border-primary bg-primary/10' : 'border-muted'
                      }`}
                    >
                      <RadioGroupItem value={days.toString()} className="sr-only" />
                      <span className="text-lg font-bold">{days}</span>
                      <span className="text-xs text-muted-foreground">days</span>
                    </Label>
                  ))}
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Add a message (optional)</Label>
              <Textarea 
                placeholder="Let's see who can burn more calories this week!"
                value={challengeMessage}
                onChange={(e) => setChallengeMessage(e.target.value)}
                className="resize-none"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsChallengeModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-orange-500 hover:bg-orange-600"
              onClick={handleCreateChallenge}
              disabled={createChallengeMutation.isPending}
            >
              {createChallengeMutation.isPending ? "Sending..." : "Send Challenge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
