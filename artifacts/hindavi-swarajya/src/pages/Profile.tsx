import { useState } from "react";
import { useRoute, Link } from "wouter";
import {
  useGetUser, useGetUserPosts, useToggleFollow,
  useUpdateMe,
  getGetUserQueryKey, getGetUserPostsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUserId, getGetMeQueryKey } from "@/hooks/useCurrentUser";
import { PostCard } from "@/components/PostCard";
import { RankBadge } from "@/components/RankBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin, Users, Heart, ArrowLeft, CalendarDays,
  Edit2, UserPlus, UserCheck, Award, Flame, Star,
  BarChart3, CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const RANK_ORDER = ["Sevak", "Karyakarta", "Nayak", "Veer", "Sardar"];
const RANK_THRESHOLD = [0, 50, 200, 500, 1000];
const RANK_COLORS: Record<string, { bg: string; text: string; border: string; ring: string }> = {
  Sevak:      { bg: "bg-gray-100",   text: "text-gray-700",   border: "border-gray-300",  ring: "ring-gray-300" },
  Karyakarta: { bg: "bg-blue-100",   text: "text-blue-700",   border: "border-blue-300",  ring: "ring-blue-400" },
  Nayak:      { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-300",ring: "ring-purple-400" },
  Veer:       { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300",ring: "ring-orange-400" },
  Sardar:     { bg: "bg-red-100",    text: "text-red-700",    border: "border-red-300",   ring: "ring-red-500" },
};

const CATEGORY_ICONS: Record<string, string> = {
  Food: "🍛", Education: "📚", Health: "❤️", Shelter: "🏠",
  Environment: "🌱", Culture: "🎭", Emergency: "🚨", Other: "🤝",
};

const CATEGORY_COLORS: Record<string, string> = {
  Food: "bg-green-50 text-green-700 border-green-100",
  Education: "bg-blue-50 text-blue-700 border-blue-100",
  Health: "bg-red-50 text-red-700 border-red-100",
  Shelter: "bg-purple-50 text-purple-700 border-purple-100",
  Environment: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Culture: "bg-yellow-50 text-yellow-700 border-yellow-100",
  Emergency: "bg-orange-50 text-orange-700 border-orange-100",
  Other: "bg-gray-50 text-gray-700 border-gray-100",
};

export default function Profile() {
  const [, params] = useRoute("/app/profile/:id");
  const currentUserId = useCurrentUserId();
  const rawId = params?.id ?? "";
  const isMeRoute = rawId === "me";
  const profileId = isMeRoute ? (currentUserId ?? 0) : parseInt(rawId || "0", 10);
  const isOwn = profileId !== 0 && profileId === currentUserId;

  const qc = useQueryClient();
  const { toast } = useToast();

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [following, setFollowing] = useState<boolean | null>(null);

  const { data: user, isLoading: userLoading } = useGetUser(profileId, {
    query: {
      enabled: !!profileId,
      queryKey: getGetUserQueryKey(profileId),
    },
  });

  const { data: posts, isLoading: postsLoading } = useGetUserPosts(profileId, {
    query: {
      enabled: !!profileId,
      queryKey: getGetUserPostsQueryKey(profileId),
    },
  });

  const toggleFollow = useToggleFollow({
    mutation: {
      onSuccess: (data) => {
        setFollowing(data.following);
        qc.invalidateQueries({ queryKey: getGetUserQueryKey(profileId) });
      },
    },
  });

  const updateMe = useUpdateMe({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetUserQueryKey(profileId) });
        qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setEditOpen(false);
        toast({ title: "Profile updated" });
      },
      onError: () => toast({ title: "Update failed", variant: "destructive" }),
    },
  });

  const handleFollow = () => {
    if (currentUserId === undefined) {
      toast({ title: "Please sign in to follow", variant: "destructive" });
      return;
    }
    toggleFollow.mutate({ id: profileId });
  };

  const openEdit = () => {
    if (!user) return;
    setEditName(user.name);
    setEditBio(user.bio ?? "");
    setEditLocation(user.location ?? "");
    setEditOpen(true);
  };

  const saveProfile = () => {
    updateMe.mutate({ data: { name: editName, bio: editBio, location: editLocation } });
  };

  // Compute impact breakdown from posts
  const impactByCategory = posts?.reduce<Record<string, { count: number; helped: number }>>((acc, post) => {
    const cat = post.category ?? "Other";
    if (!acc[cat]) acc[cat] = { count: 0, helped: 0 };
    acc[cat].count++;
    acc[cat].helped += post.helpedPeople ?? 0;
    return acc;
  }, {}) ?? {};

  const sortedCategories = Object.entries(impactByCategory)
    .sort((a, b) => b[1].helped - a[1].helped);

  const maxHelped = sortedCategories[0]?.[1].helped ?? 1;

  // Rank progress
  const rankIdx = RANK_ORDER.indexOf(user?.rank ?? "Sevak");
  const nextRank = RANK_ORDER[rankIdx + 1];
  const currentThreshold = RANK_THRESHOLD[rankIdx] ?? 0;
  const nextThreshold = RANK_THRESHOLD[rankIdx + 1] ?? null;
  const progress = nextThreshold
    ? Math.min(((user?.totalHelped ?? 0) - currentThreshold) / (nextThreshold - currentThreshold) * 100, 100)
    : 100;

  const rankStyle = RANK_COLORS[user?.rank ?? "Sevak"] ?? RANK_COLORS.Sevak;
  const isFollowing = following !== null ? following : false;

  if (isMeRoute && currentUserId === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <Skeleton className="h-32 w-72 rounded-2xl" />
      </div>
    );
  }

  if (userLoading) {
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="h-36 bg-gradient-to-r from-orange-200 to-amber-200 shrink-0" />
        <div className="px-6 -mt-12 mb-6">
          <Skeleton className="w-24 h-24 rounded-full border-4 border-white mb-4" />
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32 mb-6" />
          <div className="flex gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 flex-1 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700 mb-2">User not found</p>
          <Link href="/app">
            <Button variant="outline">Back to Feed</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ── Banner ── */}
      <div className="relative h-36 shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF6F00] via-orange-500 to-amber-400">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/moroccan-flower.png')]" />
        </div>
        <div className="absolute top-3 left-3">
          <Link href="/app">
            <button className="w-8 h-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg flex items-center justify-center text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>

      {/* ── Profile header ── */}
      <div className="px-5 pb-0 bg-white border-b border-gray-100">
        <div className="flex items-end justify-between -mt-12 mb-3">
          {/* Avatar */}
          <div className={`relative ring-4 ${rankStyle.ring} ring-offset-2 rounded-full`}>
            <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-2xl bg-orange-50 text-[#FF6F00] font-bold">
                {user.name.substring(0, 2)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mb-1">
            {isOwn ? (
              <Button variant="outline" size="sm" onClick={openEdit} className="gap-1.5 h-9 rounded-xl text-sm">
                <Edit2 className="w-3.5 h-3.5" />
                Edit Profile
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleFollow}
                disabled={toggleFollow.isPending || currentUserId === undefined}
                className={`gap-1.5 h-9 rounded-xl text-sm transition-all ${
                  isFollowing
                    ? "bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 border border-gray-200"
                    : "bg-[#FF6F00] hover:bg-orange-600 text-white shadow-md shadow-orange-200"
                }`}
              >
                {isFollowing
                  ? <><UserCheck className="w-3.5 h-3.5" />Following</>
                  : <><UserPlus className="w-3.5 h-3.5" />Follow</>
                }
              </Button>
            )}
          </div>
        </div>

        {/* Name + rank + meta */}
        <div className="mb-4">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-xl font-bold text-gray-900" data-testid={`profile-name-${user.id}`}>{user.name}</h1>
            <RankBadge rank={user.rank} />
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
            {user.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />{user.location}
              </span>
            )}
            {user.joinedAt && (
              <span className="flex items-center gap-1">
                <CalendarDays className="w-3 h-3" />Joined {format(new Date(user.joinedAt), "MMMM yyyy")}
              </span>
            )}
          </div>
          {user.bio && (
            <p className="text-sm text-gray-700 mt-2 leading-relaxed">{user.bio}</p>
          )}
          {!user.bio && isOwn && (
            <button onClick={openEdit} className="text-xs text-[#FF6F00] hover:underline mt-2">
              + Add a bio
            </button>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 pb-4">
          {[
            { label: "Sevas", value: user.postsCount, icon: Flame, color: "text-orange-500" },
            { label: "Helped", value: user.totalHelped, icon: Heart, color: "text-emerald-500" },
            { label: "Followers", value: user.followersCount, icon: Users, color: "text-blue-500" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-gray-50 rounded-2xl p-3 text-center border border-gray-100">
              <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
              <p className="text-lg font-bold text-gray-900">{value.toLocaleString()}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex-1">
        <Tabs defaultValue="posts" className="flex flex-col h-full">
          <TabsList className="mx-5 mt-4 grid grid-cols-3 bg-gray-100 rounded-xl h-9 shrink-0">
            <TabsTrigger value="posts" className="text-xs rounded-lg">Seva Posts</TabsTrigger>
            <TabsTrigger value="impact" className="text-xs rounded-lg">Impact</TabsTrigger>
            <TabsTrigger value="journey" className="text-xs rounded-lg">Journey</TabsTrigger>
          </TabsList>

          {/* ── Seva Posts ── */}
          <TabsContent value="posts" className="px-5 py-4 mt-0 space-y-3">
            {postsLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
              </div>
            ) : !posts?.length ? (
              <div className="text-center py-16">
                <Flame className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-600 mb-1">No sevas yet</p>
                <p className="text-xs text-gray-400 mb-4">
                  {isOwn ? "Share your first act of service." : `${user.name} hasn't posted yet.`}
                </p>
                {isOwn && (
                  <Link href="/app/create">
                    <Button size="sm" className="bg-[#FF6F00] hover:bg-orange-600 text-white rounded-xl text-xs">
                      Share a Seva
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              posts.map((post, i) => (
                <motion.div key={post.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <PostCard post={post} />
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* ── Impact ── */}
          <TabsContent value="impact" className="px-5 py-4 mt-0">
            {postsLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
            ) : sortedCategories.length === 0 ? (
              <div className="text-center py-16">
                <BarChart3 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No impact data yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Total banner */}
                <div className="bg-gradient-to-r from-[#FF6F00] to-orange-500 rounded-2xl p-4 text-white">
                  <p className="text-xs font-semibold opacity-80 mb-1">Total People Helped</p>
                  <p className="text-3xl font-bold">{user.totalHelped.toLocaleString()}</p>
                  <p className="text-xs opacity-70 mt-0.5">across {posts?.length ?? 0} seva posts</p>
                </div>

                {/* Category breakdown */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">By Category</p>
                  {sortedCategories.map(([cat, { count, helped }], i) => (
                    <motion.div
                      key={cat}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className={`rounded-2xl border p-4 ${CATEGORY_COLORS[cat] ?? "bg-gray-50 text-gray-700 border-gray-100"}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{CATEGORY_ICONS[cat] ?? "🤝"}</span>
                          <span className="font-semibold text-sm">{cat}</span>
                        </div>
                        <span className="text-xs font-medium opacity-70">{count} post{count !== 1 ? "s" : ""}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-white/50 rounded-full h-2 overflow-hidden">
                          <motion.div
                            className="h-full bg-current opacity-60 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${(helped / maxHelped) * 100}%` }}
                            transition={{ duration: 0.6, delay: i * 0.06 }}
                          />
                        </div>
                        <span className="text-sm font-bold shrink-0">{helped} helped</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── Journey / Rank ── */}
          <TabsContent value="journey" className="px-5 py-4 mt-0 space-y-4">
            {/* Current rank card */}
            <div className={`rounded-2xl border p-5 ${rankStyle.bg} ${rankStyle.border}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${rankStyle.bg}`}>
                  <Award className={`w-6 h-6 ${rankStyle.text}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold opacity-60">Current Rank</p>
                  <p className={`text-xl font-bold ${rankStyle.text}`}>{user.rank}</p>
                </div>
              </div>
              {nextRank ? (
                <>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="opacity-60">Progress to {nextRank}</span>
                    <span className="font-semibold">{user.totalHelped} / {nextThreshold}</span>
                  </div>
                  <div className="h-2.5 bg-white/50 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${rankStyle.text.replace("text-", "bg-")}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                  <p className="text-xs opacity-60 mt-2">
                    {Math.max(0, (nextThreshold ?? 0) - user.totalHelped)} more people to help to reach {nextRank}
                  </p>
                </>
              ) : (
                <div className="flex items-center gap-2 mt-2">
                  <Star className={`w-4 h-4 ${rankStyle.text}`} />
                  <p className={`text-sm font-semibold ${rankStyle.text}`}>Highest rank achieved!</p>
                </div>
              )}
            </div>

            {/* Rank ladder */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rank Ladder</p>
              {RANK_ORDER.map((rank, i) => {
                const achieved = RANK_ORDER.indexOf(user.rank) >= i;
                const isCurrent = user.rank === rank;
                const r = RANK_COLORS[rank] ?? RANK_COLORS.Sevak;
                return (
                  <div
                    key={rank}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isCurrent
                        ? `${r.bg} ${r.border} shadow-sm`
                        : achieved
                          ? "bg-gray-50 border-gray-100"
                          : "bg-white border-gray-100 opacity-40"
                    }`}
                  >
                    {achieved
                      ? <CheckCircle2 className={`w-5 h-5 ${isCurrent ? r.text : "text-gray-400"} shrink-0`} />
                      : <div className="w-5 h-5 rounded-full border-2 border-gray-200 shrink-0" />
                    }
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${isCurrent ? r.text : "text-gray-700"}`}>{rank}</p>
                      <p className="text-xs text-gray-400">{RANK_THRESHOLD[i].toLocaleString()}+ people helped</p>
                    </div>
                    {isCurrent && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${r.bg} ${r.text}`}>You are here</span>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Edit Profile Dialog ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Name</Label>
              <Input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="rounded-xl h-10 bg-gray-50 border-gray-200"
                placeholder="Your name"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Location</Label>
              <Input
                value={editLocation}
                onChange={e => setEditLocation(e.target.value)}
                className="rounded-xl h-10 bg-gray-50 border-gray-200"
                placeholder="City, State"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Bio</Label>
              <Textarea
                value={editBio}
                onChange={e => setEditBio(e.target.value)}
                className="rounded-xl bg-gray-50 border-gray-200 resize-none text-sm"
                placeholder="Tell the community about your seva mission…"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)} className="rounded-xl">Cancel</Button>
            <Button
              onClick={saveProfile}
              disabled={updateMe.isPending || !editName.trim()}
              className="rounded-xl bg-[#FF6F00] hover:bg-orange-600 text-white"
            >
              {updateMe.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
