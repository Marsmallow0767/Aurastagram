import React, { useState } from 'react';
import { Heart, MessageCircle, Send, MoreVertical, Music, Disc, Plus } from 'lucide-react';
import { Reel, User } from '../../types';
import { usePosts } from '../../context/PostContext';
import confetti from 'canvas-confetti';

interface ReelsViewProps {
  reels: Reel[];
  currentUser: User | null;
  onOpenComments?: (reelId: string) => void;
}

export const ReelsView: React.FC<ReelsViewProps> = ({
  reels,
  currentUser,
}) => {
  const { toggleLikeReel } = usePosts();
  const [activeIndex, setActiveIndex] = useState(0);

  // If no reels, show nice Instagram Reels placeholder
  const activeReel = reels[activeIndex];

  const handleNext = () => {
    if (activeIndex < reels.length - 1) setActiveIndex((p) => p + 1);
    else setActiveIndex(0);
  };

  const handlePrev = () => {
    if (activeIndex > 0) setActiveIndex((p) => p - 1);
  };

  const handleLike = (reelId: string) => {
    toggleLikeReel(reelId);
    confetti({
      particleCount: 20,
      spread: 50,
      origin: { y: 0.7, x: 0.88 },
      colors: ['#ff3040', '#ff007f'],
    });
  };

  if (!activeReel) {
    return (
      <div className="w-full h-[calc(100vh-52px)] bg-black flex flex-col items-center justify-center p-6 text-center text-white">
        <Disc className="w-16 h-16 text-neutral-600 animate-spin mb-4" />
        <h3 className="text-base font-semibold mb-1">Henüz Reels Yok</h3>
        <p className="text-xs text-neutral-400 max-w-xs">
          İlk Reels videosunu veya görselini paylaşmak için oluştur butonuna dokunun!
        </p>
      </div>
    );
  }

  const isLiked = currentUser ? activeReel.likes.includes(currentUser.id) : false;

  return (
    <div className="relative w-full h-[calc(100vh-52px)] bg-black text-white overflow-hidden max-w-md mx-auto select-none">
      {/* MEDIA BACKGROUND */}
      <div className="w-full h-full relative flex items-center justify-center bg-neutral-900">
        <img
          src={activeReel.mediaUrl}
          alt={activeReel.caption}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 pointer-events-none" />
      </div>

      {/* SWIPE / TAP NAVIGATION CONTROLS */}
      <button
        onClick={handlePrev}
        disabled={activeIndex === 0}
        className="absolute top-16 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md rounded-full px-3 py-1 text-[11px] text-white/80 hover:text-white disabled:opacity-0 transition-opacity z-20"
      >
        ▲ Önceki
      </button>

      <button
        onClick={handleNext}
        className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md rounded-full px-3 py-1 text-[11px] text-white/80 hover:text-white transition-opacity z-20"
      >
        ▼ Sonraki
      </button>

      {/* RIGHT ACTION COLUMN */}
      <div className="absolute right-3 bottom-20 flex flex-col items-center gap-5 z-20">
        {/* Like */}
        <button
          onClick={() => handleLike(activeReel.id)}
          className="flex flex-col items-center gap-1 active:scale-80 transition-transform"
        >
          <Heart
            className={`w-7 h-7 drop-shadow-md ${
              isLiked ? 'text-[#ff3040] fill-[#ff3040]' : 'text-white stroke-[2]'
            }`}
          />
          <span className="text-[11px] font-semibold drop-shadow-md">
            {activeReel.likes.length}
          </span>
        </button>

        {/* Comment */}
        <button className="flex flex-col items-center gap-1 active:scale-80 transition-transform">
          <MessageCircle className="w-7 h-7 text-white stroke-[2] drop-shadow-md" />
          <span className="text-[11px] font-semibold drop-shadow-md">
            {activeReel.commentsCount || 0}
          </span>
        </button>

        {/* Share */}
        <button className="flex flex-col items-center gap-1 active:scale-80 transition-transform">
          <Send className="w-6.5 h-6.5 text-white stroke-[2] -rotate-12 drop-shadow-md" />
          <span className="text-[11px] font-semibold drop-shadow-md">
            {activeReel.sharesCount || 0}
          </span>
        </button>

        {/* More */}
        <button className="p-1 text-white">
          <MoreVertical className="w-5 h-5 drop-shadow-md" />
        </button>

        {/* Spinning audio disc */}
        <div className="w-8 h-8 rounded-full border-2 border-white/80 overflow-hidden animate-[spin_4s_linear_infinite] mt-2 shadow-lg">
          <img
            src={activeReel.userAvatar}
            alt="Audio art"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* BOTTOM INFO (USER, CAPTION, AUDIO) */}
      <div className="absolute left-4 right-16 bottom-6 z-20 space-y-2.5 text-left">
        {/* User Handle & Follow */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-white/60">
            <img
              src={activeReel.userAvatar}
              alt={activeReel.username}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-xs font-semibold text-white drop-shadow-md">
            {activeReel.username}
          </span>
          <button className="border border-white/60 text-white font-semibold text-[11px] px-2.5 py-0.5 rounded-md backdrop-blur-xs hover:bg-white/20">
            Takip Et
          </button>
        </div>

        {/* Caption */}
        <p className="text-xs text-white/95 line-clamp-2 drop-shadow-md font-normal">
          {activeReel.caption}
        </p>

        {/* Audio tag marquee */}
        <div className="flex items-center gap-2 text-[11px] text-white/90 drop-shadow-md">
          <Music className="w-3.5 h-3.5" />
          <span className="truncate">{activeReel.audioTitle}</span>
        </div>
      </div>
    </div>
  );
};
