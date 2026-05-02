import { useState } from "react";
import { Link } from "wouter";
import { useListPosts, useGetLeaderboard, getListPostsQueryKey, getGetLeaderboardQueryKey } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { RankBadge } from "@/components/RankBadge";
import {
  ArrowLeft, Search, Users, MessageCircle, BookOpen,
  Pin, Eye, Heart, Trophy, Crown, Award, Medal
} from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

const MOCK_DISCUSSIONS = [
  {
    id: "d1", title: "How can we organize more effective seva drives in our local communities?",
    content: "I've been thinking about ways to make our seva activities more impactful and reach more people in need. What strategies have worked well in your areas?",
    author: { name: "Vikrant Jadhav", avatar: "https://i.pravatar.cc/100?u=vikrant", rank: "Nayak", location: "Nashik" },
    category: "General", timeAgo: "2 hours ago", replies: 23, likes: 45, views: 156, isPinned: true,
    tags: ["seva", "community", "organization"],
  },
  {
    id: "d2", title: "Understanding Maharaj's philosophy on Swarajya in modern context",
    content: "How do we apply Chhatrapati Shivaji Maharaj's principles of self-governance and independence in today's world?",
    author: { name: "Dr. Rajendra More", avatar: "https://i.pravatar.cc/100?u=rajendra", rank: "Sardar", location: "Pune" },
    category: "Teachings", timeAgo: "5 hours ago", replies: 41, likes: 89, views: 312, isPinned: true,
    tags: ["maharaj", "philosophy", "swarajya"],
  },
  {
    id: "d3", title: "Best practices for running a free medical camp",
    content: "Sharing my experience from running 12 medical camps in rural Maharashtra. Happy to answer questions!",
    author: { name: "Dr. Priya Shinde", avatar: "https://i.pravatar.cc/100?u=priya", rank: "Karyakarta", location: "Satara" },
    category: "Support", timeAgo: "1 day ago", replies: 17, likes: 52, views: 198,
    tags: ["health", "medical-camp", "tips"],
  },
  {
    id: "d4", title: "Youth education initiative — looking for tutors in Marathwada",
    content: "We are starting a free tutoring program for Class 8–10 students in rural Marathwada. Need volunteers who can commit 4 hours/week.",
    author: { name: "Sneha Kulkarni", avatar: "https://i.pravatar.cc/100?u=sneha", rank: "Sevak", location: "Aurangabad" },
    category: "Events", timeAgo: "2 days ago", replies: 8, likes: 31, views: 112,
    tags: ["education", "volunteer", "tutoring"],
  },
  {
    id: "d5", title: "Celebrating 500 lives changed in our food distribution drive!",
    content: "Our team has reached a milestone — 500 families fed through our monthly drives. Sharing photos and stories.",
    author: { name: "Manoj Patil", avatar: "https://i.pravatar.cc/100?u=manoj", rank: "Nayak", location: "Kolhapur" },
    category: "General", timeAgo: "3 days ago", replies: 34, likes: 127, views: 420,
    tags: ["milestone", "food", "impact"],
  },
];

const MOCK_TEACHINGS = [
  {
    id: "t1", title: "The Seven Pillars of Maharaj's Leadership",
    quote: "स्वराज्य हा माझा जन्मसिद्ध हक्क आहे",
    content: "Shivaji Maharaj's leadership was built on seven principles — courage, strategy, justice, humility, inclusivity, spirituality, and service.",
    author: { name: "Pandit Dinanath", avatar: "https://i.pravatar.cc/100?u=pandit", rank: "Sardar" },
    category: "Leadership", likes: 234, saves: 89, timeAgo: "1 week ago",
    image: "https://images.unsplash.com/photo-1598538651017-a45d505b5ef4?w=400&h=200&fit=crop",
  },
  {
    id: "t2", title: "Seva as Dharma — Ancient Wisdom for Modern Action",
    quote: "सेवा परमो धर्म:",
    content: "The concept of seva — selfless service — is at the heart of the Hindavi Swarajya movement. Every act of kindness strengthens the community.",
    author: { name: "Acharya Suresh", avatar: "https://i.pravatar.cc/100?u=acharya", rank: "Senapati" },
    category: "Values", likes: 189, saves: 67, timeAgo: "2 weeks ago",
    image: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400&h=200&fit=crop",
  },
  {
    id: "t3", title: "The Mavala Spirit — Courage in Community",
    quote: "जो वाढविल धर्म सकळांचा सो वाढविल राज्य आपणासि",
    content: "Maharaj's Mavale — mountain warriors — embodied the spirit of service to the community. Their courage was not just on the battlefield.",
    author: { name: "Prof. Shashikant", avatar: "https://i.pravatar.cc/100?u=shashi", rank: "Nayak" },
    category: "History", likes: 145, saves: 44, timeAgo: "3 weeks ago",
    image: "https://images.unsplash.com/photo-1586899028174-e7098604235b?w=400&h=200&fit=crop",
  },
];

