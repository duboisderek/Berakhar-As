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


    setUser(data);
  };

  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<LoginAttemptResult> => {
    try {
      // Get user from database
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (userError || !userRecord) {
        return {
          success: false,
          error: 'אימייל או סיסמה שגויים'
        };
      }

      // Check if account is locked
      if (userRecord.account_locked_until) {
        const lockoutTime = new Date(userRecord.account_locked_until);
        if (lockoutTime > new Date()) {
          return {
            success: false,
            error: 'החשבון נעול זמנית עקב ניסיונות התחברות כושלים',
            accountLocked: true,
            lockoutTime
          };
        }
      }

      // Verify password
      const bcrypt = await import('bcryptjs');
      const isValidPassword = await bcrypt.compare(password, userRecord.password_hash);
      
      if (!isValidPassword) {
        // Increment failed login attempts
        const newFailedAttempts = (userRecord.failed_login_attempts || 0) + 1;
        
        const updateData: any = {
          failed_login_attempts: newFailedAttempts
        };
        
        if (newFailedAttempts >= 5) {
          const lockUntil = new Date();
          lockUntil.setMinutes(lockUntil.getMinutes() + 30);
          updateData.account_locked_until = lockUntil.toISOString();
        }
        
        await supabase
          .from('users')
          .update(updateData)
          .eq('id', userRecord.id);
          
        return {
          success: false,
          error: 'אימייל או סיסמה שגויים'
        };
      }

      // Reset failed attempts and update last login
      await supabase
        .from('users')
        .update({ 
          last_login: new Date().toISOString(),
          failed_login_attempts: 0,
          account_locked_until: null
        })
        .eq('id', userRecord.id);

      // Create session if remember me is enabled
      if (rememberMe) {
        await AuthService.createSession(userRecord.id, true);
      }
      
      setUser(userRecord);
      
      // Log successful login
      await AuthService.logAuditEvent(
        userRecord.id,
        'login',
        'user',
        userRecord.id
      );

      return {
        success: true,
        user: userRecord
      };
        
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'שגיאה בהתחברות - נסה שוב'
      };
    }
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