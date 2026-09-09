import React, { useState, useMemo } from 'react';
import { Search, Heart, MessageCircle, User as UserIcon } from 'lucide-react';
import { Post, User } from '../../types';
import { storageService } from '../../services/storage';
import { getFilterCss } from '../../services/filters';

interface ExploreGridProps {
  posts: Post[];
  onOpenPost: (post: Post) => void;
  onOpenProfile: (userId: string) => void;
}

export const ExploreGrid: React.FC<ExploreGridProps> = ({
  posts,
  onOpenPost,
  onOpenProfile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Search users or hashtags
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase().trim();
    const users = storageService.getUsers().filter(
      (u) =>
        u.username.toLowerCase().includes(query) ||
        u.fullName.toLowerCase().includes(query)
    );
    const matchedPosts = posts.filter(
      (p) =>
        p.caption.toLowerCase().includes(query) ||
        p.username.toLowerCase().includes(query) ||
        (p.location && p.location.toLowerCase().includes(query))
    );
    return { users, posts: matchedPosts };
  }, [searchQuery, posts]);

  return (
    <div className="w-full pb-16 min-h-screen bg-black text-white max-w-md mx-auto">
      {/* SEARCH BAR */}
      <div className="sticky top-0 z-30 bg-black/95 backdrop-blur-md px-3 py-2 border-b border-[#262626]">
        <div className="relative flex items-center bg-[#262626] rounded-lg px-3 py-1.5">
          <Search className="w-4 h-4 text-neutral-400 mr-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ara (kullanıcı veya #etiket)"
            className="w-full bg-transparent text-xs text-white placeholder-neutral-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-neutral-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* SEARCH RESULTS VIEW */}
      {searchResults ? (
        <div className="p-3 space-y-4">
          {/* USERS FOUND */}
          {searchResults.users.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wide">
                Hesaplar
              </h3>
              <div className="space-y-2">
                {searchResults.users.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => onOpenProfile(u.id)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-900 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-neutral-700">
                      <img
                        src={u.avatar}
                        alt={u.username}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">
                        {u.username}
                      </div>
                      <div className="text-[11px] text-neutral-400">{u.fullName}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* POSTS FOUND */}
          <div>
            <h3 className="text-xs font-semibold text-neutral-400 mb-2 uppercase tracking-wide">
              Gönderiler ({searchResults.posts.length})
            </h3>
            {searchResults.posts.length === 0 ? (
              <p className="text-xs text-neutral-500 py-6 text-center">
                Eşleşen gönderi bulunamadı.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-0.5">
                {searchResults.posts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => onOpenPost(post)}
                    className="relative aspect-square bg-[#121212] group cursor-pointer overflow-hidden"
                  >
                    <img
                      src={post.imageUrl}
                      alt={post.caption}
                      className="w-full h-full object-cover"
                      style={{ filter: getFilterCss(post.filter) }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* EXPLORE GRID (INSTAGRAM 3-COL MOSAIC) */
        <div className="grid grid-cols-3 gap-0.5">
          {posts.map((post, index) => {
            // Instagram signature: every 9 items, one item spans 2 rows and 2 cols
            const isLarge = index % 9 === 0;

            return (
              <div
                key={post.id}
                onClick={() => onOpenPost(post)}
                className={`relative aspect-square bg-[#121212] group cursor-pointer overflow-hidden ${
                  isLarge ? 'col-span-2 row-span-2 aspect-square' : ''
                }`}
              >
                <img
                  src={post.imageUrl}
                  alt={post.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  style={{ filter: getFilterCss(post.filter) }}
                  loading="lazy"
                />

                {/* Hover overlay with likes and comments */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-semibold text-xs">
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4 fill-white" />
                    <span>{post.likes.length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>{post.commentsCount}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
