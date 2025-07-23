import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AuthService, LoginAttemptResult, PasswordStrength } from '../lib/auth';
import type { Database } from '../lib/supabase';

type User = Database['public']['Tables']['users']['Row'];

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<LoginAttemptResult>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  validatePasswordStrength: (password: string) => PasswordStrength;
  requestPasswordReset: (email: string) => Promise<boolean>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
  hasPermission: (permission: string) => Promise<boolean>;
  isAdmin: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Get user profile from our users table
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('email', session.user.email)
            .maybeSingle();
          
          if (profile) {
            setUser(profile);
            // Update last login
            await supabase
              .from('users')
              .update({ last_login: new Date().toISOString() })
              .eq('id', profile.id);
          }
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('email', session.user.email)
          .maybeSingle();
        
        if (profile) {
          setUser(profile);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const register = async (userData: RegisterData) => {
    // Simple password validation for alphanumeric only
    if (userData.password.length < 6 || userData.password.length > 20) {
      throw new Error('הסיסמה חייבת להכיל בין 6 ל-20 תווים');
    }
    
    if (!/^[a-zA-Z0-9]+$/.test(userData.password)) {
      throw new Error('הסיסמה חייבת להכיל רק אותיות ומספרים');
    }

    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    try {
      // Insert user into our users table
      const { data, error } = await supabase
        .from('users')
        .insert([{
          email: userData.email,
          password_hash: hashedPassword,
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone || null,
          role: 'client',
          email_verified: true,
          status: 'active'
        }])
        .select()
        .single();

      if (error) {
        console.error('Registration error:', error);
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('כתובת האימייל כבר קיימת במערכת');
        }
        throw new Error('שגיאה ביצירת החשבון');
      }

      setUser(data);
    } catch (error: any) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<LoginAttemptResult> => {
    const result = await AuthService.attemptLogin(email, password);
    
    if (result.success && result.user) {
      // Create session if remember me is enabled
      if (rememberMe) {
        await AuthService.createSession(result.user.id, true);
      }
      
      setUser(result.user);
      
      // Log successful login
      await AuthService.logAuditEvent(
        result.user.id,
        'login',
        'user',
        result.user.id
      );
    }
    
    return result;
  };

  const logout = async () => {
    if (user) {
      // Log logout event
      await AuthService.logAuditEvent(
        user.id,
        'logout',
        'user',
        user.id
      );
    }
    
    await supabase.auth.signOut();
    setUser(null);
  };

  const validatePasswordStrength = (password: string): PasswordStrength => {
    return AuthService.validatePasswordStrength(password);
  };

  const requestPasswordReset = async (email: string): Promise<boolean> => {
    return await AuthService.generatePasswordResetToken(email);
  };

  const resetPassword = async (token: string, newPassword: string): Promise<boolean> => {
    return await AuthService.resetPassword(token, newPassword);
  };

  const hasPermission = async (permission: string): Promise<boolean> => {
    if (!user) return false;
    return await AuthService.hasPermission(user.id, permission);
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'root';

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    validatePasswordStrength,
    requestPasswordReset,
    resetPassword,
    hasPermission,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}