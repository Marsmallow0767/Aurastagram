import React, { useState, useEffect, useRef } from 'react';
import { User, Message } from '../../types';
import { storageService } from '../../services/storage';
import { ArrowLeft, Send, Heart, Image as ImageIcon, Phone, Video } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ChatRoomProps {
  currentUser: User;
  targetUser: User;
  onBack: () => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
  currentUser,
  targetUser,
  onBack,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Deterministic conversation ID for two users
  const conversationId = [currentUser.id, targetUser.id].sort().join('_');

  useEffect(() => {
    setMessages(storageService.getMessages(conversationId));
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text: string, mediaUrl?: string) => {
    if (!text.trim() && !mediaUrl) return;

    const newMsg: Message = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      conversationId,
      senderId: currentUser.id,
      senderUsername: currentUser.username,
      senderAvatar: currentUser.avatar,
      text: text.trim(),
      mediaUrl,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    storageService.sendMessage(newMsg);
    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
  };

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleSend('', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQuickHeart = () => {
    handleSend('❤️');
    confetti({
      particleCount: 15,
      spread: 50,
      origin: { y: 0.9, x: 0.8 },
      colors: ['#ff3040', '#ff007f'],
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between max-w-md mx-auto">
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-black/95 backdrop-blur-md px-3 h-14 flex items-center justify-between border-b border-[#262626]">
        <div className="flex items-center gap-2.5">
          <button onClick={onBack} className="p-1 text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-neutral-700">
            <img
              src={targetUser.avatar}
              alt={targetUser.username}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="text-xs font-semibold text-white leading-tight">
              {targetUser.username}
            </div>
            <div className="text-[10px] text-green-400">Aktif</div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-white pr-1">
          <button className="p-1 hover:text-neutral-300">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-1 hover:text-neutral-300">
            <Video className="w-5.5 h-5.5" />
          </button>
        </div>
      </header>

      {/* MESSAGES SCROLL AREA */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar">
        {/* Profile Info in chat header */}
        <div className="flex flex-col items-center py-6 border-b border-neutral-800/60 mb-2">
          <div className="w-18 h-18 rounded-full overflow-hidden border border-neutral-700 mb-2">
            <img
              src={targetUser.avatar}
              alt={targetUser.username}
              className="w-full h-full object-cover"
            />
          </div>
          <h3 className="text-sm font-semibold">{targetUser.fullName}</h3>
          <p className="text-xs text-neutral-400">@{targetUser.username} · Instagram</p>
          <p className="text-[11px] text-neutral-500 mt-1">
            {targetUser.followers.length} takipçi · {targetUser.following.length} takip
          </p>
        </div>

        {messages.length === 0 ? (
          <p className="text-xs text-neutral-500 text-center py-4">
            Henüz mesaj yok. Bir selamlama gönderin!
          </p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === currentUser.id;
            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'} items-end gap-2`}
              >
                {!isMine && (
                  <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 mb-0.5">
                    <img
                      src={targetUser.avatar}
                      alt={targetUser.username}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div
                  className={`max-w-[72%] rounded-2xl px-3.5 py-2 text-xs break-words shadow-sm ${
                    isMine
                      ? 'bg-[#3797f0] text-white rounded-br-xs'
                      : 'bg-[#262626] text-white rounded-bl-xs'
                  }`}
                >
                  {msg.mediaUrl && (
                    <img
                      src={msg.mediaUrl}
                      alt="Gönderilen fotoğraf"
                      className="rounded-xl max-h-60 w-full object-cover mb-1"
                    />
                  )}
                  {msg.text && (
                    <p className={msg.text === '❤️' ? 'text-3xl py-1' : ''}>
                      {msg.text}
                    </p>
                  )}
                  <span className="text-[9px] opacity-60 block text-right mt-0.5">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT FORM */}
      <div className="p-3 bg-black border-t border-[#262626] flex items-center gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-[#0095f6] text-white p-2 rounded-full hover:scale-105 active:scale-95 transition-transform"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelected}
          className="hidden"
        />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(inputText);
          }}
          className="flex-1 flex items-center bg-[#262626] rounded-full px-3 py-1.5"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Mesaj yaz..."
            className="w-full bg-transparent text-xs text-white placeholder-neutral-400 focus:outline-none"
          />
          {inputText.trim() ? (
            <button
              type="submit"
              className="text-[#0095f6] font-semibold text-xs ml-2 hover:text-[#1877f2]"
            >
              Gönder
            </button>
          ) : (
            <button
              type="button"
              onClick={handleQuickHeart}
              className="text-neutral-400 hover:text-red-500 active:scale-125 transition-transform ml-1"
            >
              <Heart className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
