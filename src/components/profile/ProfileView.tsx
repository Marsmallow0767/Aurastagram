import React, { useState } from 'react';
import { User, Post } from '../../types';
import { Grid, Bookmark, Clapperboard, Settings, LogOut, Share2, Plus } from 'lucide-react';
import { getFilterCss } from '../../services/filters';

interface ProfileViewProps {
  user: User;
  isCurrentUser: boolean;
  posts: Post[];
  onOpenEditProfile: () => void;
  onLogout: () => void;
  onOpenPost: (post: Post) => void;
  onToggleFollow?: (userId: string) => void;
  isFollowing?: boolean;
}

const HIGHLIGHTS = [
  { id: '1', title: 'Anılar', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=150' },
  { id: '2', title: 'Gezi', img: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=150' },
  { id: '3', title: 'Favoriler', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150' },
];

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  isCurrentUser,
  posts,
  onOpenEditProfile,
  onLogout,
  onOpenPost,
  onToggleFollow,
  isFollowing,
}) => {
  const [activeTab, setActiveTab] = useState<'grid' | 'saved' | 'reels'>('grid');

  const userPosts = posts.filter((p) => p.userId === user.id);
  const savedPosts = posts.filter((p) => p.savedBy?.includes(user.id));

  return (
    <div className="w-full pb-20 min-h-screen bg-black text-white max-w-md mx-auto">
      {/* 1. TOP HEADER */}
      <header className="sticky top-0 z-30 bg-black/95 backdrop-blur-md px-4 h-12 flex items-center justify-between border-b border-[#262626]">
        <div className="flex items-center gap-2">
          <span className="font-bold text-base tracking-tight">{user.username}</span>
          {user.verified && (
            <span className="w-3.5 h-3.5 bg-[#0095f6] text-white rounded-full flex items-center justify-center text-[9px] font-bold">
              ✓
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isCurrentUser && (
            <button
              onClick={onLogout}
              className="p-1 text-red-400 hover:text-red-300"
              title="Çıkış Yap"
              aria-label="Çıkış Yap"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* 2. PROFILE STATS & AVATAR */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          {/* Avatar with gradient */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full p-0.5 story-gradient">
              <div className="w-full h-full rounded-full bg-black p-0.5 overflow-hidden">
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Stats counts */}
          <div className="flex-1 flex justify-around pl-4">
            <div className="flex flex-col items-center">
              <span className="font-bold text-base">{userPosts.length}</span>
              <span className="text-xs text-neutral-400">gönderi</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold text-base">{user.followers.length}</span>
              <span className="text-xs text-neutral-400">takipçi</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold text-base">{user.following.length}</span>
              <span className="text-xs text-neutral-400">takip</span>
            </div>
          </div>
        </div>

        {/* Name and Bio */}
        <div className="mt-3 text-xs space-y-0.5">
          <p className="font-semibold text-white">{user.fullName}</p>
          {user.bio && <p className="text-neutral-300 whitespace-pre-line">{user.bio}</p>}
          {user.website && (
            <a
              href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
              target="_blank"
              rel="noreferrer"
              className="text-[#0095f6] hover:underline font-medium block"
            >
              {user.website}
            </a>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex items-center gap-2">
          {isCurrentUser ? (
            <>
              <button
                onClick={onOpenEditProfile}
                className="flex-1 bg-[#262626] hover:bg-[#363636] text-white text-xs font-semibold py-1.5 rounded-lg active:scale-95 transition-all"
              >
                Profili Düzenle
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: user.fullName, text: `@${user.username} Instagram Profili` });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Profil bağlantısı panoya kopyalandı!');
                  }
                }}
                className="flex-1 bg-[#262626] hover:bg-[#363636] text-white text-xs font-semibold py-1.5 rounded-lg active:scale-95 transition-all"
              >
                Profili Paylaş
              </button>
            </>
          ) : (
            <button
              onClick={() => onToggleFollow?.(user.id)}
              className={`flex-1 text-xs font-semibold py-1.5 rounded-lg active:scale-95 transition-all ${
                isFollowing
                  ? 'bg-[#262626] text-white hover:bg-[#363636]'
                  : 'bg-[#0095f6] text-white hover:bg-[#1877f2]'
              }`}
            >
              {isFollowing ? 'Takip Ediliyor' : 'Takip Et'}
            </button>
          )}
        </div>

        {/* Story Highlights */}
        <div className="mt-5 flex items-center gap-4 overflow-x-auto no-scrollbar pb-1">
          {HIGHLIGHTS.map((h) => (
            <div key={h.id} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer">
              <div className="w-14 h-14 rounded-full p-0.5 border border-neutral-700">
                <div className="w-full h-full rounded-full overflow-hidden bg-black">
                  <img src={h.img} alt={h.title} className="w-full h-full object-cover" />
                </div>
              </div>
              <span className="text-[10px] text-neutral-300 truncate max-w-14">{h.title}</span>
            </div>
          ))}

          {isCurrentUser && (
            <div className="flex flex-col items-center gap-1 shrink-0 cursor-pointer">
              <div className="w-14 h-14 rounded-full border border-neutral-800 flex items-center justify-center bg-[#121212]">
                <Plus className="w-5 h-5 text-neutral-400" />
              </div>
              <span className="text-[10px] text-neutral-400">Yeni</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. TABS SWITCHER */}
      <div className="flex items-center border-t border-[#262626] mt-3">
        <button
          onClick={() => setActiveTab('grid')}
          className={`flex-1 py-3 flex justify-center border-b-2 transition-colors ${
            activeTab === 'grid' ? 'border-white text-white' : 'border-transparent text-neutral-500'
          }`}
          aria-label="Gönderiler"
        >
          <Grid className="w-5 h-5" />
        </button>

        {isCurrentUser && (
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 py-3 flex justify-center border-b-2 transition-colors ${
              activeTab === 'saved' ? 'border-white text-white' : 'border-transparent text-neutral-500'
            }`}
            aria-label="Kaydedilenler"
          >
            <Bookmark className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 4. POSTS GRID */}
      {activeTab === 'grid' && (
        userPosts.length === 0 ? (
          <div className="py-16 text-center text-neutral-400 text-xs px-4">
            <p className="font-semibold text-white mb-1">Henüz Paylaşım Yok</p>
            <p>Fotoğraf veya video paylaştığınızda profilinizde burada görünecektir.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5">
            {userPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => onOpenPost(post)}
                className="relative aspect-square bg-[#121212] cursor-pointer overflow-hidden group"
              >
                <img
                  src={post.imageUrl}
                  alt={post.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  style={{ filter: getFilterCss(post.filter) }}
                />
              </div>
            ))}
          </div>
        )
      )}

      {activeTab === 'saved' && (
        savedPosts.length === 0 ? (
          <div className="py-16 text-center text-neutral-400 text-xs px-4">
            <p className="font-semibold text-white mb-1">Kaydedilen Gönderi Yok</p>
            <p>Tekrar görmek istediğiniz fotoğraf ve videoları kaydedin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5">
            {savedPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => onOpenPost(post)}
                className="relative aspect-square bg-[#121212] cursor-pointer overflow-hidden group"
              >
                <img
                  src={post.imageUrl}
                  alt={post.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  style={{ filter: getFilterCss(post.filter) }}
                />
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};
