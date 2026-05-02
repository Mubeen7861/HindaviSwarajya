import { useState } from "react";
import { 
  useListPosts, 
  useGetStatsSummary, 
  useGetTrendingTags,
  getListPostsQueryKey,
  getGetStatsSummaryQueryKey,
  getGetTrendingTagsQueryKey
} from "@workspace/api-client-react";
import { ListPostsCategory, ListPostsSortBy } from "@workspace/api-client-react";
import { PostCard } from "@/components/PostCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Flame, Target, Quote, MessageSquare } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");

  // Add simple debouncing
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    // Real implementation would use a proper debounce hook
    setTimeout(() => setDebouncedSearch(e.target.value), 500);
  };

  const queryParams = {
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(category !== "all" ? { category: category as ListPostsCategory } : {}),
    ...(sortBy ? { sortBy: sortBy as ListPostsSortBy } : {}),
    limit: 20
  };

  const { data: posts, isLoading: postsLoading } = useListPosts(queryParams, {
    query: {
      queryKey: getListPostsQueryKey(queryParams)
    }
  });

  const { data: stats } = useGetStatsSummary({
    query: {
      queryKey: getGetStatsSummaryQueryKey()
    }
  });

  const { data: trendingTags } = useGetTrendingTags({ limit: 10 }, {
    query: {
      queryKey: getGetTrendingTagsQueryKey({ limit: 10 })
    }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-3 space-y-6">
          {/* Filters Bar */}
          <Card className="border-orange-100 dark:border-orange-900/30">
            <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search sevas..." 
                  className="pl-9"
                  value={search}
                  onChange={handleSearchChange}
                  data-testid="input-search-feed"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full sm:w-[140px]" data-testid="select-filter-category">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value={ListPostsCategory.Food}>Food</SelectItem>
                    <SelectItem value={ListPostsCategory.Education}>Education</SelectItem>
                    <SelectItem value={ListPostsCategory.Health}>Health</SelectItem>
                    <SelectItem value={ListPostsCategory.Shelter}>Shelter</SelectItem>
                    <SelectItem value={ListPostsCategory.Other}>Other</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[140px]" data-testid="select-sort-by">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ListPostsSortBy.recent}>Recent</SelectItem>
                    <SelectItem value={ListPostsSortBy.impact}>Highest Impact</SelectItem>
                    <SelectItem value={ListPostsSortBy.likes}>Most Liked</SelectItem>
                    <SelectItem value={ListPostsSortBy.comments}>Most Discussed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Feed Content */}
          <div>
            {postsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-4">
                    <div className="flex gap-4 mb-4">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-20 w-full mb-4" />
                    <Skeleton className="h-4 w-2/3" />
                  </Card>
                ))}
              </div>
            ) : posts?.length === 0 ? (
              <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed border-border">
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-1">No sevas found</h3>
                <p className="text-muted-foreground">Try adjusting your filters or be the first to post!</p>
                <Link href="/create" className="text-primary mt-4 inline-block hover:underline font-medium">
                  Share a Seva
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {posts?.map(post => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quote Card */}
          <Card className="bg-primary text-primary-foreground border-none overflow-hidden relative">
            <div className="absolute right-[-20px] top-[-20px] opacity-10">
              <Quote className="w-24 h-24" />
            </div>
            <CardContent className="p-6 relative z-10 text-center">
              <p className="text-xl font-serif font-bold mb-2 leading-relaxed text-white">
                "गवार राज्यापेक्षा स्वराज्य बरे"
              </p>
              <p className="text-primary-foreground/80 text-sm">
                Self-rule is better than foreign rule.
              </p>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card className="border-orange-100 dark:border-orange-900/30">
            <CardHeader className="bg-primary/5 pb-4 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Our Collective Impact
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {stats ? (
                <div className="divide-y divide-border">
                  <div className="p-4 flex justify-between items-center bg-emerald-50 dark:bg-emerald-950/30">
                    <span className="font-semibold text-emerald-800 dark:text-emerald-300">People Helped</span>
                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats.totalHelped.toLocaleString()}</span>
                  </div>
                  <div className="p-4 flex justify-between items-center">
                    <span className="text-muted-foreground">Acts of Seva</span>
                    <span className="font-bold">{stats.totalPosts.toLocaleString()}</span>
                  </div>
                  <div className="p-4 flex justify-between items-center">
                    <span className="text-muted-foreground">Volunteers</span>
                    <span className="font-bold">{stats.totalUsers.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trending Tags */}
          <Card className="border-orange-100 dark:border-orange-900/30">
            <CardHeader className="bg-primary/5 pb-4 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                Trending Causes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {trendingTags ? (
                <div className="flex flex-wrap gap-2">
                  {trendingTags.map(tag => (
                    <div key={tag.tag} className="flex items-center gap-1.5 bg-muted rounded-full px-3 py-1 hover:bg-primary/10 transition-colors cursor-pointer border border-border">
                      <span className="text-xs font-semibold text-primary">#{tag.tag}</span>
                      <span className="text-[10px] text-muted-foreground">{tag.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-6 w-16 rounded-full" />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="text-center text-xs text-muted-foreground/60 pb-8">
            <p>HindaviSwarajya Seva Platform &copy; 2025</p>
          </div>
        </div>
      </div>
    </div>
  );
}
