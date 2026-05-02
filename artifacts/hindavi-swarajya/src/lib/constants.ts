import { SWARAJYA_RANKS } from "./ranks";

// Tailwind class strings for each rank — used by the lightweight RankBadge
// component and any consumer that wants a one-liner pill style.
export const RANK_COLORS: Record<string, string> = SWARAJYA_RANKS.reduce(
  (acc, r) => {
    acc[r.name] = `${r.bg} ${r.text} ${r.border}`;
    return acc;
  },
  {
    Chhava:
      "bg-gradient-to-r from-amber-500 via-orange-600 to-red-700 text-white border-amber-600",
  } as Record<string, string>,
);

export const CATEGORY_COLORS: Record<string, string> = {
  Food: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  Education: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  Health: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  Shelter: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  Other: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};
