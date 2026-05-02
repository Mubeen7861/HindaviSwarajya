// Client-side Swarajya rank metadata.
// The threshold list MUST mirror lib/db/src/ranks.ts — the server is the
// source of truth for the rank string stored on each user. Keep these in sync.

import ashtaPradhanBadge from "@assets/ChatGPT_Image_May_3,_2026,_02_52_20_AM_1_1777758103572.png";
import sarnobatBadge from "@assets/ChatGPT_Image_May_3,_2026,_02_52_15_AM_1_1777758103572.png";

export const MUDRA_PER_HELP = 10;

export type RankTier = "starter" | "core" | "elite" | "command" | "supreme";

export interface RankDef {
  name: string;
  devanagari: string;
  threshold: number;       // in Mudra (points)
  tier: RankTier;
  description: string;
  bg: string;
  text: string;
  border: string;
  ring: string;
  gradient: string;        // for hero/badge backgrounds
  /** Optional gold-coin badge artwork rendered inline by RankBadge / Landing /
   * Profile when present. Only set for ceremonial supreme ranks. */
  image?: string;
}

export const SWARAJYA_RANKS: RankDef[] = [
  { name: "Sevak",         devanagari: "सेवक",          threshold: 0,      tier: "starter", description: "Starting your journey of seva",
    bg: "bg-stone-100",    text: "text-stone-700",   border: "border-stone-300",   ring: "ring-stone-300",   gradient: "from-stone-200 to-stone-100" },
  { name: "Mavla",         devanagari: "मावळा",          threshold: 10,     tier: "starter", description: "Loyal foot soldier of the cause",
    bg: "bg-amber-50",     text: "text-amber-700",   border: "border-amber-200",   ring: "ring-amber-300",   gradient: "from-amber-100 to-amber-50" },
  { name: "Bargir",        devanagari: "बारगीर",          threshold: 30,     tier: "starter", description: "Trusted cavalry of the Swarajya",
    bg: "bg-orange-50",    text: "text-orange-700",  border: "border-orange-200",  ring: "ring-orange-300",  gradient: "from-orange-100 to-orange-50" },
  { name: "Shiledar",      devanagari: "शिलेदार",         threshold: 60,     tier: "core",    description: "Owns their own arms and rides",
    bg: "bg-orange-100",   text: "text-orange-800",  border: "border-orange-300",  ring: "ring-orange-400",  gradient: "from-orange-200 to-orange-100" },
  { name: "Naik",          devanagari: "नाईक",            threshold: 120,    tier: "core",    description: "Leader of a small unit of sevaks",
    bg: "bg-rose-50",      text: "text-rose-700",    border: "border-rose-200",    ring: "ring-rose-300",    gradient: "from-rose-100 to-rose-50" },
  { name: "Havaldar",      devanagari: "हवलदार",         threshold: 240,    tier: "core",    description: "Commands a contingent of soldiers",
    bg: "bg-rose-100",     text: "text-rose-800",    border: "border-rose-300",    ring: "ring-rose-400",    gradient: "from-rose-200 to-rose-100" },
  { name: "Jumledar",      devanagari: "जुमलेदार",         threshold: 480,    tier: "core",    description: "Captain of a jumla — multiple units",
    bg: "bg-red-100",      text: "text-red-800",     border: "border-red-300",     ring: "ring-red-400",     gradient: "from-red-200 to-red-100" },
  { name: "Hazari",        devanagari: "हजारी",           threshold: 960,    tier: "elite",   description: "Marshal of a thousand brave warriors",
    bg: "bg-purple-50",    text: "text-purple-700",  border: "border-purple-200",  ring: "ring-purple-300",  gradient: "from-purple-100 to-purple-50" },
  { name: "Panch Hazari",  devanagari: "पंच हजारी",       threshold: 2000,   tier: "elite",   description: "Commander of five thousand",
    bg: "bg-purple-100",   text: "text-purple-800",  border: "border-purple-300",  ring: "ring-purple-400",  gradient: "from-purple-200 to-purple-100" },
  { name: "Sardar",        devanagari: "सरदार",           threshold: 4000,   tier: "elite",   description: "Noble general of the realm",
    bg: "bg-indigo-100",   text: "text-indigo-800",  border: "border-indigo-300",  ring: "ring-indigo-400",  gradient: "from-indigo-200 to-indigo-100" },
  { name: "Killedar",      devanagari: "किल्लेदार",        threshold: 7000,   tier: "command", description: "Guardian of a fort and its people",
    bg: "bg-blue-100",     text: "text-blue-800",    border: "border-blue-300",    ring: "ring-blue-400",    gradient: "from-blue-200 to-blue-100" },
  { name: "Deshpande",     devanagari: "देशपांडे",         threshold: 10000,  tier: "command", description: "Steward of a land and its records",
    bg: "bg-cyan-100",     text: "text-cyan-800",    border: "border-cyan-300",    ring: "ring-cyan-400",    gradient: "from-cyan-200 to-cyan-100" },
  { name: "Deshmukh",      devanagari: "देशमुख",          threshold: 15000,  tier: "command", description: "Hereditary chief of a region",
    bg: "bg-teal-100",     text: "text-teal-800",    border: "border-teal-300",    ring: "ring-teal-400",    gradient: "from-teal-200 to-teal-100" },
  { name: "Subhedar",      devanagari: "सुभेदार",          threshold: 22000,  tier: "command", description: "Governor of a province",
    bg: "bg-emerald-100",  text: "text-emerald-800", border: "border-emerald-300", ring: "ring-emerald-400", gradient: "from-emerald-200 to-emerald-100" },
  { name: "Ashta Pradhan", devanagari: "अष्ट प्रधान",      threshold: 35000,  tier: "supreme", description: "One of the eight royal ministers",
    bg: "bg-yellow-100",   text: "text-yellow-800",  border: "border-yellow-400",  ring: "ring-yellow-500",  gradient: "from-yellow-200 to-amber-100",
    image: ashtaPradhanBadge },
  { name: "Sarnobat",      devanagari: "सरनोबत",          threshold: 60000,  tier: "supreme", description: "Commander-in-chief of all forces",
    bg: "bg-amber-200",    text: "text-amber-900",   border: "border-amber-500",   ring: "ring-amber-600",   gradient: "from-amber-300 to-yellow-200",
    image: sarnobatBadge },
  { name: "Sar Senapati",  devanagari: "सरसेनापती",       threshold: 100000, tier: "supreme", description: "Supreme commander — the highest rank",
    bg: "bg-gradient-to-br from-amber-300 to-orange-400", text: "text-white", border: "border-amber-500", ring: "ring-amber-600", gradient: "from-amber-400 via-orange-500 to-red-500" },
];

