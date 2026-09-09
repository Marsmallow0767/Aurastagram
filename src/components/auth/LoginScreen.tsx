import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Lock, User as UserIcon, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onSwitchToRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Lütfen tüm alanları doldurunuz.');
      return;
    }

    setError(null);
    setLoading(true);
    const result = await login(identifier, password);
    setLoading(false);

    if (!result.success && result.error) {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between px-6 py-10 max-w-md mx-auto w-full">
      <div className="flex-1 flex flex-col justify-center">
        {/* Instagram Brand Typography */}
        <div className="text-center mb-10">
          <h1 className="font-instagram text-5xl text-white tracking-wide">
            Instagram
          </h1>
          <p className="text-sm text-neutral-400 mt-2 font-medium">
            Fotoğraf ve videolarınızı paylaşın
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-950/60 border border-red-800/80 rounded-lg p-3 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Identifier Field */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
              <UserIcon className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Telefon numarası, kullanıcı adı veya e-posta"
              className="w-full bg-[#121212] border border-[#262626] rounded-md py-3 pl-10 pr-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
              autoComplete="username"
            />
          </div>

          {/* Password Field */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifre"
              className="w-full bg-[#121212] border border-[#262626] rounded-md py-3 pl-10 pr-10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
              autoComplete="current-password"
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
            disabled={loading || !identifier.trim() || !password}
            className="w-full bg-[#0095f6] hover:bg-[#1877f2] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5 rounded-lg transition-colors shadow-sm active:scale-[0.98]"
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#262626]" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-black px-4 text-neutral-500 font-semibold">YA DA</span>
          </div>
        </div>

        <div className="text-center">
          <button
            type="button"
            className="text-[#0095f6] hover:underline text-xs font-semibold"
          >
            Şifreni mi unuttun?
          </button>
        </div>
      </div>

      {/* Switch to Register footer */}
      <div className="border-t border-[#262626] pt-5 text-center">
        <p className="text-xs text-neutral-400">
          Hesabın yok mu?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-[#0095f6] font-semibold hover:underline"
          >
            Kaydol.
          </button>
        </p>
      </div>
    </div>
  );
};
