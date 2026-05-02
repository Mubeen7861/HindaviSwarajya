import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, Users, FileText, Calendar, AlertCircle, Trash2,
  TrendingUp, Activity, RefreshCw, ArrowLeft, Edit3, Check, X, LogOut,
  CheckCircle2, XCircle, Inbox, Clock, Crown,
  Image as ImageIcon, Plus, ChevronUp, ChevronDown, Eye, EyeOff,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { SWARAJYA_RANKS, RANK_NAMES } from "@/lib/ranks";
import { bannerBackground } from "@/components/BannerCarousel";

const ADMIN_TOKEN_KEY = "hs_admin_token";

function getToken(): string | null {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

function clearToken(): void {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}

const API_BASE = "/api";

function adminFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = getToken() ?? "";
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": token,
      ...(init?.headers ?? {}),
    },
  });
}

type Overview = {
  counts: {
    users: number; posts: number; events: number; helpRequests: number; totalHelped: number;
    pendingPosts: number; pendingEvents: number; pendingHelpRequests: number;
  };
  recentUsers: { id: number; name: string; avatar: string; rank: string; location: string; joinedAt: string | null }[];
  recentPosts: { id: number; content: string; category: string; userId: number; helpedPeople: number; timestamp: string | null }[];
};

type AdminUser = { id: number; name: string; avatar: string; location: string; rank: string; totalHelped: number; mudra: number; chhava: boolean; followersCount: number; postsCount: number; joinedAt: string | null };
type AdminPost = { id: number; userId: number; userName: string; userAvatar: string; content: string; category: string; helpedPeople: number; likes: number; location: string | null; approvalStatus: string; timestamp: string | null };
type AdminEvent = { id: number; title: string; category: string; date: string; location: string; status: string; approvalStatus: string; organizerId: number; organizerName: string; volunteersNeeded: number; createdAt: string | null };
type AdminHelpRequest = { id: number; title: string; category: string; urgency: string; location: string; status: string; approvalStatus: string; requesterId: number; requesterName: string; peopleNeeded: number; deadline: string | null; createdAt: string | null };

type PendingPost = { id: number; userId: number; userName: string; userAvatar: string; content: string; category: string; helpedPeople: number; location: string | null; images: string[]; timestamp: string | null };
type PendingEvent = { id: number; title: string; description: string; category: string; eventType: string; date: string; time: string; location: string; organizerId: number; organizerName: string; organizerAvatar: string; volunteersNeeded: number; image: string | null; createdAt: string | null };
type PendingHelpRequest = { id: number; title: string; description: string; category: string; urgency: string; location: string; requesterId: number; requesterName: string; requesterAvatar: string; peopleNeeded: number; deadline: string | null; createdAt: string | null };
type PendingQueue = { counts: { posts: number; events: number; helpRequests: number }; posts: PendingPost[]; events: PendingEvent[]; helpRequests: PendingHelpRequest[] };

type AdminBanner = {
  id: number;
  subtitle: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string | null;
  gradientFrom: string;
  gradientTo: string;
  position: number;
  active: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

type BannerDraft = Omit<AdminBanner, "id" | "createdAt" | "updatedAt" | "imageUrl"> & { imageUrl: string };

const EMPTY_BANNER_DRAFT: BannerDraft = {
  subtitle: "",
  title: "",
  body: "",
  ctaLabel: "",
  ctaHref: "",
  imageUrl: "",
  gradientFrom: "#FF6F00",
  gradientTo: "#EA580C",
  position: 0,
  active: true,
};

const RANKS = RANK_NAMES;
const EVENT_STATUSES = ["upcoming", "ongoing", "completed", "cancelled"];
const HELP_STATUSES = ["open", "in_progress", "fulfilled", "closed"];

const rankColors: Record<string, string> = Object.fromEntries(
  SWARAJYA_RANKS.map((r) => [r.name, `${r.bg} ${r.text}`]),
);

const statusColors: Record<string, string> = {
  upcoming: "bg-blue-100 text-blue-700",
  ongoing: "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
  open: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-blue-100 text-blue-700",
  fulfilled: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-700",
};

const approvalColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};

