import { useState } from "react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import {
  Heart, MessageCircle, Share2, MapPin, Clock,
  Bookmark, MoreVertical
} from "lucide-react";
import { SevaPost } from "@workspace/api-client-react";
import { useToggleLike, getListPostsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUserId } from "@/hooks/useCurrentUser";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RankBadge } from "./RankBadge";
import { motion, AnimatePresence } from "framer-motion";

const categoryColors: Record<string, string> = {
  Food: "bg-green-100 text-green-800",
  Education: "bg-blue-100 text-blue-800",
  Health: "bg-red-100 text-red-800",
  Shelter: "bg-purple-100 text-purple-800",
  Other: "bg-gray-100 text-gray-800",
};

export function PostCard({ post }: { post: SevaPost }) {
  const queryClient = useQueryClient();
  const currentUserId = useCurrentUserId();
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
    const text = `Check out this seva by ${post.user.name}!\n\n"${post.content}"\n\n${post.helpedPeople} people helped 🙏`;
    if (navigator.share) {
      navigator.share({ title: "HindaviSwarajya Seva", text, url: window.location.href });
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  const visibleTags = post.tags?.slice(0, 2) ?? [];
  const extraTags = (post.tags?.length ?? 0) - 2;
  const catColor = categoryColors[post.category] ?? "bg-gray-100 text-gray-800";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 lg:p-6">
        {/* User Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Link href={`/app/profile/${post.user.id}`}>
              <Avatar className="w-12 h-12 lg:w-14 lg:h-14 cursor-pointer shrink-0 border border-gray-100">
                <AvatarImage src={post.user.avatar} alt={post.user.name} />
                <AvatarFallback className="bg-orange-50 text-[#FF6F00] font-semibold">
                  {post.user.name.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/app/profile/${post.user.id}`}>
                  <span
                    className="font-semibold text-gray-900 hover:text-[#FF6F00] cursor-pointer transition-colors"
                    data-testid={`text-post-user-${post.id}`}
                  >
                    {post.user.name}
                  </span>
                </Link>
                <RankBadge rank={post.user.rank} />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5 flex-wrap">
                {post.location && (
                  <>
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span>{post.location}</span>
                    <span>•</span>
                  </>
                )}
                <Clock className="w-3 h-3 shrink-0" />
                <span>{formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              onClick={() => setSaved(!saved)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Bookmark className={`w-4 h-4 ${saved ? "fill-[#FF6F00] text-[#FF6F00]" : "text-gray-400"}`} />
            </button>
            <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <Link href={`/app/post/${post.id}`}>
          <p
            className="text-gray-800 leading-relaxed mb-3 cursor-pointer hover:text-gray-900 transition-colors"
            data-testid={`text-post-content-${post.id}`}
          >
            {post.content}
          </p>
        </Link>

        {/* Category + Impact + Tags row */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${catColor}`}>
            {post.category}
          </span>
          <span className="text-xs text-[#FF6F00] font-semibold" data-testid={`text-post-helped-${post.id}`}>
            {post.helpedPeople} people helped
          </span>
          {visibleTags.map((tag) => (
            <button
              key={tag}
              className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg hover:bg-orange-50 hover:text-[#FF6F00] transition-colors"
            >
              #{tag}
            </button>
          ))}
          {extraTags > 0 && (
            <span className="text-xs text-gray-400">+{extraTags}</span>
          )}
        </div>

        {/* Image */}
        {post.image && (
          <Link href={`/app/post/${post.id}`}>
            <div className="mb-3 rounded-xl overflow-hidden cursor-pointer">
              <img
                src={post.image}
                alt="Seva"
                className="w-full h-48 lg:h-64 object-cover hover:scale-[1.02] transition-transform duration-300"
                loading="lazy"
              />
            </div>
          </Link>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-5">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleLike}
              disabled={toggleLike.isPending || currentUserId === undefined}
              className="flex items-center gap-1.5 text-gray-500 hover:text-[#FF6F00] transition-colors disabled:opacity-50"
              data-testid={`button-like-${post.id}`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? "fill-[#FF6F00] text-[#FF6F00]" : ""}`} />
              <span className="text-sm">{post.likes}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 text-gray-500 hover:text-[#FF6F00] transition-colors"
              data-testid={`button-comment-${post.id}`}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm">{post.comments.length}</span>
            </motion.button>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleShare}
              className="flex items-center gap-1.5 text-gray-500 hover:text-[#FF6F00] transition-colors"
            >
              <Share2 className="w-5 h-5" />
              <span className="text-sm">Share</span>
            </motion.button>
          </div>
        </div>

        {/* Inline Comments (expandable) */}
        <AnimatePresence>
          {showComments && post.comments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 border-t border-gray-100 pt-4 space-y-3 overflow-hidden"
            >
              {post.comments.slice(0, 3).map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  <Avatar className="w-7 h-7 shrink-0">
                    <AvatarImage src={comment.userAvatar} alt={comment.userName} />
                    <AvatarFallback className="text-xs">{comment.userName?.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 bg-gray-50 rounded-xl p-2.5">
                    <span className="text-xs font-semibold text-gray-800 mr-2">{comment.userName}</span>
                    <span className="text-xs text-gray-600">{comment.content}</span>
                  </div>
                </div>
              ))}
              {post.comments.length > 3 && (
                <Link href={`/app/post/${post.id}`}>
                  <span className="text-xs text-[#FF6F00] hover:underline cursor-pointer">
                    View all {post.comments.length} comments
                  </span>
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
