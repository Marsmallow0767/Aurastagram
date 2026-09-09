import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Lock, User as UserIcon, Mail, Camera, AlertCircle } from 'lucide-react';

interface RegisterScreenProps {
  onSwitchToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password) {
      setError('Lütfen tüm zorunlu alanları doldurunuz.');
      return;
    }

    setError(null);
    setLoading(true);
    const result = await register(
      username.trim(),
      fullName.trim() || username.trim(),
      email.trim(),
      password,
      avatar || undefined
    );
    setLoading(false);

    if (!result.success && result.error) {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between px-6 py-8 max-w-md mx-auto w-full">
      <div className="flex-1 flex flex-col justify-center">
        {/* Instagram Brand Typography */}
        <div className="text-center mb-6">
          <h1 className="font-instagram text-5xl text-white tracking-wide">
            Instagram
          </h1>
          <p className="text-xs text-neutral-400 mt-2 font-medium px-4">
            Arkadaşlarının fotoğraf ve videolarını görmek için kaydol.
          </p>
        </div>

        {/* Avatar Upload circle */}
        <div className="flex flex-col items-center mb-5">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-20 h-20 rounded-full bg-[#1e1e1e] border-2 border-[#262626] overflow-hidden flex items-center justify-center">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-10 h-10 text-neutral-500" />
              )}
            </div>
            <div className="absolute bottom-0 right-0 bg-[#0095f6] rounded-full p-1.5 border-2 border-black">
              <Camera className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <span className="text-[11px] text-neutral-400 mt-1.5">Profil Fotoğrafı Seç</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

        {error && (
          <div className="mb-4 bg-red-950/60 border border-red-800/80 rounded-lg p-3 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Email */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta adresi"
              className="w-full bg-[#121212] border border-[#262626] rounded-md py-2.5 pl-10 pr-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
              autoComplete="email"
            />
          </div>

          {/* Full Name */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
              <UserIcon className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Adı Soyadı"
              className="w-full bg-[#121212] border border-[#262626] rounded-md py-2.5 pl-10 pr-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
            />
          </div>

          {/* Username */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
              <span className="text-neutral-500 text-sm font-semibold">@</span>
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
              placeholder="Kullanıcı adı"
              className="w-full bg-[#121212] border border-[#262626] rounded-md py-2.5 pl-10 pr-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
              autoComplete="username"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifre (en az 6 karakter)"
              className="w-full bg-[#121212] border border-[#262626] rounded-md py-2.5 pl-10 pr-10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-200"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !username.trim() || !email.trim() || !password}
            className="w-full bg-[#0095f6] hover:bg-[#1877f2] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5 rounded-lg transition-colors shadow-sm active:scale-[0.98] mt-2"
          >
            {loading ? 'Hesap oluşturuluyor...' : 'Kaydol'}
          </button>
        </form>

        <p className="text-[11px] text-neutral-500 text-center mt-4 px-2">
          Kaydolarak Koşullarımızı, Gizlilik İlkemizi ve Çerezler İlkemizi kabul etmiş olursun.
        </p>
      </div>

      {/* Switch to Login footer */}
      <div className="border-t border-[#262626] pt-5 text-center">
        <p className="text-xs text-neutral-400">
          Zaten hesabın var mı?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-[#0095f6] font-semibold hover:underline"
          >
            Giriş Yap.
          </button>
        </p>
      </div>
    </div>
  );
};
