import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRoute, Link, useLocation } from "wouter";
import {
  useGetUser, useGetUserPosts, useToggleFollow,
  useUpdateMe,
  useListMyPosts, useListMyEvents, useListMyHelpRequests,
  useUpdatePost, useDeletePost,
  useUpdateEvent, useDeleteEvent,
  useUpdateHelpRequest, useDeleteHelpRequest,
  getGetUserQueryKey, getGetUserPostsQueryKey,
  getListMyPostsQueryKey, getListMyEventsQueryKey, getListMyHelpRequestsQueryKey,
  getListPostsQueryKey, getGetPostQueryKey,
  getListEventsQueryKey, getGetEventQueryKey,
  getListHelpRequestsQueryKey, getGetHelpRequestQueryKey,
  type SevaPost, type SevaEvent, type HelpRequest as HelpReq,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useClerk } from "@clerk/react";
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin, Users, Heart, ArrowLeft, CalendarDays,
  Edit2, UserPlus, UserCheck, Award, Flame, Star,
  BarChart3, CheckCircle2, Sparkles, LogOut,
  Pencil, Trash2, Clock, XCircle, AlertCircle, Calendar as CalIcon,
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import {
  SWARAJYA_RANKS, CHHAVA_RANK, getRankDef, getRankProgress, mudraFromHelped,
} from "@/lib/ranks";

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

