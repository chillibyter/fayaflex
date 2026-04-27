import { Users } from "lucide-react";

/** Deterministically derive a soft accent hue from the team's id (or name as
 *  fallback) so each team gets a visually distinct dot without us needing to
 *  store a colour in the database. */
function teamHue(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % 360;
}

export function TeamBadge({
  id,
  name,
  className,
}: {
  id: string;
  name: string;
  className?: string;
}) {
  const hue = teamHue(id || name);
  const dot = `hsl(${hue}, 65%, 55%)`;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/50 px-1.5 py-0.5 text-[10px] font-semibold text-foreground/85 ${className ?? ""}`}
      data-testid={`team-badge-${id}`}
      title={name}
    >
      <Users className="h-2.5 w-2.5 text-muted-foreground" aria-hidden="true" />
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: dot, boxShadow: `0 0 4px ${dot}` }}
      />
      <span className="max-w-[110px] truncate">{name}</span>
    </span>
  );
}
