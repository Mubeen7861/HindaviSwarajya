import { useRoute, Link } from "wouter";
import { 
  useGetUser, 
  useGetUserPosts, 
  useToggleFollow,
  getGetUserQueryKey,
  getGetUserPostsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { CURRENT_USER_ID } from "@/lib/constants";
import { PostCard } from "@/components/PostCard";
import { RankBadge } from "@/components/RankBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Users, Heart, ArrowLeft, CalendarDays } from "lucide-react";
import { format } from "date-fns";

export default function Profile() {
  const [, params] = useRoute("/profile/:id");
  const profileId = parseInt(params?.id || "0", 10);
  const isCurrentUser = profileId === CURRENT_USER_ID;
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useGetUser(profileId, {
    query: {
      enabled: !!profileId,
      queryKey: getGetUserQueryKey(profileId)
    }
  });

  const { data: posts, isLoading: postsLoading } = useGetUserPosts(profileId, {
    query: {
      enabled: !!profileId,
      queryKey: getGetUserPostsQueryKey(profileId)
    }
  });

  const toggleFollow = useToggleFollow({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(profileId) });
      }
    }
  });

  const handleFollow = () => {
    toggleFollow.mutate({
      id: profileId,
      data: { followerId: CURRENT_USER_ID }
    });
  };

  if (userLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Skeleton className="h-48 w-full rounded-xl mb-4" />
        <div className="flex gap-6 relative -top-12 px-6">
          <Skeleton className="w-24 h-24 rounded-full border-4 border-background" />
          <div className="pt-14 flex-1">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8 text-center">
        <h2 className="text-xl font-bold mb-2">User not found</h2>
        <Link href="/">
          <Button variant="outline">Back to Feed</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <Link href="/">
        <Button variant="ghost" size="sm" className="mb-4 gap-2 text-muted-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to Feed
        </Button>
      </Link>

      <Card className="border-orange-100 dark:border-orange-900/30 overflow-hidden mb-8">
        <div className="h-32 bg-gradient-to-r from-primary/80 to-orange-400 relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        </div>
        <CardContent className="p-6 relative pt-0">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 -mt-12 sm:-mt-16 mb-4">
            <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-background shadow-md">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-2xl">{user.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold font-serif text-foreground" data-testid={`profile-name-${user.id}`}>
                    {user.name}
                  </h1>
                  <div className="flex items-center gap-3 mt-1 text-muted-foreground text-sm">
                    {user.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {user.location}
                      </span>
                    )}
                    {user.joinedAt && (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" /> Joined {format(new Date(user.joinedAt), 'MMMM yyyy')}
                      </span>
                    )}
                  </div>
                </div>
                
                {!isCurrentUser && (
                  <Button 
                    onClick={handleFollow} 
                    disabled={toggleFollow.isPending}
                    variant="default"
                    className="gap-2 shadow-sm"
                    data-testid={`button-follow-${user.id}`}
                  >
                    Follow
                  </Button>
                )}
                {isCurrentUser && (
                  <Button variant="outline" size="sm">Edit Profile</Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 mb-6">
            <div className="flex-1">
              <div className="mb-4">
                <RankBadge rank={user.rank} />
              </div>
              {user.bio && (
                <p className="text-foreground/90 whitespace-pre-wrap">{user.bio}</p>
              )}
              {!user.bio && isCurrentUser && (
                <p className="text-muted-foreground italic text-sm">Add a bio to tell the community about your mission.</p>
              )}
            </div>
            
            <div className="flex gap-4 sm:gap-6 shrink-0 bg-muted/30 p-4 rounded-xl border border-border/50 self-start">
              <div className="flex flex-col items-center">
                <span className="font-bold text-xl">{user.postsCount}</span>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Sevas</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-xl text-emerald-600 dark:text-emerald-400">{user.totalHelped}</span>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Helped</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-xl">{user.followersCount}</span>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Followers</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="w-full sm:w-auto mb-6 bg-transparent border-b rounded-none p-0 h-auto justify-start space-x-6">
          <TabsTrigger 
            value="posts" 
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 py-3 text-base"
          >
            Seva Timeline
          </TabsTrigger>
          <TabsTrigger 
            value="impact" 
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 py-3 text-base"
          >
            Impact Summary
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts" className="mt-0">
          {postsLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-64 w-full rounded-xl" />
              ))}
            </div>
          ) : posts?.length === 0 ? (
            <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed border-border">
              <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-1">No sevas recorded yet</h3>
              <p className="text-muted-foreground">
                {isCurrentUser ? "Start your journey by sharing your first act of seva." : `${user.name} hasn't posted any sevas yet.`}
              </p>
              {isCurrentUser && (
                <Link href="/create" className="text-primary mt-4 inline-block hover:underline font-medium">
                  Share a Seva
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
              {posts?.map((post) => (
                <div key={post.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  {/* Timeline marker */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-primary/20 text-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    <Heart className="w-4 h-4 fill-current" />
                  </div>
                  {/* Card wrapper */}
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)]">
                    <PostCard post={post} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="impact">
          <Card className="border-orange-100 dark:border-orange-900/30">
            <CardContent className="p-8 text-center">
              <Target className="w-16 h-16 text-emerald-500 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">Impact Visualizer</h3>
              <p className="text-muted-foreground">Detailed charts of {user.name}'s impact across different categories will appear here in the next update.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