const SEVA_CATS = ["Food", "Education", "Health", "Shelter", "Other"] as const;
const URGENCIES = ["Low", "Medium", "High", "Emergency"] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Status badge — shared across post/event/help cards
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status?: string | null }) {
  const s = status ?? "pending";
  if (s === "approved") {
    return (
      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 gap-1 font-medium">
        <CheckCircle2 className="w-3 h-3" /> Approved
      </Badge>
    );
  }
  if (s === "rejected") {
    return (
      <Badge className="bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-50 gap-1 font-medium">
        <XCircle className="w-3 h-3" /> Rejected
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50 gap-1 font-medium">
      <Clock className="w-3 h-3" /> Pending review
    </Badge>
  );
}

export default function Profile() {
  const { t } = useTranslation();
  const [, params] = useRoute("/app/profile/:id");
  const [, navigate] = useLocation();
  const currentUserId = useCurrentUserId();
  const rawId = params?.id ?? "";
  const isMeRoute = rawId === "me";
  const profileId = isMeRoute ? (currentUserId ?? 0) : parseInt(rawId || "0", 10);
  const isOwn = profileId !== 0 && profileId === currentUserId;

  const qc = useQueryClient();
  const { toast } = useToast();
  const { signOut } = useClerk();

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [following, setFollowing] = useState<boolean | null>(null);

  // Edit/delete dialogs for own content
  const [editingPost, setEditingPost] = useState<SevaPost | null>(null);
  const [editingEvent, setEditingEvent] = useState<SevaEvent | null>(null);
  const [editingHelp, setEditingHelp] = useState<HelpReq | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<
    | { kind: "post"; id: number; label: string }
    | { kind: "event"; id: number; label: string }
    | { kind: "help"; id: number; label: string }
    | null
  >(null);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const { data: user, isLoading: userLoading } = useGetUser(profileId, {
    query: { enabled: !!profileId, queryKey: getGetUserQueryKey(profileId) },
  });

  // Public list (used when viewing somebody else's profile or for the Impact tab)
  const { data: publicPosts, isLoading: postsLoading } = useGetUserPosts(profileId, {
    query: { enabled: !!profileId, queryKey: getGetUserPostsQueryKey(profileId) },
  });

  // Own content (any approval status) — only fetched when viewing own profile
  const { data: myPosts, isLoading: myPostsLoading } = useListMyPosts({
    query: { enabled: isOwn, queryKey: getListMyPostsQueryKey() },
  });
  const { data: myEvents, isLoading: myEventsLoading } = useListMyEvents({
    query: { enabled: isOwn, queryKey: getListMyEventsQueryKey() },
  });
  const { data: myHelp, isLoading: myHelpLoading } = useListMyHelpRequests({
    query: { enabled: isOwn, queryKey: getListMyHelpRequestsQueryKey() },
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

  // ── Mutations for own content ────────────────────────────────────────────
  // Invalidate everything that could surface the edited/deleted item, so other
  // tabs (Feed, Events, Help) reflect the change immediately. Calling each
  // list-key helper without arguments yields a prefix that React Query uses to
  // match any parameterised variant.
  const invalidateMine = (target?: "post" | "event" | "help", id?: number) => {
    qc.invalidateQueries({ queryKey: getListMyPostsQueryKey() });
    qc.invalidateQueries({ queryKey: getListMyEventsQueryKey() });
    qc.invalidateQueries({ queryKey: getListMyHelpRequestsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetUserQueryKey(profileId) });
    qc.invalidateQueries({ queryKey: getGetUserPostsQueryKey(profileId) });
    qc.invalidateQueries({ queryKey: getListPostsQueryKey() });
    qc.invalidateQueries({ queryKey: getListEventsQueryKey() });
    qc.invalidateQueries({ queryKey: getListHelpRequestsQueryKey() });
    if (target === "post" && id) qc.invalidateQueries({ queryKey: getGetPostQueryKey(id) });
    if (target === "event" && id) qc.invalidateQueries({ queryKey: getGetEventQueryKey(id) });
    if (target === "help" && id) qc.invalidateQueries({ queryKey: getGetHelpRequestQueryKey(id) });
  };

  const updatePost = useUpdatePost({
    mutation: {
      onSuccess: (_d, vars) => { invalidateMine("post", vars.id); setEditingPost(null); toast({ title: "Seva updated" }); },
      onError: () => toast({ title: "Update failed", variant: "destructive" }),
    },
  });
  const deletePost = useDeletePost({
    mutation: {
      onSuccess: (_d, vars) => { invalidateMine("post", vars.id); setDeleteTarget(null); toast({ title: "Seva deleted" }); },
      onError: () => toast({ title: "Delete failed", variant: "destructive" }),
    },
  });
  const updateEvent = useUpdateEvent({
    mutation: {
      onSuccess: (_d, vars) => { invalidateMine("event", vars.id); setEditingEvent(null); toast({ title: "Event updated" }); },
      onError: () => toast({ title: "Update failed", variant: "destructive" }),
    },
  });
  const deleteEvent = useDeleteEvent({
    mutation: {
      onSuccess: (_d, vars) => { invalidateMine("event", vars.id); setDeleteTarget(null); toast({ title: "Event deleted" }); },
      onError: () => toast({ title: "Delete failed", variant: "destructive" }),
    },
  });
  const updateHelp = useUpdateHelpRequest({
    mutation: {
      onSuccess: (_d, vars) => { invalidateMine("help", vars.id); setEditingHelp(null); toast({ title: "Help request updated" }); },
      onError: () => toast({ title: "Update failed", variant: "destructive" }),
    },
  });
  const deleteHelp = useDeleteHelpRequest({
    mutation: {
      onSuccess: (_d, vars) => { invalidateMine("help", vars.id); setDeleteTarget(null); toast({ title: "Help request deleted" }); },
      onError: () => toast({ title: "Delete failed", variant: "destructive" }),
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

  const handleLogout = async () => {
    try {
      qc.clear();
      await signOut({ redirectUrl: `${import.meta.env.BASE_URL}` });
      setLogoutOpen(false);
      navigate("/");
    } catch (err) {
      // Keep the user on the page if Clerk sign-out fails so they can retry,
      // and surface the failure clearly instead of silently redirecting.
      toast({ title: "Sign out failed", variant: "destructive" });
      // eslint-disable-next-line no-console
      console.error(err);
      setLogoutOpen(false);
    }
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === "post") deletePost.mutate({ id: deleteTarget.id });
    if (deleteTarget.kind === "event") deleteEvent.mutate({ id: deleteTarget.id });
    if (deleteTarget.kind === "help") deleteHelp.mutate({ id: deleteTarget.id });
  };

  // Use approved-only posts for the Impact chart so counts match the public profile.
  const impactSourcePosts = isOwn
    ? (myPosts?.filter((p) => p.approvalStatus === "approved") ?? [])
    : (publicPosts ?? []);

  const impactByCategory = impactSourcePosts.reduce<Record<string, { count: number; helped: number }>>((acc, post) => {
    const cat = post.category ?? "Other";
    if (!acc[cat]) acc[cat] = { count: 0, helped: 0 };
    acc[cat].count++;
    acc[cat].helped += post.helpedPeople ?? 0;
    return acc;
  }, {});

  const sortedCategories = Object.entries(impactByCategory).sort((a, b) => b[1].helped - a[1].helped);
  const maxHelped = sortedCategories[0]?.[1].helped ?? 1;

  // Rank progress (Mudra-based: 1 help = 10 Mudra)
  const rankProgress = getRankProgress(user?.totalHelped ?? 0);
  const rankStyle = user?.chhava ? CHHAVA_RANK : rankProgress.current;
  const totalMudra = mudraFromHelped(user?.totalHelped ?? 0);
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

  const ownTabs = isOwn;

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
              <>
                <Button variant="outline" size="sm" onClick={openEdit} className="gap-1.5 h-9 rounded-xl text-sm" data-testid="button-edit-profile">
                  <Edit2 className="w-3.5 h-3.5" />
                  {t("profile.editProfile")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLogoutOpen(true)}
                  className="gap-1.5 h-9 rounded-xl text-sm border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  data-testid="button-logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {t("profile.logout")}
                </Button>
              </>
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
        <div className="grid grid-cols-4 gap-2 pb-4">
          {[
            { label: "Mudra",     value: totalMudra,         icon: Sparkles, color: "text-amber-500" },
            { label: "Helped",    value: user.totalHelped,    icon: Heart,    color: "text-emerald-500" },
            { label: "Sevas",     value: user.postsCount,     icon: Flame,    color: "text-orange-500" },
            { label: "Followers", value: user.followersCount, icon: Users,    color: "text-blue-500" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-gray-50 rounded-2xl p-2.5 text-center border border-gray-100">
              <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
              <p className="text-base font-bold text-gray-900 tabular-nums">{value.toLocaleString()}</p>
              <p className="text-[10px] text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex-1">
        <Tabs defaultValue={ownTabs ? "my-sevas" : "posts"} className="flex flex-col h-full">
          {ownTabs ? (
            <TabsList className="mx-5 mt-4 grid grid-cols-5 bg-gray-100 rounded-xl h-9 shrink-0">
              <TabsTrigger value="my-sevas" className="text-xs rounded-lg" data-testid="tab-my-sevas">Sevas</TabsTrigger>
              <TabsTrigger value="my-events" className="text-xs rounded-lg" data-testid="tab-my-events">Events</TabsTrigger>
              <TabsTrigger value="my-help" className="text-xs rounded-lg" data-testid="tab-my-help">Help</TabsTrigger>
              <TabsTrigger value="impact" className="text-xs rounded-lg">Impact</TabsTrigger>
              <TabsTrigger value="journey" className="text-xs rounded-lg">Journey</TabsTrigger>
            </TabsList>
          ) : (
            <TabsList className="mx-5 mt-4 grid grid-cols-3 bg-gray-100 rounded-xl h-9 shrink-0">
              <TabsTrigger value="posts" className="text-xs rounded-lg">Seva Posts</TabsTrigger>
              <TabsTrigger value="impact" className="text-xs rounded-lg">Impact</TabsTrigger>
              <TabsTrigger value="journey" className="text-xs rounded-lg">Journey</TabsTrigger>
            </TabsList>
          )}

          {/* ── Public Posts (other users only) ── */}
          {!ownTabs && (
            <TabsContent value="posts" className="px-5 py-4 mt-0 space-y-3">
              {postsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
                </div>
              ) : !publicPosts?.length ? (
                <EmptyState
                  icon={Flame}
                  title={`${user.name} hasn't shared a seva yet`}
                  description="Check back soon to see what they've contributed to the community."
                  testId="empty-state-profile-posts"
                />
              ) : (
                publicPosts.map((post, i) => (
                  <motion.div key={post.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <PostCard post={post} />
                  </motion.div>
                ))
              )}
            </TabsContent>
          )}

          {/* ── My Sevas (own only) ── */}
          {ownTabs && (
            <TabsContent value="my-sevas" className="px-5 py-4 mt-0 space-y-3">
              {myPostsLoading ? (
                <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
              ) : !myPosts?.length ? (
                <EmptyState
                  icon={Flame}
                  title="Your seva story starts here"
                  description="Post your first act of service — even a small one — and inspire others to follow."
                  action={
                    <Link href="/app/create">
                      <Button className="bg-[#FF6F00] hover:bg-orange-600 text-white gap-2 rounded-xl shadow-sm">
                        <Sparkles className="w-4 h-4" />Share your first Seva
                      </Button>
                    </Link>
                  }
                  testId="empty-state-my-sevas"
                />
              ) : (
                myPosts.map((post, i) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
                    data-testid={`my-post-card-${post.id}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`${CATEGORY_COLORS[post.category] ?? "bg-gray-50"} font-medium`}>
                          {CATEGORY_ICONS[post.category] ?? "🤝"} {post.category}
                        </Badge>
                        <StatusBadge status={post.approvalStatus} />
                      </div>
                      <span className="text-[11px] text-gray-400 shrink-0">
                        {post.timestamp ? format(new Date(post.timestamp), "MMM d") : ""}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed line-clamp-3 mb-3 whitespace-pre-wrap">
                      {post.content}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-emerald-500" />
                        {post.helpedPeople} helped
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm" variant="outline"
                          className="h-8 rounded-lg gap-1 text-xs"
                          onClick={() => setEditingPost(post)}
                          data-testid={`button-edit-post-${post.id}`}
                        >
                          <Pencil className="w-3 h-3" /> Edit
                        </Button>
                        <Button
                          size="sm" variant="outline"
                          className="h-8 rounded-lg gap-1 text-xs border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          onClick={() => setDeleteTarget({
                            kind: "post", id: post.id,
                            label: post.content.slice(0, 60) + (post.content.length > 60 ? "…" : ""),
                          })}
                          data-testid={`button-delete-post-${post.id}`}
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </Button>
                      </div>
                    </div>
                    {post.approvalStatus === "rejected" && (
                      <p className="mt-2 text-[11px] text-rose-600 bg-rose-50 px-2 py-1.5 rounded-lg flex items-start gap-1">
                        <AlertCircle className="w-3 h-3 mt-px shrink-0" />
                        An admin rejected this post. Edit it and re-post if you'd like to try again.
                      </p>
                    )}
                  </motion.div>
                ))
              )}
            </TabsContent>
          )}

          {/* ── My Events (own only) ── */}
          {ownTabs && (
            <TabsContent value="my-events" className="px-5 py-4 mt-0 space-y-3">
              {myEventsLoading ? (
                <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
              ) : !myEvents?.length ? (
                <EmptyState
                  icon={CalIcon}
                  title="You haven't organised any events yet"
                  description="Bring your community together — host a clean-up, a workshop, a relief drive."
                  action={
                    <Link href="/app/events">
                      <Button className="bg-[#FF6F00] hover:bg-orange-600 text-white gap-2 rounded-xl shadow-sm">
                        <Sparkles className="w-4 h-4" />Plan an event
                      </Button>
                    </Link>
                  }
                  testId="empty-state-my-events"
                />
              ) : (
                myEvents.map((event, i) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
                    data-testid={`my-event-card-${event.id}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <h3 className="font-semibold text-sm text-gray-900 line-clamp-2">{event.title}</h3>
                      <StatusBadge status={event.approvalStatus} />
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">{event.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-gray-500 flex-wrap mb-3">
                      <span className="flex items-center gap-1"><CalIcon className="w-3 h-3" />{event.date} · {event.time}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{(event.volunteersRegistered?.length ?? 0)}/{event.volunteersNeeded}</span>
                    </div>
                    <div className="flex items-center justify-end gap-1.5">
                      <Button size="sm" variant="outline" className="h-8 rounded-lg gap-1 text-xs"
                        onClick={() => setEditingEvent(event)} data-testid={`button-edit-event-${event.id}`}>
                        <Pencil className="w-3 h-3" /> Edit
                      </Button>
                      <Button size="sm" variant="outline"
                        className="h-8 rounded-lg gap-1 text-xs border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => setDeleteTarget({ kind: "event", id: event.id, label: event.title })}
                        data-testid={`button-delete-event-${event.id}`}>
                        <Trash2 className="w-3 h-3" /> Delete
                      </Button>
                    </div>
                    {event.approvalStatus === "rejected" && (
                      <p className="mt-2 text-[11px] text-rose-600 bg-rose-50 px-2 py-1.5 rounded-lg flex items-start gap-1">
                        <AlertCircle className="w-3 h-3 mt-px shrink-0" />
                        An admin rejected this event.
                      </p>
                    )}
                  </motion.div>
                ))
              )}
            </TabsContent>
          )}

          {/* ── My Help Requests (own only) ── */}
          {ownTabs && (
            <TabsContent value="my-help" className="px-5 py-4 mt-0 space-y-3">
              {myHelpLoading ? (
                <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
              ) : !myHelp?.length ? (
                <EmptyState
                  icon={AlertCircle}
                  title="No help requests yet"
                  description="If you or someone you know needs a hand, post a request — sevaks are ready to help."
                  action={
                    <Link href="/app/help">
                      <Button className="bg-[#FF6F00] hover:bg-orange-600 text-white gap-2 rounded-xl shadow-sm">
                        <Sparkles className="w-4 h-4" />Ask for help
                      </Button>
                    </Link>
                  }
                  testId="empty-state-my-help"
                />
              ) : (
                myHelp.map((hr, i) => (
                  <motion.div
                    key={hr.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
                    data-testid={`my-help-card-${hr.id}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <h3 className="font-semibold text-sm text-gray-900 line-clamp-2">{hr.title}</h3>
                      <StatusBadge status={hr.approvalStatus} />
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">{hr.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-gray-500 flex-wrap mb-3">
                      <Badge variant="outline" className={`${CATEGORY_COLORS[hr.category] ?? "bg-gray-50"} font-medium text-[10px] py-0`}>
                        {hr.category}
                      </Badge>
                      <span className="font-medium">Urgency: {hr.urgency}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{hr.location}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{(hr.helpersJoined?.length ?? 0)}/{hr.peopleNeeded}</span>
                    </div>
                    <div className="flex items-center justify-end gap-1.5">
                      <Button size="sm" variant="outline" className="h-8 rounded-lg gap-1 text-xs"
                        onClick={() => setEditingHelp(hr)} data-testid={`button-edit-help-${hr.id}`}>
                        <Pencil className="w-3 h-3" /> Edit
                      </Button>
                      <Button size="sm" variant="outline"
                        className="h-8 rounded-lg gap-1 text-xs border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => setDeleteTarget({ kind: "help", id: hr.id, label: hr.title })}
                        data-testid={`button-delete-help-${hr.id}`}>
                        <Trash2 className="w-3 h-3" /> Delete
                      </Button>
                    </div>
                    {hr.approvalStatus === "rejected" && (
                      <p className="mt-2 text-[11px] text-rose-600 bg-rose-50 px-2 py-1.5 rounded-lg flex items-start gap-1">
                        <AlertCircle className="w-3 h-3 mt-px shrink-0" />
                        An admin rejected this request.
                      </p>
                    )}
                  </motion.div>
                ))
              )}
            </TabsContent>
          )}

          {/* ── Impact ── */}
          <TabsContent value="impact" className="px-5 py-4 mt-0">
            {(ownTabs ? myPostsLoading : postsLoading) ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
            ) : sortedCategories.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title={isOwn ? "Your impact chart is waiting" : "No impact data yet"}
                description={
                  isOwn
                    ? "Once your sevas are approved across categories, you'll see your impact light up here."
                    : `${user.name} hasn't logged any seva yet.`
                }
                action={
                  isOwn ? (
                    <Link href="/app/create">
                      <Button className="bg-[#FF6F00] hover:bg-orange-600 text-white gap-2 rounded-xl shadow-sm">
                        <Sparkles className="w-4 h-4" />Share a Seva
                      </Button>
                    </Link>
                  ) : undefined
                }
                testId="empty-state-profile-impact"
              />
            ) : (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-[#FF6F00] to-orange-500 rounded-2xl p-4 text-white">
                  <p className="text-xs font-semibold opacity-80 mb-1">Total People Helped</p>
                  <p className="text-3xl font-bold">{user.totalHelped.toLocaleString()}</p>
                  <p className="text-xs opacity-70 mt-0.5">across {impactSourcePosts.length} approved seva posts</p>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">By Category</p>
                  {sortedCategories.map(([cat, { count, helped }], i) => (
                    <motion.div
                      key={cat}
                      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
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
            {/* Chhava honorary badge */}
            {user.chhava && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`rounded-2xl border p-5 ${CHHAVA_RANK.bg} ${CHHAVA_RANK.border} text-white shadow-lg`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center ring-2 ring-white/30">
                    <Crown className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-90">Honorary Rank</p>
                    <p className="text-2xl font-bold">Chhava <span className="opacity-80 text-base font-semibold">· छावा</span></p>
                    <p className="text-xs opacity-90 mt-0.5">{CHHAVA_RANK.description}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Current rank + progress */}
            <div className={`rounded-2xl border p-5 ${rankProgress.current.bg} ${rankProgress.current.border}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white/60 ring-1 ${rankProgress.current.ring}`}>
                  <Award className={`w-6 h-6 ${rankProgress.current.text}`} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Current Rank</p>
                  <p className={`text-xl font-bold ${rankProgress.current.text}`}>
                    {rankProgress.current.name}
                    <span className="ml-2 text-sm font-semibold opacity-70">{rankProgress.current.devanagari}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold opacity-60 uppercase tracking-wide">Mudra</p>
                  <p className={`text-lg font-bold tabular-nums ${rankProgress.current.text}`}>{totalMudra.toLocaleString()}</p>
                </div>
              </div>
              {rankProgress.next ? (
                <>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="opacity-70">Next: <span className="font-semibold">{rankProgress.next.name}</span></span>
                    <span className="font-semibold tabular-nums">
                      {totalMudra.toLocaleString()} / {rankProgress.next.threshold.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2.5 bg-white/60 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${rankProgress.current.text.replace("text-", "bg-")}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${rankProgress.progress}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                  <p className="text-xs opacity-70 mt-2">
                    Help {rankProgress.helpedToNext} more {rankProgress.helpedToNext === 1 ? "person" : "people"} (+{rankProgress.mudraToNext.toLocaleString()} Mudra) to reach {rankProgress.next.name}
                  </p>
                </>
              ) : (
                <div className="flex items-center gap-2 mt-2">
                  <Star className={`w-4 h-4 ${rankProgress.current.text}`} />
                  <p className={`text-sm font-semibold ${rankProgress.current.text}`}>Supreme rank achieved — Sar Senapati!</p>
                </div>
              )}
              <p className="text-[11px] opacity-60 mt-3 italic">{rankProgress.current.description}</p>
            </div>

            {/* Full 17-rank ladder */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Swarajya Ladder</p>
                <p className="text-[10px] text-gray-400">17 ranks · 10 Mudra per help</p>
              </div>
              {SWARAJYA_RANKS.map((rank, i) => {
                const achieved = totalMudra >= rank.threshold;
                const isCurrent = rankProgress.current.name === rank.name && !user.chhava;
                return (
                  <div
                    key={rank.name}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isCurrent ? `${rank.bg} ${rank.border} shadow-sm`
                        : achieved ? "bg-gray-50 border-gray-100"
                          : "bg-white border-gray-100 opacity-50"
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold tabular-nums shrink-0
                      bg-white/80 border border-gray-200 text-gray-500">
                      {i + 1}
                    </div>
                    {achieved
                      ? <CheckCircle2 className={`w-5 h-5 ${isCurrent ? rank.text : "text-gray-400"} shrink-0`} />
                      : <div className="w-5 h-5 rounded-full border-2 border-gray-200 shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isCurrent ? rank.text : achieved ? "text-gray-700" : "text-gray-500"}`}>
                        {rank.name} <span className="text-[11px] opacity-60 font-normal">· {rank.devanagari}</span>
                      </p>
                      <p className="text-[11px] text-gray-400 tabular-nums">
                        {rank.threshold.toLocaleString()} Mudra
                        {rank.threshold > 0 && ` · ${(rank.threshold / 10).toLocaleString()} helped`}
                      </p>
                    </div>
                    {isCurrent && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${rank.bg} ${rank.text} shrink-0`}>You</span>
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
              <Input value={editName} onChange={e => setEditName(e.target.value)}
                className="rounded-xl h-10 bg-gray-50 border-gray-200" placeholder="Your name" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Location</Label>
              <Input value={editLocation} onChange={e => setEditLocation(e.target.value)}
                className="rounded-xl h-10 bg-gray-50 border-gray-200" placeholder="City, State" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Bio</Label>
              <Textarea value={editBio} onChange={e => setEditBio(e.target.value)}
                className="rounded-xl bg-gray-50 border-gray-200 resize-none text-sm"
                placeholder="Tell the community about your seva mission…" rows={3} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={saveProfile} disabled={updateMe.isPending || !editName.trim()}
              className="rounded-xl bg-[#FF6F00] hover:bg-orange-600 text-white">
              {updateMe.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Post Dialog ── */}
      <EditPostDialog
        post={editingPost}
        onClose={() => setEditingPost(null)}
        onSave={(data) => editingPost && updatePost.mutate({ id: editingPost.id, data })}
        saving={updatePost.isPending}
      />

      {/* ── Edit Event Dialog ── */}
      <EditEventDialog
        event={editingEvent}
        onClose={() => setEditingEvent(null)}
        onSave={(data) => editingEvent && updateEvent.mutate({ id: editingEvent.id, data })}
        saving={updateEvent.isPending}
      />

      {/* ── Edit Help Request Dialog ── */}
      <EditHelpDialog
        hr={editingHelp}
        onClose={() => setEditingHelp(null)}
        onSave={(data) => editingHelp && updateHelp.mutate({ id: editingHelp.id, data })}
        saving={updateHelp.isPending}
      />

      {/* ── Delete confirm ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this {deleteTarget?.kind === "post" ? "seva post" : deleteTarget?.kind === "event" ? "event" : "help request"}?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.label}" will be permanently removed. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deletePost.isPending || deleteEvent.isPending || deleteHelp.isPending}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Logout confirm ── */}
      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("profile.logoutConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("profile.logoutConfirmBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
              data-testid="button-confirm-logout"
            >
              {t("profile.confirmLogout")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Edit dialogs
// ─────────────────────────────────────────────────────────────────────────────

function EditPostDialog({
  post, onClose, onSave, saving,
}: {
  post: SevaPost | null;
  onClose: () => void;
  onSave: (data: { content: string; category: typeof SEVA_CATS[number]; helpedPeople: number; location: string | null }) => void;
  saving: boolean;
}) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<typeof SEVA_CATS[number]>("Other");
  const [helped, setHelped] = useState("0");
  const [loc, setLoc] = useState("");

  useEffect(() => {
    if (!post) return;
    setContent(post.content);
    setCategory((SEVA_CATS as readonly string[]).includes(post.category) ? post.category as typeof SEVA_CATS[number] : "Other");
    setHelped(String(post.helpedPeople ?? 0));
    setLoc(post.location ?? "");
  }, [post]);

  return (
    <Dialog open={!!post} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader><DialogTitle className="text-lg font-bold">Edit Seva Post</DialogTitle></DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">What did you do?</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)}
              rows={4} className="rounded-xl bg-gray-50 border-gray-200 resize-none text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as typeof SEVA_CATS[number])}>
                <SelectTrigger className="rounded-xl bg-gray-50 border-gray-200 h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SEVA_CATS.map(c => <SelectItem key={c} value={c}>{CATEGORY_ICONS[c] ?? "🤝"} {c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">People helped</Label>
              <Input type="number" min={0} value={helped} onChange={(e) => setHelped(e.target.value)}
                className="rounded-xl bg-gray-50 border-gray-200 h-10" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Location</Label>
            <Input value={loc} onChange={(e) => setLoc(e.target.value)}
              className="rounded-xl bg-gray-50 border-gray-200 h-10" placeholder="Optional" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button
            onClick={() => onSave({
              content: content.trim(),
              category,
              helpedPeople: Math.max(0, parseInt(helped, 10) || 0),
              location: loc.trim() ? loc.trim() : null,
            })}
            disabled={saving || !content.trim()}
            className="rounded-xl bg-[#FF6F00] hover:bg-orange-600 text-white"
            data-testid="button-save-post-edit"
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditEventDialog({
  event, onClose, onSave, saving,
}: {
  event: SevaEvent | null;
  onClose: () => void;
  onSave: (data: {
    title: string; description: string; date: string; time: string;
    location: string; address: string; volunteersNeeded: number;
  }) => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loc, setLoc] = useState("");
  const [addr, setAddr] = useState("");
  const [vol, setVol] = useState("0");

  useEffect(() => {
    if (!event) return;
    setTitle(event.title);
    setDesc(event.description);
    setDate(event.date);
    setTime(event.time);
    setLoc(event.location);
    setAddr(event.address);
    setVol(String(event.volunteersNeeded ?? 0));
  }, [event]);

  return (
    <Dialog open={!!event} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="text-lg font-bold">Edit Event</DialogTitle></DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl bg-gray-50 border-gray-200 h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Description</Label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)}
              rows={3} className="rounded-xl bg-gray-50 border-gray-200 resize-none text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl bg-gray-50 border-gray-200 h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Time</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="rounded-xl bg-gray-50 border-gray-200 h-10" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Location (city / area)</Label>
            <Input value={loc} onChange={(e) => setLoc(e.target.value)} className="rounded-xl bg-gray-50 border-gray-200 h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Address</Label>
            <Input value={addr} onChange={(e) => setAddr(e.target.value)} className="rounded-xl bg-gray-50 border-gray-200 h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Volunteers needed</Label>
            <Input type="number" min={1} value={vol} onChange={(e) => setVol(e.target.value)}
              className="rounded-xl bg-gray-50 border-gray-200 h-10" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button
            onClick={() => onSave({
              title: title.trim(),
              description: desc.trim(),
              date, time,
              location: loc.trim(),
              address: addr.trim(),
              volunteersNeeded: Math.max(1, parseInt(vol, 10) || 1),
            })}
            disabled={saving || !title.trim() || !desc.trim() || !date || !time || !loc.trim()}
            className="rounded-xl bg-[#FF6F00] hover:bg-orange-600 text-white"
            data-testid="button-save-event-edit"
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditHelpDialog({
  hr, onClose, onSave, saving,
}: {
  hr: HelpReq | null;
  onClose: () => void;
  onSave: (data: {
    title: string; description: string; category: typeof SEVA_CATS[number];
    urgency: typeof URGENCIES[number]; location: string; peopleNeeded: number;
  }) => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState<typeof SEVA_CATS[number]>("Other");
  const [urg, setUrg] = useState<typeof URGENCIES[number]>("Medium");
  const [loc, setLoc] = useState("");
  const [people, setPeople] = useState("1");

  useEffect(() => {
    if (!hr) return;
    setTitle(hr.title);
    setDesc(hr.description);
    setCat((SEVA_CATS as readonly string[]).includes(hr.category) ? hr.category as typeof SEVA_CATS[number] : "Other");
    setUrg((URGENCIES as readonly string[]).includes(hr.urgency) ? hr.urgency as typeof URGENCIES[number] : "Medium");
    setLoc(hr.location);
    setPeople(String(hr.peopleNeeded ?? 1));
  }, [hr]);

  return (
    <Dialog open={!!hr} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="text-lg font-bold">Edit Help Request</DialogTitle></DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl bg-gray-50 border-gray-200 h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Description</Label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)}
              rows={3} className="rounded-xl bg-gray-50 border-gray-200 resize-none text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Category</Label>
              <Select value={cat} onValueChange={(v) => setCat(v as typeof SEVA_CATS[number])}>
                <SelectTrigger className="rounded-xl bg-gray-50 border-gray-200 h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SEVA_CATS.map(c => <SelectItem key={c} value={c}>{CATEGORY_ICONS[c] ?? "🤝"} {c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Urgency</Label>
              <Select value={urg} onValueChange={(v) => setUrg(v as typeof URGENCIES[number])}>
                <SelectTrigger className="rounded-xl bg-gray-50 border-gray-200 h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {URGENCIES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Location</Label>
            <Input value={loc} onChange={(e) => setLoc(e.target.value)} className="rounded-xl bg-gray-50 border-gray-200 h-10" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">People needed</Label>
            <Input type="number" min={1} value={people} onChange={(e) => setPeople(e.target.value)}
              className="rounded-xl bg-gray-50 border-gray-200 h-10" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button
            onClick={() => onSave({
              title: title.trim(),
              description: desc.trim(),
              category: cat,
              urgency: urg,
              location: loc.trim(),
              peopleNeeded: Math.max(1, parseInt(people, 10) || 1),
            })}
            disabled={saving || !title.trim() || !desc.trim() || !loc.trim()}
            className="rounded-xl bg-[#FF6F00] hover:bg-orange-600 text-white"
            data-testid="button-save-help-edit"
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
