import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, Users, FileText, Calendar, AlertCircle, Trash2,
  TrendingUp, Activity, RefreshCw, ArrowLeft, Edit3, Check, X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const API_BASE = "/api";

type Overview = {
  counts: { users: number; posts: number; events: number; helpRequests: number; totalHelped: number };
  recentUsers: { id: number; name: string; avatar: string; rank: string; location: string; joinedAt: string | null }[];
  recentPosts: { id: number; content: string; category: string; userId: number; helpedPeople: number; timestamp: string | null }[];
};

type AdminUser = { id: number; name: string; avatar: string; location: string; rank: string; totalHelped: number; followersCount: number; postsCount: number; joinedAt: string | null };
type AdminPost = { id: number; userId: number; userName: string; userAvatar: string; content: string; category: string; helpedPeople: number; likes: number; location: string | null; timestamp: string | null };
type AdminEvent = { id: number; title: string; category: string; date: string; location: string; status: string; organizerId: number; organizerName: string; volunteersNeeded: number; createdAt: string | null };
type AdminHelpRequest = { id: number; title: string; category: string; urgency: string; location: string; status: string; requesterId: number; requesterName: string; peopleNeeded: number; deadline: string | null; createdAt: string | null };

const RANKS = ["Sevak", "Karyakarta", "Nayak", "Veer", "Sardar"];
const EVENT_STATUSES = ["upcoming", "ongoing", "completed", "cancelled"];
const HELP_STATUSES = ["open", "in_progress", "fulfilled", "closed"];

