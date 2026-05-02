import { Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RANK_COLORS } from "@/lib/constants";
import { getRankDef, CHHAVA_RANK } from "@/lib/ranks";

interface RankBadgeProps {
  rank: string;
  chhava?: boolean;
  showDevanagari?: boolean;
  size?: "sm" | "md";
}

export function RankBadge({ rank, chhava, showDevanagari, size = "sm" }: RankBadgeProps) {
  // Chhava — honorary rank, displayed above the normal rank
  if (chhava) {
    const padding = size === "md" ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[11px]";
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full font-semibold tracking-wide ${padding} ${RANK_COLORS.Chhava} shadow-sm`}
        data-testid="badge-rank-chhava"
        title={CHHAVA_RANK.description}
      >
        <Crown className="w-3 h-3" />
        {CHHAVA_RANK.name}
        {showDevanagari && <span className="opacity-90">· {CHHAVA_RANK.devanagari}</span>}
      </span>
    );
  }

  const def = getRankDef(rank);
  const colorClass = RANK_COLORS[rank] ?? RANK_COLORS.Sevak;
  const coinSize = size === "md" ? "w-6 h-6" : "w-4 h-4";
  return (
    <Badge
      variant="outline"
      className={`${colorClass} font-semibold border inline-flex items-center gap-1.5`}
      data-testid={`badge-rank-${rank.replace(/\s+/g, "-").toLowerCase()}`}
      title={def.description}
    >
      {def.image && (
        <img
          src={def.image}
          alt=""
          aria-hidden="true"
          className={`${coinSize} rounded-full object-cover -ml-0.5 shrink-0 ring-1 ring-amber-600/30`}
        />
      )}
      {rank}
      {showDevanagari && <span className="ml-1 opacity-80">· {def.devanagari}</span>}
    </Badge>
  );
}
