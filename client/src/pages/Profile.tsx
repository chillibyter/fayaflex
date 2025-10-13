import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, TrendingUp, Calendar, AlertCircle, User } from "lucide-react";
import ProgressChart from "@/components/ProgressChart";
import { useQuery } from "@tanstack/react-query";
import type { User as UserType } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { FITNESS_AVATARS, getAvatarById } from "@/lib/avatars";
import { Check } from "lucide-react";

type ChartData = {
  date: string;
  calories: number;
};

type UserStats = {
  totalWorkouts: number;
  currentStreak: number;
};

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");

  const {
    data: user,
    isLoading: isLoadingUser,
    isError: isErrorUser,
    refetch: refetchUser
  } = useQuery<UserType>({
    queryKey: ['/api/auth/user'],
  });

  const {
    data: chartData = [],
    isLoading: isLoadingChart
  } = useQuery<ChartData[]>({
    queryKey: ['/api/progress/chart'],
  });

  const {
    data: stats,
    isLoading: isLoadingStats
  } = useQuery<UserStats>({
    queryKey: ['/api/profile/stats'],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; avatarId?: string }) => {
      return await apiRequest('PATCH', '/api/auth/user', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleEditClick = () => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setSelectedAvatar(user.avatarId || "runner");
    }
    setIsEditOpen(true);
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({ firstName, lastName, avatarId: selectedAvatar });
  };

  const getUserInitials = () => {
    if (!user) return "?";
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || user.email?.[0]?.toUpperCase() || "?";
  };

  const getUserFullName = () => {
    if (!user) return "Loading...";
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return user.email || "User";
  };

  const achievements = [
    { title: "First Steps", description: "Completed your first workout", icon: Target },
    { title: "Streak Master", description: "7 day workout streak", icon: TrendingUp },
    { title: "Team Player", description: "Joined your first team", icon: Trophy },
  ];

  if (isErrorUser) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Profile</h1>
          <p className="text-muted-foreground">
            View your fitness journey and achievements.
          </p>
        </div>
        <Card className="p-12">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
            <p className="text-muted-foreground">Failed to load profile</p>
            <Button onClick={() => refetchUser()} variant="outline" data-testid="button-retry-profile">
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Profile</h1>
        <p className="text-muted-foreground">
          View your fitness journey and achievements.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoadingUser ? (
            <div className="flex items-center gap-6 flex-wrap">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-36" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
          ) : (
            <div className="flex items-center gap-6 flex-wrap">
              <Avatar className="h-24 w-24">
                {user?.avatarId ? (
                  <AvatarFallback className={`bg-gradient-to-br ${getAvatarById(user.avatarId).gradient}`}>
                    {(() => {
                      const IconComponent = getAvatarById(user.avatarId).icon;
                      return <IconComponent className="h-12 w-12 text-white" />;
                    })()}
                  </AvatarFallback>
                ) : user?.profileImageUrl ? (
                  <AvatarImage src={user.profileImageUrl} alt={getUserFullName()} />
                ) : (
                  <AvatarFallback className="text-2xl">{getUserInitials()}</AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1" data-testid="text-user-name">
                  {getUserFullName()}
                </h2>
                <p className="text-muted-foreground mb-3" data-testid="text-member-since">
                  {user?.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  Member since {user?.createdAt ? format(new Date(user.createdAt), 'MMMM yyyy') : 'Unknown'}
                </p>
              </div>
              <Button 
                variant="outline" 
                data-testid="button-edit-profile"
                onClick={handleEditClick}
              >
                <User className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            {isLoadingStats ? (
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-7 w-16" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-total-workouts">
                    {stats?.totalWorkouts || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Workouts</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            {isLoadingStats ? (
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-7 w-16" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold" data-testid="text-current-streak">
                    {stats?.currentStreak || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Day Streak</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {isLoadingChart ? (
        <Skeleton className="h-96 w-full" />
      ) : chartData.length > 0 ? (
        <ProgressChart data={chartData} title="My Progress" />
      ) : (
        <Card className="h-96 flex items-center justify-center">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">No activity data yet</p>
            <p className="text-sm text-muted-foreground">Start logging activities to see your progress</p>
          </div>
        </Card>
      )}

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent data-testid="dialog-edit-profile">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information below
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                data-testid="input-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                data-testid="input-last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name"
              />
            </div>
            <div className="space-y-2">
              <Label>Choose Your Avatar</Label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {FITNESS_AVATARS.map((avatar) => {
                  const IconComponent = avatar.icon;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar.id)}
                      className={`relative h-16 w-16 rounded-md bg-gradient-to-br ${avatar.gradient} flex items-center justify-center hover-elevate active-elevate-2 transition-all`}
                      data-testid={`button-avatar-${avatar.id}`}
                    >
                      <IconComponent className="h-8 w-8 text-white" />
                      {selectedAvatar === avatar.id && (
                        <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveProfile}
                disabled={updateProfileMutation.isPending}
                data-testid="button-save-profile"
              >
                {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
