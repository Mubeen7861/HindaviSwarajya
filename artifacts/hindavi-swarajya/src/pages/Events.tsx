import { useState } from "react";
import { Link } from "wouter";
import {
  useListEvents,
  useCreateEvent,
  useRegisterForEvent,
  getListEventsQueryKey,
} from "@workspace/api-client-react";
import { SevaEvent } from "@workspace/api-client-react";
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
  Calendar, MapPin, Users, Plus, Search,
  CheckCircle, ArrowLeft, Sparkles, Tag, Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const EVENT_TYPES = ["Seminar","Cleaning Drive","Food Distribution","Medical Camp","Blood Donation","Tree Plantation","Awareness Campaign","Workshop","Other"] as const;
const CATEGORIES = ["Food","Education","Health","Shelter","Other"] as const;

const typeColors: Record<string, string> = {
  "Seminar": "bg-blue-100 text-blue-800",
  "Cleaning Drive": "bg-green-100 text-green-800",
  "Food Distribution": "bg-orange-100 text-orange-800",
  "Medical Camp": "bg-red-100 text-red-800",
  "Blood Donation": "bg-pink-100 text-pink-800",
  "Tree Plantation": "bg-emerald-100 text-emerald-800",
  "Awareness Campaign": "bg-purple-100 text-purple-800",
  "Workshop": "bg-indigo-100 text-indigo-800",
  "Other": "bg-gray-100 text-gray-800",
};

const statusColors: Record<string, string> = {
  upcoming: "bg-blue-100 text-blue-800",
  ongoing: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-800",
};

