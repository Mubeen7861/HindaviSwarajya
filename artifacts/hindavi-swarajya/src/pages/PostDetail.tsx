import { useState } from "react";
import { useRoute, Link } from "wouter";
import { 
  useGetPost, 
  useToggleLike, 
  useAddComment,
  getGetPostQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { CURRENT_USER_ID } from "@/lib/constants";
import { PostCard } from "@/components/PostCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MessageSquare, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function PostDetail() {
  const [, params] = useRoute("/post/:id");
  const postId = parseInt(params?.id || "0", 10);
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");

  const { data: post, isLoading } = useGetPost(postId, {
    query: {
      enabled: !!postId,
      queryKey: getGetPostQueryKey(postId)
    }
  });

  const addComment = useAddComment({
    mutation: {
      onSuccess: () => {
        setCommentText("");
        queryClient.invalidateQueries({ queryKey: getGetPostQueryKey(postId) });
      }
    }
  });

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    addComment.mutate({
      id: postId,
      data: {
        userId: CURRENT_USER_ID,
        content: commentText.trim()
      }
    });
  };

  if (isLoading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Skeleton className="w-24 h-8 mb-4" />
        <Card className="p-4 mb-6">
          <div className="flex gap-4 mb-4">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-32 w-full mb-4" />
        </Card>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8 text-center">
        <h2 className="text-xl font-bold mb-2">Post not found</h2>
        <Link href="/">
          <Button variant="outline">Back to Feed</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <Link href="/">
        <Button variant="ghost" size="sm" className="mb-4 gap-2 text-muted-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to Feed
        </Button>
      </Link>

      <div className="mb-8">
        <PostCard post={post} />
      </div>

      <Card className="border-orange-100 dark:border-orange-900/30">
        <CardHeader className="bg-primary/5 border-b pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Comments ({post.comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 border-b bg-muted/10">
            <form onSubmit={handleCommentSubmit} className="flex flex-col gap-3">
              <Textarea
                placeholder="Share a word of encouragement..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="resize-none min-h-20"
                data-testid={`input-comment-${post.id}`}
              />
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={!commentText.trim() || addComment.isPending}
                  className="gap-2"
                  data-testid={`button-submit-comment-${post.id}`}
                >
                  <Send className="w-4 h-4" />
                  {addComment.isPending ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </form>
          </div>

          <div className="divide-y divide-border">
            {post.comments.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No comments yet. Be the first to encourage them!
              </div>
            ) : (
              post.comments.map(comment => (
                <div key={comment.id} className="p-4 flex gap-3 hover:bg-muted/30 transition-colors">
                  <Link href={`/profile/${comment.userId}`}>
                    <Avatar className="w-8 h-8 cursor-pointer">
                      <AvatarImage src={comment.userAvatar} alt={comment.userName} />
                      <AvatarFallback>{comment.userName.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline mb-1">
                      <Link href={`/profile/${comment.userId}`}>
                        <span className="font-semibold text-sm cursor-pointer hover:underline" data-testid={`comment-user-${comment.id}`}>
                          {comment.userName}
                        </span>
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap" data-testid={`comment-content-${comment.id}`}>
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
