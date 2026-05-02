import { Link } from "wouter";
import { useGetLeaderboard, getGetLeaderboardQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Users, Sparkles, Crown } from "lucide-react";
import { RankBadge } from "@/components/RankBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { EmptyState } from "@/components/EmptyState";
import { CHHAVA_RANK, mudraFromHelped } from "@/lib/ranks";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useGetLeaderboard({ limit: 50 }, {
    query: {
      queryKey: getGetLeaderboardQueryKey({ limit: 50 })
    }
  });

  const chhavaHolders = leaderboard?.filter((e) => e.user.chhava) ?? [];

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold font-serif text-primary flex items-center justify-center gap-2 mb-2">
          <Trophy className="w-8 h-8 text-yellow-500" />
          Seva Leaderboard
        </h1>
        <p className="text-muted-foreground">Top contributors making an impact — ranked by Mudra (10 per person helped)</p>
      </div>

      {/* Chhava honor roll */}
      {chhavaHolders.length > 0 && (
        <Card className={`mb-6 overflow-hidden border-amber-300 ${CHHAVA_RANK.bg} text-white shadow-lg`}>
          <CardHeader className="pb-3 border-b border-white/15">
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="w-5 h-5" /> Chhava — Honorary Rank
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              {chhavaHolders.map((entry) => (
                <Link key={entry.user.id} href={`/app/profile/${entry.user.id}`}>
                  <div className="flex items-center gap-2 bg-white/15 backdrop-blur rounded-full pr-3 pl-1 py-1 hover:bg-white/25 transition-colors cursor-pointer">
                    <Avatar className="w-7 h-7 border border-white/40">
                      <AvatarImage src={entry.user.avatar} alt={entry.user.name} />
                      <AvatarFallback>{entry.user.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-semibold">{entry.user.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-orange-100 dark:border-orange-900/30 overflow-hidden">
        <CardHeader className="bg-primary/5 pb-4 border-b">
          <CardTitle className="text-lg">Top Sevaks</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : leaderboard?.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Trophy}
                title="The leaderboard is waiting for its first hero"
                description="Share a seva and you might be the very first karyakarta to top the list."
                action={
                  <Link href="/app/create">
                    <Button className="bg-[#FF6F00] hover:bg-[#E65100] text-white gap-2 rounded-xl shadow-sm" data-testid="button-empty-leaderboard-share">
                      <Sparkles className="w-4 h-4" />
                      Share your first Seva
                    </Button>
                  </Link>
                }
                testId="empty-state-leaderboard"
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {leaderboard?.map((entry, index) => (
                <motion.div 
                  key={entry.user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center gap-3 sm:gap-4 p-4 hover:bg-muted/50 transition-colors ${index < 3 ? 'bg-primary/5' : ''}`}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-200 text-gray-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'text-muted-foreground'
                  }`}>
                    #{entry.rank}
                  </div>
                  
                  <Link href={`/app/profile/${entry.user.id}`}>
                    <Avatar className={`w-10 h-10 sm:w-12 sm:h-12 cursor-pointer border-2 ${
                      index === 0 ? 'border-yellow-400' :
                      index === 1 ? 'border-gray-400' :
                      index === 2 ? 'border-orange-400' :
                      'border-transparent'
                    }`}>
                      <AvatarImage src={entry.user.avatar} alt={entry.user.name} />
                      <AvatarFallback>{entry.user.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link href={`/app/profile/${entry.user.id}`}>
                      <h3 className="font-semibold text-sm sm:text-base truncate cursor-pointer hover:underline flex items-center gap-1.5" data-testid={`leaderboard-name-${entry.user.id}`}>
                        {entry.user.name}
                        {entry.user.chhava && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {entry.user.chhava && <RankBadge rank={entry.user.rank} chhava />}
                      <RankBadge rank={entry.user.rank} />
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-foreground tabular-nums">{entry.postCount}</span>
                      <span className="text-xs">Sevas</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-foreground tabular-nums">{entry.totalHelped}</span>
                      <span className="text-xs">Helped</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-0.5 ml-2 border-l pl-4 border-border">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Mudra</span>
                    <span className="font-extrabold text-amber-600 flex items-center gap-1.5 text-xl sm:text-2xl tabular-nums leading-none">
                      {mudraFromHelped(entry.totalHelped).toLocaleString()} <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
