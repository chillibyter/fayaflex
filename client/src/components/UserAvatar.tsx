import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarById, AVATAR_SPRITE_URL } from "@/lib/avatars";
import type { User } from "@shared/schema";

interface UserAvatarProps {
  user: User | null | undefined;
  className?: string;
  iconClassName?: string;
  fallbackClassName?: string;
}

export function UserAvatar({ user, className, iconClassName, fallbackClassName }: UserAvatarProps) {
  const userName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user?.username || user?.email || 'User';
  
  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  const selectedAvatar = user?.avatarId ? getAvatarById(user.avatarId) : null;
  const hasProfileImage = user?.profileImageUrl;

  return (
    <Avatar className={className}>
      {hasProfileImage ? (
        <AvatarImage 
          src={user.profileImageUrl!} 
          alt={userName}
          className="object-cover"
        />
      ) : selectedAvatar ? (
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `url(${AVATAR_SPRITE_URL})`,
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
  
  return (
    <div 
      className={`rounded-full ${selected ? 'ring-2 ring-primary ring-offset-2' : ''} ${className}`}
      style={{
        backgroundImage: `url(${AVATAR_SPRITE_URL})`,
        backgroundSize: '500%',
        backgroundPosition: `${avatar.col * 25}% ${avatar.row * 25}%`,
        width: size,
        height: size,
      }}
    />
  );
}