const rankColors: Record<string, string> = {
  Sevak: "bg-gray-100 text-gray-700",
  Karyakarta: "bg-blue-100 text-blue-700",
  Nayak: "bg-purple-100 text-purple-700",
  Veer: "bg-orange-100 text-orange-700",
  Sardar: "bg-red-100 text-red-700",
};

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
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [helpReqs, setHelpReqs] = useState<AdminHelpRequest[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [editingRank, setEditingRank] = useState<{ id: number; rank: string } | null>(null);

  const setLoad = (key: string, val: boolean) =>
    setLoading((prev) => ({ ...prev, [key]: val }));

  const fetchOverview = useCallback(async () => {
    setLoad("overview", true);
    try {
      const r = await fetch(`${API_BASE}/admin/overview`);
      setOverview(await r.json());
    } finally {
      setLoad("overview", false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoad("users", true);
    try {
      const r = await fetch(`${API_BASE}/admin/users?limit=100`);
      setUsers(await r.json());
    } finally {
      setLoad("users", false);
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoad("posts", true);
    try {
      const r = await fetch(`${API_BASE}/admin/posts?limit=100`);
      setPosts(await r.json());
    } finally {
      setLoad("posts", false);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoad("events", true);
    try {
      const r = await fetch(`${API_BASE}/admin/events?limit=100`);
      setEvents(await r.json());
    } finally {
      setLoad("events", false);
    }
  }, []);

  const fetchHelpReqs = useCallback(async () => {
    setLoad("help", true);
    try {
      const r = await fetch(`${API_BASE}/admin/help-requests?limit=100`);
      setHelpReqs(await r.json());
    } finally {
      setLoad("help", false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
    fetchUsers();
    fetchPosts();
    fetchEvents();
    fetchHelpReqs();
  }, [fetchOverview, fetchUsers, fetchPosts, fetchEvents, fetchHelpReqs]);

  const deleteUser = async (id: number) => {
    const r = await fetch(`${API_BASE}/admin/users/${id}`, { method: "DELETE" });
    if (r.ok) {
      setUsers((u) => u.filter((x) => x.id !== id));
      fetchOverview();
      toast({ title: "User deleted" });
    } else {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const saveRank = async (id: number, rank: string) => {
    const r = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rank }),
    });
    if (r.ok) {
      setUsers((u) => u.map((x) => (x.id === id ? { ...x, rank } : x)));
      setEditingRank(null);
      toast({ title: "Rank updated" });
    } else {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const deletePost = async (id: number) => {
    const r = await fetch(`${API_BASE}/admin/posts/${id}`, { method: "DELETE" });
    if (r.ok) {
      setPosts((p) => p.filter((x) => x.id !== id));
      fetchOverview();
      toast({ title: "Post deleted" });
    } else {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const updateEventStatus = async (id: number, status: string) => {
    const r = await fetch(`${API_BASE}/admin/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (r.ok) {
      setEvents((e) => e.map((x) => (x.id === id ? { ...x, status } : x)));
      toast({ title: "Event status updated" });
    } else {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const deleteEvent = async (id: number) => {
    const r = await fetch(`${API_BASE}/admin/events/${id}`, { method: "DELETE" });
    if (r.ok) {
      setEvents((e) => e.filter((x) => x.id !== id));
      fetchOverview();
      toast({ title: "Event deleted" });
    } else {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const updateHelpStatus = async (id: number, status: string) => {
    const r = await fetch(`${API_BASE}/admin/help-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (r.ok) {
      setHelpReqs((h) => h.map((x) => (x.id === id ? { ...x, status } : x)));
      toast({ title: "Status updated" });
    } else {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const deleteHelpReq = async (id: number) => {
    const r = await fetch(`${API_BASE}/admin/help-requests/${id}`, { method: "DELETE" });
    if (r.ok) {
      setHelpReqs((h) => h.filter((x) => x.id !== id));
      fetchOverview();
      toast({ title: "Request deleted" });
    } else {
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
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-xs"
          onClick={() => { fetchOverview(); fetchUsers(); fetchPosts(); fetchEvents(); fetchHelpReqs(); }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh All
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="overview" className="flex flex-col h-full">
          <TabsList className="mx-6 mt-4 mb-0 grid grid-cols-5 bg-gray-100 rounded-xl h-9 shrink-0">
            <TabsTrigger value="overview" className="text-xs rounded-lg">Overview</TabsTrigger>
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Recent Users */}
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
                  {/* Recent Posts */}
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
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Rank</th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide hidden md:table-cell">Location</th>
                        <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide hidden lg:table-cell">Helped</th>
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
                                <Select
                                  value={editingRank.rank}
                                  onValueChange={(v) => setEditingRank({ id: u.id, rank: v })}
                                >
                                  <SelectTrigger className="h-7 text-xs w-32">
                                    <SelectValue />
                                  </SelectTrigger>
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
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rankColors[u.rank] ?? "bg-gray-100 text-gray-600"}`}>{u.rank}</span>
                                <button onClick={() => setEditingRank({ id: u.id, rank: u.rank })} className="w-5 h-5 flex items-center justify-center rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100">
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs hidden md:table-cell">{u.location}</td>
                          <td className="px-4 py-3 text-right font-semibold text-orange-600 hidden lg:table-cell">{u.totalHelped}</td>
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
                                  <AlertDialogDescription>
                                    This will permanently delete the user and all their posts, comments, and activity. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteUser(u.id)} className="bg-red-600 hover:bg-red-700">
                                    Delete
                                  </AlertDialogAction>
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
                            <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">{p.category}</span>
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
                                  <AlertDialogDescription>
                                    This will permanently remove the post and all its likes and comments.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deletePost(p.id)} className="bg-red-600 hover:bg-red-700">
                                    Delete
                                  </AlertDialogAction>
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
                            <Select value={ev.status} onValueChange={(v) => updateEventStatus(ev.id, v)}>
                              <SelectTrigger className="h-7 text-xs w-32 border-0 shadow-none p-0 gap-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[ev.status] ?? "bg-gray-100 text-gray-600"}`}>
                                  {ev.status}
                                </span>
                              </SelectTrigger>
                              <SelectContent>
                                {EVENT_STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                              </SelectContent>
                            </Select>
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
                                  <AlertDialogDescription>
                                    This will permanently remove the event and all registrations.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteEvent(ev.id)} className="bg-red-600 hover:bg-red-700">
                                    Delete
                                  </AlertDialogAction>
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
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${urgencyColors[hr.urgency] ?? "bg-gray-100 text-gray-600"}`}>
                              {hr.urgency}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Select value={hr.status} onValueChange={(v) => updateHelpStatus(hr.id, v)}>
                              <SelectTrigger className="h-7 text-xs w-32 border-0 shadow-none p-0 gap-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[hr.status] ?? "bg-gray-100 text-gray-600"}`}>
                                  {hr.status}
                                </span>
                              </SelectTrigger>
                              <SelectContent>
                                {HELP_STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
                              </SelectContent>
                            </Select>
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
                                  <AlertDialogDescription>
                                    This will permanently remove the help request and all volunteer joins.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteHelpReq(hr.id)} className="bg-red-600 hover:bg-red-700">
                                    Delete
                                  </AlertDialogAction>
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
        </Tabs>
      </div>
    </div>
  );
}
