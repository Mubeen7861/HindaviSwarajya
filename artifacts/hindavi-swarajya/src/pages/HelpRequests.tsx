import { useState } from "react";
import { Link } from "wouter";
import {
  useListHelpRequests,
  useCreateHelpRequest,
  useJoinHelpRequest,
  getListHelpRequestsQueryKey,
} from "@workspace/api-client-react";
import { HelpRequest } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUserId } from "@/hooks/useCurrentUser";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle, MapPin, Users, Plus, Search,
  CheckCircle, ArrowLeft, Heart, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

const CATEGORIES = ["Food","Education","Health","Shelter","Other"] as const;
const URGENCIES = ["Low","Medium","High","Emergency"] as const;

const urgencyColors: Record<string, string> = {
  Low: "bg-green-100 text-green-800 border-green-200",
  Medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  High: "bg-orange-100 text-orange-800 border-orange-200",
  Emergency: "bg-red-100 text-red-800 border-red-200",
};

const categoryColors: Record<string, string> = {
  Food: "bg-green-100 text-green-800",
  Education: "bg-blue-100 text-blue-800",
  Health: "bg-red-100 text-red-800",
  Shelter: "bg-purple-100 text-purple-800",
  Other: "bg-gray-100 text-gray-800",
};

export default function HelpRequests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUserId = useCurrentUserId();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<HelpRequest | null>(null);

  const [form, setForm] = useState({
    title: "", description: "", category: "Other",
    urgency: "Medium", location: "", peopleNeeded: "5",
    deadline: "", contactInfo: "",
  });

  const { data: requests, isLoading } = useListHelpRequests({}, {
    query: { queryKey: getListHelpRequestsQueryKey() },
  });

  const createHelpRequest = useCreateHelpRequest({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListHelpRequestsQueryKey() });
        setCreateOpen(false);
        toast({ title: "Submitted for admin approval", description: "Sevaks will be notified once an admin approves your request." });
        setForm({ title: "", description: "", category: "Other", urgency: "Medium", location: "", peopleNeeded: "5", deadline: "", contactInfo: "" });
      },
      onError: () => toast({ title: "Failed to post request", variant: "destructive" }),
    },
  });

  const joinHelpRequest = useJoinHelpRequest({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListHelpRequestsQueryKey() });
        toast({ title: data.joined ? "You're helping! 🙏" : "Left the request", description: data.joined ? "Thank you for volunteering." : "" });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUserId === undefined) {
      toast({ title: "Please sign in to post a request", variant: "destructive" });
      return;
    }
    createHelpRequest.mutate({
      data: {
        title: form.title,
        description: form.description,
        category: form.category as "Food"|"Education"|"Health"|"Shelter"|"Other",
        urgency: form.urgency as "Low"|"Medium"|"High"|"Emergency",
        location: form.location,
        peopleNeeded: parseInt(form.peopleNeeded) || 5,
        deadline: form.deadline || null,
        contactInfo: form.contactInfo || null,
      },
    });
  };

  const filteredReqs = (requests ?? []).filter(r => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "All" || r.category === filterCategory;
    return matchSearch && matchCat;
  });

  const emergencyReqs = filteredReqs.filter(r => r.urgency === "Emergency");
  const normalReqs = filteredReqs.filter(r => r.urgency !== "Emergency");

  const onJoin = (id: number) => {
    if (currentUserId === undefined) {
      toast({ title: "Please sign in to help", variant: "destructive" });
      return;
    }
    joinHelpRequest.mutate({ id });
  };

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
            <h1 className="text-2xl font-bold text-primary font-serif leading-tight">Help Requests</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Find someone who needs your seva</p>
          </div>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-[#FF6F00] hover:bg-[#E65100]" data-testid="button-create-help-request">
              <Plus className="w-4 h-4" /> New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl text-primary font-serif">Request Help</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input placeholder="What kind of help do you need?" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required data-testid="input-help-title" />
              </div>
              <div className="space-y-1.5">
                <Label>Description *</Label>
                <Textarea placeholder="Describe the situation in detail..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required className="min-h-20 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Urgency</Label>
                  <Select value={form.urgency} onValueChange={v => setForm(p => ({ ...p, urgency: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{URGENCIES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Location *</Label>
                <Input placeholder="City, Village, District" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>People Needed</Label>
                  <Input type="number" min={1} value={form.peopleNeeded} onChange={e => setForm(p => ({ ...p, peopleNeeded: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Deadline (optional)</Label>
                  <Input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Contact Info (optional)</Label>
                <Input placeholder="Phone / email" value={form.contactInfo} onChange={e => setForm(p => ({ ...p, contactInfo: e.target.value }))} />
              </div>
              <Button type="submit" className="w-full bg-[#FF6F00] hover:bg-[#E65100] gap-2" disabled={createHelpRequest.isPending || currentUserId === undefined} data-testid="button-submit-help-request">
                <Heart className="w-4 h-4" />
                {createHelpRequest.isPending ? "Posting..." : "Post Request"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 border-b border-gray-100 bg-white flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search help requests..." className="pl-9 h-9 bg-gray-50 border-gray-200 rounded-xl text-sm" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["All", ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setFilterCategory(c)}
              className={`px-3 h-9 rounded-xl text-xs font-semibold transition-colors ${filterCategory === c ? "bg-[#FF6F00] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Feed */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-36 rounded-2xl" />)}</div>
        ) : filteredReqs.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-600 mb-1">No help requests</h3>
            <p className="text-sm text-muted-foreground mb-4">Post a request if you or someone needs help.</p>
            <Button onClick={() => setCreateOpen(true)} className="bg-[#FF6F00] hover:bg-[#E65100] gap-2">
              <Plus className="w-4 h-4" /> Post Request
            </Button>
          </div>
        ) : (
          <>
            {emergencyReqs.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-3">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-bold text-red-700">Emergency Requests ({emergencyReqs.length})</span>
                </div>
                <div className="space-y-3">
                  {emergencyReqs.map((r, i) => <RequestCard key={r.id} r={r} i={i} currentUserId={currentUserId} onJoin={onJoin} onClick={() => setSelectedReq(r)} isPending={joinHelpRequest.isPending} />)}
                </div>
              </div>
            )}
            <AnimatePresence>
              {normalReqs.map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <RequestCard r={r} i={i} currentUserId={currentUserId} onJoin={onJoin} onClick={() => setSelectedReq(r)} isPending={joinHelpRequest.isPending} />
                </motion.div>
              ))}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Detail Dialog */}
      {selectedReq && (
        <Dialog open={!!selectedReq} onOpenChange={() => setSelectedReq(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex gap-2 mb-1 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${urgencyColors[selectedReq.urgency]}`}>{selectedReq.urgency}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${categoryColors[selectedReq.category]}`}>{selectedReq.category}</span>
              </div>
              <DialogTitle className="text-lg font-bold text-gray-900">{selectedReq.title}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600">{selectedReq.description}</p>
            <div className="space-y-2 bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-[#FF6F00]" /><span>{selectedReq.location}</span></div>
              <div className="flex items-center gap-2 text-sm"><Users className="w-4 h-4 text-[#FF6F00]" /><span>{selectedReq.helpersJoined.length} / {selectedReq.peopleNeeded} helpers joined</span></div>
              {selectedReq.deadline && <div className="flex items-center gap-2 text-sm"><Clock className="w-4 h-4 text-[#FF6F00]" /><span>Deadline: {selectedReq.deadline}</span></div>}
              {selectedReq.contactInfo && <div className="flex items-center gap-2 text-sm"><span className="text-gray-500">Contact:</span><span>{selectedReq.contactInfo}</span></div>}
            </div>
            <div className="flex items-center gap-3">
              <Avatar className="w-9 h-9"><AvatarImage src={selectedReq.requester?.avatar} /><AvatarFallback>{selectedReq.requester?.name?.substring(0, 2)}</AvatarFallback></Avatar>
              <div><p className="text-xs text-gray-400">Requested by</p><p className="text-sm font-semibold">{selectedReq.requester?.name}</p></div>
            </div>
            {currentUserId !== undefined && selectedReq.requesterId !== currentUserId && (
              <Button
                className={`w-full gap-2 ${selectedReq.helpersJoined.includes(currentUserId) ? "bg-red-50 text-red-700 border border-red-200" : "bg-[#FF6F00] hover:bg-[#E65100] text-white"}`}
                variant={selectedReq.helpersJoined.includes(currentUserId) ? "outline" : "default"}
                onClick={() => onJoin(selectedReq.id)}
                disabled={joinHelpRequest.isPending}
              >
                <Heart className="w-4 h-4" />
                {selectedReq.helpersJoined.includes(currentUserId) ? "Leave request" : "I can help!"}
              </Button>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function RequestCard({ r, currentUserId, onJoin, onClick, isPending }: {
  r: HelpRequest; i: number;
  currentUserId: number | undefined;
  onJoin: (id: number) => void;
  onClick: () => void;
  isPending: boolean;
}) {
  const isJoined = currentUserId !== undefined && r.helpersJoined.includes(currentUserId);
  const isOwn = currentUserId !== undefined && r.requesterId === currentUserId;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer" onClick={onClick}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex gap-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${urgencyColors[r.urgency] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}>
            {r.urgency}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${categoryColors[r.category] ?? "bg-gray-100 text-gray-700"}`}>
            {r.category}
          </span>
        </div>
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold shrink-0 ${r.status === "open" ? "bg-blue-50 text-blue-700" : r.status === "in-progress" ? "bg-orange-50 text-orange-700" : "bg-gray-100 text-gray-600"}`}>
          {r.status}
        </span>
      </div>
      <h3 className="font-bold text-gray-900 mb-1 leading-tight">{r.title}</h3>
      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{r.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{r.location}</span>
          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{r.helpersJoined.length}/{r.peopleNeeded}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</span>
        </div>
        {!isOwn && (
          <Button
            size="sm"
            onClick={e => { e.stopPropagation(); onJoin(r.id); }}
            className={`text-xs h-7 gap-1 ${isJoined ? "bg-green-50 text-green-700 border border-green-200 hover:bg-red-50 hover:text-red-700" : "bg-[#FF6F00] text-white hover:bg-[#E65100]"}`}
            variant={isJoined ? "outline" : "default"}
            disabled={isPending || currentUserId === undefined}
            data-testid={`button-join-request-${r.id}`}
          >
            {isJoined ? <><CheckCircle className="w-3 h-3" /> Helping</> : <><Heart className="w-3 h-3" /> Help</>}
          </Button>
        )}
      </div>
    </div>
  );
}