const categoryColors: Record<string, string> = {
  General: "bg-gray-100 text-gray-700",
  Teachings: "bg-purple-100 text-purple-700",
  Events: "bg-blue-100 text-blue-700",
  Support: "bg-green-100 text-green-700",
  Leadership: "bg-orange-100 text-orange-700",
  Values: "bg-teal-100 text-teal-700",
  History: "bg-amber-100 text-amber-700",
  Inspiration: "bg-pink-100 text-pink-700",
};

export default function Community() {
  const [search, setSearch] = useState("");

  const { data: leaderboard } = useGetLeaderboard({ limit: 10 }, {
    query: { queryKey: getGetLeaderboardQueryKey({ limit: 10 }) },
  });

  const filteredDiscussions = MOCK_DISCUSSIONS.filter(d =>
    !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-primary font-serif leading-tight">Community</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Discussions, teachings & connections</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 py-3 border-b border-gray-100 bg-white">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search discussions and teachings..." className="pl-9 h-9 bg-gray-50 border-gray-200 rounded-xl text-sm" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="discussions" className="flex flex-col h-full">
          <TabsList className="mx-6 mt-3 mb-0 grid grid-cols-3 bg-gray-100 rounded-xl h-9">
            <TabsTrigger value="discussions" className="text-xs rounded-lg">Discussions</TabsTrigger>
            <TabsTrigger value="teachings" className="text-xs rounded-lg">Teachings</TabsTrigger>
            <TabsTrigger value="leaderboard" className="text-xs rounded-lg">Top Sevaks</TabsTrigger>
          </TabsList>

          {/* ── Discussions ── */}
          <TabsContent value="discussions" className="flex-1 overflow-y-auto px-6 py-4 space-y-3 mt-0">
            {filteredDiscussions.length === 0 ? (
              <div className="text-center py-16">
                <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No discussions found</p>
              </div>
            ) : filteredDiscussions.map((d, i) => (
              <motion.div key={d.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer">
                  <div className="flex items-start gap-3 mb-2">
                    <Avatar className="w-9 h-9 shrink-0">
                      <AvatarImage src={d.author.avatar} />
                      <AvatarFallback className="text-xs">{d.author.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-sm font-semibold text-gray-900">{d.author.name}</span>
                        <RankBadge rank={d.author.rank} />
                        {d.isPinned && <Pin className="w-3 h-3 text-[#FF6F00]" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[d.category] ?? "bg-gray-100 text-gray-700"}`}>{d.category}</span>
                        <span className="text-xs text-gray-400">{d.timeAgo}</span>
                      </div>
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1 leading-snug">{d.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{d.content}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{d.replies}</span>
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{d.likes}</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{d.views}</span>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {d.tags.slice(0, 2).map(t => (
                        <span key={t} className="text-xs bg-orange-50 text-[#FF6F00] px-2 py-0.5 rounded-full">#{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </TabsContent>

          {/* ── Teachings ── */}
          <TabsContent value="teachings" className="flex-1 overflow-y-auto px-6 py-4 space-y-4 mt-0">
            {MOCK_TEACHINGS.map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer">
                  {t.image && <img src={t.image} alt={t.title} className="w-full h-36 object-cover" loading="lazy" />}
                  <div className="p-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[t.category] ?? "bg-gray-100 text-gray-700"}`}>{t.category}</span>
                    <h3 className="font-bold text-gray-900 mt-2 mb-1">{t.title}</h3>
                    <blockquote className="text-sm text-[#FF6F00] font-medium italic border-l-2 border-[#FF6F00]/30 pl-3 mb-2">"{t.quote}"</blockquote>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{t.content}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6"><AvatarImage src={t.author.avatar} /><AvatarFallback className="text-xs">{t.author.name.substring(0, 2)}</AvatarFallback></Avatar>
                        <span className="text-xs text-gray-500">{t.author.name}</span>
                        <RankBadge rank={t.author.rank} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{t.likes}</span>
                        <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{t.saves}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </TabsContent>

          {/* ── Leaderboard ── */}
          <TabsContent value="leaderboard" className="flex-1 overflow-y-auto px-6 py-4 mt-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-yellow-50 border-b border-orange-100 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-bold text-gray-800">Top Sevaks Leaderboard</span>
              </div>
              {!leaderboard ? (
                <div className="p-4 space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="flex gap-3 items-center"><Skeleton className="w-10 h-10 rounded-full" /><div className="flex-1 space-y-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div></div>)}</div>
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
