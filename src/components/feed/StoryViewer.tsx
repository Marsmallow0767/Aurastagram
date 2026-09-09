import React, { useState, useEffect, useRef } from 'react';
import { Story } from '../../types';
import { X, Heart, Send } from 'lucide-react';
import confetti from 'canvas-confetti';

interface StoryViewerProps {
  stories: Story[];
  initialStory: Story;
  onClose: () => void;
  currentUserId?: string;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({
  stories,
  initialStory,
  onClose,
  currentUserId,
}) => {
  const [currentIndex, setCurrentIndex] = useState(() => {
    const idx = stories.findIndex((s) => s.id === initialStory.id);
    return idx >= 0 ? idx : 0;
  });

  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isLiked, setIsLiked] = useState(false);

  const currentStory = stories[currentIndex] || initialStory;
  const timerRef = useRef<number | null>(null);

  // Auto-progress timer
  useEffect(() => {
    setProgress(0);
    setIsLiked(false);

    if (isPaused) return;

    const interval = 50; // ms
    const duration = 5000; // 5s story duration
    const step = (interval / duration) * 100;

    timerRef.current = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isPaused]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleHeartReaction = () => {
    setIsLiked(true);
    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.85, x: 0.85 },
      colors: ['#ff3040', '#ff007f', '#ff85a1'],
    });
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setReplyText('');
    confetti({
      particleCount: 15,
      spread: 40,
      origin: { y: 0.85, x: 0.5 },
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none">
      <div
        className="relative w-full h-full max-w-md bg-black flex flex-col justify-between overflow-hidden"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* PROGRESS BARS */}
        <div className="absolute top-2 left-2 right-2 z-30 flex items-center gap-1">
          {stories.map((s, idx) => (
            <div
              key={s.id}
              className="flex-1 h-0.75 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white transition-all ease-linear"
                style={{
                  width:
                    idx < currentIndex
                      ? '100%'
                      : idx === currentIndex
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* TOP HEADER */}
        <div className="absolute top-4 left-3 right-3 z-30 flex items-center justify-between mt-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/40">
              <img
                src={currentStory.userAvatar}
                alt={currentStory.username}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white text-xs font-semibold drop-shadow-md">
                {currentStory.username}
              </span>
              <span className="text-white/70 text-[11px] drop-shadow-md">
                {new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/90 hover:text-white p-1 rounded-full active:scale-90 transition-transform"
            aria-label="Kapat"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* STORY MEDIA */}
        <div className="relative w-full h-full flex items-center justify-center bg-[#121212]">
          <img
            src={currentStory.mediaUrl}
            alt={currentStory.caption || 'Hikaye'}
            className="w-full h-full object-contain"
          />

          {currentStory.caption && (
            <div className="absolute bottom-20 left-4 right-4 text-center">
              <span className="inline-block bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl text-white text-sm font-medium">
                {currentStory.caption}
              </span>
            </div>
          )}

          {/* TAP ZONES (Left / Right navigation) */}
          <div
            className="absolute inset-y-0 left-0 w-1/3 z-20 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
          />
          <div
            className="absolute inset-y-0 right-0 w-2/3 z-20 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
          />
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="absolute bottom-3 left-3 right-3 z-30 flex items-center gap-3">
          <form onSubmit={handleSendReply} className="flex-1 flex items-center">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`${currentStory.username} kişisine mesaj gönder...`}
              className="w-full bg-black/40 backdrop-blur-md border border-white/30 rounded-full py-2.5 px-4 text-xs text-white placeholder-white/70 focus:outline-none focus:border-white transition-colors"
            />
          </form>

          <button
            onClick={handleHeartReaction}
            className="text-white active:scale-125 transition-transform p-1"
            aria-label="Beğen"
          >
            <Heart
              className={`w-7 h-7 transition-colors ${
                isLiked ? 'text-[#ff3040] fill-[#ff3040]' : 'text-white stroke-[1.8]'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
