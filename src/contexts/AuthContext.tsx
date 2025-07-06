import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import bcrypt from 'bcryptjs';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'moderator';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth token and verify with database
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      const userId = localStorage.getItem('user_id');
      
      if (token && userId) {
        try {
          // Verify user exists in database
          const { data, error } = await supabase
            .from('admin_users')
            .select('id, email, name, role, is_active')
            .eq('id', userId)
            .single();

          if (data && data.is_active && !error) {
            setUser({
              id: data.id,
              email: data.email,
              name: data.name,
              role: data.role
            });
          } else {
            // Invalid token or inactive user
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_id');
          }
        } catch (error) {
          console.error('Auth verification error:', error);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_id');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Try to authenticate with database
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('id, email, password_hash, name, role, is_active')
        .eq('email', email)
        .single();

      if (error || !adminUser) {
        // Fallback to demo credentials for new users
        if (email === 'admin@pickme.intel' && password === 'admin123') {
          // Create demo user in database if it doesn't exist
          const demoUser = {
            email: 'admin@pickme.intel',
            password_hash: await bcrypt.hash('admin123', 12),
            name: 'Admin User',
            role: 'admin' as const,
            is_active: true
          };

          const { data: createdUser, error: createError } = await supabase
            .from('admin_users')
            .insert([demoUser])
            .select('id, email, name, role')
            .single();

          if (createError && !createError.message.includes('duplicate')) {
            throw new Error('Failed to create demo user');
          }

          const userData = createdUser || {
            id: 'demo-admin-id',
            email: 'admin@pickme.intel',
            name: 'Admin User',
            role: 'admin' as const
          };

          setUser(userData);
          localStorage.setItem('auth_token', 'demo-jwt-token');
          localStorage.setItem('user_id', userData.id);
          
          // Update last login
          await supabase
            .from('admin_users')
            .update({ last_login: new Date().toISOString() })
            .eq('email', email);
        } else {
          throw new Error('Invalid credentials');
        }
      } else {
        // Verify password
        const isValidPassword = await bcrypt.compare(password, adminUser.password_hash);
        if (!isValidPassword) {
          throw new Error('Invalid credentials');
        }

        if (!adminUser.is_active) {
          throw new Error('Account is deactivated');
        }

        setUser({
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role
        });

        localStorage.setItem('auth_token', `jwt-${adminUser.id}`);
        localStorage.setItem('user_id', adminUser.id);

        // Update last login
        await supabase
          .from('admin_users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', adminUser.id);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isLoading, 
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
};