import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BannerCarousel, type Banner } from "@/components/BannerCarousel";
import {
  useListPosts,
  useGetStatsSummary,
  useGetTrendingTags,
  useGetLeaderboard,
  getListPostsQueryKey,
  getGetStatsSummaryQueryKey,
  getGetTrendingTagsQueryKey,
  getGetLeaderboardQueryKey
} from "@workspace/api-client-react";
import { ListPostsCategory, ListPostsSortBy } from "@workspace/api-client-react";
import { PostCard } from "@/components/PostCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search, SlidersHorizontal, Calendar, Users, Heart,
  Target, Flame, ArrowUpRight, Star, Sparkles
} from "lucide-react";
import { Link } from "wouter";
import { useListEvents, getListEventsQueryKey } from "@workspace/api-client-react";
import { useListHelpRequests, getListHelpRequestsQueryKey } from "@workspace/api-client-react";
import { HandHeart, MapPin } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [banners, setBanners] = useState<Banner[]>([]);

  const filtersActive = sortBy !== "recent" || category !== "all";

  useEffect(() => {
    let cancelled = false;
    fetch("/api/banners")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Banner[]) => {
        if (!cancelled && Array.isArray(data)) setBanners(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setTimeout(() => setDebouncedSearch(e.target.value), 400);
  };

  const queryParams = {
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(category !== "all" ? { category: category as ListPostsCategory } : {}),
    ...(sortBy ? { sortBy: sortBy as ListPostsSortBy } : {}),
    limit: 20,
  };

  const { data: posts, isLoading: postsLoading } = useListPosts(queryParams, {
    query: { queryKey: getListPostsQueryKey(queryParams) },
  });
  const { data: stats } = useGetStatsSummary({
    query: { queryKey: getGetStatsSummaryQueryKey() },
  });
  const { data: trendingTags } = useGetTrendingTags({ limit: 8 }, {
    query: { queryKey: getGetTrendingTagsQueryKey({ limit: 8 }) },
  });
  const { data: leaderboard } = useGetLeaderboard({ limit: 5 }, {
    query: { queryKey: getGetLeaderboardQueryKey({ limit: 5 }) },
  });
  const { data: upcomingEventsData } = useListEvents(
    { status: "upcoming" as const, limit: 3 },
    { query: { queryKey: getListEventsQueryKey({ status: "upcoming" as const, limit: 3 }) } }
  );
  const { data: openHelpData } = useListHelpRequests(
    { limit: 3 },
    { query: { queryKey: getListHelpRequestsQueryKey({ limit: 3 }) } }
  );

  return (
    <div className="flex flex-col h-full">
      {/* ── Page header ── */}
      <div className="flex items-end justify-between px-5 sm:px-6 pt-5 pb-4 border-b border-border/50 bg-background">
        <div className="min-w-0">
          <h1 className="text-[22px] sm:text-2xl font-semibold text-foreground leading-tight tracking-tight">
            {t("home.title")}
          </h1>
          <p className="text-[12.5px] text-muted-foreground mt-0.5">{t("home.subtitle")}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.1em]">
            {t("home.totalSeva")}
          </p>
          <p className="text-lg font-semibold text-primary tabular-nums">
            {stats?.totalHelped?.toLocaleString() ?? "—"}
            <span className="text-[11px] font-medium text-muted-foreground ml-1">{t("home.helps")}</span>
          </p>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0">
        {/* ── Center Feed ── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 min-w-0">

          {/* Search + filter row */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.85} />
              <Input
                placeholder={t("home.searchPlaceholder")}
                className="pl-10 bg-foreground/[0.04] border-transparent rounded-full h-10 text-[13.5px] focus-visible:ring-primary/30 focus-visible:bg-background"
                value={search}
                onChange={handleSearchChange}
                data-testid="input-search-feed"
              />
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
              aria-controls="home-filters-panel"
              data-testid="button-toggle-filters"
              className={`relative inline-flex items-center gap-1.5 px-3.5 h-10 rounded-full border text-[12.5px] font-medium transition-colors shrink-0 tap-none ${
                filtersOpen || filtersActive
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/60 bg-background text-foreground/70 hover:bg-foreground/5"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" strokeWidth={1.85} />
              Filters
              {filtersActive && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary ring-2 ring-background" />
              )}
            </button>
          </div>

          {/* Filters panel — collapsible */}
          {filtersOpen && (
            <div
              id="home-filters-panel"
              className="flex gap-2 -mx-1 px-1 overflow-x-auto no-scrollbar animate-in fade-in slide-in-from-top-1 duration-150"
            >
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-auto min-w-[140px] h-9 rounded-full text-[12.5px] border-border/60 bg-background" data-testid="select-sort-by">
                  <SelectValue placeholder={t("common.sortBy")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ListPostsSortBy.recent}>{t("home.sortRecent")}</SelectItem>
                  <SelectItem value={ListPostsSortBy.impact}>{t("home.sortImpact")}</SelectItem>
                  <SelectItem value={ListPostsSortBy.likes}>{t("home.sortLikes")}</SelectItem>
                  <SelectItem value={ListPostsSortBy.comments}>{t("home.sortComments")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-auto min-w-[120px] h-9 rounded-full text-[12.5px] border-border/60 bg-background" data-testid="select-filter-category">
                  <SelectValue placeholder={t("common.category")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("home.catAll")}</SelectItem>
                  <SelectItem value={ListPostsCategory.Food}>Food</SelectItem>
                  <SelectItem value={ListPostsCategory.Education}>Education</SelectItem>
                  <SelectItem value={ListPostsCategory.Health}>Health</SelectItem>
                  <SelectItem value={ListPostsCategory.Shelter}>Shelter</SelectItem>
                  <SelectItem value={ListPostsCategory.Other}>Other</SelectItem>
                </SelectContent>
              </Select>
              {filtersActive && (
                <button
                  type="button"
                  onClick={() => { setSortBy("recent"); setCategory("all"); }}
                  data-testid="button-clear-filters"
                  className="inline-flex items-center px-3 h-9 rounded-full text-[12.5px] font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors shrink-0"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* ── Featured banner carousel — admin-managed ── */}
          <BannerCarousel
            banners={banners}
            fallback={{
              subtitle: t("home.bannerSubtitle"),
              title: t("home.bannerTitle"),
              body: t("home.bannerBody"),
              ctaLabel: t("home.bannerCta"),
              ctaHref: "/app/events",
            }}
          />

          {/* ── Feed ── */}
          {postsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex gap-3 mb-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-16 w-full mb-3" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : posts?.length === 0 ? (
            <EmptyState
              icon={debouncedSearch || category !== "all" ? Target : Sparkles}
              title={
                debouncedSearch || category !== "all"
                  ? "No sevas match your filters"
                  : "Be the first to share a seva"
              }
              description={
                debouncedSearch || category !== "all"
                  ? "Try clearing your search or picking a different category."
                  : "Every act of service inspires the next. Share what you did today and start the chain."
              }
              action={
                <Link href="/app/create">
                  <Button className="bg-[#FF6F00] hover:bg-[#E65100] text-white gap-2 rounded-xl shadow-sm" data-testid="button-empty-share-seva">
                    <Sparkles className="w-4 h-4" />
                    Share a Seva
                  </Button>
                </Link>
              }
              testId="empty-state-feed"
            />
          ) : (
            <div className="space-y-4">
              {posts?.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>

        {/* ── Right Sidebar ── */}
        <div className="hidden lg:flex flex-col w-72 shrink-0 border-l border-gray-100 overflow-y-auto px-4 py-5 space-y-4 bg-gray-50/50">

          {/* Today's Impact */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <h3 className="text-sm font-bold text-gray-800">Today's Impact</h3>
            </div>
            <div className="p-4 space-y-2.5">
              {[
                { label: "New Seva Posts", value: stats?.totalPosts ?? "—", accent: false },
                { label: "People Helped", value: stats?.totalHelped?.toLocaleString() ?? "—", accent: true },
                { label: "Active Sevaks", value: stats?.totalUsers ?? "—", accent: false },
              ].map(({ label, value, accent }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className={`text-sm font-bold ${accent ? "text-primary" : "text-gray-800"}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800">Upcoming Events</h3>
              <span className="text-xs text-primary font-semibold cursor-pointer hover:underline">View All</span>
            </div>
            <div className="p-3 space-y-2.5">
              {!upcomingEventsData ? (
                <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
              ) : upcomingEventsData.length === 0 ? (
                <p className="text-xs text-center text-muted-foreground py-4">No upcoming events yet</p>
              ) : upcomingEventsData.map((ev) => (
                <Link key={ev.id} href="/app/events">
                  <div className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 text-primary shrink-0 mt-0.5">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 leading-tight">{ev.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        <span>{ev.date}</span>
                        <span>·</span>
                        <Users className="w-3 h-3" />
                        <span>{ev.volunteersRegistered?.length ?? 0}/{ev.volunteersNeeded}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Help Needed */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <HandHeart className="w-4 h-4 text-primary" />
                Help Needed
              </h3>
              <Link href="/app/help">
                <span className="text-xs text-primary font-semibold cursor-pointer hover:underline">View All</span>
              </Link>
            </div>
            <div className="p-3 space-y-2.5">
              {!openHelpData ? (
                <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
              ) : openHelpData.length === 0 ? (
                <p className="text-xs text-center text-muted-foreground py-4">No open help requests</p>
              ) : openHelpData.map((hr) => {
                const isEmergency = hr.urgency === "Emergency";
                const isHigh = hr.urgency === "High";
                const tone = isEmergency
                  ? "bg-red-50 text-red-600"
                  : isHigh
                    ? "bg-orange-50 text-primary"
                    : "bg-orange-50 text-primary";
                return (
                  <Link key={hr.id} href="/app/help">
                    <div className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 mt-0.5 ${tone}`}>
                        <HandHeart className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 leading-tight truncate">{hr.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                          {isEmergency || isHigh ? (
                            <span className={`font-semibold ${isEmergency ? "text-red-600" : "text-primary"}`}>
                              {hr.urgency}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate">{hr.location}</span>
                            </span>
                          )}
                          <span>·</span>
                          <Users className="w-3 h-3" />
                          <span>{hr.helpersJoined?.length ?? 0}/{hr.peopleNeeded}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Trending Tags */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-primary" />
                Trending Tags
              </h3>
            </div>
            <div className="p-3">
              {trendingTags ? (
                <div className="flex flex-wrap gap-1.5">
                  {trendingTags.map((t) => (
                    <span
                      key={t.tag}
                      className="text-xs font-medium text-primary bg-orange-50 border border-orange-100 hover:bg-primary hover:text-white transition-colors cursor-pointer px-2.5 py-1 rounded-full"
                    >
                      #{t.tag}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-6 w-20 rounded-full" />)}
                </div>
              )}
            </div>
          </div>

          {/* Top Helpers This Week */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800">Top Helpers This Week</h3>
              <Link href="/app/leaderboard">
                <ArrowUpRight className="w-4 h-4 text-muted-foreground hover:text-primary cursor-pointer" />
              </Link>
            </div>
            <div className="p-3 space-y-2">
              {leaderboard?.slice(0, 5).map((entry, i) => (
                <Link key={entry.user.id} href={`/app/profile/${entry.user.id}`}>
                  <div className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                    <span className={`text-xs font-bold w-5 text-center shrink-0 ${i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-orange-400" : "text-gray-300"}`}>
                      #{i + 1}
                    </span>
                    <Avatar className="w-7 h-7 shrink-0">
                      <AvatarImage src={entry.user.avatar} alt={entry.user.name} />
                      <AvatarFallback className="text-xs">{entry.user.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate text-gray-800">{entry.user.name}</p>
                      <p className="text-[10px] text-muted-foreground">{entry.totalHelped} helped</p>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                      <Heart className="w-3 h-3" />
                      {entry.totalLikes}
                    </div>
                  </div>
                </Link>
              )) ?? [1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2.5 p-1.5">
                  <Skeleton className="w-7 h-7 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-2 w-14" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-[10px] text-gray-300 pb-2">HindaviSwarajya &copy; 2025</p>
        </div>
      </div>
    </div>
  );
}
