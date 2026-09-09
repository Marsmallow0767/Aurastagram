import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { storageService, getDefaultAvatar } from '../services/storage';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  register: (username: string, fullName: string, email: string, password: string, avatar?: string) => Promise<{ success: boolean; error?: string }>;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  toggleFollow: (targetUserId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session on launch
    const user = storageService.getCurrentUser();
    if (user) {
      // Re-fetch freshest data from user list
      const freshUser = storageService.getUserById(user.id);
      setCurrentUser(freshUser || user);
    }
    setIsLoading(false);
  }, []);

  const register = async (
    username: string,
    fullName: string,
    email: string,
    password: string,
    avatar?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUsername || cleanUsername.length < 3) {
      return { success: false, error: 'Kullanıcı adı en az 3 karakter olmalıdır.' };
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Geçerli bir e-posta adresi giriniz.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Şifre en az 6 karakter olmalıdır.' };
    }

    if (storageService.getUserByUsername(cleanUsername)) {
      return { success: false, error: 'Bu kullanıcı adı zaten kullanılıyor.' };
    }
    if (storageService.getUserByEmail(cleanEmail)) {
      return { success: false, error: 'Bu e-posta adresi ile zaten kayıt olunmuş.' };
    }

    const newUser: User = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      username: cleanUsername,
      fullName: fullName.trim() || cleanUsername,
      email: cleanEmail,
      avatar: avatar || getDefaultAvatar(cleanUsername),
      followers: [],
      following: [],
      createdAt: new Date().toISOString(),
    };

    storageService.saveUser(newUser, password);
    storageService.setCurrentUser(newUser);
    setCurrentUser(newUser);

    return { success: true };
  };

  const login = async (
    identifier: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanId = identifier.trim().toLowerCase();
    const user = storageService.getUserByUsername(cleanId) || storageService.getUserByEmail(cleanId);

    if (!user) {
      return { success: false, error: 'Bu kullanıcı adı veya e-posta ile kayıtlı hesap bulunamadı.' };
    }

    const isValid = storageService.verifyPassword(user.id, password);
    if (!isValid) {
      return { success: false, error: 'Girdiğiniz şifre hatalı.' };
    }

    storageService.setCurrentUser(user);
    setCurrentUser(user);
    return { success: true };
  };

  const logout = () => {
    storageService.setCurrentUser(null);
    setCurrentUser(null);
  };

  const updateProfile = (updates: Partial<User>) => {
    if (!currentUser) return;
    const updated: User = { ...currentUser, ...updates };
    storageService.saveUser(updated);
    setCurrentUser(updated);
  };

  const toggleFollow = (targetUserId: string): boolean => {
    if (!currentUser) return false;
    const result = storageService.toggleFollow(currentUser.id, targetUserId);
    const refreshed = storageService.getUserById(currentUser.id);
    if (refreshed) {
      setCurrentUser(refreshed);
    }
    return result;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        register,
        login,
        logout,
        updateProfile,
        toggleFollow,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
