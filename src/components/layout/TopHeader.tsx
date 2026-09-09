import React from 'react';
import { Heart, Send, ChevronDown } from 'lucide-react';
import { ActiveTab } from '../../types';

interface TopHeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  unreadMessagesCount?: number;
  unreadNotificationsCount?: number;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  setActiveTab,
  unreadMessagesCount = 0,
  unreadNotificationsCount = 0,
}) => {
  if (activeTab === 'reels') {
    return (
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-13 bg-transparent text-white max-w-md mx-auto">
        <h1 className="text-xl font-bold tracking-tight">Reels</h1>
        <button 
          onClick={() => setActiveTab('create')}
          className="p-1 active:scale-95 transition-transform"
          aria-label="Kamera"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-4 h-13 bg-black border-b border-[#262626] max-w-md mx-auto w-full">
      <div className="flex items-center gap-1.5 cursor-pointer">
        <span className="font-instagram text-3xl text-white tracking-wide pt-1">
          Instagram
        </span>
        <ChevronDown className="w-4 h-4 text-white/70" />
      </div>

      <div className="flex items-center gap-5">
        <button
          onClick={() => setActiveTab('notifications')}
          className="relative p-1 active:scale-90 transition-transform text-white"
          aria-label="Bildirimler"
        >
          <Heart className={`w-6 h-6 ${activeTab === 'notifications' ? 'fill-white' : ''}`} />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#ff3040] rounded-full ring-2 ring-black" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('direct')}
          className="relative p-1 active:scale-90 transition-transform text-white"
          aria-label="Direkt Mesajlar"
        >
          <Send className={`w-6 h-6 ${activeTab === 'direct' ? 'fill-white' : ''} -rotate-12`} />
          {unreadMessagesCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#ff3040] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full ring-2 ring-black">
              {unreadMessagesCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