export const CHHAVA_RANK: RankDef = {
  name: "Chhava",
  devanagari: "छावा",
  threshold: -1, // not point-based
  tier: "supreme",
  description: "Honorary rank — exceptional impact, awarded by the council",
  bg: "bg-gradient-to-br from-amber-500 via-orange-600 to-red-700",
  text: "text-white",
  border: "border-amber-600",
  ring: "ring-amber-700",
  gradient: "from-amber-500 via-orange-600 to-red-700",
};

export const RANK_NAMES = SWARAJYA_RANKS.map((r) => r.name);

export function rankIndexOf(name: string | undefined): number {
  if (!name) return 0;
  const i = SWARAJYA_RANKS.findIndex((r) => r.name === name);
  return i === -1 ? 0 : i;
}

export function getRankDef(name: string | undefined): RankDef {
  if (!name) return SWARAJYA_RANKS[0];
  return SWARAJYA_RANKS.find((r) => r.name === name) ?? SWARAJYA_RANKS[0];
}

export function mudraFromHelped(totalHelped: number): number {
  return Math.max(0, Math.floor(totalHelped)) * MUDRA_PER_HELP;
}

export function computeRank(totalHelped: number): string {
  const points = mudraFromHelped(totalHelped);
  let current = SWARAJYA_RANKS[0];
  for (const r of SWARAJYA_RANKS) {
    if (points >= r.threshold) current = r;
    else break;
  }
  return current.name;
}

export interface RankProgress {
  current: RankDef;
  next: RankDef | null;
  mudra: number;
  progress: number;          // 0..100
  mudraToNext: number;       // 0 if maxed
  helpedToNext: number;      // people still to help
}

export function getRankProgress(totalHelped: number): RankProgress {
  const mudra = mudraFromHelped(totalHelped);
  const idx = SWARAJYA_RANKS.reduce((acc, r, i) => (mudra >= r.threshold ? i : acc), 0);
  const current = SWARAJYA_RANKS[idx];
  const next = SWARAJYA_RANKS[idx + 1] ?? null;
  if (!next) {
    return { current, next: null, mudra, progress: 100, mudraToNext: 0, helpedToNext: 0 };
  }
  const span = next.threshold - current.threshold;
  const into = Math.max(0, mudra - current.threshold);
  const progress = Math.min(100, (into / span) * 100);
  const mudraToNext = Math.max(0, next.threshold - mudra);
  const helpedToNext = Math.ceil(mudraToNext / MUDRA_PER_HELP);
  return { current, next, mudra, progress, mudraToNext, helpedToNext };
}
