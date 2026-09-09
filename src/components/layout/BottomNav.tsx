import React from 'react';
import { Home, Search, PlusSquare, Clapperboard } from 'lucide-react';
import { ActiveTab, User } from '../../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser: User | null;
  onOpenCreate: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenCreate,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-md border-t border-[#262626] h-13 max-w-md mx-auto w-full px-6 flex items-center justify-between">
      {/* 1. HOME */}
      <button
        onClick={() => setActiveTab('home')}
        className="p-2 text-white active:scale-85 transition-transform"
        aria-label="Ana Sayfa"
      >
        <Home
          className={`w-6 h-6 transition-all ${
            activeTab === 'home' ? 'stroke-[2.5] fill-white' : 'stroke-[1.8] stroke-white'
          }`}
        />
      </button>

      {/* 2. EXPLORE */}
      <button
        onClick={() => setActiveTab('explore')}
        className="p-2 text-white active:scale-85 transition-transform"
        aria-label="Keşfet"
      >
        <Search
          className={`w-6 h-6 transition-all ${
            activeTab === 'explore' ? 'stroke-[3]' : 'stroke-[2]'
          }`}
        />
      </button>

      {/* 3. CREATE (+) */}
      <button
        onClick={onOpenCreate}
        className="p-2 text-white active:scale-85 transition-transform"
        aria-label="Yeni Gönderi"
      >
        <PlusSquare className="w-6 h-6 stroke-[1.8]" />
      </button>

      {/* 4. REELS */}
      <button
        onClick={() => setActiveTab('reels')}
        className="p-2 text-white active:scale-85 transition-transform"
        aria-label="Reels"
      >
        <Clapperboard
          className={`w-6 h-6 transition-all ${
            activeTab === 'reels' ? 'fill-white stroke-[2.2]' : 'stroke-[1.8]'
          }`}
        />
      </button>

      {/* 5. PROFILE */}
      <button
        onClick={() => setActiveTab('profile')}
        className="p-1 active:scale-85 transition-transform"
        aria-label="Profil"
      >
        <div
          className={`w-7 h-7 rounded-full overflow-hidden p-0.5 transition-all ${
            activeTab === 'profile' ? 'ring-2 ring-white' : 'ring-1 ring-transparent'
          }`}
        >
          <img
            src={currentUser?.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
            alt={currentUser?.username || 'Profil'}
            className="w-full h-full object-cover rounded-full"
          />
        </div>
      </button>
    </nav>
  );
};
