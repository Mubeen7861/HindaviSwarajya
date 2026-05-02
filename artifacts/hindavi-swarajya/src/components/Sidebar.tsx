import { Link, useLocation } from "wouter";
import {
  Home, Calendar, PlusCircle, HelpCircle, Users, TrendingUp,
  User as UserIcon, Flame, TrendingUpIcon
} from "lucide-react";
import { CURRENT_USER_ID } from "@/lib/constants";
import { useGetStatsSummary } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "Home", sub: "Latest seva activities", testId: "nav-home" },
  { href: "/leaderboard", icon: TrendingUp, label: "Leaderboard", sub: "Top contributors", testId: "nav-leaderboard" },
  { href: "/community", icon: Users, label: "Community", sub: "Connect with sevaks", testId: "nav-community" },
  { href: `/profile/${CURRENT_USER_ID}`, icon: UserIcon, label: "Profile", sub: "Your seva journey", testId: "nav-profile" },
];

export function Sidebar() {
  const [location] = useLocation();

  const { data: stats } = useGetStatsSummary({ query: { staleTime: 30_000 } });

  return (
    <>
      {/* ─── Desktop Sidebar ─── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-[220px] bg-white border-r border-gray-100 z-40 select-none overflow-y-auto">

        {/* Brand */}
        <div className="px-5 pt-6 pb-4 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary shadow-[0_2px_10px_rgba(255,111,0,0.35)] group-hover:shadow-[0_4px_18px_rgba(255,111,0,0.45)] transition-all">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div className="leading-none">
              <p className="text-sm font-bold text-primary font-serif" data-testid="nav-brand">Hindavi Swarajya</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">महाराजांचे स्वप्न, आमचे कर्तव्य</p>
            </div>
          </Link>
        </div>

        <div className="h-px bg-gray-100 mx-4 mb-3" />

        {/* Nav items */}
        <nav className="flex flex-col gap-0.5 px-3">
          {navItems.map(({ href, icon: Icon, label, sub, testId }) => {
            const isActive = href === "/"
              ? location === "/"
              : location.startsWith(href);
            return (
              <Link key={href} href={href}>
                <div
                  data-testid={testId}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 group",
                    isActive
                      ? "bg-orange-50 border border-orange-100"
                      : "hover:bg-gray-50"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-colors",
                    isActive ? "bg-orange-100" : "bg-gray-100 group-hover:bg-gray-150"
                  )}>
                    <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-gray-500")} />
                  </div>
                  <div className="min-w-0">
                    <p className={cn("text-sm font-semibold leading-tight truncate", isActive ? "text-primary" : "text-gray-800")}>{label}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{sub}</p>
                  </div>
                </div>
              </Link>
            );
          })}

          {/* Share Seva CTA */}
          <Link href="/create">
            <div
              data-testid="nav-create"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 mt-1",
                location === "/create"
                  ? "bg-primary shadow-[0_2px_10px_rgba(255,111,0,0.35)]"
                  : "bg-primary hover:bg-orange-600 shadow-[0_2px_8px_rgba(255,111,0,0.3)] hover:shadow-[0_4px_16px_rgba(255,111,0,0.4)]"
              )}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 shrink-0">
                <PlusCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">Share Seva</p>
                <p className="text-[11px] text-orange-100">Post your service</p>
              </div>
            </div>
          </Link>
        </nav>

        {/* Community Impact widget */}
        <div className="mx-3 mt-5 p-4 rounded-xl bg-blue-50 border border-blue-100 shrink-0">
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingUpIcon className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Community Impact</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-gray-500">Total Seva Acts</span>
              <span className="text-sm font-bold text-primary">{stats?.totalPosts?.toLocaleString() ?? "—"}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-gray-500">People Helped</span>
              <span className="text-sm font-bold text-primary">{stats?.totalHelped?.toLocaleString() ?? "—"}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-gray-500">Active Sevaks</span>
              <span className="text-sm font-bold text-primary">{stats?.totalUsers?.toLocaleString() ?? "—"}</span>
            </div>
          </div>
        </div>

        {/* Inspirational quote */}
        <div className="mx-3 mt-3 mb-4 p-3 rounded-xl bg-orange-50 border border-orange-100 shrink-0">
          <p className="text-xs font-bold text-primary italic leading-snug text-center">
            "स्वराज हा माझा जन्मसिद्ध हक्क आहे"
          </p>
          <p className="text-[10px] text-muted-foreground text-center mt-1">Daily inspiration from Maharaj</p>
        </div>
      </aside>

      {/* ─── Mobile Top Bar ─── */}
      <header className="md:hidden sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary shadow-[0_2px_6px_rgba(255,111,0,0.4)]">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-primary font-serif">हिंदवी स्वराज्य</span>
          </Link>
          <Link href="/create">
            <div className="flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm">
              <PlusCircle className="w-3.5 h-3.5" />
              Share Seva
            </div>
          </Link>
        </div>
      </header>

      {/* ─── Mobile Bottom Nav ─── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-gray-100 bg-white flex justify-around items-center h-16 z-50 pb-safe">
        {navItems.map(({ href, icon: Icon, testId }) => {
          const isActive = href === "/" ? location === "/" : location.startsWith(href);
          return (
            <Link key={href} href={href}>
              <div
                data-testid={`${testId}-mobile`}
                className={cn(
                  "flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all",
                  isActive ? "text-primary" : "text-gray-400"
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
            </Link>
          );
        })}
        <Link href="/create">
          <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl text-primary">
            <PlusCircle className="w-5 h-5" />
          </div>
        </Link>
      </nav>
    </>
  );
}
