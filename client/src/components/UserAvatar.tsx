import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarById, AVATAR_SPRITE_URL } from "@/lib/avatars";
import { getApiUrl } from "@/lib/queryClient";
import { Capacitor } from "@capacitor/core";
import type { User } from "@shared/schema";

interface UserAvatarProps {
  user: User | null | undefined;
  className?: string;
  iconClassName?: string;
  fallbackClassName?: string;
}

// Convert relative paths to absolute URLs for native apps
function getImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  // Data URLs (base64 profile images stored in DB) — always pass through unchanged
  if (path.startsWith('data:')) {
    return path;
  }
  // If already absolute URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // For native apps, prepend the API base URL
  if (Capacitor.isNativePlatform()) {
    return getApiUrl(path);
  }
  // For web, relative paths work fine
  return path;
}

export function UserAvatar({ user, className, iconClassName, fallbackClassName }: UserAvatarProps) {
  const userName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user?.username || user?.email || 'User';
  
  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  const selectedAvatar = user?.avatarId ? getAvatarById(user.avatarId) : null;
  const profileImageUrl = getImageUrl(user?.profileImageUrl);
  const spriteUrl = Capacitor.isNativePlatform() ? getApiUrl(AVATAR_SPRITE_URL) : AVATAR_SPRITE_URL;

  return (
    <Avatar className={className}>
      {profileImageUrl ? (
        <AvatarImage 
          src={profileImageUrl} 
          alt={userName}
          className="object-cover"
        />
      ) : selectedAvatar ? (
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `url(${spriteUrl})`,
            backgroundSize: '500%',
            backgroundPosition: `${selectedAvatar.col * 25}% ${selectedAvatar.row * 25}%`,
          }}
        />
      ) : (
        <AvatarFallback className={fallbackClassName}>
          {initials}
        </AvatarFallback>
      )}
    </Avatar>
  );
}

interface AvatarSpriteProps {
  avatarId: string;
  size?: number;
  className?: string;
  selected?: boolean;
}

export function AvatarSprite({ avatarId, size = 48, className = '', selected = false }: AvatarSpriteProps) {
  const avatar = getAvatarById(avatarId);
  const spriteUrl = Capacitor.isNativePlatform() ? getApiUrl(AVATAR_SPRITE_URL) : AVATAR_SPRITE_URL;
  
  return (
    <div 
      className={`rounded-full ${selected ? 'ring-2 ring-primary ring-offset-2' : ''} ${className}`}
      style={{
        backgroundImage: `url(${spriteUrl})`,
        backgroundSize: '500%',
        backgroundPosition: `${avatar.col * 25}% ${avatar.row * 25}%`,
        width: size,
        height: size,
      }}
    />
  );
}
