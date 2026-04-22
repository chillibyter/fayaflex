import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, AlertCircle, User, Camera, Upload, Loader2, X, Flame, Footprints, Dumbbell, ArrowLeft, Check, Bell } from "lucide-react";
import { useLocation as useWouterLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { User as UserType, Team, Challenge } from "@shared/schema";
import { Trophy, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getApiUrl, getAuthToken } from "@/lib/queryClient";
import { format } from "date-fns";
import { FITNESS_AVATARS, AVATAR_SPRITE_URL } from "@/lib/avatars";
import { UserAvatar } from "@/components/UserAvatar";
import { Icon3D } from "@/components/Icon3D";
import BadgesDisplay from "@/components/BadgesDisplay";
import SmartGoals from "@/components/SmartGoals";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CitySearch } from "@/components/CitySearch";
import { Capacitor } from "@capacitor/core";
import { CapacitorHttp } from "@capacitor/core";

type UserStats = {
  totalWorkouts: number;
  currentStreak: number;
  totalCalories?: number;
  totalSteps?: number;
};

type EnrichedTeam = Team & { memberCount: number };

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logoutMutation } = useAuth();
  // Get absolute URL for avatar sprite on native platforms
  const avatarSpriteUrl = Capacitor.isNativePlatform() ? getApiUrl(AVATAR_SPRITE_URL) : AVATAR_SPRITE_URL;
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [useCustomPhoto, setUseCustomPhoto] = useState(false);
  const [continentId, setContinentId] = useState<string | null>(null);
  const [countryId, setCountryId] = useState<string | null>(null);
  const [regionId, setRegionId] = useState<string | null>(null);
  const [townId, setTownId] = useState<string | null>(null);
  const [bmr, setBmr] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { data: user, isLoading: isLoadingUser, isError: isErrorUser, refetch: refetchUser } = useQuery<UserType>({
    queryKey: ['/api/auth/user'],
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery<UserStats>({
    queryKey: ['/api/profile/stats'],
  });

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ['/api/app-notifications/unread-count'],
    refetchInterval: 60_000,
  });

  const { data: teams = [] } = useQuery<EnrichedTeam[]>({
    queryKey: ['/api/teams'],
  });

  interface EnrichedChallenge extends Challenge {
    challenger: UserType | null;
    opponent: UserType | null;
    currentScores: { challengerScore: number; opponentScore: number } | null;
  }

  const { data: challenges = [] } = useQuery<EnrichedChallenge[]>({
    queryKey: ['/api/challenges'],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; avatarId?: string; profileImageUrl?: string; bmr?: number | null }) => {
      return await apiRequest('PATCH', '/api/auth/user', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({ title: "Profile updated", description: "Your profile has been updated." });
      setIsEditOpen(false);
      setPreviewImage(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to update profile", variant: "destructive" });
    },
  });

  // Compress image on client before upload to reduce bandwidth and speed up uploads
  const compressImage = async (file: File, maxSize = 1024, quality = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        img.onload = () => {
          // Calculate new dimensions while maintaining aspect ratio
          let { width, height } = img;
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            } else {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }
          
          // Draw to canvas and compress
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 JPEG (good compression for photos)
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          const base64 = dataUrl.split(',')[1];
          console.log(`[Upload] Compressed image: ${file.size} bytes -> ~${Math.round(base64.length * 0.75)} bytes`);
          resolve(base64);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const uploadProfileImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const url = getApiUrl('/api/upload/profile-image');
      
      // Compress image on client before upload (reduces 10MB photo to ~100KB)
      const base64Data = await compressImage(file, 1024, 0.85);
      
      if (Capacitor.isNativePlatform()) {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        const token = getAuthToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await CapacitorHttp.request({
          url,
          method: 'POST',
          headers,
          data: {
            image: base64Data,
            filename: file.name,
            mimeType: 'image/jpeg',
          },
        });
        
        if (response.status >= 400) {
          throw new Error(response.data?.message || 'Failed to upload image');
        }
        return response.data;
      } else {
        // Web: convert base64 back to blob for FormData upload
        const byteString = atob(base64Data);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: 'image/jpeg' });
        
        const formData = new FormData();
        formData.append('image', blob, 'profile.jpg');
        const response = await fetch(url, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to upload image');
        }
        return response.json();
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({ title: "Photo uploaded", description: "Your profile photo has been saved." });
      setPreviewImage(`${data.path}?t=${Date.now()}`);
      setUseCustomPhoto(true);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to upload photo", variant: "destructive" });
    },
  });

  const handleEditClick = () => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setSelectedAvatar(user.avatarId || "runner");
      setUseCustomPhoto(!!user.profileImageUrl);
      setPreviewImage(user.profileImageUrl || null);
      setContinentId(user.continentId || null);
      setCountryId(user.countryId || null);
      setRegionId(user.regionId || null);
      setTownId(user.townId || null);
      setBmr((user as any).bmr || null);
    }
    setIsEditOpen(true);
  };

  const handleSaveProfile = () => {
    const updateData: any = {
      firstName,
      lastName,
      avatarId: selectedAvatar,
      continentId,
      countryId,
      regionId,
      townId,
      bmr: bmr || null,
    };
    if (!useCustomPhoto && user?.profileImageUrl) {
      updateData.profileImageUrl = "";
    }
    updateProfileMutation.mutate(updateData);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file", description: "Please select an image file", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
      setUseCustomPhoto(true);
    };
    reader.readAsDataURL(file);
    uploadProfileImageMutation.mutate(file);
  };

  const handleRemovePhoto = () => {
    setPreviewImage(null);
    setUseCustomPhoto(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const getUserFullName = () => {
    if (!user) return "Loading...";
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return user.email || "User";
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toString();
  };

  if (isErrorUser) {
    return (
      <div className="min-h-screen bg-background p-4">
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
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

  const [, setWouterLocation] = useWouterLocation();

  return (
    <div className="min-h-screen bg-background">
      <div
        className="relative px-4 pt-4 pb-16 text-white"
        style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)" }}
      >
        <button
          onClick={() => setWouterLocation("/")}
          className="absolute top-3 left-3 p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWouterLocation("/notifications")}
            aria-label="Notifications"
            className="relative p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            data-testid="button-notifications"
          >
            <Bell className="h-5 w-5" />
            {(unreadData?.count ?? 0) > 0 && (
              <span
                className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center leading-none"
                data-testid="text-unread-badge"
              >
                {(unreadData!.count) > 99 ? "99+" : unreadData!.count}
              </span>
            )}
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            data-testid="button-settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col items-center">
          {isLoadingUser ? (
            <Skeleton className="h-24 w-24 rounded-full" />
          ) : (
            <button
              onClick={handleEditClick}
              className="relative cursor-pointer group"
              data-testid="button-profile-photo"
            >
              <UserAvatar user={user} className="h-24 w-24 border-4 border-white/30 group-hover:border-white/50 transition-colors" iconClassName="h-12 w-12" />
              <div className="absolute -bottom-1 -right-1 p-2 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-full bg-white text-gray-700 shadow-md group-hover:bg-gray-100 transition-colors">
                <User className="h-4 w-4" />
              </div>
            </button>
          )}

          <h2 className="text-2xl font-bold mt-4" data-testid="text-user-name">{getUserFullName()}</h2>
          <p className="text-white/80 text-sm" data-testid="text-member-since">
            Member since {user?.createdAt ? format(new Date(user.createdAt), 'MMM yyyy') : 'Unknown'}
          </p>

          {!isLoadingStats && (stats?.currentStreak || 0) > 0 && (
            <div className="flex items-center gap-2 mt-3 pl-2 pr-4 py-1 bg-black/20 rounded-full">
              <Icon3D name="fire-streak" size={32} alt="Streak" />
              <span className="font-semibold">{stats?.currentStreak} Day Streak</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="mb-6">
          <SmartGoals />
        </div>

        <div className="mb-6">
          <h3 className="text-base font-semibold mb-3">Monthly Stats</h3>
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-green-50 dark:bg-green-900/20 border-0">
              <CardContent className="py-3 px-3 text-center">
                <Flame className="h-6 w-6 text-orange-500 mx-auto mb-1" />
                <p className="text-lg font-bold">{formatNumber(stats?.totalCalories || 0)}</p>
                <p className="text-xs text-muted-foreground">Total Calories</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 dark:bg-green-900/20 border-0">
              <CardContent className="py-3 px-3 text-center">
                <Footprints className="h-6 w-6 text-green-600 mx-auto mb-1" />
                <p className="text-lg font-bold">{formatNumber(stats?.totalSteps || 0)}</p>
                <p className="text-xs text-muted-foreground">Total Steps</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 dark:bg-green-900/20 border-0">
              <CardContent className="py-3 px-3 text-center">
                <Dumbbell className="h-6 w-6 text-green-600 mx-auto mb-1" />
                <p className="text-lg font-bold">{stats?.totalWorkouts || 0}</p>
                <p className="text-xs text-muted-foreground">Total Workouts</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <BadgesDisplay />

        {challenges.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <Trophy className="h-4 w-4 text-orange-500" />
                My Challenges
              </h3>
              <Link href="/challenges">
                <Button variant="ghost" size="sm" className="text-xs">
                  View All <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="space-y-2">
              {challenges.filter(c => c.status === 'active' || c.status === 'pending').slice(0, 3).map((challenge) => {
                const isChallenger = challenge.challengerId === user?.id;
                const opponent = isChallenger ? challenge.opponent : challenge.challenger;
                const myScore = isChallenger ? challenge.currentScores?.challengerScore : challenge.currentScores?.opponentScore;
                const opponentScore = isChallenger ? challenge.currentScores?.opponentScore : challenge.currentScores?.challengerScore;
                
                return (
                  <Link key={challenge.id} href="/challenges">
                    <Card className="hover-elevate cursor-pointer">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                              challenge.metric === 'calories' ? 'bg-orange-100 dark:bg-orange-950' :
                              challenge.metric === 'steps' ? 'bg-emerald-100 dark:bg-emerald-950' :
                              'bg-purple-100 dark:bg-purple-950'
                            }`}>
                              {challenge.metric === 'calories' && <Flame className="h-4 w-4 text-orange-500" />}
                              {challenge.metric === 'steps' && <Footprints className="h-4 w-4 text-emerald-500" />}
                              {challenge.metric === 'workouts' && <Dumbbell className="h-4 w-4 text-purple-500" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                vs {opponent?.firstName || 'Teammate'}
                              </p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {challenge.status === 'pending' ? 'Pending' : `${challenge.durationDays} day ${challenge.metric}`}
                              </p>
                            </div>
                          </div>
                          {challenge.status === 'active' && challenge.currentScores && (
                            <div className={`text-sm font-semibold ${
                              (myScore || 0) > (opponentScore || 0) ? 'text-emerald-600' : 
                              (myScore || 0) < (opponentScore || 0) ? 'text-red-500' : 'text-yellow-600'
                            }`}>
                              {myScore?.toLocaleString()} - {opponentScore?.toLocaleString()}
                            </div>
                          )}
                          {challenge.status === 'pending' && !isChallenger && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-1 rounded-full">
                              Respond
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {teams.length > 0 && (
          <div className="mb-6">
            <h3 className="text-base font-semibold mb-3">My Teams</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
              {teams.map((team) => (
                <Link key={team.id} href={`/teams/${team.id}`}>
                  <div className="flex items-center gap-2 px-3 py-2 bg-card rounded-full border hover-elevate cursor-pointer min-w-fit">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{team.name[0]}</span>
                    </div>
                    <span className="text-sm font-medium whitespace-nowrap">{team.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-1 py-2">
            <Link href="/how-it-works" onClick={() => setIsSettingsOpen(false)}>
              <button className="w-full flex items-center gap-3 py-3 px-2 hover:bg-muted/50 rounded-md transition-colors" data-testid="link-how-it-works">
                <span className="font-medium">How It Works</span>
              </button>
            </Link>
            <Link href="/support" onClick={() => setIsSettingsOpen(false)}>
              <button className="w-full flex items-center gap-3 py-3 px-2 hover:bg-muted/50 rounded-md transition-colors" data-testid="link-support">
                <span className="font-medium">Support</span>
              </button>
            </Link>
            <Link href="/privacy" onClick={() => setIsSettingsOpen(false)}>
              <button className="w-full flex items-center gap-3 py-3 px-2 hover:bg-muted/50 rounded-md transition-colors" data-testid="link-privacy">
                <span className="font-medium">Privacy Policy</span>
              </button>
            </Link>
            <Link href="/notifications" onClick={() => setIsSettingsOpen(false)}>
              <button className="w-full flex items-center gap-3 py-3 px-2 hover:bg-muted/50 rounded-md transition-colors" data-testid="link-notifications">
                <span className="font-medium">Notifications</span>
              </button>
            </Link>
            <div className="border-t my-2" />
            <Link href="/delete-account" onClick={() => setIsSettingsOpen(false)}>
              <button className="w-full flex items-center gap-3 py-3 px-2 hover:bg-destructive/10 rounded-md transition-colors text-destructive" data-testid="link-delete-account">
                <span className="font-medium">Delete Account</span>
              </button>
            </Link>
            <button
              onClick={() => {
                setIsSettingsOpen(false);
                setIsLogoutConfirmOpen(true);
              }}
              className="w-full flex items-center gap-3 py-3 px-2 hover:bg-destructive/10 rounded-md transition-colors text-destructive"
              data-testid="button-logout"
            >
              <span className="font-medium">Log Out</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isLogoutConfirmOpen} onOpenChange={setIsLogoutConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out? You'll need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-logout">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="button-confirm-logout">
              Log Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden" data-testid="dialog-edit-profile">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <Flame className="h-6 w-6 text-orange-500" />
            <DialogTitle className="text-lg font-semibold">Edit Profile</DialogTitle>
            <button onClick={() => setIsEditOpen(false)} className="p-1 rounded-full hover:bg-muted" data-testid="button-close-edit">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="px-4 pb-4 max-h-[70vh] overflow-y-auto">
            <p className="text-center text-sm text-muted-foreground mb-4">Update your profile information</p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" data-testid="input-first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" data-testid="input-last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Input id="email" value={user?.email || ''} readOnly className="pl-9 bg-muted/50" />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              <div className="flex flex-col items-center py-4">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                    {useCustomPhoto && previewImage ? (
                      <AvatarImage src={previewImage} alt="Profile preview" className="object-cover" />
                    ) : selectedAvatar ? (
                      <div 
                        className="w-full h-full"
                        style={{
                          backgroundImage: `url(${avatarSpriteUrl})`,
                          backgroundSize: '500%',
                          backgroundPosition: `${(FITNESS_AVATARS.find(a => a.id === selectedAvatar)?.col || 0) * 25}% ${(FITNESS_AVATARS.find(a => a.id === selectedAvatar)?.row || 0) * 25}%`,
                        }}
                      />
                    ) : (
                      <AvatarFallback className="text-2xl">
                        {firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {uploadProfileImageMutation.isPending && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center border-2 border-background">
                    <Flame className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadProfileImageMutation.isPending} data-testid="button-upload-photo">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => cameraInputRef.current?.click()} disabled={uploadProfileImageMutation.isPending} data-testid="button-take-selfie">
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => document.getElementById('avatar-grid')?.scrollIntoView({ behavior: 'smooth' })} 
                  data-testid="button-choose-avatar"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Choose Avatar
                </Button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" data-testid="input-file-upload" />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="user" onChange={handleFileSelect} className="hidden" data-testid="input-camera-capture" />

              <div className="space-y-2" id="avatar-grid">
                <Label>Choose Your Avatar</Label>
                <div className="grid grid-cols-6 gap-2">
                  {FITNESS_AVATARS.map((avatar) => {
                    const isSelected = !useCustomPhoto && selectedAvatar === avatar.id;
                    return (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => {
                          setSelectedAvatar(avatar.id);
                          setUseCustomPhoto(false);
                          setPreviewImage(null);
                        }}
                        className={`relative h-10 w-10 rounded-full overflow-hidden hover-elevate ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                        style={{
                          backgroundImage: `url(${avatarSpriteUrl})`,
                          backgroundSize: '500%',
                          backgroundPosition: `${avatar.col * 25}% ${avatar.row * 25}%`,
                        }}
                        data-testid={`button-avatar-${avatar.id}`}
                      >
                        {isSelected && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Check className="h-5 w-5 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  className="w-full min-h-[80px] px-3 py-2 border rounded-md bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Tell us about your fitness journey..."
                  data-testid="input-bio"
                />
              </div>

              <CitySearch
                onSelect={(location) => {
                  setContinentId(location.continentId);
                  setCountryId(location.countryId);
                  setRegionId(location.regionId);
                  setTownId(location.townId);
                }}
              />

              <div className="space-y-2">
                <Label htmlFor="bmr">BMR (Basal Metabolic Rate)</Label>
                <Input
                  id="bmr"
                  type="number"
                  min={500}
                  max={5000}
                  value={bmr || ""}
                  onChange={(e) => setBmr(e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="e.g. 1800"
                  data-testid="input-bmr"
                />
                <p className="text-xs text-muted-foreground">
                  Used by Android devices to calculate active calories from total calories burned. Typical range: 1200-2500 kcal.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 px-4 py-4 border-t bg-background">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditOpen(false)} data-testid="button-cancel-edit">
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={handleSaveProfile}
              disabled={updateProfileMutation.isPending || uploadProfileImageMutation.isPending}
              data-testid="button-save-profile"
            >
              {updateProfileMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