export default function Events() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUserId = useCurrentUserId();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SevaEvent | null>(null);

  const [form, setForm] = useState({
    title: "", description: "", eventType: "Seminar",
    category: "Other", date: "", time: "10:00 AM",
    location: "", address: "", volunteersNeeded: "20",
    duration: "", requirements: "", tags: "",
  });

  const { data: events, isLoading } = useListEvents({}, {
    query: { queryKey: getListEventsQueryKey() },
  });

  const createEvent = useCreateEvent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
        setCreateOpen(false);
        toast({ title: "Submitted for admin approval", description: "Your event will go live once an admin approves it." });
        setForm({ title: "", description: "", eventType: "Seminar", category: "Other", date: "", time: "10:00 AM", location: "", address: "", volunteersNeeded: "20", duration: "", requirements: "", tags: "" });
      },
      onError: () => toast({ title: "Failed to create event", variant: "destructive" }),
    },
  });

  const registerForEvent = useRegisterForEvent({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
        toast({ title: data.registered ? "Registered! 🎉" : "Registration cancelled", description: data.registered ? "You're now signed up for this event." : "" });
      },
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUserId === undefined) {
      toast({ title: "Please sign in to create an event", variant: "destructive" });
      return;
    }
    createEvent.mutate({
      data: {
        title: form.title,
        description: form.description,
        eventType: form.eventType,
        category: form.category as "Food" | "Education" | "Health" | "Shelter" | "Other",
        date: form.date,
        time: form.time,
        location: form.location,
        address: form.address,
        volunteersNeeded: parseInt(form.volunteersNeeded) || 20,
        tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
        duration: form.duration || null,
        requirements: form.requirements || null,
        image: null,
      },
    });
  };

  const filteredEvents = (events ?? []).filter(ev => {
    const matchSearch = !search || ev.title.toLowerCase().includes(search.toLowerCase()) || ev.location.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || ev.status === filterStatus;
    return matchSearch && matchStatus;
  });

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
            <h1 className="text-2xl font-bold text-primary font-serif leading-tight">Seva Events</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Organize and join community seva events</p>
          </div>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-[#FF6F00] hover:bg-[#E65100] shadow-sm" data-testid="button-create-event">
              <Plus className="w-4 h-4" /> Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl text-primary font-serif">Create a Seva Event</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>Event Title *</Label>
                <Input placeholder="e.g. Free Medical Camp – Nashik" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required data-testid="input-event-title" />
              </div>
              <div className="space-y-1.5">
                <Label>Description *</Label>
                <Textarea placeholder="What will happen at this event?" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required className="min-h-20 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Event Type *</Label>
                  <Select value={form.eventType} onValueChange={v => setForm(p => ({ ...p, eventType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Category *</Label>
                  <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Date *</Label>
                  <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Time</Label>
                  <Input placeholder="e.g. 9:00 AM" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Location *</Label>
                <Input placeholder="City, District" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Full Address</Label>
                <Input placeholder="Street / Venue name" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Volunteers Needed</Label>
                  <Input type="number" min={1} value={form.volunteersNeeded} onChange={e => setForm(p => ({ ...p, volunteersNeeded: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Duration</Label>
                  <Input placeholder="e.g. 3 hours" value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Tags (comma-separated)</Label>
                <Input placeholder="e.g. health, free, camp" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Requirements</Label>
                <Textarea placeholder="What should volunteers bring?" value={form.requirements} onChange={e => setForm(p => ({ ...p, requirements: e.target.value }))} className="min-h-16 resize-none" />
              </div>
              <Button type="submit" className="w-full bg-[#FF6F00] hover:bg-[#E65100] gap-2" disabled={createEvent.isPending || currentUserId === undefined} data-testid="button-submit-event">
                <Sparkles className="w-4 h-4" />
                {createEvent.isPending ? "Creating..." : "Publish Event"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 border-b border-gray-100 bg-white flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search events..." className="pl-9 h-9 bg-gray-50 border-gray-200 rounded-xl text-sm" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5">
          {["all","upcoming","ongoing","completed"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 h-9 rounded-xl text-xs font-semibold transition-colors capitalize ${filterStatus === s ? "bg-[#FF6F00] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-600 mb-1">No events found</h3>
            <p className="text-sm text-muted-foreground mb-4">Be the first to organize a seva event!</p>
            <Button onClick={() => setCreateOpen(true)} className="bg-[#FF6F00] hover:bg-[#E65100] gap-2">
              <Plus className="w-4 h-4" /> Create Event
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AnimatePresence>
              {filteredEvents.map((event, i) => {
                const isRegistered = currentUserId !== undefined && event.volunteersRegistered.includes(currentUserId);
                const spotsLeft = event.volunteersNeeded - event.volunteersRegistered.length;
                return (
                  <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer" onClick={() => setSelectedEvent(event)}>
                      {event.image && (
                        <img src={event.image} alt={event.title} className="w-full h-36 object-cover" loading="lazy" />
                      )}
                      {!event.image && (
                        <div className="h-20 bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
                          <Calendar className="w-8 h-8 text-[#FF6F00] opacity-40" />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-bold text-gray-900 leading-tight line-clamp-2 flex-1">{event.title}</h3>
                          <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[event.status] ?? "bg-gray-100 text-gray-700"}`}>
                            {event.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{event.description}</p>
                        <div className="space-y-1.5 mb-3">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Calendar className="w-3.5 h-3.5 text-[#FF6F00] shrink-0" />
                            <span>{event.date} • {event.time}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <MapPin className="w-3.5 h-3.5 text-[#FF6F00] shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Users className="w-3.5 h-3.5 text-[#FF6F00] shrink-0" />
                            <span>{event.volunteersRegistered.length}/{event.volunteersNeeded} registered • {Math.max(0, spotsLeft)} spots left</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={event.organizer?.avatar} />
                              <AvatarFallback className="text-xs">{event.organizer?.name?.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-gray-500">{event.organizer?.name}</span>
                          </div>
                          <Button
                            size="sm"
                            onClick={e => { e.stopPropagation(); registerForEvent.mutate({ id: event.id }); }}
                            className={`text-xs h-7 gap-1 ${isRegistered ? "bg-green-50 text-green-700 border border-green-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200" : "bg-[#FF6F00] text-white hover:bg-[#E65100]"}`}
                            variant={isRegistered ? "outline" : "default"}
                            disabled={registerForEvent.isPending || currentUserId === undefined || (spotsLeft <= 0 && !isRegistered)}
                            data-testid={`button-register-event-${event.id}`}
                          >
                            {isRegistered ? <><CheckCircle className="w-3 h-3" /> Registered</> : "Register"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Event Detail Dialog */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-start gap-3">
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${typeColors[selectedEvent.eventType] ?? "bg-gray-100 text-gray-700"}`}>
                    {selectedEvent.eventType}
                  </span>
                  <DialogTitle className="text-lg font-bold mt-1 text-gray-900">{selectedEvent.title}</DialogTitle>
                </div>
              </div>
            </DialogHeader>
            {selectedEvent.image && <img src={selectedEvent.image} alt={selectedEvent.title} className="w-full h-44 object-cover rounded-xl" />}
            <p className="text-sm text-gray-600 leading-relaxed">{selectedEvent.description}</p>
            <div className="space-y-2 bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 text-sm"><Calendar className="w-4 h-4 text-[#FF6F00]" /><span>{selectedEvent.date} at {selectedEvent.time}</span>{selectedEvent.duration && <span className="text-gray-400">({selectedEvent.duration})</span>}</div>
              <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-[#FF6F00]" /><span>{selectedEvent.location}{selectedEvent.address ? ` – ${selectedEvent.address}` : ""}</span></div>
              <div className="flex items-center gap-2 text-sm"><Users className="w-4 h-4 text-[#FF6F00]" /><span>{selectedEvent.volunteersRegistered.length} / {selectedEvent.volunteersNeeded} registered</span></div>
            </div>
            {selectedEvent.requirements && (
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
                <p className="text-xs font-semibold text-[#FF6F00] mb-1">What to bring</p>
                <p className="text-sm text-gray-700">{selectedEvent.requirements}</p>
              </div>
            )}
            {selectedEvent.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedEvent.tags.map(t => <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full"><Tag className="w-3 h-3 inline mr-1" />{t}</span>)}
              </div>
            )}
            <div className="flex items-center gap-3 pt-2">
              <Avatar className="w-9 h-9"><AvatarImage src={selectedEvent.organizer?.avatar} /><AvatarFallback className="text-sm">{selectedEvent.organizer?.name?.substring(0, 2)}</AvatarFallback></Avatar>
              <div><p className="text-xs text-gray-400">Organized by</p><p className="text-sm font-semibold">{selectedEvent.organizer?.name}</p></div>
            </div>
            {(() => {
              const isRegistered = currentUserId !== undefined && selectedEvent.volunteersRegistered.includes(currentUserId);
              return (
                <Button
                  className={`w-full gap-2 ${isRegistered ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100" : "bg-[#FF6F00] hover:bg-[#E65100] text-white"}`}
                  variant={isRegistered ? "outline" : "default"}
                  onClick={() => registerForEvent.mutate({ id: selectedEvent.id })}
                  disabled={registerForEvent.isPending || currentUserId === undefined}
                >
                  {isRegistered
                    ? <><Zap className="w-4 h-4" /> Cancel Registration</>
                    : <><CheckCircle className="w-4 h-4" /> Register as Volunteer</>
                  }
                </Button>
              );
            })()}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
