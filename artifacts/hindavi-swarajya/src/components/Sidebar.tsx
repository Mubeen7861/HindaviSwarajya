import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import {
  Home, Plus, HandHeart, Users, User as UserIcon,
  Calendar, TrendingUp, Menu, ChevronRight,
} from "lucide-react";
import {
  useGetStatsSummary, getGetStatsSummaryQueryKey,
} from "@workspace/api-client-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import {
  Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
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

const MOBILE_TABS: TabId[] = ["home", "help-request", "create", "events", "profile"];

const ALL_TABS = [...PRIMARY_TABS, ...SECONDARY_TABS];

function isTabActive(href: string, location: string) {
  if (href === "/app") return location === "/app" || location === "/app/";
  return location.startsWith(href);
}

function BrandLogo({ small = false }: { small?: boolean }) {
  return (
    <Link
      href="/"
      className="flex items-center group tap-none"
      data-testid="nav-brand"
    >
      <Logo
        className={cn(
          "w-auto transition-transform group-hover:scale-105",
          small ? "h-9" : "h-11",
        )}
      />
    </Link>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data: stats } = useGetStatsSummary({
    query: { queryKey: getGetStatsSummaryQueryKey(), staleTime: 30_000 },
  });

  const NavItem = ({ tab }: { tab: Tab }) => {
    const Icon = tab.icon;
    const isCreate = tab.id === "create";
    const isActive = isTabActive(tab.href, location);
    // Three visual modes: solid-orange CTA pill (Share Seva), soft-peach active
    // tint (current page), neutral hover-able row (everything else).
    const variant: "cta" | "active" | "default" = isCreate
      ? "cta"
      : isActive
        ? "active"
        : "default";

    return (
      <Link key={tab.id} href={tab.href}>
        <div
          data-testid={`nav-${tab.id}`}
          className={cn(
            "w-full px-3.5 py-3 rounded-2xl transition-all duration-150 text-left cursor-pointer tap-none",
            variant === "cta" &&
              "bg-gradient-to-r from-primary to-orange-500 text-primary-foreground shadow-[0_6px_18px_-6px_rgba(255,111,0,0.55)] hover:shadow-[0_8px_22px_-6px_rgba(255,111,0,0.65)]",
            variant === "active" && "bg-primary/10 text-primary",
            variant === "default" &&
              "text-foreground/75 hover:bg-foreground/5 hover:text-foreground",
          )}
        >
          <div className="flex items-center gap-3">
            <Icon
              className={cn(
                "w-[18px] h-[18px] shrink-0",
                variant === "cta" && "text-primary-foreground",
                variant === "active" && "text-primary",
                variant === "default" && "text-foreground/55",
              )}
              strokeWidth={variant === "cta" ? 2.5 : variant === "active" ? 2.1 : 1.85}
            />
            <div className="min-w-0">
              <p
                className={cn(
                  "text-[14px] font-semibold leading-tight truncate",
                  variant === "cta" && "text-primary-foreground",
                  variant === "active" && "text-primary",
                )}
              >
                {t(tab.labelKey)}
              </p>
              <p
                className={cn(
                  "text-[11px] mt-0.5 leading-tight truncate",
                  variant === "cta"
                    ? "text-primary-foreground/85"
                    : "text-muted-foreground",
                )}
              >
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
              "हे स्वराज्य व्हावे, ही तर श्रींची इच्छा."
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
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  data-testid="nav-menu-trigger"
                  aria-label={t("nav.more")}
                  className="inline-flex items-center justify-center w-11 h-11 rounded-xl text-foreground/70 hover:bg-foreground/5 active:scale-95 transition tap-none"
                >
                  <Menu className="w-[22px] h-[22px]" strokeWidth={2} />
                </button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[86vw] max-w-sm p-0 flex flex-col"
              >
                {/* Header */}
                <div className="px-5 pt-5 pb-4 border-b border-border/60 shrink-0">
                  <BrandLogo />
                  <SheetTitle className="sr-only">{t("nav.more")}</SheetTitle>
                  <SheetDescription className="sr-only">
                    {t("nav.dailyInspiration")}
                  </SheetDescription>
                  <p
                    className="text-[11px] text-foreground/55 italic mt-3 truncate"
                    lang="mr"
                  >
                    "महाराजांचे स्वप्न, आमचे कर्तव्य"
                  </p>
                </div>

                {/* Scrollable nav */}
                <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                  {PRIMARY_TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = isTabActive(tab.href, location);
                    const isCreate = tab.id === "create";
                    return (
                      <Link
                        key={tab.id}
                        href={tab.href}
                        onClick={() => setSheetOpen(false)}
                      >
                        <div
                          data-testid={`nav-sheet-${tab.id}`}
                          className={cn(
                            "w-full px-3.5 py-3 rounded-2xl flex items-center gap-3 cursor-pointer tap-none transition-colors",
                            isCreate &&
                              "bg-gradient-to-r from-primary to-orange-500 text-primary-foreground",
                            !isCreate && isActive && "bg-primary/10 text-primary",
                            !isCreate && !isActive &&
                              "text-foreground/80 hover:bg-foreground/5",
                          )}
                        >
                          <Icon
                            className={cn(
                              "w-[20px] h-[20px] shrink-0",
                              isCreate
                                ? "text-primary-foreground"
                                : isActive
                                  ? "text-primary"
                                  : "text-foreground/55",
                            )}
                            strokeWidth={isCreate ? 2.5 : isActive ? 2.1 : 1.85}
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                "text-[14.5px] font-semibold leading-tight truncate",
                                isCreate && "text-primary-foreground",
                              )}
                            >
                              {t(tab.labelKey)}
                            </p>
                            <p
                              className={cn(
                                "text-[11px] mt-0.5 leading-tight truncate",
                                isCreate
                                  ? "text-primary-foreground/85"
                                  : "text-muted-foreground",
                              )}
                            >
                              {t(tab.descKey)}
                            </p>
                          </div>
                          {!isCreate && (
                            <ChevronRight className="w-4 h-4 text-foreground/30 shrink-0" />
                          )}
                        </div>
                      </Link>
                    );
                  })}

                  <div className="pt-4 mt-2">
                    <p className="px-3.5 text-[10px] uppercase tracking-[0.1em] font-semibold text-foreground/45 mb-1.5">
                      {t("nav.more")}
                    </p>
                    {SECONDARY_TABS.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = isTabActive(tab.href, location);
                      return (
                        <Link
                          key={tab.id}
                          href={tab.href}
                          onClick={() => setSheetOpen(false)}
                        >
                          <div
                            data-testid={`nav-sheet-${tab.id}`}
                            className={cn(
                              "w-full px-3.5 py-3 rounded-2xl flex items-center gap-3 cursor-pointer tap-none transition-colors",
                              isActive
                                ? "bg-primary/10 text-primary"
                                : "text-foreground/80 hover:bg-foreground/5",
                            )}
                          >
                            <Icon
                              className={cn(
                                "w-[20px] h-[20px] shrink-0",
                                isActive ? "text-primary" : "text-foreground/55",
                              )}
                              strokeWidth={isActive ? 2.1 : 1.85}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-[14.5px] font-semibold leading-tight truncate">
                                {t(tab.labelKey)}
                              </p>
                              <p className="text-[11px] mt-0.5 leading-tight truncate text-muted-foreground">
                                {t(tab.descKey)}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-foreground/30 shrink-0" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  {/* Community Impact */}
                  <div className="pt-4 mt-2 px-1">
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
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-border/60 shrink-0 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p
                      className="text-[11px] text-primary font-semibold truncate"
                      lang="mr"
                    >
                      "हे स्वराज्य व्हावे, ही तर श्रींची इच्छा."
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      {t("nav.dailyInspiration")}
                    </p>
                  </div>
                  <LanguageSwitcher variant="icon" />
                </div>
              </SheetContent>
            </Sheet>
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