const urgencyColors: Record<string, string> = {
  Low: "bg-green-100 text-green-700",
  Medium: "bg-yellow-100 text-yellow-700",
  High: "bg-orange-100 text-orange-700",
  Critical: "bg-red-100 text-red-700",
};

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{typeof value === "number" ? value.toLocaleString() : value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function Admin() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [helpReqs, setHelpReqs] = useState<AdminHelpRequest[]>([]);
  const [pending, setPending] = useState<PendingQueue | null>(null);
  const [banners, setBanners] = useState<AdminBanner[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [editingRank, setEditingRank] = useState<{ id: number; rank: string } | null>(null);
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false);
  const [bannerEditingId, setBannerEditingId] = useState<number | null>(null);
  const [bannerDraft, setBannerDraft] = useState<BannerDraft>(EMPTY_BANNER_DRAFT);
  const [bannerSaving, setBannerSaving] = useState(false);

  const setLoad = (key: string, val: boolean) =>
    setLoading((prev) => ({ ...prev, [key]: val }));

  const handleUnauth = useCallback(() => {
    clearToken();
    navigate("/app/admin/login");
  }, [navigate]);

  const safeFetch = useCallback(async (path: string, init?: RequestInit): Promise<Response | null> => {
    const res = await adminFetch(path, init);
    if (res.status === 401) { handleUnauth(); return null; }
    return res;
  }, [handleUnauth]);

  useEffect(() => {
    if (!getToken()) { navigate("/app/admin/login"); }
  }, [navigate]);

  const fetchOverview = useCallback(async () => {
    setLoad("overview", true);
    try {
      const r = await safeFetch("/admin/overview");
      if (r) setOverview(await r.json());
    } finally { setLoad("overview", false); }
  }, [safeFetch]);

  const fetchUsers = useCallback(async () => {
    setLoad("users", true);
    try {
      const r = await safeFetch("/admin/users?limit=100");
      if (r) setUsers(await r.json());
    } finally { setLoad("users", false); }
  }, [safeFetch]);

  const fetchPosts = useCallback(async () => {
    setLoad("posts", true);
    try {
      const r = await safeFetch("/admin/posts?limit=100");
      if (r) setPosts(await r.json());
    } finally { setLoad("posts", false); }
  }, [safeFetch]);

  const fetchEvents = useCallback(async () => {
    setLoad("events", true);
    try {
      const r = await safeFetch("/admin/events?limit=100");
      if (r) setEvents(await r.json());
    } finally { setLoad("events", false); }
  }, [safeFetch]);

  const fetchHelpReqs = useCallback(async () => {
    setLoad("help", true);
    try {
      const r = await safeFetch("/admin/help-requests?limit=100");
      if (r) setHelpReqs(await r.json());
    } finally { setLoad("help", false); }
  }, [safeFetch]);

  const fetchPending = useCallback(async () => {
    setLoad("pending", true);
    try {
      const r = await safeFetch("/admin/pending");
      if (r) setPending(await r.json());
    } finally { setLoad("pending", false); }
  }, [safeFetch]);

  const fetchBanners = useCallback(async () => {
    setLoad("banners", true);
    try {
      const r = await safeFetch("/admin/banners");
      if (r) setBanners(await r.json());
    } finally { setLoad("banners", false); }
  }, [safeFetch]);

  useEffect(() => {
    if (!getToken()) return;
    fetchOverview();
    fetchUsers();
    fetchPosts();
    fetchEvents();
    fetchHelpReqs();
    fetchPending();
    fetchBanners();
  }, [fetchOverview, fetchUsers, fetchPosts, fetchEvents, fetchHelpReqs, fetchPending, fetchBanners]);

  const handleLogout = () => {
    clearToken();
    navigate("/app/admin/login");
  };

  const deleteUser = async (id: number) => {
    const r = await safeFetch(`/admin/users/${id}`, { method: "DELETE" });
    if (r?.ok) {
      setUsers((u) => u.filter((x) => x.id !== id));
      fetchOverview();
      toast({ title: "User deleted" });
    } else if (r) {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const saveRank = async (id: number, rank: string) => {
    const r = await safeFetch(`/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ rank }),
    });
    if (r?.ok) {
      setUsers((u) => u.map((x) => (x.id === id ? { ...x, rank } : x)));
      setEditingRank(null);
      toast({ title: "Rank updated" });
    } else if (r) {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const openCreateBanner = () => {
    setBannerEditingId(null);
    setBannerDraft({ ...EMPTY_BANNER_DRAFT, position: banners.length });
    setBannerDialogOpen(true);
  };

  const openEditBanner = (b: AdminBanner) => {
    setBannerEditingId(b.id);
    setBannerDraft({
      subtitle: b.subtitle,
      title: b.title,
      body: b.body,
      ctaLabel: b.ctaLabel,
      ctaHref: b.ctaHref,
      imageUrl: b.imageUrl ?? "",
      gradientFrom: b.gradientFrom,
      gradientTo: b.gradientTo,
      position: b.position,
      active: b.active,
    });
    setBannerDialogOpen(true);
  };

  const saveBanner = async () => {
    if (!bannerDraft.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    setBannerSaving(true);
    try {
      const payload = { ...bannerDraft, imageUrl: bannerDraft.imageUrl || null };
      const r = bannerEditingId == null
        ? await safeFetch("/admin/banners", { method: "POST", body: JSON.stringify(payload) })
        : await safeFetch(`/admin/banners/${bannerEditingId}`, { method: "PATCH", body: JSON.stringify(payload) });
      if (r?.ok) {
        await fetchBanners();
        setBannerDialogOpen(false);
        toast({ title: bannerEditingId == null ? "Banner created" : "Banner updated" });
      } else if (r) {
        const err = await r.json().catch(() => ({}));
        toast({ title: err.error ?? "Save failed", variant: "destructive" });
      }
    } finally {
      setBannerSaving(false);
    }
  };

  const toggleBannerActive = async (b: AdminBanner) => {
    const r = await safeFetch(`/admin/banners/${b.id}`, {
      method: "PATCH",
      body: JSON.stringify({ active: !b.active }),
    });
    if (r?.ok) {
      setBanners((rows) => rows.map((x) => (x.id === b.id ? { ...x, active: !b.active } : x)));
      toast({ title: !b.active ? "Banner activated" : "Banner deactivated" });
    } else if (r) {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const deleteBanner = async (id: number) => {
    const r = await safeFetch(`/admin/banners/${id}`, { method: "DELETE" });
    if (r?.ok) {
      setBanners((rows) => rows.filter((x) => x.id !== id));
      toast({ title: "Banner deleted" });
    } else if (r) {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const moveBanner = async (b: AdminBanner, dir: -1 | 1) => {
    const sorted = [...banners].sort((a, c) => a.position - c.position || a.id - c.id);
    const idx = sorted.findIndex((x) => x.id === b.id);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= sorted.length) return;
    const other = sorted[swapIdx];
    const newPosA = other.position;
    const newPosB = b.position;
    const [r1, r2] = await Promise.all([
      safeFetch(`/admin/banners/${b.id}`, { method: "PATCH", body: JSON.stringify({ position: newPosA }) }),
      safeFetch(`/admin/banners/${other.id}`, { method: "PATCH", body: JSON.stringify({ position: newPosB }) }),
    ]);
    if (r1?.ok && r2?.ok) {
      await fetchBanners();
    } else {
      toast({ title: "Reorder failed", variant: "destructive" });
    }
  };

  const toggleChhava = async (id: number, chhava: boolean) => {
    const r = await safeFetch(`/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ chhava }),
    });
    if (r?.ok) {
      setUsers((u) => u.map((x) => (x.id === id ? { ...x, chhava } : x)));
      toast({
        title: chhava ? "Chhava awarded ✦" : "Chhava revoked",
        description: chhava ? "Honorary rank granted." : "Honorary rank removed.",
      });
    } else if (r) {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const deletePost = async (id: number) => {
    const r = await safeFetch(`/admin/posts/${id}`, { method: "DELETE" });
    if (r?.ok) {
      setPosts((p) => p.filter((x) => x.id !== id));
      fetchOverview();
      toast({ title: "Post deleted" });
    } else if (r) {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const updateEventStatus = async (id: number, status: string) => {
    const r = await safeFetch(`/admin/events/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    if (r?.ok) {
      setEvents((e) => e.map((x) => (x.id === id ? { ...x, status } : x)));
      toast({ title: "Event status updated" });
    } else if (r) {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const deleteEvent = async (id: number) => {
    const r = await safeFetch(`/admin/events/${id}`, { method: "DELETE" });
    if (r?.ok) {
      setEvents((e) => e.filter((x) => x.id !== id));
      fetchOverview();
      toast({ title: "Event deleted" });
    } else if (r) {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const updateHelpStatus = async (id: number, status: string) => {
    const r = await safeFetch(`/admin/help-requests/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    if (r?.ok) {
      setHelpReqs((h) => h.map((x) => (x.id === id ? { ...x, status } : x)));
      toast({ title: "Status updated" });
    } else if (r) {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const moderate = async (
    kind: "posts" | "events" | "help-requests",
    id: number,
    action: "approve" | "reject",
  ) => {
    const r = await safeFetch(`/admin/${kind}/${id}/${action}`, { method: "POST" });
    if (r?.ok) {
      toast({
        title: action === "approve" ? "Approved ✓" : "Rejected",
        description: action === "approve" ? "It is now visible in the feed." : "It will not appear publicly.",
      });
      fetchPending();
      fetchOverview();
      // Keep the main lists in sync if the user is also viewing them.
      if (kind === "posts") fetchPosts();
      if (kind === "events") fetchEvents();
      if (kind === "help-requests") fetchHelpReqs();
    } else if (r) {
      toast({ title: `${action === "approve" ? "Approval" : "Rejection"} failed`, variant: "destructive" });
    }
  };

  const deleteHelpReq = async (id: number) => {
    const r = await safeFetch(`/admin/help-requests/${id}`, { method: "DELETE" });
    if (r?.ok) {
      setHelpReqs((h) => h.filter((x) => x.id !== id));
      fetchOverview();
      toast({ title: "Request deleted" });
    } else if (r) {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/app">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6F00] to-orange-600 flex items-center justify-center shadow-sm">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">Admin Panel</h1>
            <p className="text-xs text-muted-foreground">Manage platform content & users</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs"
            onClick={() => { fetchOverview(); fetchUsers(); fetchPosts(); fetchEvents(); fetchHelpReqs(); fetchPending(); }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="overview" className="flex flex-col h-full">
          <TabsList className="mx-6 mt-4 mb-0 grid grid-cols-7 bg-gray-100 rounded-xl h-9 shrink-0">
            <TabsTrigger value="overview" className="text-xs rounded-lg">Overview</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs rounded-lg gap-1">
              <span>Pending</span>
              {(() => {
                const total = (pending?.counts.posts ?? 0) + (pending?.counts.events ?? 0) + (pending?.counts.helpRequests ?? 0);
                return total > 0 ? (
                  <span className="text-[10px] bg-amber-200 text-amber-800 rounded-full px-1.5 font-bold">{total}</span>
                ) : null;
              })()}
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs rounded-lg">
              Users {users.length > 0 && <span className="ml-1 text-[10px] bg-gray-200 text-gray-600 rounded-full px-1.5">{users.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="posts" className="text-xs rounded-lg">
              Posts {posts.length > 0 && <span className="ml-1 text-[10px] bg-gray-200 text-gray-600 rounded-full px-1.5">{posts.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="events" className="text-xs rounded-lg">
              Events {events.length > 0 && <span className="ml-1 text-[10px] bg-gray-200 text-gray-600 rounded-full px-1.5">{events.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="help" className="text-xs rounded-lg">
              Help {helpReqs.length > 0 && <span className="ml-1 text-[10px] bg-gray-200 text-gray-600 rounded-full px-1.5">{helpReqs.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="banners" className="text-xs rounded-lg" data-testid="tab-banners">
              Banners {banners.length > 0 && <span className="ml-1 text-[10px] bg-gray-200 text-gray-600 rounded-full px-1.5">{banners.length}</span>}
            </TabsTrigger>
          </TabsList>

          {/* ── Overview ── */}
          <TabsContent value="overview" className="flex-1 overflow-y-auto px-6 py-5 mt-0 space-y-6">
            {loading.overview && !overview ? (
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
              </div>
            ) : overview ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <StatCard icon={Users} label="Total Users" value={overview.counts.users} color="bg-blue-50 text-blue-600" />
                  <StatCard icon={FileText} label="Seva Posts" value={overview.counts.posts} color="bg-orange-50 text-orange-600" />
                  <StatCard icon={Calendar} label="Events" value={overview.counts.events} color="bg-purple-50 text-purple-600" />
                  <StatCard icon={AlertCircle} label="Help Requests" value={overview.counts.helpRequests} color="bg-red-50 text-red-600" />
                  <StatCard icon={TrendingUp} label="People Helped" value={overview.counts.totalHelped} color="bg-green-50 text-green-600" />
                </div>
                {(overview.counts.pendingPosts + overview.counts.pendingEvents + overview.counts.pendingHelpRequests) > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-amber-900 text-sm">
                          {overview.counts.pendingPosts + overview.counts.pendingEvents + overview.counts.pendingHelpRequests} item(s) waiting for approval
                        </p>
                        <p className="text-xs text-amber-700/80">
                          {overview.counts.pendingPosts} posts · {overview.counts.pendingEvents} events · {overview.counts.pendingHelpRequests} help requests
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5 shrink-0"
                      onClick={() => {
                        const trigger = document.querySelector<HTMLButtonElement>('[data-state][role="tab"][value="pending"]');
                        trigger?.click();
                      }}
                    >
                      <Inbox className="w-3.5 h-3.5" />
                      Review queue
                    </Button>
                  </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-bold text-gray-800">Recent Users</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {overview.recentUsers.map((u) => (
                        <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                          <Avatar className="w-9 h-9 shrink-0">
                            <AvatarImage src={u.avatar} />
                            <AvatarFallback className="text-xs">{u.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{u.name}</p>
                            <p className="text-xs text-muted-foreground">{u.location}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rankColors[u.rank] ?? "bg-gray-100 text-gray-600"}`}>{u.rank}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-bold text-gray-800">Recent Posts</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {overview.recentPosts.map((p) => (
                        <div key={p.id} className="flex items-start gap-3 px-4 py-3">
                          <span className="text-xs text-gray-400 font-mono shrink-0 mt-1">#{p.id}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 line-clamp-2">{p.content}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">{p.category}</span>
                              <span className="text-xs text-muted-foreground">{p.helpedPeople} helped</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </TabsContent>

          {/* ── Pending Approvals ── */}
          <TabsContent value="pending" className="flex-1 overflow-y-auto px-6 py-5 mt-0 space-y-6">
            {loading.pending && !pending ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
            ) : pending && (pending.counts.posts + pending.counts.events + pending.counts.helpRequests) === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm py-16 px-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="mt-4 font-bold text-gray-900">All caught up!</h3>
                <p className="text-sm text-muted-foreground mt-1">Nothing waiting for approval right now.</p>
              </div>
            ) : pending ? (
              <>
                {/* Pending posts */}
                {pending.posts.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1 mb-3 flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-orange-500" />
                      Seva Posts <span className="bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 text-[10px] normal-case">{pending.posts.length}</span>
                    </h3>
                    <div className="space-y-3">
                      {pending.posts.map((p) => (
                        <div key={p.id} className="bg-white border border-amber-100 rounded-2xl shadow-sm p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="w-9 h-9 shrink-0">
                              <AvatarImage src={p.userAvatar} />
                              <AvatarFallback className="text-xs">{p.userName.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm text-gray-900">{p.userName}</span>
                                <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">{p.category}</span>
                                <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">{p.helpedPeople} helped</span>
                                {p.location && <span className="text-xs text-muted-foreground">· {p.location}</span>}
                                <span className="text-xs text-gray-400 ml-auto">
                                  {p.timestamp ? formatDistanceToNow(new Date(p.timestamp), { addSuffix: true }) : "—"}
                                </span>
                              </div>
                              <p className="text-sm text-gray-800 mt-2 whitespace-pre-wrap break-words">{p.content}</p>
                              {p.images && p.images.length > 0 && (
                                <div className="mt-3 flex gap-2 flex-wrap">
                                  {p.images.slice(0, 3).map((src, i) => (
                                    <img
                                      key={`${p.id}-img-${i}`}
                                      src={src}
                                      alt=""
                                      className="rounded-xl max-h-32 object-cover border border-gray-100"
                                    />
                                  ))}
                                </div>
                              )}
                              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                                <Button
                                  size="sm"
                                  className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() => moderate("posts", p.id, "approve")}
                                  data-testid={`approve-post-${p.id}`}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50"
                                  onClick={() => moderate("posts", p.id, "reject")}
                                  data-testid={`reject-post-${p.id}`}
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Reject
                                </Button>
                                <span className="text-xs text-gray-400 ml-auto">ID #{p.id}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Pending events */}
                {pending.events.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1 mb-3 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-purple-500" />
                      Events <span className="bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 text-[10px] normal-case">{pending.events.length}</span>
                    </h3>
                    <div className="space-y-3">
                      {pending.events.map((ev) => (
                        <div key={ev.id} className="bg-white border border-amber-100 rounded-2xl shadow-sm p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="w-9 h-9 shrink-0">
                              <AvatarImage src={ev.organizerAvatar} />
                              <AvatarFallback className="text-xs">{ev.organizerName.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-gray-900">{ev.title}</span>
                                <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">{ev.category}</span>
                                <span className="text-xs text-gray-400 ml-auto">
                                  {ev.createdAt ? formatDistanceToNow(new Date(ev.createdAt), { addSuffix: true }) : "—"}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                by <span className="font-medium text-gray-700">{ev.organizerName}</span>
                                {" · "}{ev.date} {ev.time} · {ev.location} · needs {ev.volunteersNeeded} volunteers
                              </p>
                              <p className="text-sm text-gray-800 mt-2 whitespace-pre-wrap break-words">{ev.description}</p>
                              {ev.image && (
                                <img src={ev.image} alt="" className="mt-3 rounded-xl max-h-48 object-cover border border-gray-100" />
                              )}
                              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                                <Button
                                  size="sm"
                                  className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() => moderate("events", ev.id, "approve")}
                                  data-testid={`approve-event-${ev.id}`}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50"
                                  onClick={() => moderate("events", ev.id, "reject")}
                                  data-testid={`reject-event-${ev.id}`}
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Reject
                                </Button>
                                <span className="text-xs text-gray-400 ml-auto">ID #{ev.id}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Pending help requests */}
                {pending.helpRequests.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                      Help Requests <span className="bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 text-[10px] normal-case">{pending.helpRequests.length}</span>
                    </h3>
                    <div className="space-y-3">
                      {pending.helpRequests.map((hr) => (
                        <div key={hr.id} className="bg-white border border-amber-100 rounded-2xl shadow-sm p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="w-9 h-9 shrink-0">
                              <AvatarImage src={hr.requesterAvatar} />
                              <AvatarFallback className="text-xs">{hr.requesterName.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-gray-900">{hr.title}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${urgencyColors[hr.urgency] ?? "bg-gray-100 text-gray-600"}`}>{hr.urgency}</span>
                                <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-medium">{hr.category}</span>
                                <span className="text-xs text-gray-400 ml-auto">
                                  {hr.createdAt ? formatDistanceToNow(new Date(hr.createdAt), { addSuffix: true }) : "—"}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                by <span className="font-medium text-gray-700">{hr.requesterName}</span>
                                {" · "}{hr.location} · needs {hr.peopleNeeded} sevak(s){hr.deadline ? ` · by ${hr.deadline}` : ""}
                              </p>
                              <p className="text-sm text-gray-800 mt-2 whitespace-pre-wrap break-words">{hr.description}</p>
                              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                                <Button
                                  size="sm"
                                  className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() => moderate("help-requests", hr.id, "approve")}
                                  data-testid={`approve-help-${hr.id}`}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50"
                                  onClick={() => moderate("help-requests", hr.id, "reject")}
                                  data-testid={`reject-help-${hr.id}`}
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Reject
                                </Button>
                                <span className="text-xs text-gray-400 ml-auto">ID #{hr.id}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            ) : null}
          </TabsContent>

          {/* ── Users ── */}
          <TabsContent value="users" className="flex-1 overflow-y-auto px-6 py-4 mt-0">
            {loading.users && users.length === 0 ? (
              <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/80">
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">User</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Rank · Honor</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide hidden md:table-cell">Location</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide hidden lg:table-cell">Mudra</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide hidden lg:table-cell">Posts</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide hidden xl:table-cell">Joined</th>
                        <th className="px-4 py-3 w-24"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8 shrink-0">
                                <AvatarImage src={u.avatar} />
                                <AvatarFallback className="text-xs">{u.name.substring(0, 2)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-gray-900">{u.name}</p>
                                <p className="text-xs text-gray-400">ID: {u.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {editingRank?.id === u.id ? (
                              <div className="flex items-center gap-1.5">
                                <Select value={editingRank.rank} onValueChange={(v) => setEditingRank({ id: u.id, rank: v })}>
                                  <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {RANKS.map(r => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                                <button onClick={() => saveRank(u.id, editingRank.rank)} className="w-6 h-6 flex items-center justify-center rounded bg-green-100 text-green-700 hover:bg-green-200">
                                  <Check className="w-3 h-3" />
                                </button>
                                <button onClick={() => setEditingRank(null)} className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 text-gray-600 hover:bg-gray-200">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rankColors[u.rank] ?? "bg-gray-100 text-gray-600"}`}>{u.rank}</span>
                                <button onClick={() => setEditingRank({ id: u.id, rank: u.rank })} className="w-5 h-5 flex items-center justify-center rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100" title="Edit rank">
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => toggleChhava(u.id, !u.chhava)}
                                  className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide transition-all ${
                                    u.chhava
                                      ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm hover:shadow-md"
                                      : "bg-gray-50 text-gray-400 border border-dashed border-gray-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-300"
                                  }`}
                                  title={u.chhava ? "Revoke Chhava honor" : "Grant Chhava honor"}
                                  data-testid={`button-chhava-${u.id}`}
                                >
                                  <Crown className="w-2.5 h-2.5" /> Chhava
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs hidden md:table-cell">{u.location}</td>
                          <td className="px-4 py-3 text-right font-semibold text-amber-600 hidden lg:table-cell tabular-nums">{u.mudra?.toLocaleString() ?? 0}</td>
                          <td className="px-4 py-3 text-right text-gray-600 hidden lg:table-cell">{u.postsCount}</td>
                          <td className="px-4 py-3 text-right text-xs text-gray-400 hidden xl:table-cell">
                            {u.joinedAt ? formatDistanceToNow(new Date(u.joinedAt), { addSuffix: true }) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors ml-auto">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete {u.name}?</AlertDialogTitle>
                                  <AlertDialogDescription>This will permanently delete the user and all their posts, comments, and activity. This action cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteUser(u.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── Posts ── */}
          <TabsContent value="posts" className="flex-1 overflow-y-auto px-6 py-4 mt-0">
            {loading.posts && posts.length === 0 ? (
              <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/80">
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Post</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide hidden md:table-cell">Author</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Category</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide hidden lg:table-cell">Helped</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide hidden lg:table-cell">Likes</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide hidden xl:table-cell">Posted</th>
                        <th className="px-4 py-3 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {posts.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 max-w-xs">
                            <p className="text-gray-800 text-sm line-clamp-2">{p.content}</p>
                            <p className="text-xs text-gray-400 mt-0.5">ID: {p.id}</p>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={p.userAvatar} />
                                <AvatarFallback className="text-[10px]">{p.userName.substring(0, 2)}</AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-gray-700 truncate max-w-[120px]">{p.userName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">{p.category}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${approvalColors[p.approvalStatus] ?? "bg-gray-100 text-gray-600"}`}>{p.approvalStatus}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-green-600 hidden lg:table-cell">{p.helpedPeople}</td>
                          <td className="px-4 py-3 text-right text-gray-600 hidden lg:table-cell">{p.likes}</td>
                          <td className="px-4 py-3 text-right text-xs text-gray-400 hidden xl:table-cell">
                            {p.timestamp ? formatDistanceToNow(new Date(p.timestamp), { addSuffix: true }) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors ml-auto">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                                  <AlertDialogDescription>This will permanently remove the post and all its likes and comments.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deletePost(p.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── Events ── */}
          <TabsContent value="events" className="flex-1 overflow-y-auto px-6 py-4 mt-0">
            {loading.events && events.length === 0 ? (
              <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/80">
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Event</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide hidden md:table-cell">Organizer</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide hidden md:table-cell">Date</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Status</th>
                        <th className="px-4 py-3 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {events.map((ev) => (
                        <tr key={ev.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900">{ev.title}</p>
                            <p className="text-xs text-gray-400">{ev.location} · {ev.category}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600 hidden md:table-cell">{ev.organizerName}</td>
                          <td className="px-4 py-3 text-xs text-gray-600 hidden md:table-cell">{ev.date}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Select value={ev.status} onValueChange={(v) => updateEventStatus(ev.id, v)}>
                                <SelectTrigger className="h-7 text-xs w-32 border-0 shadow-none p-0 gap-1">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[ev.status] ?? "bg-gray-100 text-gray-600"}`}>{ev.status}</span>
                                </SelectTrigger>
                                <SelectContent>
                                  {EVENT_STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${approvalColors[ev.approvalStatus] ?? "bg-gray-100 text-gray-600"}`}>{ev.approvalStatus}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors ml-auto">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete "{ev.title}"?</AlertDialogTitle>
                                  <AlertDialogDescription>This will permanently remove the event and all registrations.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteEvent(ev.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── Help Requests ── */}
          <TabsContent value="help" className="flex-1 overflow-y-auto px-6 py-4 mt-0">
            {loading.help && helpReqs.length === 0 ? (
              <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/80">
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Request</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide hidden md:table-cell">Requester</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Urgency</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Status</th>
                        <th className="px-4 py-3 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {helpReqs.map((hr) => (
                        <tr key={hr.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900">{hr.title}</p>
                            <p className="text-xs text-gray-400">{hr.location} · {hr.category}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600 hidden md:table-cell">{hr.requesterName}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${urgencyColors[hr.urgency] ?? "bg-gray-100 text-gray-600"}`}>{hr.urgency}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Select value={hr.status} onValueChange={(v) => updateHelpStatus(hr.id, v)}>
                                <SelectTrigger className="h-7 text-xs w-32 border-0 shadow-none p-0 gap-1">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[hr.status] ?? "bg-gray-100 text-gray-600"}`}>{hr.status}</span>
                                </SelectTrigger>
                                <SelectContent>
                                  {HELP_STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${approvalColors[hr.approvalStatus] ?? "bg-gray-100 text-gray-600"}`}>{hr.approvalStatus}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors ml-auto">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete this request?</AlertDialogTitle>
                                  <AlertDialogDescription>This will permanently remove the help request and all volunteer joins.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteHelpReq(hr.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── Banners ── */}
          <TabsContent value="banners" className="flex-1 overflow-y-auto px-6 py-5 mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Home banners</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Promotional cards shown in the homepage carousel. Active banners rotate every 6 seconds.
                </p>
              </div>
              <Button onClick={openCreateBanner} className="bg-primary hover:bg-primary/90" data-testid="button-create-banner">
                <Plus className="w-4 h-4 mr-1" /> New banner
              </Button>
            </div>

            {loading.banners && banners.length === 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {[1, 2].map((i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
              </div>
            ) : banners.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
                <p className="font-semibold text-gray-700">No banners yet</p>
                <p className="text-sm text-gray-500 mt-1">
                  The homepage shows the default seva banner. Add your first custom banner to start a carousel.
                </p>
                <Button onClick={openCreateBanner} className="mt-4 bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-1" /> Create banner
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...banners].sort((a, b) => a.position - b.position || a.id - b.id).map((b, idx, arr) => (
                  <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col" data-testid={`banner-card-${b.id}`}>
                    <div
                      className="relative h-32 px-4 py-3"
                      style={{ background: bannerBackground(b) }}
                    >
                      {b.subtitle && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm mb-1.5">
                          <span className="text-[9px] uppercase tracking-wider font-semibold text-white truncate max-w-[140px]">{b.subtitle}</span>
                        </div>
                      )}
                      <h3 className="text-white font-semibold text-base leading-tight line-clamp-2">{b.title}</h3>
                      {!b.active && (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/40 text-white text-[10px] font-semibold uppercase tracking-wide">
                          Hidden
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex flex-col gap-2 flex-1">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="font-mono">#{b.position}</span>
                        {b.ctaLabel && <span className="truncate text-gray-600 max-w-[150px]">→ {b.ctaLabel}</span>}
                      </div>
                      {b.body && <p className="text-xs text-gray-600 line-clamp-2">{b.body}</p>}
                      <div className="flex items-center gap-1 mt-auto pt-2 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => moveBanner(b, -1)}
                          disabled={idx === 0}
                          className="w-7 h-7 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                          title="Move up"
                          data-testid={`button-banner-up-${b.id}`}
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveBanner(b, 1)}
                          disabled={idx === arr.length - 1}
                          className="w-7 h-7 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                          title="Move down"
                          data-testid={`button-banner-down-${b.id}`}
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleBannerActive(b)}
                          className={`w-7 h-7 rounded-md flex items-center justify-center ${b.active ? "text-emerald-600 hover:bg-emerald-50" : "text-gray-400 hover:bg-gray-100"}`}
                          title={b.active ? "Deactivate" : "Activate"}
                          data-testid={`button-banner-toggle-${b.id}`}
                        >
                          {b.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                        <div className="flex-1" />
                        <button
                          type="button"
                          onClick={() => openEditBanner(b)}
                          className="w-7 h-7 rounded-md text-gray-500 hover:bg-gray-100 flex items-center justify-center"
                          title="Edit"
                          data-testid={`button-banner-edit-${b.id}`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              type="button"
                              className="w-7 h-7 rounded-md text-red-500 hover:bg-red-50 flex items-center justify-center"
                              title="Delete"
                              data-testid={`button-banner-delete-${b.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete banner?</AlertDialogTitle>
                              <AlertDialogDescription>
                                "{b.title}" will be removed from the homepage carousel. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteBanner(b.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* ── Banner edit dialog ── */}
        <Dialog open={bannerDialogOpen} onOpenChange={setBannerDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{bannerEditingId == null ? "New banner" : "Edit banner"}</DialogTitle>
              <DialogDescription>
                Banners appear in the homepage carousel. Active banners rotate automatically.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="banner-subtitle">Eyebrow / subtitle</Label>
                  <Input
                    id="banner-subtitle"
                    value={bannerDraft.subtitle}
                    onChange={(e) => setBannerDraft({ ...bannerDraft, subtitle: e.target.value })}
                    placeholder="CREATE IMPACT AT SCALE"
                    maxLength={60}
                    data-testid="input-banner-subtitle"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="banner-position">Order position</Label>
                  <Input
                    id="banner-position"
                    type="number"
                    value={bannerDraft.position}
                    onChange={(e) => setBannerDraft({ ...bannerDraft, position: Number(e.target.value) || 0 })}
                    data-testid="input-banner-position"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="banner-title">Title <span className="text-red-500">*</span></Label>
                <Input
                  id="banner-title"
                  value={bannerDraft.title}
                  onChange={(e) => setBannerDraft({ ...bannerDraft, title: e.target.value })}
                  placeholder="Organise a seva event"
                  maxLength={120}
                  data-testid="input-banner-title"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="banner-body">Body</Label>
                <Textarea
                  id="banner-body"
                  value={bannerDraft.body}
                  onChange={(e) => setBannerDraft({ ...bannerDraft, body: e.target.value })}
                  placeholder="Plan seminars, cleaning drives, food distribution..."
                  rows={3}
                  maxLength={300}
                  data-testid="input-banner-body"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="banner-cta-label">CTA label</Label>
                  <Input
                    id="banner-cta-label"
                    value={bannerDraft.ctaLabel}
                    onChange={(e) => setBannerDraft({ ...bannerDraft, ctaLabel: e.target.value })}
                    placeholder="Create event"
                    maxLength={40}
                    data-testid="input-banner-cta-label"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="banner-cta-href">CTA link</Label>
                  <Input
                    id="banner-cta-href"
                    value={bannerDraft.ctaHref}
                    onChange={(e) => setBannerDraft({ ...bannerDraft, ctaHref: e.target.value })}
                    placeholder="/app/events or https://..."
                    data-testid="input-banner-cta-href"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="banner-image">Background image URL (optional)</Label>
                <Input
                  id="banner-image"
                  value={bannerDraft.imageUrl}
                  onChange={(e) => setBannerDraft({ ...bannerDraft, imageUrl: e.target.value })}
                  placeholder="https://..."
                  data-testid="input-banner-image"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="banner-from">Gradient start</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="banner-from"
                      type="color"
                      value={bannerDraft.gradientFrom}
                      onChange={(e) => setBannerDraft({ ...bannerDraft, gradientFrom: e.target.value })}
                      className="w-12 h-9 p-1 cursor-pointer"
                    />
                    <Input
                      value={bannerDraft.gradientFrom}
                      onChange={(e) => setBannerDraft({ ...bannerDraft, gradientFrom: e.target.value })}
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="banner-to">Gradient end</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="banner-to"
                      type="color"
                      value={bannerDraft.gradientTo}
                      onChange={(e) => setBannerDraft({ ...bannerDraft, gradientTo: e.target.value })}
                      className="w-12 h-9 p-1 cursor-pointer"
                    />
                    <Input
                      value={bannerDraft.gradientTo}
                      onChange={(e) => setBannerDraft({ ...bannerDraft, gradientTo: e.target.value })}
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50">
                <div>
                  <Label htmlFor="banner-active" className="font-semibold cursor-pointer">Active</Label>
                  <p className="text-xs text-gray-500 mt-0.5">Show this banner on the homepage</p>
                </div>
                <Switch
                  id="banner-active"
                  checked={bannerDraft.active}
                  onCheckedChange={(v) => setBannerDraft({ ...bannerDraft, active: v })}
                  data-testid="switch-banner-active"
                />
              </div>

              {/* Live preview */}
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-gray-500">Preview</Label>
                <div
                  className="relative overflow-hidden rounded-2xl px-5 py-5 min-h-[140px]"
                  style={{
                    background: bannerBackground({
                      gradientFrom: bannerDraft.gradientFrom,
                      gradientTo: bannerDraft.gradientTo,
                      imageUrl: bannerDraft.imageUrl || null,
                    }),
                  }}
                >
                  {bannerDraft.subtitle && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm mb-2">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-white">{bannerDraft.subtitle}</span>
                    </div>
                  )}
                  <h3 className="text-white font-semibold text-lg leading-tight">{bannerDraft.title || "Title preview"}</h3>
                  {bannerDraft.body && <p className="text-white/85 text-[13px] mt-1.5">{bannerDraft.body}</p>}
                  {bannerDraft.ctaLabel && (
                    <div className="mt-3 inline-flex items-center gap-2 bg-white text-primary font-semibold text-[12px] px-3 py-1.5 rounded-full">
                      {bannerDraft.ctaLabel}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setBannerDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveBanner} disabled={bannerSaving} className="bg-primary hover:bg-primary/90" data-testid="button-save-banner">
                {bannerSaving ? "Saving..." : bannerEditingId == null ? "Create banner" : "Save changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
