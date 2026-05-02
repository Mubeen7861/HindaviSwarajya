import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Share2, MapPin, Users } from "lucide-react";
import { SevaPost } from "@workspace/api-client-react";
import { useToggleLike, getListPostsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { CURRENT_USER_ID } from "@/lib/constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RankBadge } from "./RankBadge";
import { CategoryBadge } from "./CategoryBadge";
import { motion } from "framer-motion";

export function PostCard({ post }: { post: SevaPost }) {
  const queryClient = useQueryClient();
  const isLiked = post.likedBy.includes(CURRENT_USER_ID);
  
  const toggleLike = useToggleLike({
    mutation: {
      onSuccess: () => {
        // Optimistic update could go here, but simple invalidate is safer for now
        queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
      }
    }
  });

  const handleLike = () => {
    toggleLike.mutate({ id: post.id, data: { userId: CURRENT_USER_ID } });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="mb-4 hover-elevate transition-shadow overflow-hidden border-orange-100 dark:border-orange-900/30 shadow-sm hover:shadow-md">
        <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
          <div className="flex gap-3">
            <Link href={`/profile/${post.user.id}`}>
              <Avatar className="w-10 h-10 border border-primary/10 cursor-pointer">
                <AvatarImage src={post.user.avatar} alt={post.user.name} />
                <AvatarFallback className="bg-primary/5 text-primary">{post.user.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex flex-col">
              <Link href={`/profile/${post.user.id}`}>
                <span className="font-semibold text-sm hover:underline cursor-pointer flex items-center gap-2" data-testid={`text-post-user-${post.id}`}>
                  {post.user.name}
                  <RankBadge rank={post.user.rank} />
                </span>
              </Link>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
                {post.location && (
                  <span className="inline-flex items-center ml-2">
                    <MapPin className="w-3 h-3 mr-0.5" /> {post.location}
                  </span>
                )}
              </span>
            </div>
          </div>
          <CategoryBadge category={post.category} />
        </CardHeader>
        
        <CardContent className="p-4 pt-2">
          <Link href={`/post/${post.id}`}>
            <div className="cursor-pointer">
              <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap mb-3 text-foreground/90" data-testid={`text-post-content-${post.id}`}>
                {post.content}
              </p>
              
              {post.image && (
                <div className="mb-3 rounded-md overflow-hidden bg-muted aspect-video relative">
                  <img 
                    src={post.image} 
                    alt="Seva" 
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
              
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {post.tags.map(tag => (
                    <span key={tag} className="text-xs text-primary font-medium bg-primary/5 px-2 py-0.5 rounded-md">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
          
          <div className="flex items-center gap-1 text-sm font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-md mt-2 w-fit">
            <Users className="w-4 h-4" />
            <span data-testid={`text-post-helped-${post.id}`}>Helped {post.helpedPeople} people</span>
          </div>
        </CardContent>
        
        <CardFooter className="p-2 px-4 border-t bg-muted/20 flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex-1 gap-1.5 ${isLiked ? 'text-primary' : 'text-muted-foreground'}`}
            onClick={handleLike}
            disabled={toggleLike.isPending}
            data-testid={`button-like-${post.id}`}
          >
            <motion.div whileTap={{ scale: 1.2 }}>
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </motion.div>
            <span>{post.likes}</span>
          </Button>
          
          <Link href={`/post/${post.id}`} className="flex-1">
            <Button variant="ghost" size="sm" className="w-full gap-1.5 text-muted-foreground" data-testid={`button-comment-${post.id}`}>
              <MessageCircle className="w-4 h-4" />
              <span>{post.comments.length}</span>
            </Button>
          </Link>
          
          <Button variant="ghost" size="sm" className="flex-1 gap-1.5 text-muted-foreground">
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
