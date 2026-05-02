import { useState } from "react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";
import {
  Heart, MessageCircle, Share2, MapPin,
  Bookmark, MoreHorizontal,
} from "lucide-react";
import { SevaPost } from "@workspace/api-client-react";
import { useToggleLike, getListPostsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUserId } from "@/hooks/useCurrentUser";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RankBadge } from "./RankBadge";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const categoryAccent: Record<string, string> = {
  Food:      "bg-emerald-50 text-emerald-700",
  Education: "bg-sky-50 text-sky-700",
  Health:    "bg-rose-50 text-rose-700",
  Shelter:   "bg-violet-50 text-violet-700",
  Other:     "bg-stone-100 text-stone-700",
};

export function PostCard({ post }: { post: SevaPost }) {
  const queryClient = useQueryClient();
  const currentUserId = useCurrentUserId();
  const { t } = useTranslation();
  const isLiked = currentUserId !== undefined && post.likedBy.includes(currentUserId);
  const [saved, setSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const toggleLike = useToggleLike({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
      },
    },
  });

  const handleLike = () => {
    if (currentUserId === undefined) return;
    toggleLike.mutate({ id: post.id });
  };

  const handleShare = () => {
    const text = `Check out this seva by ${post.user.name}!\n\n"${post.content}"`;
    if (navigator.share) {
      navigator.share({ title: "HindaviSwarajya Seva", text, url: window.location.href });
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  const visibleTags = post.tags?.slice(0, 3) ?? [];
  const extraTags = (post.tags?.length ?? 0) - visibleTags.length;
  const catColor = categoryAccent[post.category] ?? categoryAccent.Other;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="surface rounded-2xl px-4 py-4 sm:px-5 sm:py-5"
    >
      {/* Header */}
      <header className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={`/app/profile/${post.user.id}`}>
            <Avatar className="w-10 h-10 cursor-pointer shrink-0 ring-1 ring-border/60">
              <AvatarImage src={post.user.avatar} alt={post.user.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                {post.user.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link href={`/app/profile/${post.user.id}`}>
                <span
                  className="text-[14px] font-semibold text-foreground hover:text-primary cursor-pointer transition-colors leading-tight"
                  data-testid={`text-post-user-${post.id}`}
                >
                  {post.user.name}
                </span>
              </Link>
              <RankBadge rank={post.user.rank} />
            </div>
            <div className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground mt-0.5 leading-tight">
              {post.location && (
                <>
                  <MapPin className="w-3 h-3 shrink-0" strokeWidth={1.75} />
                  <span className="truncate max-w-[140px]">{post.location}</span>
                  <span aria-hidden>·</span>
                </>
              )}
              <time>
                {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}
              </time>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0 ml-2">
          <button
            type="button"
            onClick={() => setSaved(!saved)}
            aria-label="Save"
            className="w-8 h-8 inline-flex items-center justify-center rounded-full text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-colors tap-none"
          >
            <Bookmark className={cn("w-[17px] h-[17px]", saved && "fill-primary text-primary")} strokeWidth={1.85} />
          </button>
          <button
            type="button"
            aria-label="More"
            className="w-8 h-8 inline-flex items-center justify-center rounded-full text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-colors tap-none"
          >
            <MoreHorizontal className="w-[18px] h-[18px]" strokeWidth={1.85} />
          </button>
        </div>
      </header>

      {/* Content */}
      <Link href={`/app/post/${post.id}`}>
        <p
          className="text-[14.5px] text-foreground/90 leading-relaxed mb-3 cursor-pointer"
          data-testid={`text-post-content-${post.id}`}
        >
          {post.content}
        </p>
      </Link>

      {/* Meta row */}
      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        <span className={cn("inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-full", catColor)}>
          {post.category}
        </span>
        <span className="inline-flex items-center text-[11px] font-semibold text-primary px-2.5 py-1 rounded-full bg-primary/10" data-testid={`text-post-helped-${post.id}`}>
          {post.helpedPeople} {t("post.helped")}
        </span>
        {visibleTags.map((tag) => (
          <span
            key={tag}
            className="text-[11px] text-foreground/60 bg-foreground/5 px-2 py-1 rounded-full"
          >
            #{tag}
          </span>
        ))}
        {extraTags > 0 && (
          <span className="text-[11px] text-muted-foreground">+{extraTags} {t("post.moreTags")}</span>
        )}
      </div>

      {/* Image */}
      {post.image && (
        <Link href={`/app/post/${post.id}`}>
          <div className="mb-3 rounded-xl overflow-hidden cursor-pointer ring-1 ring-border/40">
            <img
              src={post.image}
              alt="Seva"
              className="w-full h-48 sm:h-60 object-cover"
              loading="lazy"
            />
          </div>
        </Link>
      )}

      {/* Actions */}
      <footer className="flex items-center justify-between pt-3 border-t border-border/40">
        <div className="flex items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={handleLike}
            disabled={toggleLike.isPending || currentUserId === undefined}
            className="inline-flex items-center gap-1.5 px-2.5 h-9 rounded-full text-foreground/60 hover:bg-foreground/5 hover:text-primary transition-colors disabled:opacity-50 tap-none"
            data-testid={`button-like-${post.id}`}
          >
            <Heart
              className={cn("w-[18px] h-[18px]", isLiked && "fill-primary text-primary")}
              strokeWidth={1.85}
            />
            <span className="text-[13px] font-medium tabular-nums">{post.likes}</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={() => setShowComments(!showComments)}
            className="inline-flex items-center gap-1.5 px-2.5 h-9 rounded-full text-foreground/60 hover:bg-foreground/5 hover:text-foreground transition-colors tap-none"
            data-testid={`button-comment-${post.id}`}
          >
            <MessageCircle className="w-[18px] h-[18px]" strokeWidth={1.85} />
            <span className="text-[13px] font-medium tabular-nums">{post.comments.length}</span>
          </motion.button>
        </div>

        <motion.button
          whileTap={{ scale: 0.92 }}
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full text-foreground/60 hover:bg-foreground/5 hover:text-foreground transition-colors tap-none"
        >
          <Share2 className="w-[16px] h-[16px]" strokeWidth={1.85} />
          <span className="text-[12.5px] font-medium hidden sm:inline">{t("common.share")}</span>
        </motion.button>
      </footer>

      {/* Inline Comments (expandable) */}
      <AnimatePresence>
        {showComments && post.comments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 border-t border-border/40 pt-3 space-y-3 overflow-hidden"
          >
            {post.comments.slice(0, 3).map((comment) => (
              <div key={comment.id} className="flex gap-2">
                <Avatar className="w-7 h-7 shrink-0">
                  <AvatarImage src={comment.userAvatar} alt={comment.userName} />
                  <AvatarFallback className="text-[10px] bg-foreground/5">
                    {comment.userName?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-foreground/[0.04] rounded-2xl px-3 py-2">
                  <span className="text-[12px] font-semibold text-foreground/90 mr-1.5">
                    {comment.userName}
                  </span>
                  <span className="text-[12.5px] text-foreground/75">{comment.content}</span>
                </div>
              </div>
            ))}
            {post.comments.length > 3 && (
              <Link href={`/app/post/${post.id}`}>
                <span className="text-[12px] text-primary hover:underline cursor-pointer">
                  {t("post.viewAllComments", { count: post.comments.length })}
                </span>
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
