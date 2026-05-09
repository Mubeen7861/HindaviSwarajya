import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart, Users, Calendar, Trophy, ArrowRight,
  Shield, Globe, CheckCircle, ChevronRight,
  Flame, Crown, Sparkles, Sword, Shield as ShieldIcon, Mountain,
  HandHeart, Share2, Link2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useGetStatsSummary, getGetStatsSummaryQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SWARAJYA_RANKS, CHHAVA_RANK, type RankDef, type RankTier } from "@/lib/ranks";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";

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
  const { i18n } = useTranslation();
  const isMarathi = i18n.language?.startsWith("mr");
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
    <div className="vintage-landing min-h-screen vint-parchment overflow-x-hidden">

      {/* ── Navbar (parchment, antique gold rule) ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md shadow-sm"
        style={{
          backgroundColor: "rgba(243, 228, 198, 0.92)",
          borderBottom: "1px solid rgba(200, 164, 92, 0.45)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo className="h-10 w-auto" />
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="compact" />
            <Link href="/sign-in">
              <Button variant="ghost" className="font-semibold hidden sm:inline-flex" style={{ color: "#5C3A1E" }}>
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button className="vint-btn-primary gap-1.5 font-bold">
                Join Free <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero (parchment + fort silhouette + drifting dust) ── */}
      <section className="vint-parchment vint-grain pt-28 pb-32 px-4 sm:px-6 relative overflow-hidden">
        {/* Soft warm vignettes */}
        <div className="absolute top-20 right-0 w-[28rem] h-[28rem] rounded-full pointer-events-none"
             style={{ background: "radial-gradient(circle, rgba(184,67,14,0.18), transparent 70%)" }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full pointer-events-none"
             style={{ background: "radial-gradient(circle, rgba(200,164,92,0.20), transparent 70%)" }} />

        {/* Drifting dust particles */}
        <div className="vint-dust" aria-hidden="true">
          {Array.from({ length: 14 }).map((_, i) => {
            const left = (i * 7.3) % 100;
            const dur = 14 + (i % 5) * 3;
            const delay = (i * 1.7) % 12;
            const size = 2 + (i % 3);
            return (
              <span
                key={i}
                style={{
                  left: `${left}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  animationDuration: `${dur}s`,
                  animationDelay: `${delay}s`,
                }}
              />
            );
          })}
        </div>

        {/* Fort silhouette at bottom */}
        <div className="vint-fort absolute left-0 right-0 bottom-0 h-36 pointer-events-none" aria-hidden="true" />

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            {/* Vintage seal badge */}
            <div className="vint-chip inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full font-bold uppercase tracking-widest text-[10px] sm:text-[11px]">
              {isMarathi ? "सामुदायिक सेवा मंच" : "Community Seva Platform"}
            </div>

            {/* Decorative ornament — gold rule + crown */}
            <div className="flex justify-center items-center gap-3 mb-5" aria-hidden="true">
              <span className="w-12 h-px" style={{ background: "linear-gradient(90deg, transparent, #C8A45C)" }} />
              <Crown className="w-5 h-5" style={{ color: "#C8A45C" }} />
              <span className="w-12 h-px" style={{ background: "linear-gradient(270deg, transparent, #C8A45C)" }} />
            </div>

            <h1
              className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.05] mb-5 font-serif tracking-tight"
              style={{ color: "#2A1F14", textShadow: "0 1px 0 rgba(255,246,225,0.5)" }}
            >
              {isMarathi ? (
                <>
                  “हे स्वराज्य व्हावे,{" "}
                  <span style={{ color: "#FF6F00" }}>
                    ही तर श्रींची इच्छा!”
                  </span>
                </>
              ) : (
                <>
                  Serve. Unite.{" "}
                  <span style={{
                    background: "linear-gradient(180deg, #B8430E 0%, #8B2E08 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}>
                    Build Swarajya.
                  </span>
                </>
              )}
            </h1>

            <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-6 leading-relaxed" style={{ color: "#5C3A1E" }}>
              {isMarathi ? (
                <>
                  <span className="font-bold" style={{ color: "#2A1F14" }}>छत्रपती शिवाजी महाराजांच्या</span>
                  {" "}विचारांनी प्रेरित —<br className="hidden md:inline" />
                  {" "}आधुनिक युगातील पहिलं डिजिटल हिंदवी स्वराज्य.
                </>
              ) : (
                <>
                  World's first seva platform inspired by the vision of{" "}
                  <span className="font-bold" style={{ color: "#2A1F14" }}>Chhatrapati Shivaji Maharaj</span>
                  {" "}— a movement, not just a platform.
                </>
              )}
            </p>

            {/* Marathi emotional line — framed in a vintage scroll */}
            <div className="max-w-xl mx-auto mb-8 relative">
              <div className="absolute -left-2 top-0 text-5xl font-serif leading-none select-none" style={{ color: "rgba(184,67,14,0.25)" }} aria-hidden="true">"</div>
              <div className="absolute -right-2 bottom-0 text-5xl font-serif leading-none select-none rotate-180" style={{ color: "rgba(184,67,14,0.25)" }} aria-hidden="true">"</div>
              <p className="text-base sm:text-lg font-bold font-serif px-6 leading-relaxed" style={{ color: "#8B2E08" }} lang="mr">
                हे महाराजांचं स्वप्न आहे — या आधुनिक जगात पुन्हा जिवंत करण्याचा आमचा प्रयत्न.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link href="/sign-up">
                <Button size="lg" className="vint-btn-primary gap-2 text-base px-8 h-12 font-bold rounded-md">
                  <Heart className="w-4 h-4" /> Start Your Seva Journey
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="lg" className="vint-btn-secondary gap-2 text-base px-8 h-12 font-bold rounded-md">
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
                  className="vint-chip inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold"
                >
                  <t.icon className="w-3 h-3" style={{ color: "#B8430E" }} />
                  {t.label}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Live Stats (banner — burnt saffron with stamped feel) ── */}
      {showStatsSection && (
        <section
          className="vint-grain py-14 relative overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #B8430E 0%, #8B2E08 100%)",
            borderTop: "2px solid rgba(200,164,92,0.45)",
            borderBottom: "2px solid rgba(42,31,20,0.45)",
            color: "#FFF6E1",
          }}
        >
          <div className="absolute inset-0 opacity-20 pointer-events-none"
               style={{
                 backgroundImage: "repeating-linear-gradient(90deg, rgba(255,246,225,0.15) 0px, rgba(255,246,225,0.15) 1px, transparent 1px, transparent 80px)",
               }} />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
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
                  className="text-center"
                >
                  <s.icon className="w-6 h-6 mx-auto mb-2" style={{ color: "#E0C078" }} />
                  <p className="text-4xl font-bold font-serif mb-0.5 tabular-nums" style={{ textShadow: "0 1px 0 rgba(0,0,0,0.25)" }}>
                    {s.value.toLocaleString()}
                  </p>
                  <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: "#F3E0B8" }}>
                    {s.label}
                  </p>
                </motion.div>
              ))
            )}
          </div>
        </section>
      )}

      {/* ── Features (parchment paper cards) ── */}
      <section className="vint-parchment vint-grain py-20 px-4 sm:px-6 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="vint-ornament mb-3 mx-auto"><span className="text-[10px] uppercase tracking-[0.3em] font-bold">सेवा</span></div>
            <h2 className="text-3xl sm:text-4xl font-bold font-serif mb-3" style={{ color: "#2A1F14" }}>
              Everything you need for{" "}
              <span style={{ color: "#8B2E08" }}>Seva</span>
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "#5C3A1E" }}>
              A complete platform for community service — organize, connect, help, and grow together.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                viewport={{ once: true }}
                className="vint-card p-5 transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className="w-11 h-11 rounded-md flex items-center justify-center mb-3"
                  style={{
                    background: "linear-gradient(180deg, #E7D2A8 0%, #D9BE85 100%)",
                    border: "1px solid rgba(139,46,8,0.3)",
                    color: "#8B2E08",
                    boxShadow: "0 1px 0 rgba(255,255,255,0.5) inset",
                  }}
                >
                  <f.icon className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <h3 className="font-bold font-serif text-lg mb-1.5" style={{ color: "#2A1F14" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#5C3A1E" }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Premium Rank Ladder (parchment) ── */}
      <section className="vint-parchment vint-grain py-20 px-4 sm:px-6 relative overflow-hidden">
        {/* Decorative warm glows */}
        <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full pointer-events-none"
             style={{ background: "radial-gradient(circle, rgba(200,164,92,0.20), transparent 70%)" }} />
        <div className="absolute bottom-10 right-1/4 w-72 h-72 rounded-full pointer-events-none"
             style={{ background: "radial-gradient(circle, rgba(184,67,14,0.15), transparent 70%)" }} />

        <div className="relative max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-12">
            <div className="vint-chip inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full">
              <Crown className="w-3.5 h-3.5" style={{ color: "#C8A45C" }} />
              <span className="text-[11px] font-bold tracking-widest uppercase">
                17 Ranks · 5 Tiers
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-serif mb-4 tracking-tight" style={{ color: "#2A1F14" }}>
              The <span style={{ color: "#8B2E08" }}>Swarajya</span> Rank System
            </h2>
            <p className="max-w-2xl mx-auto text-base sm:text-lg leading-relaxed" style={{ color: "#5C3A1E" }}>
              Every person you help earns you{" "}
              <span className="font-bold" style={{ color: "#8B2E08" }}>10 Mudra</span>. Rise through the ranks of
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
                  className="relative overflow-hidden rounded-xl"
                  style={{ border: "1px solid rgba(200,164,92,0.35)" }}
                >
                  {/* Tier header strip — muted brown/saffron */}
                  <div
                    className="relative px-5 py-3 flex items-center justify-between"
                    style={{
                      background: "linear-gradient(180deg, #5C3A1E 0%, #2A1F14 100%)",
                      color: "#F3E0B8",
                      borderBottom: "1px solid #C8A45C",
                    }}
                  >
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
                              className="group relative p-4 sm:p-5 transition-all hover:-translate-y-0.5 col-span-2 sm:col-span-3 lg:col-span-2"
                              title={r.description}
                            >
                              <div className="relative flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                                <div className="relative shrink-0">
                                  <img
                                    src={r.image}
                                    alt={`${r.name} badge`}
                                    className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover drop-shadow-[0_6px_18px_rgba(92,58,30,0.45)] transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3"
                                  />
                                </div>
                                <div className="flex-1 min-w-0 text-center sm:text-left">
                                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                                    <span className="text-xs font-bold tabular-nums" style={{ color: "#5C3A1E", opacity: 0.7 }}>#{idx + 1}</span>
                                    <span
                                      className="text-base sm:text-lg font-extrabold tabular-nums px-3 py-1 rounded-full"
                                      style={{
                                        color: "#8B2E08",
                                        backgroundColor: "rgba(250,239,214,0.85)",
                                        border: "1px solid rgba(200,164,92,0.6)",
                                      }}
                                    >
                                      {fmtThreshold(r.threshold)}
                                    </span>
                                  </div>
                                  <p className="font-extrabold text-2xl sm:text-3xl leading-tight font-serif" style={{ color: "#2A1F14" }}>{r.name}</p>
                                  <p className="text-base font-serif leading-tight mt-0.5" style={{ color: "#5C3A1E", opacity: 0.85 }} lang="mr">
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
                            className="group relative p-3 transition-all hover:-translate-y-0.5"
                            title={r.description}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-bold tabular-nums" style={{ color: "#5C3A1E", opacity: 0.7 }}>#{idx + 1}</span>
                            </div>
                            <p className="font-bold text-sm leading-tight" style={{ color: "#2A1F14" }}>{r.name}</p>
                            <p className="mt-1 text-sm sm:text-base font-extrabold tabular-nums" style={{ color: "#8B2E08" }}>
                              {fmtThreshold(r.threshold)}
                            </p>
                            <p className="text-[11px] font-serif leading-tight" style={{ color: "#5C3A1E", opacity: 0.75 }} lang="mr">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-8 mb-12">
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

      {/* ── How It Works (parchment) ── */}
      <section className="vint-parchment vint-grain py-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
             style={{ background: "radial-gradient(circle, rgba(184,67,14,0.10), transparent 70%)" }} />

        <div className="relative max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-14">
            <div className="vint-chip inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold tracking-widest uppercase">
                Your Journey in Swarajya
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-serif mb-3 tracking-tight" style={{ color: "#2A1F14" }}>
              How It <span style={{ color: "#8B2E08" }}>Works</span>
            </h2>
            <p className="text-lg sm:text-xl font-bold font-serif" style={{ color: "#8B2E08" }} lang="mr">
              स्वराज्य कसे घडते
            </p>
            <p className="mt-4 max-w-xl mx-auto text-base sm:text-lg leading-relaxed" style={{ color: "#5C3A1E" }}>
              Five simple steps. One powerful movement. Start with action, rise with respect.
            </p>
          </div>

          {/* Steps */}
          {(() => {
            const STEPS = [
              {
                icon: HandHeart,
                title: "Do Seva",
                tagline: "Start with action.",
                desc: "Help someone in real life — food, education, health, or any meaningful support.",
                accent: "from-rose-500 to-red-600",
              },
              {
                icon: Share2,
                title: "Share Your Impact",
                tagline: "Inspire others.",
                desc: "Post your seva on Instagram and tag us to spread the movement.",
                accent: "from-amber-500 to-orange-500",
              },
              {
                icon: Link2,
                title: "Submit Proof",
                tagline: "Make it count.",
                desc: "Paste your post link on our platform and submit your contribution.",
                accent: "from-[#FF6F00] to-[#E65100]",
              },
              {
                icon: CheckCircle,
                title: "Get Verified",
                tagline: "Earn trust.",
                desc: "Our team reviews your submission to ensure genuine impact.",
                accent: "from-emerald-500 to-teal-600",
              },
              {
                icon: Crown,
                title: "Rise in Swarajya",
                tagline: "Earn respect, not just points.",
                desc: "Gain Mudra, unlock ranks like Mavla and Sardar, and become part of something bigger.",
                accent: "from-indigo-500 to-purple-600",
              },
            ];

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-3">
                {STEPS.map((step, i) => {
                  const Icon = step.icon;
                  const isLast = i === STEPS.length - 1;
                  return (
                    <div key={step.title} className="relative group">
                      <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.08 }}
                        className="vint-card relative h-full p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1"
                      >
                        {/* Step number */}
                        <div className="flex items-center justify-between mb-4">
                          <div
                            className="w-12 h-12 rounded-md flex items-center justify-center group-hover:scale-110 group-hover:rotate-2 transition-transform duration-300"
                            style={{
                              background: "linear-gradient(180deg, #C9531E 0%, #B8430E 60%, #8B2E08 100%)",
                              border: "1px solid #8B2E08",
                              color: "#FFF6E1",
                              boxShadow: "0 1px 0 rgba(255,255,255,0.18) inset, 0 -2px 0 rgba(0,0,0,0.18) inset, 0 6px 12px -4px rgba(139,46,8,0.45)",
                            }}
                          >
                            <Icon className="w-6 h-6" strokeWidth={1.8} />
                          </div>
                          <span className="text-4xl font-extrabold tabular-nums leading-none font-serif select-none" style={{ color: "rgba(184,67,14,0.20)" }}>
                            0{i + 1}
                          </span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold font-serif leading-tight mb-1" style={{ color: "#2A1F14" }}>
                          {step.title}
                        </h3>
                        <p className="text-sm font-bold mb-2 uppercase tracking-wide" style={{ color: "#8B2E08" }}>
                          {step.tagline}
                        </p>
                        <p className="text-sm leading-relaxed" style={{ color: "#5C3A1E" }}>
                          {step.desc}
                        </p>
                      </motion.div>

                      {/* Arrow flow between cards (lg only) */}
                      {!isLast && (
                        <div className="hidden lg:flex absolute top-1/2 -right-2 -translate-y-1/2 z-10 pointer-events-none">
                          <motion.div
                            initial={{ opacity: 0, x: -4 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.08 + 0.2 }}
                            className="w-7 h-7 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform duration-300"
                            style={{
                              backgroundColor: "#FAEFD6",
                              border: "1px solid #C8A45C",
                              color: "#8B2E08",
                              boxShadow: "0 2px 4px rgba(92,58,30,0.2)",
                            }}
                          >
                            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
                          </motion.div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Closing line */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-14 max-w-3xl mx-auto text-center"
          >
            <div
              className="relative inline-block px-6 sm:px-10 py-6 rounded-md overflow-hidden"
              style={{
                background: "linear-gradient(180deg, #5C3A1E 0%, #2A1F14 100%)",
                border: "1.5px solid #C8A45C",
                color: "#FFF6E1",
                boxShadow: "0 1px 0 rgba(255,255,255,0.08) inset, 0 -2px 0 rgba(0,0,0,0.4) inset, 0 14px 28px -10px rgba(42,31,20,0.55)",
              }}
            >
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full" style={{ border: "2px solid rgba(200,164,92,0.35)" }} />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full" style={{ border: "2px solid rgba(200,164,92,0.2)" }} />
              <Flame className="w-7 h-7 mx-auto mb-3" style={{ color: "#E0C078" }} />
              <p className="text-xl sm:text-2xl font-bold font-serif leading-snug" style={{ textShadow: "0 1px 0 rgba(0,0,0,0.4)" }}>
                This is not just a platform.<br />
                <span style={{ color: "#E0C078" }}>This is a movement built on seva.</span>
              </p>
              <p className="mt-3 text-base sm:text-lg font-bold font-serif" style={{ color: "#F3E0B8" }} lang="mr">
                हे फक्त प्लॅटफॉर्म नाही… हे स्वराज्य आहे.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA (burnt saffron stamped banner) ── */}
      <section
        className="vint-grain py-20 px-4 sm:px-6 relative overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #B8430E 0%, #8B2E08 100%)",
          borderTop: "2px solid rgba(200,164,92,0.55)",
          color: "#FFF6E1",
        }}
      >
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <div className="absolute top-8 left-8 w-32 h-32 rounded-full" style={{ border: "2px solid #C8A45C" }} />
          <div className="absolute bottom-8 right-8 w-48 h-48 rounded-full" style={{ border: "2px solid #C8A45C" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full" style={{ border: "2px solid #C8A45C" }} />
        </div>
        {/* Fort silhouette echo */}
        <div className="vint-fort absolute left-0 right-0 bottom-0 h-24 pointer-events-none opacity-50" aria-hidden="true" />

        <div className="relative max-w-2xl mx-auto text-center">
          <Flame className="w-10 h-10 mx-auto mb-4" style={{ color: "#E0C078" }} />
          <h2 className="text-3xl sm:text-4xl font-bold font-serif mb-3" style={{ textShadow: "0 1px 0 rgba(0,0,0,0.3)" }}>
            Ready to serve?
          </h2>
          <p className="text-lg mb-8 max-w-md mx-auto" style={{ color: "#F3E0B8" }}>
            Join the community of sevaks across India. Your first act of service starts here.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/sign-up">
              <Button
                size="lg"
                className="font-bold gap-2 px-8 h-12 rounded-md"
                style={{
                  backgroundColor: "#FAEFD6",
                  color: "#8B2E08",
                  border: "1.5px solid #C8A45C",
                  boxShadow: "0 1px 0 rgba(255,255,255,0.5) inset, 0 6px 14px -4px rgba(0,0,0,0.35)",
                }}
              >
                <Heart className="w-4 h-4" /> Create Free Account
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 px-8 h-12 font-bold rounded-md"
                style={{
                  borderColor: "rgba(243,224,184,0.5)",
                  color: "#FFF6E1",
                  backgroundColor: "transparent",
                }}
              >
                Sign In <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-4 mt-6 text-xs" style={{ color: "#F3E0B8" }}>
            {["Free forever", "No ads", "Community-driven"].map(t => (
              <span key={t} className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" />{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer (charcoal & antique gold) ── */}
      <footer
        className="py-8 px-4 sm:px-6 text-center"
        style={{
          background: "linear-gradient(180deg, #2A1F14 0%, #1A1108 100%)",
          borderTop: "1px solid rgba(200,164,92,0.45)",
        }}
      >
        <div className="flex items-center justify-center mb-2">
          <Logo className="h-10 w-auto" />
        </div>
        <p className="text-xs mb-1" style={{ color: "#C8A45C" }}>हिंदवी स्वराज्य — Community Seva Platform</p>
        <p className="text-xs mb-3" style={{ color: "#8C6F3D" }}>"महाराजांचे स्वप्न, आमचे कर्तव्य" © 2026</p>
        <a
          href="/app/admin/login"
          className="text-[11px] underline-offset-2 hover:underline"
          style={{ color: "#8C6F3D" }}
        >
          Admin
        </a>
      </footer>
    </div>
  );
}
