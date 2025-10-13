import { 
  Bike, 
  Dumbbell, 
  Footprints, 
  Flame, 
  Heart, 
  Trophy, 
  Zap, 
  Mountain,
  Activity,
  Target,
  Timer,
  Wind
} from 'lucide-react';

export const FITNESS_AVATARS = [
  { id: 'runner', icon: Footprints, name: 'Runner', gradient: 'from-blue-500 to-cyan-500' },
  { id: 'cyclist', icon: Bike, name: 'Cyclist', gradient: 'from-green-500 to-emerald-500' },
  { id: 'swimmer', icon: Wind, name: 'Swimmer', gradient: 'from-blue-400 to-teal-500' },
  { id: 'weightlifter', icon: Dumbbell, name: 'Weightlifter', gradient: 'from-orange-500 to-red-500' },
  { id: 'energetic', icon: Zap, name: 'Energetic', gradient: 'from-pink-500 to-purple-500' },
  { id: 'cardio', icon: Heart, name: 'Cardio', gradient: 'from-red-500 to-pink-500' },
  { id: 'climber', icon: Mountain, name: 'Climber', gradient: 'from-amber-500 to-orange-500' },
  { id: 'active', icon: Activity, name: 'Active', gradient: 'from-purple-500 to-indigo-500' },
  { id: 'champion', icon: Trophy, name: 'Champion', gradient: 'from-green-600 to-lime-500' },
  { id: 'burner', icon: Flame, name: 'Burner', gradient: 'from-orange-600 to-amber-500' },
  { id: 'focused', icon: Target, name: 'Focused', gradient: 'from-lime-500 to-green-500' },
  { id: 'endurance', icon: Timer, name: 'Endurance', gradient: 'from-cyan-500 to-blue-600' },
] as const;

export type AvatarId = typeof FITNESS_AVATARS[number]['id'];

export function getAvatarById(id: string | null | undefined) {
  return FITNESS_AVATARS.find(avatar => avatar.id === id) || FITNESS_AVATARS[0];
}
