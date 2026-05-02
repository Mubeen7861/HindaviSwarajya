import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import {
  Home, Plus, HandHeart, Users, User as UserIcon,
  Calendar, TrendingUp, Crown,
} from "lucide-react";
import {
  useGetStatsSummary, getGetStatsSummaryQueryKey,
} from "@workspace/api-client-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { cn } from "@/lib/utils";

type TabId =
  | "home" | "help-request" | "create" | "community" | "profile"
  | "events" | "leaderboard";

type Tab = {
  href: string;
  id: TabId;
  icon: typeof Home;
  labelKey: string;
  descKey: string;
};

const PRIMARY_TABS: Tab[] = [
  { href: "/app",            id: "home",         icon: Home,      labelKey: "nav.home",      descKey: "nav.homeDesc" },
  { href: "/app/help",       id: "help-request", icon: HandHeart, labelKey: "nav.help",      descKey: "nav.helpDesc" },
  { href: "/app/create",     id: "create",       icon: Plus,      labelKey: "nav.create",    descKey: "nav.createDesc" },
  { href: "/app/community",  id: "community",    icon: Users,     labelKey: "nav.community", descKey: "nav.communityDesc" },
  { href: "/app/profile/me", id: "profile",      icon: UserIcon,  labelKey: "nav.profile",   descKey: "nav.profileDesc" },
];

const SECONDARY_TABS: Tab[] = [
  { href: "/app/events",      id: "events",      icon: Calendar,    labelKey: "nav.events",      descKey: "nav.eventsDesc" },
  { href: "/app/leaderboard", id: "leaderboard", icon: TrendingUp,  labelKey: "nav.leaderboard", descKey: "nav.leaderboardDesc" },
];

const MOBILE_TABS: TabId[] = ["home", "help-request", "create", "community", "profile"];

const ALL_TABS = [...PRIMARY_TABS, ...SECONDARY_TABS];

function isTabActive(href: string, location: string) {
  if (href === "/app") return location === "/app" || location === "/app/";
  return location.startsWith(href);
}

function BrandLogo({ small = false }: { small?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3 group tap-none">
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl bg-primary text-primary-foreground shrink-0 transition-transform group-hover:scale-105",
          small ? "w-9 h-9" : "w-11 h-11",
        )}
      >
        <Crown className={cn(small ? "w-4 h-4" : "w-5 h-5")} strokeWidth={2.25} />
      </div>
      <div className="min-w-0 leading-tight">
        <p
          className={cn(
            "font-semibold text-primary tracking-tight truncate",
            small ? "text-[15px]" : "text-[18px]",
          )}
          lang="mr"
          data-testid="nav-brand"
        >
          हिंदवी स्वराज्य
        </p>
        <p
          className={cn(
            "text-foreground/55 font-medium truncate",
            small ? "text-[10.5px]" : "text-[11.5px]",
          )}
          lang="en"
        >
          HindaviSwarajya
        </p>
      </div>
    </Link>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const { data: stats } = useGetStatsSummary({
    query: { queryKey: getGetStatsSummaryQueryKey(), staleTime: 30_000 },
  });

  const NavItem = ({ tab }: { tab: Tab }) => {
    const Icon = tab.icon;
    const isCreate = tab.id === "create";
    const isActive = isTabActive(tab.href, location);
    const showAsAccent = isCreate || isActive;

    return (
      <Link key={tab.id} href={tab.href}>
        <div
          data-testid={`nav-${tab.id}`}
          className={cn(
            "w-full px-3.5 py-3 rounded-2xl transition-all duration-150 text-left cursor-pointer tap-none",
            showAsAccent
              ? "bg-primary text-primary-foreground shadow-[0_4px_12px_-4px_rgba(255,111,0,0.5)]"
              : "text-foreground/75 hover:bg-foreground/5 hover:text-foreground",
          )}
        >
          <div className="flex items-center gap-3">
            <Icon
              className={cn(
                "w-[18px] h-[18px] shrink-0",
                showAsAccent ? "text-primary-foreground" : "text-foreground/55",
              )}
              strokeWidth={showAsAccent ? 2.25 : 1.85}
            />
            <div className="min-w-0">
              <p className={cn(
                "text-[14px] font-semibold leading-tight truncate",
                showAsAccent ? "text-primary-foreground" : "",
              )}>
                {t(tab.labelKey)}
              </p>
              <p className={cn(
                "text-[11px] mt-0.5 leading-tight truncate",
                showAsAccent ? "text-primary-foreground/85" : "text-muted-foreground",
              )}>
                {t(tab.descKey)}
              </p>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <>
      {/* ─── Desktop Sidebar ─── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-72 bg-card border-r border-border/60 z-40">
        {/* Header */}
        <div className="px-5 pt-6 pb-4 shrink-0">
          <BrandLogo />
          <p className="text-[11px] text-foreground/55 italic mt-3 truncate" lang="mr">
            "महाराजांचे स्वप्न, आमचे कर्तव्य"
          </p>
        </div>

        <div className="mx-5 border-t border-border/60" />

        {/* Primary navigation */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {PRIMARY_TABS.map((tab) => <NavItem key={tab.id} tab={tab} />)}

          {/* Secondary nav — Events & Leaderboard */}
          <div className="pt-4 mt-2">
            <p className="px-3.5 text-[10px] uppercase tracking-[0.1em] font-semibold text-foreground/45 mb-1.5">
              {t("nav.more")}
            </p>
            {SECONDARY_TABS.map((tab) => <NavItem key={tab.id} tab={tab} />)}
          </div>
        </div>

        {/* Community Impact — soft blue card */}
        <div className="px-4 pb-3 shrink-0">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[11px] uppercase tracking-[0.08em] font-semibold text-blue-700">
                {t("nav.impact")}
              </span>
            </div>
            <div className="space-y-1.5">
              {[
                { label: t("nav.impactPosts"),  value: stats?.totalPosts },
                { label: t("nav.impactHelped"), value: stats?.totalHelped },
                { label: t("nav.impactSevaks"), value: stats?.totalUsers  },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-baseline justify-between">
                  <span className="text-[12px] text-blue-700/80">{label}</span>
                  <span className="text-[13.5px] font-semibold text-blue-900 tabular-nums">
                    {value?.toLocaleString() ?? "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer: language + Maharaj quote */}
        <div className="px-5 pb-5 shrink-0 border-t border-border/50 pt-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] text-primary font-semibold truncate" lang="mr">
              "स्वराज्य हा माझा जन्मसिद्ध हक्क आहे"
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              {t("nav.dailyInspiration")}
            </p>
          </div>
          <LanguageSwitcher variant="icon" />
        </div>
      </aside>

      {/* ─── Mobile Top Bar ─── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 glass-bar border-b border-border/50 pt-safe">
        <div className="flex items-center justify-between px-4 h-14">
          <BrandLogo small />
          <div className="flex items-center gap-1">
            <LanguageSwitcher variant="icon" />
          </div>
        </div>
      </header>

      {/* ─── Mobile Bottom Nav ─── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-bar border-t border-border/50 pb-safe"
        aria-label="Primary"
      >
        <div className="flex justify-around items-center h-[60px] px-2 max-w-md mx-auto">
          {ALL_TABS.filter((t) => MOBILE_TABS.includes(t.id))
            .sort((a, b) => MOBILE_TABS.indexOf(a.id) - MOBILE_TABS.indexOf(b.id))
            .map((tab) => {
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
