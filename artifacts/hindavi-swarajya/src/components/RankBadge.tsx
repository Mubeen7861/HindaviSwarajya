import { Badge } from "@/components/ui/badge";
import { RANK_COLORS } from "@/lib/constants";

export function RankBadge({ rank }: { rank: string }) {
  const colorClass = RANK_COLORS[rank] || "bg-gray-100 text-gray-800";
  return (
    <Badge variant="outline" className={`${colorClass} font-semibold`} data-testid={`badge-rank-${rank}`}>
      {rank}
    </Badge>
  );
}
