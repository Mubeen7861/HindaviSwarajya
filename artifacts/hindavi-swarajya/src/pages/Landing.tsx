import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart, Users, Calendar, Trophy, ArrowRight,
  Shield, Globe, CheckCircle, ChevronRight,
  Flame, Crown, Sparkles, Sword, Shield as ShieldIcon, Mountain,
} from "lucide-react";
import { motion } from "framer-motion";
import { useGetStatsSummary, getGetStatsSummaryQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SWARAJYA_RANKS, CHHAVA_RANK, type RankDef, type RankTier } from "@/lib/ranks";

// Tier metadata for the premium rank ladder. Order matters: foundation first, ascending to pinnacle.
const RANK_TIERS: { id: RankTier; label: string; subtitle: string; icon: typeof Crown; accent: string; ring: string }[] = [
  { id: "starter",  label: "Foundation", subtitle: "Where every sevak begins", icon: Heart,    accent: "from-stone-500 to-stone-700",    ring: "ring-stone-300/60" },
  { id: "core",     label: "Core",     subtitle: "Captains of the army",      icon: Sword,      accent: "from-rose-500 to-red-600",       ring: "ring-rose-300/60" },
  { id: "elite",    label: "Elite",    subtitle: "Marshals & nobles",         icon: ShieldIcon, accent: "from-indigo-500 to-purple-600",  ring: "ring-indigo-300/60" },
  { id: "command",  label: "Command",  subtitle: "Governors of the realm",    icon: Mountain,   accent: "from-emerald-500 to-teal-600",   ring: "ring-emerald-300/60" },
  { id: "supreme",  label: "Supreme",  subtitle: "The royal council",         icon: Crown,      accent: "from-amber-500 to-orange-600",   ring: "ring-amber-300/60" },
];

const PINNACLE: RankDef = SWARAJYA_RANKS[SWARAJYA_RANKS.length - 1]; // Sar Senapati
const RANKS_BY_TIER: Record<RankTier, RankDef[]> = SWARAJYA_RANKS
  .filter((r) => r.name !== PINNACLE.name)
  .reduce((acc, r) => {
    (acc[r.tier] ||= []).push(r);
    return acc;
  }, {} as Record<RankTier, RankDef[]>);

function fmtThreshold(n: number): string {
  if (n === 0) return "Start";
  if (n >= 1000) return `${n / 1000}k Mudra`;
  return `${n} Mudra`;
}

const FEATURES = [
  {
    icon: Heart,
    title: "Share Your Seva",
    desc: "Post stories of your community service and inspire others across Maharashtra and beyond.",
    color: "bg-red-50 text-red-600",
  },
  {
    icon: Calendar,
    title: "Join Seva Events",
    desc: "Find and register for local events — medical camps, food drives, clean-up missions, and more.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Shield,
    title: "Answer Help Requests",
    desc: "Emergency flood relief, blood donation, education support — be there when someone needs you.",
    color: "bg-orange-50 text-orange-600",
  },
  {
    icon: Users,
    title: "Build Community",
    desc: "Connect with like-minded sevaks, discuss ideas, and grow a network rooted in dharma.",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: Trophy,
    title: "Earn Recognition",
    desc: "Earn 10 Mudra per person helped and rise through 17 Swarajya ranks — from Sevak to Sar Senapati.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: Globe,
    title: "Hindavi Swarajya",
    desc: "Inspired by Chhatrapati Shivaji Maharaj's vision of a self-reliant, caring community.",
    color: "bg-yellow-50 text-yellow-600",
  },
];

