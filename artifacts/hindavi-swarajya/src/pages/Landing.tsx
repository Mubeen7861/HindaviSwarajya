import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart, Users, Calendar, Trophy, ArrowRight,
  Star, Shield, Zap, Globe, CheckCircle, ChevronRight,
  Flame
} from "lucide-react";
import { motion } from "framer-motion";
import { useGetStatsSummary, getGetStatsSummaryQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

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
    desc: "Rise through ranks — Sevak, Karyakarta, Nayak, Veer, Sardar — as your seva grows.",
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
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-orange-50/30 pointer-events-none" />
        <div className="absolute top-20 right-0 w-96 h-96 rounded-full bg-[#FF6F00]/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-[#FF6F00]/5 blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge className="mb-5 bg-orange-50 text-[#FF6F00] border border-orange-200 text-xs px-3 py-1 font-medium">
              <Star className="w-3 h-3 mr-1" /> Inspired by Chhatrapati Shivaji Maharaj
            </Badge>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-4 font-serif">
              Serve. Connect.{" "}
              <span className="text-[#FF6F00]">Build Swarajya.</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-3 leading-relaxed">
              India's community seva platform for organizing events, sharing service stories, and helping those in need — together.
            </p>

            <p className="text-base text-[#FF6F00] font-semibold mb-8 font-serif">
              "स्वराज्य हा माझा जन्मसिद्ध हक्क आहे आणि तो मी मिळवणारच"
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link href="/sign-up">
                <Button size="lg" className="bg-[#FF6F00] hover:bg-[#E65100] text-white shadow-lg shadow-orange-200 gap-2 text-base px-8 h-12">
                  <Heart className="w-4 h-4" /> Start Your Seva Journey
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50 gap-2 text-base px-8 h-12">
                  Sign In <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
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

      {/* ── Ranks Section ── */}
      <section className="py-16 px-4 sm:px-6 bg-orange-50/50">
        <div className="max-w-4xl mx-auto text-center">
          <Zap className="w-8 h-8 text-[#FF6F00] mx-auto mb-3" />
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 font-serif mb-3">
            Your Seva Earns You Rank
          </h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">Rise through the ranks as your service grows. Each act of seva moves you closer to becoming a Sardar of the community.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              { rank: "Sevak", desc: "Starting your journey", color: "bg-green-100 text-green-800 border-green-200" },
              { rank: "Karyakarta", desc: "Active volunteer", color: "bg-blue-100 text-blue-800 border-blue-200" },
              { rank: "Nayak", desc: "Community leader", color: "bg-purple-100 text-purple-800 border-purple-200" },
              { rank: "Veer", desc: "Dedicated warrior", color: "bg-orange-100 text-orange-800 border-orange-200" },
              { rank: "Sardar", desc: "Elite champion", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
            ].map((r) => (
              <div key={r.rank} className={`border rounded-xl px-4 py-3 text-center ${r.color}`}>
                <p className="font-bold text-sm">{r.rank}</p>
                <p className="text-xs mt-0.5 opacity-80">{r.desc}</p>
              </div>
            ))}
          </div>
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
