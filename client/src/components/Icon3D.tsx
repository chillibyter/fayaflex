import flame from "@/assets/icons-3d/flame.webp";
import sneaker from "@/assets/icons-3d/sneaker.webp";
import dumbbell from "@/assets/icons-3d/dumbbell.webp";
import heart from "@/assets/icons-3d/heart.webp";
import trophyGold from "@/assets/icons-3d/trophy_gold.webp";
import medalSilver from "@/assets/icons-3d/medal_silver.webp";
import medalBronze from "@/assets/icons-3d/medal_bronze.webp";
import bicycle from "@/assets/icons-3d/bicycle.webp";
import mountain from "@/assets/icons-3d/mountain.webp";
import crown from "@/assets/icons-3d/crown.webp";
import confetti from "@/assets/icons-3d/confetti.webp";
import fireStreak from "@/assets/icons-3d/fire_streak.webp";
import boxing from "@/assets/icons-3d/boxing.webp";

export type Icon3DName =
  | "flame"
  | "sneaker"
  | "dumbbell"
  | "heart"
  | "trophy-gold"
  | "medal-silver"
  | "medal-bronze"
  | "bicycle"
  | "mountain"
  | "crown"
  | "confetti"
  | "fire-streak"
  | "boxing";

const MAP: Record<Icon3DName, string> = {
  flame,
  sneaker,
  dumbbell,
  heart,
  "trophy-gold": trophyGold,
  "medal-silver": medalSilver,
  "medal-bronze": medalBronze,
  bicycle,
  mountain,
  crown,
  confetti,
  "fire-streak": fireStreak,
  boxing,
};

interface Icon3DProps {
  name: Icon3DName;
  size?: number;
  className?: string;
  alt?: string;
}

export function Icon3D({ name, size = 48, className = "", alt }: Icon3DProps) {
  const src = MAP[name];
  return (
    <img
      src={src}
      alt={alt ?? name}
      width={size}
      height={size}
      className={`object-contain pointer-events-none select-none ${className}`}
      style={{ width: size, height: size }}
      data-testid={`icon3d-${name}`}
      draggable={false}
    />
  );
}

export function workoutTypeToIcon3D(type: string | undefined | null): Icon3DName {
  const t = (type || "").toLowerCase();
  if (t.includes("run") || t.includes("walk") || t.includes("jog")) return "sneaker";
  if (t.includes("cycl") || t.includes("bike") || t.includes("ride")) return "bicycle";
  if (t.includes("hik") || t.includes("climb") || t.includes("mountain")) return "mountain";
  if (t.includes("box")) return "boxing";
  return "dumbbell";
}
