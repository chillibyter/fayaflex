import flame from "@/assets/icons-3d/flame.png";
import sneaker from "@/assets/icons-3d/sneaker.png";
import dumbbell from "@/assets/icons-3d/dumbbell.png";
import heart from "@/assets/icons-3d/heart.png";
import trophyGold from "@/assets/icons-3d/trophy_gold.png";
import medalSilver from "@/assets/icons-3d/medal_silver.png";
import medalBronze from "@/assets/icons-3d/medal_bronze.png";
import bicycle from "@/assets/icons-3d/bicycle.png";
import mountain from "@/assets/icons-3d/mountain.png";
import crown from "@/assets/icons-3d/crown.png";
import confetti from "@/assets/icons-3d/confetti.png";
import fireStreak from "@/assets/icons-3d/fire_streak.png";

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
  | "fire-streak";

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
  return "dumbbell";
}
