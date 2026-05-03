import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { recordAuthEvent } from '@/lib/supabaseTelemetry';
import { ADMIN_EMAIL, isValidAdminCredential } from '@/lib/admin';

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  subscription: 'free' | 'premium';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateSubscription: (plan: 'free' | 'premium') => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// Simple hash for demo purposes (not production-grade)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
};

const generateToken = () => crypto.randomUUID();

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('df_token');
    const userData = localStorage.getItem('df_user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setIsLoading(false);
  }, []);

  const signup = async (name: string, email: string, password: string) => {
    const users = JSON.parse(localStorage.getItem('df_users') || '[]');
    if (users.find((u: any) => u.email === email)) {
      throw new Error('Email already registered');
    }

    const hashedPw = await hashPassword(password);
    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      email,
      createdAt: new Date().toISOString(),
      subscription: 'free',
    };

    users.push({ ...newUser, password: hashedPw });
    localStorage.setItem('df_users', JSON.stringify(users));

    const token = generateToken();
    localStorage.setItem('df_token', token);
    localStorage.setItem('df_user', JSON.stringify(newUser));
    setUser(newUser);
    void recordAuthEvent(newUser, 'signup');
  };

  const login = async (email: string, password: string) => {
    const users = JSON.parse(localStorage.getItem('df_users') || '[]');
    const hashedPw = await hashPassword(password);

    let userData: User | null = null;

    if (isValidAdminCredential(email, hashedPw)) {
      const existingUser = localStorage.getItem('df_user');
      const parsedExistingUser = existingUser ? (JSON.parse(existingUser) as User) : null;
      userData = parsedExistingUser?.email === ADMIN_EMAIL
        ? parsedExistingUser
        : {
            id: 'admin-user',
            name: 'Admin',
            email: ADMIN_EMAIL,
            createdAt: new Date().toISOString(),
            subscription: 'premium',
          };
    } else {
      const normalizedEmail = email.trim().toLowerCase();
      const found = users.find((u: any) => u.email.toLowerCase() === normalizedEmail && u.password === hashedPw);
      if (!found) {
        throw new Error('Invalid email or password');
      }
      const { password: _, ...foundUser } = found;
      userData = foundUser as User;
    }

    const token = generateToken();
    localStorage.setItem('df_token', token);
    localStorage.setItem('df_user', JSON.stringify(userData));
    setUser(userData);
    void recordAuthEvent(userData, 'login');
  };

  const logout = () => {
    localStorage.removeItem('df_token');
    localStorage.removeItem('df_user');
    setUser(null);
  };
  const updateSubscription = (plan: 'free' | 'premium') => {
    if (user) {
      const updatedUser = { ...user, subscription: plan };
      setUser(updatedUser);
      localStorage.setItem('df_user', JSON.stringify(updatedUser));

      const users = JSON.parse(localStorage.getItem('df_users') || '[]');
      const userIndex = users.findIndex((u: any) => u.id === user.id);
      if (userIndex >= 0) {
        users[userIndex].subscription = plan;
        localStorage.setItem('df_users', JSON.stringify(users));
      }

      void recordAuthEvent(updatedUser, 'subscription_update');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, updateSubscription }}>
      {children}
    </AuthContext.Provider>
  );
};
