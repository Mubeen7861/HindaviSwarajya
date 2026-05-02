import { Link, useLocation } from "wouter";
import {
  Home, Calendar, Plus, AlertCircle, Users, TrendingUp, User as UserIcon, Flame
} from "lucide-react";
import { CURRENT_USER_ID } from "@/lib/constants";
import { useGetStatsSummary } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/app", id: "home", icon: Home, label: "Home", description: "Latest seva activities" },
  { href: "/app/events", id: "events", icon: Calendar, label: "Events", description: "Join seva events" },
  { href: "/app/create", id: "create", icon: Plus, label: "Share Seva", description: "Post your service" },
  { href: "/app/help", id: "help-request", icon: AlertCircle, label: "Help Requests", description: "Find or offer help" },
  { href: "/app/community", id: "community", icon: Users, label: "Community", description: "Connect with sevaks" },
  { href: "/app/leaderboard", id: "leaderboard", icon: TrendingUp, label: "Leaderboard", description: "Top contributors" },
  { href: `/app/profile/${CURRENT_USER_ID}`, id: "profile", icon: UserIcon, label: "Profile", description: "Your seva journey" },
];

export function Sidebar() {
  const [location] = useLocation();
  const { data: stats } = useGetStatsSummary({ query: { staleTime: 30_000 } });

  return (
    <>
      {/* ─── Desktop Sidebar ─── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-72 bg-white border-r border-gray-200 z-40">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 shrink-0">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#FF6F00] shadow-[0_2px_10px_rgba(255,111,0,0.35)] group-hover:shadow-[0_4px_18px_rgba(255,111,0,0.45)] transition-all shrink-0">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#FF6F00] font-serif leading-tight" data-testid="nav-brand">
                Hindavi Swarajya
              </p>
              <p className="text-xs text-gray-500 mt-0.5 leading-tight">
                "महाराजांचे स्वप्न, आमचे कर्तव्य"
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isCreate = tab.id === "create";
            const isActive = !isCreate && (
              tab.href === "/app" ? location === "/app" || location === "/app/" : location.startsWith(tab.href)
            );

            return (
              <Link key={tab.id} href={tab.href}>
                <div
                  data-testid={`nav-${tab.id}`}
                  className={cn(
                    "w-full p-3.5 rounded-xl transition-all duration-200 text-left cursor-pointer",
                    isCreate
                      ? "bg-gradient-to-r from-[#FF6F00] to-[#E65100] text-white shadow-lg hover:shadow-xl"
                      : isActive
                        ? "bg-[#FFF3E0] text-[#FF6F00] border border-[#FF6F00]/20"
                        : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn(
                      "w-5 h-5 shrink-0",
                      isCreate ? "text-white" : isActive ? "text-[#FF6F00]" : "text-gray-500"
                    )} />
                    <div>
                      <p className={cn(
                        "font-medium text-sm leading-tight",
                        isCreate ? "text-white" : isActive ? "text-[#FF6F00]" : "text-gray-900"
                      )}>
                        {tab.label}
                      </p>
                      <p className={cn(
                        "text-xs mt-0.5",
                        isCreate ? "text-orange-100" : isActive ? "text-[#FF6F00]/70" : "text-gray-500"
                      )}>
                        {tab.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Community Impact Card */}
        <div className="px-4 pb-3 shrink-0">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-none">
            <div className="flex items-center gap-2 mb-2.5">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-800">Community Impact</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-blue-700">Total Seva Acts</span>
                <span className="font-semibold text-blue-800">{stats?.totalPosts?.toLocaleString() ?? "—"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-blue-700">People Helped</span>
                <span className="font-semibold text-blue-800">{stats?.totalHelped?.toLocaleString() ?? "—"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-blue-700">Active Sevaks</span>
                <span className="font-semibold text-blue-800">{stats?.totalUsers?.toLocaleString() ?? "—"}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Daily Quote */}
        <div className="px-6 py-4 border-t border-gray-200 shrink-0 text-center">
          <p className="text-xs text-[#FF6F00] font-medium mb-0.5">
            "स्वराज्य हा माझा जन्मसिद्ध हक्क आहे"
          </p>
          <p className="text-xs text-gray-500">Daily inspiration from Maharaj</p>
        </div>
      </aside>

      {/* ─── Mobile Top Bar ─── */}
      <header className="md:hidden sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#FF6F00] shadow-[0_2px_6px_rgba(255,111,0,0.4)]">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-[#FF6F00] font-serif">हिंदवी स्वराज्य</span>
          </Link>
          <Link href="/app/create">
            <div className="flex items-center gap-1.5 bg-[#FF6F00] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm">
              <Plus className="w-3.5 h-3.5" />
              Share Seva
            </div>
          </Link>
        </div>
      </header>

      {/* ─── Mobile Bottom Nav ─── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-gray-100 bg-white flex justify-around items-center h-16 z-50 pb-safe">
        {tabs.filter(t => ["home","leaderboard","create","profile"].includes(t.id)).map(({ href, id, icon: Icon }) => {
          const isActive = href === "/" ? location === "/" : location.startsWith(href);
          return (
            <Link key={id} href={href}>
              <div className={cn(
                "flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all",
                isActive ? "text-[#FF6F00]" : "text-gray-400"
              )}>
                <Icon className="w-5 h-5" />
              </div>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
