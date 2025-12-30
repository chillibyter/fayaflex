import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, Calendar, AlertCircle, User, HelpCircle, Shield, BookOpen, LogOut, ChevronRight, Camera, Upload, Loader2, X } from "lucide-react";
import ProgressChart from "@/components/ProgressChart";
import { useQuery } from "@tanstack/react-query";
import type { User as UserType } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useRef } from "react";
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
import { FITNESS_AVATARS } from "@/lib/avatars";
import { Check } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { HealthDevices } from "@/components/HealthDevices";
import BadgesDisplay from "@/components/BadgesDisplay";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LocationPicker } from "@/components/LocationPicker";

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
  const { logoutMutation } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [useCustomPhoto, setUseCustomPhoto] = useState(false);
  const [continentId, setContinentId] = useState<string | null>(null);
  const [countryId, setCountryId] = useState<string | null>(null);
  const [regionId, setRegionId] = useState<string | null>(null);
  const [townId, setTownId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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
    mutationFn: async (data: { firstName: string; lastName: string; avatarId?: string; profileImageUrl?: string }) => {
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

  const uploadProfileImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetch('/api/upload/profile-image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload image');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({ title: "Photo uploaded", description: "Your profile photo has been saved." });
      // Keep dialog open so user can continue editing other fields
      // Update preview with the saved image path
      setPreviewImage(data.path);
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
    }
    setIsEditOpen(true);
  };

  const handleSaveProfile = () => {
    // Build update payload - always include name, avatar, and location
    const updateData: { 
      firstName: string; 
      lastName: string; 
      avatarId?: string; 
      profileImageUrl?: string;
      continentId?: string | null;
      countryId?: string | null;
      regionId?: string | null;
      townId?: string | null;
    } = {
      firstName,
      lastName,
      avatarId: selectedAvatar, // Always save avatar as fallback
      continentId,
      countryId,
      regionId,
      townId,
    };
    
    // If user is switching from custom photo to avatar, clear the profile image
    if (!useCustomPhoto && user?.profileImageUrl) {
      updateData.profileImageUrl = "";
    }
    
    updateProfileMutation.mutate(updateData);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file", description: "Please select an image file", variant: "destructive" });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
      setUseCustomPhoto(true);
    };
    reader.readAsDataURL(file);

    // Upload the image
    uploadProfileImageMutation.mutate(file);
  };

  const handleRemovePhoto = () => {
    setPreviewImage(null);
    setUseCustomPhoto(false);
    // Clear file inputs
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

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold mb-6">Profile</h1>

        <Card className="mb-6">
          <CardContent className="pt-6">
            {isLoadingUser ? (
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <UserAvatar user={user} className="h-16 w-16" iconClassName="h-8 w-8" />
                <div className="flex-1">
                  <h2 className="text-xl font-bold" data-testid="text-user-name">{getUserFullName()}</h2>
                  <p className="text-sm text-muted-foreground" data-testid="text-member-since">
                    Member since {user?.createdAt ? format(new Date(user.createdAt), 'MMM yyyy') : 'Unknown'}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleEditClick} data-testid="button-edit-profile">
                  <User className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-4">
              {isLoadingStats ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-center">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-2xl font-bold" data-testid="text-total-workouts">{stats?.totalWorkouts || 0}</p>
                  <p className="text-xs text-muted-foreground">Workouts</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4">
              {isLoadingStats ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="text-center">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-2xl font-bold" data-testid="text-current-streak">{stats?.currentStreak || 0}</p>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <BadgesDisplay />

        <HealthDevices />

        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Settings & Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <Link href="/how-it-works">
              <button className="w-full flex items-center justify-between py-3 px-1 hover:bg-muted/50 rounded-md transition-colors" data-testid="link-how-it-works">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span className="font-medium">How It Works</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </Link>
            <Link href="/support">
              <button className="w-full flex items-center justify-between py-3 px-1 hover:bg-muted/50 rounded-md transition-colors" data-testid="link-support">
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <span className="font-medium">Support</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </Link>
            <Link href="/privacy">
              <button className="w-full flex items-center justify-between py-3 px-1 hover:bg-muted/50 rounded-md transition-colors" data-testid="link-privacy">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="font-medium">Privacy Policy</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </Link>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-between py-3 px-1 hover:bg-destructive/10 rounded-md transition-colors text-destructive"
              data-testid="button-logout"
            >
              <div className="flex items-center gap-3">
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Log Out</span>
              </div>
              <ChevronRight className="h-5 w-5" />
            </button>
          </CardContent>
        </Card>

        {isLoadingChart ? (
          <Skeleton className="h-64 w-full mt-6" />
        ) : chartData.length > 0 ? (
          <div className="mt-6">
            <ProgressChart data={chartData} title="My Progress" />
          </div>
        ) : null}
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent data-testid="dialog-edit-profile">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your profile information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" data-testid="input-first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" data-testid="input-last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
            </div>
            
            <div className="space-y-3">
              <Label>Profile Photo</Label>
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    {useCustomPhoto && previewImage ? (
                      <AvatarImage src={previewImage} alt="Profile preview" className="object-cover" />
                    ) : selectedAvatar ? (
                      <div className={`flex items-center justify-center w-full h-full bg-gradient-to-br ${FITNESS_AVATARS.find(a => a.id === selectedAvatar)?.gradient || 'from-blue-500 to-cyan-500'}`}>
                        {(() => {
                          const avatar = FITNESS_AVATARS.find(a => a.id === selectedAvatar);
                          if (avatar) {
                            const Icon = avatar.icon;
                            return <Icon className="h-10 w-10 text-white" />;
                          }
                          return null;
                        })()}
                      </div>
                    ) : (
                      <AvatarFallback className="text-xl">
                        {firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {uploadProfileImageMutation.isPending && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                  {useCustomPhoto && previewImage && !uploadProfileImageMutation.isPending && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-destructive flex items-center justify-center hover:bg-destructive/80"
                      data-testid="button-remove-photo"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  )}
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadProfileImageMutation.isPending}
                      data-testid="button-upload-photo"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={uploadProfileImageMutation.isPending}
                      data-testid="button-take-selfie"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Selfie
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Or choose an avatar below</p>
                </div>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-file-upload"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-camera-capture"
              />
            </div>

            <div className="space-y-2">
              <Label>Choose Avatar</Label>
              <div className="grid grid-cols-6 gap-2">
                {FITNESS_AVATARS.map((avatar) => {
                  const IconComponent = avatar.icon;
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
                      className={`relative h-10 w-10 rounded-md bg-gradient-to-br ${avatar.gradient} flex items-center justify-center hover-elevate ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                      data-testid={`button-avatar-${avatar.id}`}
                    >
                      <IconComponent className="h-5 w-5 text-white" />
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-2.5 w-2.5 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <LocationPicker
              continentId={continentId}
              countryId={countryId}
              regionId={regionId}
              townId={townId}
              onContinentChange={setContinentId}
              onCountryChange={setCountryId}
              onRegionChange={setRegionId}
              onTownChange={setTownId}
            />

            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} data-testid="button-cancel-edit">
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleSaveProfile} 
                disabled={updateProfileMutation.isPending || uploadProfileImageMutation.isPending} 
                data-testid="button-save-profile"
              >
                {updateProfileMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
