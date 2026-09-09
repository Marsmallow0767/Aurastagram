import React, { useState, useEffect } from 'react';
import { Post, Comment, User } from '../../types';
import { usePosts } from '../../context/PostContext';
import { X, Heart, Send } from 'lucide-react';

interface CommentsModalProps {
  post: Post;
  currentUser: User | null;
  onClose: () => void;
}

const QUICK_EMOJIS = ['❤️', '🙌', '🔥', '👏', '😍', '😢', '😂', '😮'];

export const CommentsModal: React.FC<CommentsModalProps> = ({
  post,
  currentUser,
  onClose,
}) => {
  const { getComments, addComment, toggleLikeComment } = usePosts();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    setComments(getComments(post.id));
  }, [post.id, getComments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !currentUser) return;
    const newComment = addComment(post.id, text.trim());
    setComments((prev) => [...prev, newComment]);
    setText('');
  };

  const handleEmojiClick = (emoji: string) => {
    setText((prev) => prev + emoji);
  };

  const handleLike = (commentId: string) => {
    toggleLikeComment(commentId);
    setComments(getComments(post.id));
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex flex-col justify-end max-w-md mx-auto"
      onClick={onClose}
    >
      <div
        className="w-full bg-[#1e1e1e] rounded-t-2xl border-t border-[#363636] max-h-[75vh] flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* GRABBER & HEADER */}
        <div className="pt-2.5 pb-2 px-4 border-b border-[#2d2d2d] flex items-center justify-between">
          <div className="w-10 h-1 bg-neutral-600 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
          <div className="w-6" />
          <h2 className="text-sm font-semibold text-center mt-1">Yorumlar</h2>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-full"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* COMMENTS LIST */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 no-scrollbar">
          {/* POST CAPTION AS FIRST ITEM */}
          {post.caption && (
            <div className="flex items-start gap-3 pb-3 border-b border-[#2d2d2d]">
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-neutral-700">
                <img
                  src={post.userAvatar}
                  alt={post.username}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 text-xs">
                <span className="font-semibold text-white mr-1.5">{post.username}</span>
                <span className="text-neutral-200">{post.caption}</span>
                <div className="text-[10px] text-neutral-500 mt-1">Gönderi Sahibi</div>
              </div>
            </div>
          )}

          {comments.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 text-xs">
              Henüz hiç yorum yok. İlk yorumu sen yap!
            </div>
          ) : (
            comments.map((comment) => {
              const isLiked = currentUser
                ? comment.likes.includes(currentUser.id)
                : false;
              return (
                <div key={comment.id} className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-neutral-700">
                      <img
                        src={comment.userAvatar}
                        alt={comment.username}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-xs">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-semibold text-white">
                          {comment.username}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          {new Date(comment.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="text-neutral-200 mt-0.5">{comment.text}</p>
                      <button className="text-[10px] text-neutral-400 font-semibold mt-1">
                        Yanıtla
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => handleLike(comment.id)}
                    className="p-1 text-neutral-500 hover:text-white shrink-0 active:scale-75 transition-transform"
                    aria-label="Yorumu beğen"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        isLiked ? 'text-[#ff3040] fill-[#ff3040]' : 'text-neutral-500'
                      }`}
                    />
                    {comment.likes.length > 0 && (
                      <span className="text-[9px] block text-center text-neutral-400">
                        {comment.likes.length}
                      </span>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* QUICK EMOJIS */}
        <div className="flex items-center justify-around py-2 px-3 border-t border-[#2d2d2d] bg-[#1a1a1a]">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              className="text-lg hover:scale-125 active:scale-90 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* INPUT FORM */}
        <form
          onSubmit={handleSubmit}
          className="p-3 border-t border-[#2d2d2d] bg-[#1a1a1a] flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-neutral-700">
            <img
              src={currentUser?.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
              alt="Profil"
              className="w-full h-full object-cover"
            />
          </div>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Yorum ekle..."
            className="flex-1 bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="text-[#0095f6] hover:text-[#1877f2] disabled:opacity-30 disabled:hover:text-[#0095f6] text-xs font-semibold px-2 py-1 transition-colors"
          >
            Paylaş
          </button>
        </form>
      </div>
    </div>
  );
};
