import { useState } from "react";
import { Link } from "wouter";
import {
  useListPosts, useGetLeaderboard, useListUsers,
  getListPostsQueryKey, getGetLeaderboardQueryKey, getListUsersQueryKey,
} from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { RankBadge } from "@/components/RankBadge";
import {
  ArrowLeft, Search, MessageCircle, Users,
  Heart, Trophy, Crown, Award, Medal, MapPin, Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { EmptyState } from "@/components/EmptyState";

const categoryColors: Record<string, string> = {
  Food: "bg-green-100 text-green-700",
  Education: "bg-blue-100 text-blue-700",
  Health: "bg-red-100 text-red-700",
  Shelter: "bg-purple-100 text-purple-700",
  Other: "bg-gray-100 text-gray-700",
};

export default function Community() {
  const [search, setSearch] = useState("");

  const { data: posts, isLoading: postsLoading } = useListPosts(
    { limit: 50, sortBy: "likes" as const },
    { query: { queryKey: getListPostsQueryKey({ limit: 50, sortBy: "likes" as const }) } }
  );

  const { data: members, isLoading: membersLoading } = useListUsers(
    { limit: 50 },
    { query: { queryKey: getListUsersQueryKey({ limit: 50 }) } }
  );

  const { data: leaderboard } = useGetLeaderboard(
    { limit: 10 },
    { query: { queryKey: getGetLeaderboardQueryKey({ limit: 10 }) } }
  );

  const filteredPosts = posts?.filter((p) =>
    !search ||
    p.content.toLowerCase().includes(search.toLowerCase()) ||
    p.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  ) ?? [];

  const filteredMembers = members?.filter((m) =>
    !search ||
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.location.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <Link href="/app">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-primary font-serif leading-tight">Community</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Discussions, members & connections</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 py-3 border-b border-gray-100 bg-white">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search posts, members, tags..."
            className="pl-9 h-9 bg-gray-50 border-gray-200 rounded-xl text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="discussions" className="flex flex-col h-full">
          <TabsList className="mx-6 mt-3 mb-0 grid grid-cols-3 bg-gray-100 rounded-xl h-9">
            <TabsTrigger value="discussions" className="text-xs rounded-lg">Discussions</TabsTrigger>
            <TabsTrigger value="members" className="text-xs rounded-lg">Members</TabsTrigger>
            <TabsTrigger value="leaderboard" className="text-xs rounded-lg">Top Sevaks</TabsTrigger>
          </TabsList>

          {/* ── Discussions (real posts) ── */}
          <TabsContent value="discussions" className="flex-1 overflow-y-auto px-6 py-4 space-y-3 mt-0">
            {postsLoading ? (
              <div className="space-y-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex gap-3 mb-3"><Skeleton className="w-9 h-9 rounded-full" /><div className="space-y-2 flex-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div></div>
                    <Skeleton className="h-12 w-full mb-2" /><Skeleton className="h-3 w-2/3" />
                  </div>
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <EmptyState
                icon={MessageCircle}
                title={search ? "No discussions match your search" : "Start the first conversation"}
                description={
                  search
                    ? "Try a different keyword or clear your search."
                    : "Share what your seva looked like today — even a small act can spark a movement."
                }
                action={
                  <Link href="/app/create">
                    <Button className="bg-[#FF6F00] hover:bg-[#E65100] text-white gap-2 rounded-xl shadow-sm" data-testid="button-empty-community-share">
                      <Sparkles className="w-4 h-4" />
                      Share a Seva
                    </Button>
                  </Link>
                }
                testId="empty-state-community-discussions"
              />
            ) : filteredPosts.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Link href={`/app/post/${p.id}`}>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer">
                    <div className="flex items-start gap-3 mb-2">
                      <Avatar className="w-9 h-9 shrink-0">
                        <AvatarImage src={p.user?.avatar} />
                        <AvatarFallback className="text-xs">{(p.user?.name ?? "U").substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-sm font-semibold text-gray-900">{p.user?.name ?? "Unknown"}</span>
                          {p.user?.rank && <RankBadge rank={p.user.rank} />}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[p.category] ?? "bg-gray-100 text-gray-700"}`}>{p.category}</span>
                          <span className="text-xs text-gray-400">
                            {p.timestamp ? formatDistanceToNow(new Date(p.timestamp), { addSuffix: true }) : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-800 line-clamp-3 mb-3">{p.content}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{p.comments?.length ?? 0}</span>
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{p.likes}</span>
                        {p.helpedPeople > 0 && (
                          <span className="flex items-center gap-1 text-green-600 font-medium">
                            <Users className="w-3 h-3" />{p.helpedPeople} helped
                          </span>
                        )}
                      </div>
                      {p.tags && p.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {p.tags.slice(0, 2).map((t) => (
                            <span key={t} className="text-xs bg-orange-50 text-[#FF6F00] px-2 py-0.5 rounded-full">#{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </TabsContent>

          {/* ── Members (real users) ── */}
          <TabsContent value="members" className="flex-1 overflow-y-auto px-6 py-4 mt-0">
            {membersLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
              </div>
            ) : filteredMembers.length === 0 ? (
              <EmptyState
                icon={Users}
                title={search ? "No members match your search" : "Your sevak community is just getting started"}
                description={
                  search
                    ? "Try searching by a different name or location."
                    : "Invite friends and family to join — every new sevak grows our impact."
                }
                action={
                  <Link href="/app/create">
                    <Button className="bg-[#FF6F00] hover:bg-[#E65100] text-white gap-2 rounded-xl shadow-sm" data-testid="button-empty-community-members">
                      <Sparkles className="w-4 h-4" />
                      Share a Seva to inspire others
                    </Button>
                  </Link>
                }
                testId="empty-state-community-members"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredMembers.map((m, i) => (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <Link href={`/app/profile/${m.id}`}>
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-11 h-11 shrink-0">
                            <AvatarImage src={m.avatar} />
                            <AvatarFallback>{m.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{m.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <RankBadge rank={m.rank} />
                              <span className="flex items-center gap-0.5 text-xs text-gray-400">
                                <MapPin className="w-2.5 h-2.5" />{m.location}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                          <div className="text-center">
                            <p className="text-sm font-bold text-[#FF6F00]">{m.totalHelped}</p>
                            <p className="text-[10px] text-gray-400">helped</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold text-gray-800">{m.postsCount}</p>
                            <p className="text-[10px] text-gray-400">posts</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold text-gray-800">{m.followersCount}</p>
                            <p className="text-[10px] text-gray-400">followers</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Leaderboard ── */}
          <TabsContent value="leaderboard" className="flex-1 overflow-y-auto px-6 py-4 mt-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-yellow-50 border-b border-orange-100 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-bold text-gray-800">Top Sevaks Leaderboard</span>
              </div>
              {!leaderboard ? (
                <div className="p-4 space-y-3">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="flex gap-3 items-center">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div>
                    </div>
                  ))}
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={Trophy}
                    title="No top sevaks yet"
                    description="Be the first to share a seva and claim the #1 spot."
                    compact
                    action={
                      <Link href="/app/create">
                        <Button className="bg-[#FF6F00] hover:bg-[#E65100] text-white gap-2 rounded-xl shadow-sm" data-testid="button-empty-community-leaderboard">
                          <Sparkles className="w-4 h-4" />
                          Share your first Seva
                        </Button>
                      </Link>
                    }
                    testId="empty-state-community-leaderboard"
                  />
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {leaderboard.map((entry, i) => (
                    <Link key={entry.user.id} href={`/app/profile/${entry.user.id}`}>
                      <div className={`flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors cursor-pointer ${i < 3 ? "bg-orange-50/30" : ""}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? "bg-yellow-100 text-yellow-700" : i === 1 ? "bg-gray-200 text-gray-700" : i === 2 ? "bg-orange-100 text-orange-700" : "text-gray-400"}`}>
                          {i === 0 ? <Crown className="w-4 h-4" /> : i === 1 ? <Medal className="w-4 h-4" /> : i === 2 ? <Award className="w-4 h-4" /> : `#${entry.rank}`}
                        </div>
                        <Avatar className={`w-10 h-10 border-2 ${i === 0 ? "border-yellow-400" : i === 1 ? "border-gray-300" : i === 2 ? "border-orange-300" : "border-transparent"}`}>
                          <AvatarImage src={entry.user.avatar} />
                          <AvatarFallback>{entry.user.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">{entry.user.name}</p>
                          <div className="flex items-center gap-2">
                            <RankBadge rank={entry.user.rank} />
                            <span className="text-xs text-gray-400">{entry.user.location}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-[#FF6F00]">{entry.totalHelped}</p>
                          <p className="text-xs text-gray-400">helped</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
