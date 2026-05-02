import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import {
  Home, Calendar, Plus, AlertCircle, Users, TrendingUp,
  User as UserIcon, Flame,
} from "lucide-react";
import {
  useGetStatsSummary, getGetStatsSummaryQueryKey,
} from "@workspace/api-client-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { cn } from "@/lib/utils";

type TabId =
  | "home" | "events" | "create" | "help-request"
  | "community" | "leaderboard" | "profile";

type Tab = {
  href: string;
  id: TabId;
  icon: typeof Home;
  labelKey: string;
  descKey: string;
};

const TABS: Tab[] = [
  { href: "/app",            id: "home",         icon: Home,        labelKey: "nav.home",        descKey: "nav.homeDesc" },
  { href: "/app/events",     id: "events",       icon: Calendar,    labelKey: "nav.events",      descKey: "nav.eventsDesc" },
  { href: "/app/create",     id: "create",       icon: Plus,        labelKey: "nav.create",      descKey: "nav.createDesc" },
  { href: "/app/help",       id: "help-request", icon: AlertCircle, labelKey: "nav.help",        descKey: "nav.helpDesc" },
  { href: "/app/community",  id: "community",    icon: Users,       labelKey: "nav.community",   descKey: "nav.communityDesc" },
  { href: "/app/leaderboard",id: "leaderboard",  icon: TrendingUp,  labelKey: "nav.leaderboard", descKey: "nav.leaderboardDesc" },
  { href: "/app/profile/me", id: "profile",      icon: UserIcon,    labelKey: "nav.profile",     descKey: "nav.profileDesc" },
];

const MOBILE_TABS: TabId[] = ["home", "events", "create", "help-request", "profile"];

function isTabActive(href: string, location: string) {
  if (href === "/app") return location === "/app" || location === "/app/";
  return location.startsWith(href);
}

export function Sidebar() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const { data: stats } = useGetStatsSummary({
    query: { queryKey: getGetStatsSummaryQueryKey(), staleTime: 30_000 },
  });

  return (
    <>
      {/* ─── Desktop Sidebar ─── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-72 bg-card border-r border-border/60 z-40">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border/50 shrink-0">
          <Link href="/" className="flex items-center gap-3 group tap-none">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-primary text-primary-foreground shrink-0 transition-transform group-hover:scale-105">
              <Flame className="w-5 h-5" strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <p
                className="text-[15px] font-semibold text-foreground leading-tight tracking-tight truncate"
                data-testid="nav-brand"
              >
                {t("brand.name")}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight truncate">
                {t("brand.tagline")}
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isCreate = tab.id === "create";
            const isActive = !isCreate && isTabActive(tab.href, location);

            return (
              <Link key={tab.id} href={tab.href}>
                <div
                  data-testid={`nav-${tab.id}`}
                  className={cn(
                    "w-full px-3 py-2.5 rounded-xl transition-all duration-150 text-left cursor-pointer tap-none",
                    isCreate
                      ? "mt-2 mb-3 bg-primary text-primary-foreground hover:bg-primary/90"
                      : isActive
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "w-[18px] h-[18px] shrink-0",
                        isCreate ? "text-primary-foreground" : isActive ? "text-primary" : "text-foreground/60",
                      )}
                      strokeWidth={isActive || isCreate ? 2.25 : 1.75}
                    />
                    <div className="min-w-0">
                      <p className={cn(
                        "text-[13.5px] font-medium leading-tight truncate",
                        isCreate ? "text-primary-foreground" : "",
                      )}>
                        {t(tab.labelKey)}
                      </p>
                      <p className={cn(
                        "text-[11px] mt-0.5 leading-tight truncate",
                        isCreate ? "text-primary-foreground/80" : "text-muted-foreground",
                      )}>
                        {t(tab.descKey)}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Community Impact — minimal stat block */}
        <div className="px-4 pb-3 shrink-0">
          <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground/80">
                {t("nav.impact")}
              </span>
            </div>
            <div className="space-y-2">
              {[
                { label: t("nav.impactPosts"),  value: stats?.totalPosts },
                { label: t("nav.impactHelped"), value: stats?.totalHelped },
                { label: t("nav.impactSevaks"), value: stats?.totalUsers  },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-baseline justify-between">
                  <span className="text-[12px] text-muted-foreground">{label}</span>
                  <span className="text-[13px] font-semibold text-foreground tabular-nums">
                    {value?.toLocaleString() ?? "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer: language + quote */}
        <div className="px-4 pb-4 shrink-0 border-t border-border/50 pt-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] text-primary font-medium truncate" lang="mr">
              {t("brand.quote")}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {t("nav.dailyInspiration")}
            </p>
          </div>
          <LanguageSwitcher variant="icon" />
        </div>
      </aside>

      {/* ─── Mobile Top Bar ─── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 glass-bar border-b border-border/50 pt-safe">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/" className="flex items-center gap-2.5 tap-none">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary text-primary-foreground">
              <Flame className="w-4 h-4" strokeWidth={2.25} />
            </div>
            <div className="leading-tight">
              <span className="block text-[15px] font-semibold text-foreground tracking-tight">
                {t("brand.name")}
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <LanguageSwitcher variant="icon" />
          </div>
        </div>
      </header>

      {/* ─── Mobile Bottom Nav (app-style) ─── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-bar border-t border-border/50 pb-safe"
        aria-label="Primary"
      >
        <div className="flex justify-around items-center h-[60px] px-2 max-w-md mx-auto">
          {TABS.filter((t) => MOBILE_TABS.includes(t.id)).map((tab) => {
            const Icon = tab.icon;
            const isCreate = tab.id === "create";
            const isActive = !isCreate && isTabActive(tab.href, location);

            if (isCreate) {
              return (
                <Link key={tab.id} href={tab.href}>
                  <div
                    data-testid={`nav-${tab.id}`}
                    className="flex items-center justify-center w-12 h-12 -mt-5 rounded-2xl bg-primary text-primary-foreground shadow-md tap-none active:scale-95 transition-transform"
                    aria-label={t(tab.labelKey)}
                  >
                    <Icon className="w-5 h-5" strokeWidth={2.5} />
                  </div>
                </Link>
              );
            }

            return (
              <Link key={tab.id} href={tab.href}>
                <div
                  data-testid={`nav-${tab.id}`}
                  className={cn(
                    "flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-colors tap-none",
                    isActive ? "text-primary" : "text-foreground/45",
                  )}
                  aria-label={t(tab.labelKey)}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon
                    className="w-[22px] h-[22px]"
                    strokeWidth={isActive ? 2.25 : 1.85}
                  />
                  <span
                    className={cn(
                      "text-[10px] mt-0.5 leading-none font-medium truncate max-w-[64px]",
                      isActive ? "text-primary" : "text-foreground/55",
                    )}
                  >
                    {t(tab.labelKey)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
