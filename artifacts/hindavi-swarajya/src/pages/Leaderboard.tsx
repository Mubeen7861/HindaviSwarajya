import { useState } from "react";
import { Link } from "wouter";
import { useGetLeaderboard, getGetLeaderboardQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Users, Heart, Award } from "lucide-react";
import { RankBadge } from "@/components/RankBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useGetLeaderboard({ limit: 50 }, {
    query: {
      queryKey: getGetLeaderboardQueryKey({ limit: 50 })
    }
  });

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold font-serif text-primary flex items-center justify-center gap-2 mb-2">
          <Trophy className="w-8 h-8 text-yellow-500" />
          Seva Leaderboard
        </h1>
        <p className="text-muted-foreground">Top contributors making an impact in the community</p>
      </div>

      <Card className="border-orange-100 dark:border-orange-900/30 overflow-hidden">
        <CardHeader className="bg-primary/5 pb-4 border-b">
          <CardTitle className="text-lg">Top Karyakartas</CardTitle>
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
            <div className="p-8 text-center text-muted-foreground">
              No top contributors yet. Be the first!
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
                      <h3 className="font-semibold text-sm sm:text-base truncate cursor-pointer hover:underline" data-testid={`leaderboard-name-${entry.user.id}`}>
                        {entry.user.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <RankBadge rank={entry.user.rank} />
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-foreground">{entry.postCount}</span>
                      <span className="text-xs">Sevas</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="font-bold text-foreground">{entry.totalLikes}</span>
                      <span className="text-xs">Likes</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 ml-2 border-l pl-4 border-border">
                    <span className="text-xs text-muted-foreground">Impact</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1 text-sm sm:text-base">
                      {entry.totalHelped} <Users className="w-3 h-3 sm:w-4 sm:h-4" />
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
