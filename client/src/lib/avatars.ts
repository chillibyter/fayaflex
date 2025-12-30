import avatarSprite from "@assets/FayaFlex_Avatar_Set_Complete_1767126826141.png";

export const AVATAR_SPRITE_URL = avatarSprite;

export const FITNESS_AVATARS = [
  { id: 'runner', name: 'Runner', row: 0, col: 0, color: '#10B981' },
  { id: 'weightlifter', name: 'Weightlifter', row: 0, col: 1, color: '#F97316' },
  { id: 'yoga', name: 'Yoga', row: 0, col: 2, color: '#A855F7' },
  { id: 'cyclist', name: 'Cyclist', row: 0, col: 3, color: '#3B82F6' },
  { id: 'swimmer', name: 'Swimmer', row: 0, col: 4, color: '#14B8A6' },
  { id: 'basketball', name: 'Basketball', row: 1, col: 0, color: '#10B981' },
  { id: 'soccer', name: 'Soccer', row: 1, col: 1, color: '#F97316' },
  { id: 'tennis', name: 'Tennis', row: 1, col: 2, color: '#EAB308' },
  { id: 'stretching', name: 'Stretching', row: 1, col: 3, color: '#EC4899' },
  { id: 'squats', name: 'Squats', row: 1, col: 4, color: '#3B82F6' },
  { id: 'fayaflex', name: 'FayaFlex', row: 2, col: 0, color: '#F97316' },
  { id: 'trophy', name: 'Trophy', row: 2, col: 1, color: '#22C55E' },
  { id: 'lightning', name: 'Lightning', row: 2, col: 2, color: '#EAB308' },
  { id: 'heartbeat', name: 'Heartbeat', row: 2, col: 3, color: '#EF4444' },
  { id: 'target', name: 'Target', row: 2, col: 4, color: '#F5F5F5' },
  { id: 'climber', name: 'Climber', row: 3, col: 0, color: '#92400E' },
  { id: 'dumbbell', name: 'Dumbbell', row: 3, col: 1, color: '#F97316' },
  { id: 'running-shoe', name: 'Running Shoe', row: 3, col: 2, color: '#22C55E' },
  { id: 'water-bottle', name: 'Water Bottle', row: 3, col: 3, color: '#3B82F6' },
  { id: 'medal', name: 'Medal', row: 3, col: 4, color: '#3B82F6' },
  { id: 'boxer', name: 'Boxer', row: 4, col: 0, color: '#10B981' },
  { id: 'martial-arts', name: 'Martial Arts', row: 4, col: 1, color: '#A855F7' },
  { id: 'hydration', name: 'Hydration', row: 4, col: 2, color: '#3B82F6' },
  { id: 'stopwatch', name: 'Stopwatch', row: 4, col: 3, color: '#F97316' },
  { id: 'protein', name: 'Protein', row: 4, col: 4, color: '#A855F7' },
] as const;

export type AvatarId = typeof FITNESS_AVATARS[number]['id'];

export function getAvatarById(id: string | null | undefined) {
  return FITNESS_AVATARS.find(avatar => avatar.id === id) || FITNESS_AVATARS[0];
}

export function getAvatarSpriteStyle(avatarId: string, size: number = 48) {
  const avatar = getAvatarById(avatarId);
  const cellSize = 20; // percentage for 5x5 grid
  
  return {
    backgroundImage: `url(${AVATAR_SPRITE_URL})`,
    backgroundSize: '500%',
    backgroundPosition: `${avatar.col * 25}% ${avatar.row * 25}%`,
    width: size,
    height: size,
    borderRadius: '50%',
  };
}
