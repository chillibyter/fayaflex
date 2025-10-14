import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getAvatarById } from "@/lib/avatars";
import type { User } from "@shared/schema";

interface UserAvatarProps {
  user: User | null | undefined;
  className?: string;
  iconClassName?: string;
  fallbackClassName?: string;
}

export function UserAvatar({ user, className, iconClassName, fallbackClassName }: UserAvatarProps) {
  // Get user's full name for fallback
  const userName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user?.username || user?.email || 'User';
  
  // Get initials for fallback
  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  // Get avatar if selected
  const selectedAvatar = user?.avatarId ? getAvatarById(user.avatarId) : null;
  const AvatarIcon = selectedAvatar?.icon;

  return (
    <Avatar className={className}>
      {selectedAvatar && AvatarIcon ? (
        <div className={`flex items-center justify-center w-full h-full bg-gradient-to-br ${selectedAvatar.gradient}`}>
          <AvatarIcon className={iconClassName || "h-1/2 w-1/2 text-white"} />
        </div>
      ) : (
        <AvatarFallback className={fallbackClassName}>
          {initials}
        </AvatarFallback>
      )}
    </Avatar>
  );
}
