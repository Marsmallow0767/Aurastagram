import React from 'react';
import { Heart, MessageCircle, UserPlus, ArrowLeft } from 'lucide-react';
import { NotificationItem, User } from '../../types';

interface NotificationsViewProps {
  notifications: NotificationItem[];
  currentUser: User | null;
  onBack: () => void;
  onOpenProfile: (userId: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onBack,
  onOpenProfile,
}) => {
  return (
    <div className="w-full pb-16 min-h-screen bg-black text-white max-w-md mx-auto">
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-black/95 backdrop-blur-md px-4 h-13 flex items-center gap-3 border-b border-[#262626]">
        <button onClick={onBack} className="p-1 text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="font-bold text-base tracking-tight">Bildirimler</h2>
      </header>

      {/* LIST */}
      <div className="p-3">
        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wide px-2 mb-3">
          Bu Hafta
        </h3>

        {notifications.length === 0 ? (
          <div className="py-16 text-center text-neutral-500 text-xs">
            <Heart className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
            <p className="font-semibold text-white mb-1">Henüz bildirim yok</p>
            <p>Fotoğrafların beğenildiğinde ve yeni takipçilerin olduğunda burada göreceksin.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-900 transition-colors cursor-pointer"
              >
                <div
                  className="flex items-center gap-3"
                  onClick={() => onOpenProfile(n.fromUserId)}
                >
                  <div className="relative">
                    <div className="w-11 h-11 rounded-full overflow-hidden border border-neutral-700">
                      <img
                        src={n.fromUserAvatar}
                        alt={n.fromUsername}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-black">
                      {n.type === 'like' && (
                        <Heart className="w-3.5 h-3.5 fill-[#ff3040] text-[#ff3040]" />
                      )}
                      {n.type === 'comment' && (
                        <MessageCircle className="w-3.5 h-3.5 fill-[#0095f6] text-[#0095f6]" />
                      )}
                      {n.type === 'follow' && (
                        <UserPlus className="w-3.5 h-3.5 text-[#0095f6]" />
                      )}
                    </div>
                  </div>

                  <div className="text-xs leading-snug">
                    <span className="font-semibold text-white">{n.fromUsername}</span>{' '}
                    <span className="text-neutral-300">
                      {n.type === 'like' && 'gönderini beğendi.'}
                      {n.type === 'comment' && 'gönderine yorum yaptı.'}
                      {n.type === 'follow' && 'seni takip etmeye başladı.'}
                    </span>
                    <span className="text-[10px] text-neutral-500 block mt-0.5">
                      {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>

                {n.postImage ? (
                  <div className="w-10 h-10 rounded-md overflow-hidden shrink-0 border border-neutral-800">
                    <img
                      src={n.postImage}
                      alt="Gönderi"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : n.type === 'follow' ? (
                  <button className="bg-[#0095f6] hover:bg-[#1877f2] text-white text-xs font-semibold px-3 py-1.5 rounded-lg active:scale-95 transition-transform">
                    Geri Takip Et
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
