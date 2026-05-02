import { Badge } from "@/components/ui/badge";
import { CATEGORY_COLORS } from "@/lib/constants";

export function CategoryBadge({ category }: { category: string }) {
  const colorClass = CATEGORY_COLORS[category] || "bg-gray-100 text-gray-800";
  return (
    <Badge variant="secondary" className={`${colorClass} px-2 py-0.5 text-xs font-medium`} data-testid={`badge-category-${category}`}>
      {category}
    </Badge>
  );
}