export default function Landing() {
  const { data: stats, isLoading: statsLoading } = useGetStatsSummary({
    query: { queryKey: getGetStatsSummaryQueryKey(), staleTime: 60_000 },
  });

  const liveStats = stats
    ? [
        { value: stats.totalUsers, label: "Sevaks", icon: Users },
        { value: stats.totalHelped, label: "Lives Touched", icon: Heart },
        { value: stats.totalPosts, label: "Seva Acts", icon: Calendar },
      ]
    : [];
  const hasRealStats = liveStats.some((s) => (s.value ?? 0) > 0);
  const showStatsSection = statsLoading || hasRealStats;

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6F00] to-[#E65100] flex items-center justify-center shadow-sm">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-base font-bold text-[#FF6F00] leading-none font-serif">HindaviSwarajya</div>
              <div className="text-[10px] text-gray-400 leading-none mt-0.5">हिंदवी स्वराज्य</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/sign-in">
              <Button variant="ghost" className="text-gray-600 hover:text-[#FF6F00]">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button className="bg-[#FF6F00] hover:bg-[#E65100] text-white shadow-sm gap-1.5">
                Join Free <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-24 pb-20 px-4 sm:px-6 relative overflow-hidden">
        {/* Premium saffron+gold backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-amber-50/40 pointer-events-none" />
        <div className="absolute top-20 right-0 w-[28rem] h-[28rem] rounded-full bg-[#FF6F00]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-amber-300/10 blur-3xl pointer-events-none" />
        {/* Subtle radial dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, #FF6F00 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {/* Premium "World's First" badge */}
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FF6F00] to-[#E65100] text-white shadow-lg shadow-orange-200/60">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[11px] sm:text-xs font-semibold tracking-wide uppercase">
                World's First Seva Platform
              </span>
              <Sparkles className="w-3.5 h-3.5" />
            </div>

            {/* Decorative ornament — three saffron dots */}
            <div className="flex justify-center items-center gap-1.5 mb-4" aria-hidden="true">
              <span className="w-1 h-1 rounded-full bg-[#FF6F00]/40" />
              <Crown className="w-4 h-4 text-amber-500" />
              <span className="w-1 h-1 rounded-full bg-[#FF6F00]/40" />
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-900 leading-[1.05] mb-5 font-serif tracking-tight">
              Serve. Unite.{" "}
              <span className="bg-gradient-to-r from-[#FF6F00] via-[#E65100] to-amber-600 bg-clip-text text-transparent">
                Build Swarajya.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-6 leading-relaxed">
              World's first seva platform inspired by the vision of{" "}
              <span className="font-semibold text-gray-800">Chhatrapati Shivaji Maharaj</span>
              {" "}— a movement, not just a platform.
            </p>

            {/* Marathi emotional line — framed in a quote card */}
            <div className="max-w-xl mx-auto mb-8 relative">
              <div className="absolute -left-2 top-0 text-5xl text-[#FF6F00]/20 font-serif leading-none select-none" aria-hidden="true">"</div>
              <div className="absolute -right-2 bottom-0 text-5xl text-[#FF6F00]/20 font-serif leading-none select-none rotate-180" aria-hidden="true">"</div>
              <p className="text-base sm:text-lg text-[#FF6F00] font-semibold font-serif px-6 leading-relaxed" lang="mr">
                हे महाराजांचं स्वप्न आहे — या आधुनिक जगात पुन्हा जिवंत करण्याचा आमचा प्रयत्न.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link href="/sign-up">
                <Button size="lg" className="bg-gradient-to-r from-[#FF6F00] to-[#E65100] hover:from-[#E65100] hover:to-[#BF360C] text-white shadow-xl shadow-orange-200 gap-2 text-base px-8 h-12 font-semibold">
                  <Heart className="w-4 h-4" /> Start Your Seva Journey
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="lg" variant="outline" className="border-2 border-[#FF6F00]/30 bg-white/60 backdrop-blur text-[#FF6F00] hover:bg-orange-50 gap-2 text-base px-8 h-12 font-semibold">
                  Join the Movement <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Power taglines strip */}
            <div className="mt-10 flex flex-wrap justify-center gap-2 text-xs">
              {[
                { label: "Seva is the new Swarajya", icon: Heart },
                { label: "People-powered. Purpose-driven.", icon: Users },
                { label: "Ek Sevak. Ek Badlav.", icon: Flame },
              ].map((t) => (
                <span
                  key={t.label}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-orange-100 text-gray-600 shadow-sm"
                >
                  <t.icon className="w-3 h-3 text-[#FF6F00]" />
                  {t.label}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Live Stats (skeleton while loading, hidden when all zero) ── */}
      {showStatsSection && (
        <section className="py-14 bg-gradient-to-r from-[#FF6F00] to-[#E65100]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {statsLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="text-center flex flex-col items-center gap-2">
                  <Skeleton className="w-6 h-6 rounded-md bg-white/30" />
                  <Skeleton className="h-8 w-24 bg-white/30" />
                  <Skeleton className="h-3 w-20 bg-white/20" />
                </div>
              ))
            ) : (
              liveStats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  viewport={{ once: true }}
                  className="text-center text-white"
                >
                  <s.icon className="w-6 h-6 mx-auto mb-2 text-white/80" />
                  <p className="text-3xl font-bold mb-0.5">{s.value.toLocaleString()}</p>
                  <p className="text-sm text-orange-100">{s.label}</p>
                </motion.div>
              ))
            )}
          </div>
        </section>
      )}

      {/* ── Features ── */}
      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 font-serif mb-3">
              Everything you need for <span className="text-[#FF6F00]">Seva</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              A complete platform for community service — organize, connect, help, and grow together.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} viewport={{ once: true }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${f.color}`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1.5">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Premium Rank Ladder ── */}
      <section className="py-20 px-4 sm:px-6 relative overflow-hidden bg-gradient-to-b from-stone-50 via-orange-50/30 to-white">
        {/* Decorative blurs */}
        <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-amber-200/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-72 h-72 rounded-full bg-[#FF6F00]/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-white border border-amber-200 shadow-sm">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px] font-semibold tracking-widest uppercase text-amber-700">
                17 Ranks · 5 Tiers
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 font-serif mb-4 tracking-tight">
              The <span className="bg-gradient-to-r from-amber-600 via-[#FF6F00] to-[#E65100] bg-clip-text text-transparent">Swarajya</span> Rank System
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
              Every person you help earns you{" "}
              <span className="font-bold text-[#FF6F00]">10 Mudra</span>. Rise through the ranks of
              the Maratha Empire — from <span className="font-semibold">Sevak</span> to{" "}
              <span className="font-semibold">Sar Senapati</span>.
            </p>
          </div>

          {/* Tier-grouped ladder — Foundation up to Supreme */}
          <div className="space-y-6">
            {RANK_TIERS.map((tier, tIdx) => {
              const ranks = RANKS_BY_TIER[tier.id] ?? [];
              if (ranks.length === 0) return null;
              const TIcon = tier.icon;
              return (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: tIdx * 0.05 }}
                  className="relative rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden"
                >
                  {/* Tier header strip */}
                  <div className={`relative bg-gradient-to-r ${tier.accent} px-5 py-3 text-white flex items-center justify-between`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                        <TIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold tracking-widest uppercase opacity-80">Tier {tIdx + 1}</p>
                        <p className="text-base font-bold font-serif leading-none">{tier.label}</p>
                      </div>
                    </div>
                    <p className="text-[11px] sm:text-xs opacity-90 hidden sm:block">{tier.subtitle}</p>
                  </div>

                  {/* Ranks within the tier */}
                  <div className="p-4 sm:p-5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {ranks.map((r) => {
                        const idx = SWARAJYA_RANKS.findIndex((x) => x.name === r.name);
                        if (r.image) {
                          return (
                            <div
                              key={r.name}
                              className={`group relative rounded-2xl border-2 ${r.border} ${r.bg} p-5 sm:p-6 transition-all hover:shadow-xl hover:-translate-y-1 col-span-2 sm:col-span-3 lg:col-span-2 overflow-hidden`}
                              title={r.description}
                            >
                              {/* radial glow behind coin */}
                              <div className="absolute inset-0 bg-gradient-radial from-amber-200/40 via-transparent to-transparent pointer-events-none" />
                              <div className="relative flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                                <div className="relative shrink-0">
                                  <div className="absolute inset-0 rounded-full bg-amber-400/30 blur-2xl scale-110" />
                                  <img
                                    src={r.image}
                                    alt={`${r.name} badge`}
                                    className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full object-cover ring-4 ring-amber-500/50 shadow-2xl drop-shadow-[0_8px_24px_rgba(217,119,6,0.45)] transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3"
                                  />
                                </div>
                                <div className="flex-1 min-w-0 text-center sm:text-left">
                                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                                    <span className={`text-xs font-bold ${r.text} opacity-60 tabular-nums`}>#{idx + 1}</span>
                                    <span className={`text-base sm:text-lg font-extrabold ${r.text} tabular-nums px-3 py-1 rounded-full bg-white/80 border border-amber-300/60 shadow-sm`}>
                                      {fmtThreshold(r.threshold)}
                                    </span>
                                  </div>
                                  <p className={`font-extrabold text-2xl sm:text-3xl leading-tight ${r.text} font-serif`}>{r.name}</p>
                                  <p className={`text-base ${r.text} opacity-80 font-serif leading-tight mt-0.5`} lang="mr">
                                    {r.devanagari}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div
                            key={r.name}
                            className={`group relative rounded-xl border ${r.border} ${r.bg} p-3 transition-all hover:shadow-md hover:-translate-y-0.5`}
                            title={r.description}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={`text-[10px] font-bold ${r.text} opacity-60 tabular-nums`}>#{idx + 1}</span>
                            </div>
                            <p className={`font-bold text-sm leading-tight ${r.text}`}>{r.name}</p>
                            <p className={`mt-1 text-sm sm:text-base font-extrabold ${r.text} tabular-nums`}>
                              {fmtThreshold(r.threshold)}
                            </p>
                            <p className={`text-[11px] ${r.text} opacity-70 font-serif leading-tight`} lang="mr">
                              {r.devanagari}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Pinnacle + Chhava — crowning honors (above Sar Senapati) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-12">
            {/* Sar Senapati — pinnacle (spans 2 cols on lg) */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="lg:col-span-2 relative rounded-3xl overflow-hidden shadow-2xl shadow-amber-300/40"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${PINNACLE.gradient}`} />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.3),transparent_60%)]" />
              {/* Decorative crown ring */}
              <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full border-4 border-white/20" />
              <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full border-4 border-white/10" />

              <div className="relative p-7 sm:p-9 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur text-[10px] font-bold tracking-widest uppercase">
                    <Sparkles className="w-3 h-3" /> Pinnacle · #17
                  </span>
                </div>
                <div className="flex items-center gap-5 sm:gap-6">
                  {PINNACLE.image ? (
                    <div className="relative shrink-0">
                      <div className="absolute inset-0 rounded-full bg-white/40 blur-2xl scale-110" />
                      <img
                        src={PINNACLE.image}
                        alt={`${PINNACLE.name} badge`}
                        className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover ring-4 ring-white/60 shadow-2xl drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0 shadow-inner">
                      <Crown className="w-8 h-8" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-3xl sm:text-4xl font-bold font-serif leading-none">{PINNACLE.name}</h3>
                    <p className="text-base opacity-90 mt-1 font-serif" lang="mr">{PINNACLE.devanagari}</p>
                    <p className="text-sm opacity-85 mt-3 leading-relaxed">{PINNACLE.description}</p>
                    <div className="flex items-center gap-3 mt-4">
                      <span className="px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur text-base sm:text-lg font-extrabold tabular-nums shadow-sm">
                        {fmtThreshold(PINNACLE.threshold)}
                      </span>
                      <span className="text-xs opacity-80">Supreme commander of all forces</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Chhava — honorary parallel rank */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="relative rounded-3xl overflow-hidden shadow-2xl shadow-red-400/30"
            >
              <div className={`absolute inset-0 ${CHHAVA_RANK.bg}`} />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.25),transparent_60%)]" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full border-4 border-white/15" />

              <div className="relative p-7 text-white h-full flex flex-col items-center text-center">
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur text-[10px] font-bold tracking-widest uppercase">
                    <Crown className="w-3 h-3" /> Honorary
                  </span>
                </div>
                {CHHAVA_RANK.image && (
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-white/30 blur-2xl rounded-full" />
                    <img
                      src={CHHAVA_RANK.image}
                      alt={`${CHHAVA_RANK.name} coin`}
                      className="relative w-36 h-36 sm:w-40 sm:h-40 object-contain drop-shadow-2xl transition-transform duration-500 hover:rotate-6 hover:scale-110"
                      data-testid="badge-coin-chhava"
                    />
                  </div>
                )}
                <h3 className="text-3xl font-bold font-serif leading-none">{CHHAVA_RANK.name}</h3>
                <p className="text-base opacity-90 mt-1 font-serif" lang="mr">{CHHAVA_RANK.devanagari}</p>
                <p className="text-sm opacity-90 mt-3 leading-relaxed flex-1">
                  Awarded by the council for exceptional, lion-hearted seva. Stands above the ladder — the rarest honor in the Swarajya.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-gray-400 mt-8 max-w-md mx-auto">
            Hover any rank to see its meaning. Ranks are inspired by the actual structure of Chhatrapati Shivaji Maharaj's Maratha Empire.
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-br from-[#FF6F00] to-[#E65100] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-8 left-8 w-32 h-32 rounded-full border-2 border-white" />
          <div className="absolute bottom-8 right-8 w-48 h-48 rounded-full border-2 border-white" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border-2 border-white" />
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <Flame className="w-10 h-10 text-white/80 mx-auto mb-4" />
          <h2 className="text-3xl sm:text-4xl font-bold text-white font-serif mb-3">
            Ready to serve?
          </h2>
          <p className="text-lg text-orange-100 mb-8 max-w-md mx-auto">
            Join the community of sevaks across India. Your first act of service starts here.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/sign-up">
              <Button size="lg" className="bg-white text-[#FF6F00] hover:bg-orange-50 font-bold gap-2 px-8 h-12 shadow-lg">
                <Heart className="w-4 h-4" /> Create Free Account
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 gap-2 px-8 h-12">
                Sign In <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-4 mt-6 text-orange-100 text-xs">
            {["Free forever", "No ads", "Community-driven"].map(t => (
              <span key={t} className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" />{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-4 sm:px-6 bg-gray-900 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-[#FF6F00] flex items-center justify-center">
            <Flame className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold font-serif">HindaviSwarajya</span>
        </div>
        <p className="text-gray-400 text-xs mb-1">हिंदवी स्वराज्य — Community Seva Platform</p>
        <p className="text-gray-600 text-xs">"महाराजांचे स्वप्न, आमचे कर्तव्य" © 2026</p>
      </footer>
    </div>
  );
}
