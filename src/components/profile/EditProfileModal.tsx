import React, { useState, useRef } from 'react';
import { User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { X, Check, Camera } from 'lucide-react';

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose }) => {
  const { updateProfile } = useAuth();
  const [fullName, setFullName] = useState(user.fullName || '');
  const [username, setUsername] = useState(user.username || '');
  const [bio, setBio] = useState(user.bio || '');
  const [website, setWebsite] = useState(user.website || '');
  const [avatar, setAvatar] = useState(user.avatar);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    updateProfile({
      fullName: fullName.trim(),
      username: username.trim().toLowerCase().replace(/[^a-z0-9_.]/g, ''),
      bio: bio.trim(),
      website: website.trim(),
      avatar,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex flex-col justify-between max-w-md mx-auto text-white">
      <div className="w-full h-full bg-black flex flex-col justify-between">
        {/* HEADER */}
        <div className="flex items-center justify-between px-4 h-13 border-b border-[#262626]">
          <button onClick={onClose} className="text-white text-xs font-medium">
            İptal
          </button>
          <h2 className="text-sm font-semibold">Profili Düzenle</h2>
          <button
            onClick={handleSave}
            className="text-[#0095f6] hover:text-[#1877f2] text-xs font-bold"
          >
            Bitti
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
          {/* AVATAR */}
          <div className="flex flex-col items-center">
            <div
              className="relative cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-20 h-20 rounded-full overflow-hidden border border-neutral-700">
                <img src={avatar} alt={username} className="w-full h-full object-cover" />
              </div>
              <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[#0095f6] text-xs font-semibold mt-2.5 hover:underline"
            >
              Profil Fotoğrafını Değiştir
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          {/* FORM FIELDS */}
          <div className="space-y-4 pt-4 border-t border-[#262626]">
            <div>
              <label className="text-xs text-neutral-400 block mb-1">Ad</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Adınız ve Soyadınız"
                className="w-full bg-[#121212] border border-[#262626] rounded-lg py-2.5 px-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400"
              />
            </div>

            <div>
              <label className="text-xs text-neutral-400 block mb-1">Kullanıcı Adı</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Kullanıcı adınız"
                className="w-full bg-[#121212] border border-[#262626] rounded-lg py-2.5 px-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400"
              />
            </div>

            <div>
              <label className="text-xs text-neutral-400 block mb-1">Biyografi</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Biyografinizi yazın..."
                rows={3}
                className="w-full bg-[#121212] border border-[#262626] rounded-lg py-2.5 px-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400 resize-none"
              />
            </div>

            <div>
              <label className="text-xs text-neutral-400 block mb-1">İnternet Sitesi</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                className="w-full bg-[#121212] border border-[#262626] rounded-lg py-2.5 px-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
