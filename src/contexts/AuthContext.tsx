import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/services/api';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    username: string,
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      fetchUserProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const data: any = await apiClient.get('/auth/profile');
        setUser(data.data.user);
      } catch (err) {
        // Token is invalid, remove it
        localStorage.removeItem('authToken');
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      localStorage.removeItem('authToken');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      try {
        const data: any = await apiClient.post('/auth/login', { identifier: email, password });
        localStorage.setItem('authToken', data.data.token);
        setUser(data.data.user);
        toast({
          title: 'Login Successful',
          description: `Welcome back, ${data.data.user.username}!`,
        });
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Invalid credentials';
        toast({
          title: 'Login Failed',
          description: message,
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      toast({
        title: 'Login Error',
        description: error instanceof Error ? error.message : 'Network error. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      try {
        const data: any = await apiClient.post('/auth/register', { username, email, password, firstName, lastName });
        localStorage.setItem('authToken', data.data.token);
        setUser(data.data.user);
        toast({
          title: 'Registration Successful',
          description: `Welcome, ${data.data.user.username}!`,
        });
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Registration failed';
        toast({
          title: 'Registration Failed',
          description: message,
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      toast({
        title: 'Registration Error',
        description: error instanceof Error ? error.message : 'Network error. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
  };

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return false;

      try {
        const result: any = await apiClient.put('/auth/profile', data);
        setUser(result.data.user);
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been successfully updated.',
        });
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update profile';
        toast({
          title: 'Update Failed',
          description: message,
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      toast({
        title: 'Update Error',
        description: error instanceof Error ? error.message : 'Network error. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    await fetchUserProfile();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;