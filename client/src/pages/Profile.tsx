import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, TrendingUp, Calendar, AlertCircle, User, Fingerprint, Shield, Copy, RefreshCw } from "lucide-react";
import ProgressChart from "@/components/ProgressChart";
import { useQuery } from "@tanstack/react-query";
import type { User as UserType, Passkey } from "@shared/schema";
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
import { UserAvatar } from "@/components/UserAvatar";
import { registerPasskey, generateStrongPassword } from "@/lib/passkey";
import { HealthDevices } from "@/components/HealthDevices";

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
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

  const {
    data: passkeys = [],
    isLoading: isLoadingPasskeys
  } = useQuery<Passkey[]>({
    queryKey: ['/api/passkeys'],
    enabled: !!user,
  });

  const registerPasskeyMutation = useMutation({
    mutationFn: async () => {
      return await registerPasskey();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/passkeys'] });
      toast({
        title: "Passkey registered",
        description: "Your passkey has been registered successfully. You can now use it to log in.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Passkey registration failed",
        description: error.message || "Failed to register passkey. Please try again.",
        variant: "destructive",
      });
    },
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

  const handleGeneratePassword = () => {
    const password = generateStrongPassword(16);
    setGeneratedPassword(password);
    setShowPassword(true);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    toast({
      title: "Password copied",
      description: "The generated password has been copied to your clipboard.",
    });
  };

  const handleRegisterPasskey = () => {
    registerPasskeyMutation.mutate();
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
              <UserAvatar 
                user={user} 
                className="h-24 w-24"
                iconClassName="h-12 w-12"
                fallbackClassName="text-2xl"
              />
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Fingerprint className="h-4 w-4" />
                Passkey Authentication
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Use biometric authentication (fingerprint, face ID) to securely sign in without a password.
              </p>
              {isLoadingPasskeys ? (
                <Skeleton className="h-10 w-full" />
              ) : passkeys.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Fingerprint className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Passkey Registered</p>
                        <p className="text-xs text-muted-foreground">
                          {passkeys[0].deviceType || "Unknown device"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  data-testid="button-register-passkey"
                  onClick={handleRegisterPasskey}
                  disabled={registerPasskeyMutation.isPending}
                  className="gap-2"
                >
                  <Fingerprint className="h-4 w-4" />
                  {registerPasskeyMutation.isPending ? "Registering..." : "Register Passkey"}
                </Button>
              )}
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">Password Generator</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Generate a strong, secure password for use with other accounts or services.
              </p>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    data-testid="button-generate-password"
                    onClick={handleGeneratePassword}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Generate Password
                  </Button>
                  {generatedPassword && (
                    <Button
                      variant="outline"
                      data-testid="button-copy-password"
                      onClick={handleCopyPassword}
                      className="gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                  )}
                </div>
                {generatedPassword && (
                  <div className="p-3 rounded-md bg-muted/50 font-mono text-sm break-all" data-testid="text-generated-password">
                    {showPassword ? generatedPassword : "••••••••••••••••"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <HealthDevices />

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
