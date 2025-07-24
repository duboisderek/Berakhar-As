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
    // Validate password strength
    const passwordStrength = AuthService.validatePasswordStrength(userData.password);
    if (!passwordStrength.isValid) {
      throw new Error(`הסיסמה אינה עומדת בדרישות האבטחה: ${passwordStrength.feedback.join(', ')}`);
    }

    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Insert user into our users table
    const { data, error } = await supabase
      .from('users')
      .insert([{
        email: userData.email,
        password_hash: hashedPassword,
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone: userData.phone,
        role: 'client',
        email_verified: true // Auto-verify for now, can be changed to false for email verification
      }])
      .select()
      .single();

    if (error) throw error;

    // Create Supabase Auth user for session management
    const { error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        emailRedirectTo: undefined // Skip email confirmation
      }
    });

    if (authError) {
      // Clean up user record if auth signup fails
      await supabase.from('users').delete().eq('id', data.id);
      throw authError;
    }

    setUser(data);
  };

  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<LoginAttemptResult> => {
    try {
      // First try Supabase Auth login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        // Fallback to custom authentication
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
      }

      // If Supabase auth succeeds, get user profile
      if (authData.user) {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('email', authData.user.email)
          .single();

        if (profileError || !profile) {
          await supabase.auth.signOut();
          return {
            success: false,
            error: 'פרופיל משתמש לא נמצא'
          };
        }

        // Update last login
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', profile.id);

        setUser(profile);
        
        // Log successful login
        await AuthService.logAuditEvent(
          profile.id,
          'login',
          'user',
          profile.id
        );

        return {
          success: true,
          user: profile
        };
      }

      return {
        success: false,
        error: 'שגיאה בהתחברות'
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'שגיאה בהתחברות'
      };
    }
  };
    
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