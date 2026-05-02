import { useState } from "react";
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
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");

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

  return (
    <div className="flex flex-col h-full">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100 bg-white">
        <div>
          <h1 className="text-2xl font-bold text-primary font-serif leading-tight">Seva Feed</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Latest community service activities</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Seva</p>
          <p className="text-xl font-bold text-primary">{stats?.totalHelped?.toLocaleString() ?? "—"} <span className="text-sm font-semibold text-muted-foreground">helps</span></p>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0">
        {/* ── Center Feed ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 min-w-0">

          {/* Search + filter row */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search seva posts, users, tags..."
                className="pl-10 bg-gray-50 border-gray-200 rounded-xl h-10 text-sm focus-visible:ring-primary/30"
                value={search}
                onChange={handleSearchChange}
                data-testid="input-search-feed"
              />
            </div>
            <button className="flex items-center gap-2 px-3.5 h-10 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shrink-0">
              <SlidersHorizontal className="w-4 h-4" />
              Advanced
            </button>
          </div>

          {/* Sort row */}
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px] h-9 rounded-lg text-sm bg-white border-gray-200" data-testid="select-sort-by">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ListPostsSortBy.recent}>Most Recent</SelectItem>
                <SelectItem value={ListPostsSortBy.impact}>Highest Impact</SelectItem>
                <SelectItem value={ListPostsSortBy.likes}>Most Liked</SelectItem>
                <SelectItem value={ListPostsSortBy.comments}>Most Discussed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[120px] h-9 rounded-lg text-sm bg-white border-gray-200" data-testid="select-filter-category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value={ListPostsCategory.Food}>Food</SelectItem>
                <SelectItem value={ListPostsCategory.Education}>Education</SelectItem>
                <SelectItem value={ListPostsCategory.Health}>Health</SelectItem>
                <SelectItem value={ListPostsCategory.Shelter}>Shelter</SelectItem>
                <SelectItem value={ListPostsCategory.Other}>Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ── Featured banner ── */}
          <div className="rounded-2xl bg-gradient-to-br from-primary to-orange-500 p-5 relative overflow-hidden shadow-[0_4px_20px_rgba(255,111,0,0.25)]">
            <div className="absolute right-4 top-3 opacity-10">
              <Flame className="w-24 h-24 text-white" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <div className="bg-white/20 rounded-lg p-1.5">
                  <Star className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base leading-tight">Organize a Seva Event</h3>
                  <p className="text-orange-100 text-xs">Create impact at scale</p>
                </div>
              </div>
              <p className="text-white/90 text-sm mt-2 mb-4 leading-relaxed max-w-md">
                Plan seminars, cleaning drives, food distribution, medical camps, and more. Bring your community together for greater impact!
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {["Schedule Events", "Recruit Volunteers", "Track Impact"].map((label) => (
                  <span key={label} className="flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer transition-colors border border-white/20">
                    <Calendar className="w-3 h-3" />
                    {label}
                  </span>
                ))}
              </div>
              <Link href="/app/events">
                <button className="w-full flex items-center justify-center gap-2 bg-white text-primary font-semibold text-sm py-2.5 rounded-xl hover:bg-orange-50 transition-colors">
                  <Calendar className="w-4 h-4" />
                  Create Event
                </button>
              </Link>
            </div>
          </div>

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
