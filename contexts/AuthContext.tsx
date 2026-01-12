import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Driver } from '../types/User';
import { mockStore } from '../services/mockDb';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, phone: string) => Promise<void>;
  signupDriver: (name: string, email: string, password: string, phone: string, vehicleType: string, licensePlate: string) => Promise<void>;
  updateProfile: (data: Partial<User | Driver>) => Promise<void>;
  updateAuth: (data: { email?: string; password?: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from local storage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const foundUser = mockStore.authenticate(email, password);

    if (foundUser) {
      const { password, ...userWithoutPass } = foundUser;
      setUser(userWithoutPass);
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPass));
    } else {
      setIsLoading(false);
      throw new Error('メールアドレスまたはパスワードが間違っています。');
    }
    setIsLoading(false);
  };

  const signup = async (name: string, email: string, password: string, phone: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      // Register via mockStore
      const newUser = mockStore.register(name, email, password, 'customer', { phone });

      const { password: _, ...userWithoutPass } = newUser;
      setUser(userWithoutPass);
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPass));
    } catch (e: any) {
      setIsLoading(false);
      throw e;
    }
    setIsLoading(false);
  };

  const signupDriver = async (name: string, email: string, password: string, phone: string, vehicleType: string, licensePlate: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const newUser = mockStore.register(name, email, password, 'driver', {
        phone,
        vehicleType,
        licensePlate
      });
      const { password: _, ...userWithoutPass } = newUser;
      setUser(userWithoutPass);
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPass));
    } catch (e: any) {
      setIsLoading(false);
      throw e;
    }
    setIsLoading(false);
  };

  const updateProfile = async (data: Partial<User | Driver>) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Sim delay

    if (user) {
      const updatedUser = { ...user, ...data } as User;
      mockStore.updateUser(updatedUser);
      setUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
    setIsLoading(false);
  };

  const updateAuth = async (data: { email?: string; password?: string }) => {
    setIsLoading(true);
    // Simulate Supabase Update User delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (user) {
      if (data.email) {
        // In real Supabase: const { data, error } = await supabase.auth.updateUser({ email: data.email })
        console.log(`[Supabase Mock] Updating Email to: ${data.email}`);
        user.email = data.email;
      }
      if (data.password) {
        // In real Supabase: const { data, error } = await supabase.auth.updateUser({ password: data.password })
        console.log(`[Supabase Mock] Updating Password... (Secure)`);
        user.password = data.password;
      }

      const updatedUser = { ...user } as User;
      mockStore.updateUser(updatedUser);
      setUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, signupDriver, updateProfile, updateAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};