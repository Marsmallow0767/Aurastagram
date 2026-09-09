import React, { useState } from 'react';
import { User, Message } from '../../types';
import { storageService } from '../../services/storage';
import { ArrowLeft, Edit, Search } from 'lucide-react';

interface DirectInboxProps {
  currentUser: User | null;
  onBack: () => void;
  onSelectChat: (targetUser: User) => void;
}

export const DirectInbox: React.FC<DirectInboxProps> = ({
  currentUser,
  onBack,
  onSelectChat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Get all registered users except self
  const allUsers = storageService.getUsers().filter((u) => u.id !== currentUser?.id);

  const filteredUsers = allUsers.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full pb-16 min-h-screen bg-black text-white max-w-md mx-auto">
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-black/95 backdrop-blur-md px-4 h-13 flex items-center justify-between border-b border-[#262626]">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 text-white" aria-label="Geri">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <span className="font-bold text-base tracking-tight">
            {currentUser?.username}
          </span>
        </div>
      </header>

      {/* SEARCH BAR */}
      <div className="p-3">
        <div className="flex items-center bg-[#262626] rounded-lg px-3 py-1.5">
          <Search className="w-4 h-4 text-neutral-400 mr-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Kullanıcı ara..."
            className="w-full bg-transparent text-xs text-white placeholder-neutral-400 focus:outline-none"
          />
        </div>
      </div>

      {/* USERS / CONVERSATIONS LIST */}
      <div className="px-2">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-xs font-bold text-white">Mesajlar</span>
          <span className="text-xs font-medium text-[#0095f6]">Talepler</span>
        </div>

        {allUsers.length === 0 ? (
          <div className="py-16 text-center text-neutral-400 text-xs px-4">
            <p className="font-semibold text-white mb-1">Henüz Başka Kullanıcı Yok</p>
            <p>Arkadaşlarınız uygulamaya kaydolduğunda burada sohbet başlatabilirsiniz!</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-10 text-center text-neutral-500 text-xs">
            Eşleşen kullanıcı bulunamadı.
          </div>
        ) : (
          filteredUsers.map((user) => {
            return (
              <div
                key={user.id}
                onClick={() => onSelectChat(user)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-900 cursor-pointer active:bg-neutral-800 transition-colors"
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-neutral-700">
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white truncate">
                    {user.username}
                  </div>
                  <div className="text-[11px] text-neutral-400 truncate">
                    {user.fullName} · Şimdi aktif
                  </div>
                </div>

                <div className="text-[10px] text-neutral-500">
                  <span className="w-2 h-2 rounded-full bg-[#0095f6] inline-block" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
