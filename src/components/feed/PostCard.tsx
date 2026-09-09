import React, { useState, useRef } from 'react';
import { Post, User } from '../../types';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Trash2, Link as LinkIcon, MapPin } from 'lucide-react';
import { getFilterCss } from '../../services/filters';

interface PostCardProps {
  post: Post;
  currentUser: User | null;
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  onOpenComments: (post: Post) => void;
  onDeletePost?: (postId: string) => void;
  onOpenProfile?: (userId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUser,
  onLike,
  onSave,
  onOpenComments,
  onDeletePost,
  onOpenProfile,
}) => {
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const lastTapRef = useRef<number>(0);

  const isLiked = currentUser ? post.likes.includes(currentUser.id) : false;
  const isSaved = currentUser && post.savedBy ? post.savedBy.includes(currentUser.id) : false;
  const isOwner = currentUser?.id === post.userId;

  // Double tap to like
  const handleImageTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      if (!isLiked) {
        onLike(post.id);
      }
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 900);
    }
    lastTapRef.current = now;
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Az önce';
    if (mins < 60) return `${mins} dakika önce`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} saat önce`;
    const days = Math.floor(hours / 24);
    return `${days} gün önce`;
  };

  return (
    <article className="w-full bg-black border-b border-[#262626] pb-3 text-white select-none">
      {/* 1. HEADER */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => onOpenProfile?.(post.userId)}
        >
          <div className="w-8 h-8 rounded-full p-0.5 story-gradient">
            <div className="w-full h-full rounded-full bg-black p-0.25 overflow-hidden">
              <img
                src={post.userAvatar}
                alt={post.username}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold tracking-tight text-white hover:underline">
              {post.username}
            </span>
            {post.location && (
              <div className="flex items-center gap-0.5 text-[10px] text-neutral-400">
                <MapPin className="w-2.5 h-2.5 text-neutral-500" />
                <span>{post.location}</span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowOptions(true)}
          className="p-1 text-neutral-400 hover:text-white"
          aria-label="Diğer seçenekler"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* 2. MEDIA (WITH DOUBLE TAP TO LIKE) */}
      <div
        className="relative w-full aspect-square bg-[#121212] overflow-hidden flex items-center justify-center cursor-pointer"
        onClick={handleImageTap}
      >
        <img
          src={post.imageUrl}
          alt={post.caption || 'Gönderi'}
          className="w-full h-full object-cover transition-transform duration-200"
          style={{ filter: getFilterCss(post.filter) }}
          loading="lazy"
        />

        {/* Double-tap animated heart pop */}
        {showHeartAnim && (
          <div className="absolute top-1/2 left-1/2 animate-heart-burst pointer-events-none drop-shadow-2xl z-20">
            <Heart className="w-24 h-24 fill-[#ff3040] text-[#ff3040]" />
          </div>
        )}
      </div>

      {/* 3. ACTION BAR */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <div className="flex items-center gap-4">
          {/* Like */}
          <button
            onClick={() => onLike(post.id)}
            className="active:scale-80 transition-transform"
            aria-label="Beğen"
          >
            <Heart
              className={`w-6 h-6 transition-colors ${
                isLiked
                  ? 'text-[#ff3040] fill-[#ff3040] scale-110'
                  : 'text-white hover:text-neutral-300 stroke-[1.9]'
              }`}
            />
          </button>

          {/* Comment */}
          <button
            onClick={() => onOpenComments(post)}
            className="active:scale-80 transition-transform text-white hover:text-neutral-300"
            aria-label="Yorum yap"
          >
            <MessageCircle className="w-6 h-6 stroke-[1.9] -rotate-4" />
          </button>

          {/* Share */}
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: 'Aurastagram Gönderisi', url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('Bağlantı panoya kopyalandı!');
              }
            }}
            className="active:scale-80 transition-transform text-white hover:text-neutral-300"
            aria-label="Paylaş"
          >
            <Send className="w-5.5 h-5.5 stroke-[1.9] -rotate-12" />
          </button>
        </div>

        {/* Save/Bookmark */}
        <button
          onClick={() => onSave(post.id)}
          className="active:scale-80 transition-transform text-white hover:text-neutral-300"
          aria-label="Kaydet"
        >
          <Bookmark
            className={`w-6 h-6 stroke-[1.9] ${
              isSaved ? 'fill-white text-white' : 'text-white'
            }`}
          />
        </button>
      </div>

      {/* 4. LIKES COUNT */}
      <div className="px-3 pt-1">
        <span className="text-xs font-semibold text-white">
          {post.likes.length > 0
            ? `${post.likes.length.toLocaleString()} beğenme`
            : 'İlk beğenen sen ol'}
        </span>
      </div>

      {/* 5. CAPTION */}
      {post.caption && (
        <div className="px-3 pt-1 text-xs text-neutral-200">
          <span
            className="font-semibold text-white mr-1.5 cursor-pointer"
            onClick={() => onOpenProfile?.(post.userId)}
          >
            {post.username}
          </span>
          <span>
            {isExpanded || post.caption.length <= 90
              ? post.caption
              : `${post.caption.slice(0, 90)}... `}
          </span>
          {post.caption.length > 90 && !isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              className="text-neutral-400 font-medium ml-1 hover:text-white"
            >
              devamı
            </button>
          )}
        </div>
      )}

      {/* 6. COMMENTS PREVIEW & LINK */}
      <div className="px-3 pt-1">
        {post.commentsCount > 0 ? (
          <button
            onClick={() => onOpenComments(post)}
            className="text-[12px] text-neutral-400 font-normal hover:text-neutral-300"
          >
            {post.commentsCount} yorumun tümünü gör
          </button>
        ) : (
          <button
            onClick={() => onOpenComments(post)}
            className="text-[12px] text-neutral-500 font-normal"
          >
            Yorum ekle...
          </button>
        )}
      </div>

      {/* 7. TIMESTAMP */}
      <div className="px-3 pt-0.5">
        <span className="text-[10px] text-neutral-500 uppercase tracking-tight">
          {timeAgo(post.createdAt)}
        </span>
      </div>

      {/* OPTIONS MODAL */}
      {showOptions && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-6"
          onClick={() => setShowOptions(false)}
        >
          <div
            className="bg-[#262626] rounded-xl w-full max-w-xs overflow-hidden divide-y divide-[#363636] text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {isOwner && (
              <button
                onClick={() => {
                  setShowOptions(false);
                  onDeletePost?.(post.id);
                }}
                className="w-full py-3 text-xs font-semibold text-red-500 hover:bg-neutral-800 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Gönderiyi Sil
              </button>
            )}
            <button
              onClick={() => {
                navigator.clipboard.writeText(post.imageUrl);
                alert('Görsel bağlantısı kopyalandı!');
                setShowOptions(false);
              }}
              className="w-full py-3 text-xs font-medium text-white hover:bg-neutral-800 flex items-center justify-center gap-2"
            >
              <LinkIcon className="w-4 h-4" />
              Bağlantıyı Kopyala
            </button>
            <button
              onClick={() => setShowOptions(false)}
              className="w-full py-3 text-xs font-medium text-neutral-400 hover:bg-neutral-800"
            >
              İptal
            </button>
          </div>
        </div>
      )}
    </article>
  );
};
