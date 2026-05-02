import { Link, useLocation } from "wouter";
import { Home, Trophy, PlusCircle, User as UserIcon, Flame, Shield } from "lucide-react";
import { CURRENT_USER_ID } from "@/lib/constants";
import { useGetUser } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "Feed", testId: "nav-home" },
  { href: "/leaderboard", icon: Trophy, label: "Leaderboard", testId: "nav-leaderboard" },
  { href: `/profile/${CURRENT_USER_ID}`, icon: UserIcon, label: "My Profile", testId: "nav-profile" },
];

export function Sidebar() {
  const [location] = useLocation();

  const { data: currentUser } = useGetUser(CURRENT_USER_ID, {
    query: { staleTime: 60_000 }
  });

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border z-40 select-none">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 px-5 py-6 group shrink-0">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-primary shadow-[0_2px_8px_rgba(255,111,0,0.45)] group-hover:shadow-[0_4px_16px_rgba(255,111,0,0.55)] transition-all duration-300">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-base font-bold text-primary tracking-tight font-serif" data-testid="nav-brand">
              हिंदवी स्वराज्य
            </span>
            <span className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase mt-0.5">
              Seva Platform
            </span>
          </div>
        </Link>

        {/* Divider */}
        <div className="mx-4 h-px bg-sidebar-border mb-3" />

        {/* Nav links */}
        <nav className="flex flex-col gap-1 px-3 flex-1 overflow-y-auto">
          {navItems.map(({ href, icon: Icon, label, testId }) => {
            const isActive = location === href;
            return (
              <Link key={href} href={href}>
                <div
                  data-testid={testId}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all duration-150",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-[0_2px_8px_rgba(255,111,0,0.3)]"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className={cn("w-4.5 h-4.5 shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                  {label}
                </div>
              </Link>
            );
          })}

          {/* Divider */}
          <div className="my-2 h-px bg-sidebar-border" />

          {/* Create CTA */}
          <Link href="/create">
            <div
              data-testid="nav-create"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-150 group",
                location === "/create"
                  ? "bg-primary text-primary-foreground shadow-[0_2px_8px_rgba(255,111,0,0.3)]"
                  : "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-[0_2px_8px_rgba(255,111,0,0.3)]"
              )}
            >
              <PlusCircle className="w-4.5 h-4.5 shrink-0" />
              Share a Seva
            </div>
          </Link>
        </nav>

        {/* Bottom: rank progress teaser */}
        <div className="mx-3 mb-3 p-3 rounded-xl bg-primary/5 border border-primary/15">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">Rank Progress</span>
          </div>
          <div className="text-xs text-muted-foreground mb-2">Keep serving to level up your rank</div>
          <div className="h-1.5 bg-primary/15 rounded-full overflow-hidden">
            <div className="h-full w-3/5 bg-gradient-to-r from-primary to-orange-400 rounded-full" />
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-sidebar-border" />

        {/* User profile at bottom */}
        <Link href={`/profile/${CURRENT_USER_ID}`} className="flex items-center gap-3 px-4 py-4 hover:bg-sidebar-accent transition-colors shrink-0 cursor-pointer">
          <Avatar className="w-8 h-8 border border-primary/20 shrink-0">
            <AvatarImage src={currentUser?.avatar} alt={currentUser?.name} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {currentUser?.name?.substring(0, 2) ?? "RP"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{currentUser?.name ?? "Loading…"}</p>
            <p className="text-xs text-muted-foreground truncate capitalize">{currentUser?.rank ?? "Sevak"}</p>
          </div>
        </Link>
      </aside>

      {/* Mobile Top Bar */}
      <header className="md:hidden sticky top-0 z-50 w-full border-b bg-sidebar/95 backdrop-blur-sm shadow-sm">
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
              Seva
            </div>
          </Link>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-sidebar flex justify-around items-center h-16 z-50 pb-safe">
        {navItems.map(({ href, icon: Icon, testId }) => {
          const isActive = location === href;
          return (
            <Link key={href} href={href}>
              <div
                data-testid={`${testId}-mobile`}
                className={cn(
                  "flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "drop-shadow-[0_0_6px_rgba(255,111,0,0.5)]")} />
              </div>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
