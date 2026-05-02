export const SWARAJYA_RANKS = [
  { name: "Sevak",         threshold: 0 },
  { name: "Mavla",         threshold: 10 },
  { name: "Bargir",        threshold: 30 },
  { name: "Shiledar",      threshold: 60 },
  { name: "Naik",          threshold: 120 },
  { name: "Havaldar",      threshold: 240 },
  { name: "Jumledar",      threshold: 480 },
  { name: "Hazari",        threshold: 960 },
  { name: "Panch Hazari",  threshold: 2000 },
  { name: "Sardar",        threshold: 4000 },
  { name: "Killedar",      threshold: 7000 },
  { name: "Deshpande",     threshold: 10000 },
  { name: "Deshmukh",      threshold: 15000 },
  { name: "Subhedar",      threshold: 22000 },
  { name: "Ashta Pradhan", threshold: 35000 },
  { name: "Sarnobat",      threshold: 60000 },
  { name: "Sar Senapati",  threshold: 100000 },
] as const;

export const SWARAJYA_RANK_NAMES = SWARAJYA_RANKS.map((r) => r.name);

export type SwarajyaRankName = (typeof SWARAJYA_RANKS)[number]["name"];

export const MUDRA_PER_HELP = 10;

export function mudraFromHelped(totalHelped: number): number {
  return Math.max(0, Math.floor(totalHelped)) * MUDRA_PER_HELP;
}

export function computeRank(totalHelped: number): SwarajyaRankName {
  const points = mudraFromHelped(totalHelped);
  let current: SwarajyaRankName = SWARAJYA_RANKS[0].name;
  for (const r of SWARAJYA_RANKS) {
    if (points >= r.threshold) current = r.name;
    else break;
  }
  return current;
}
