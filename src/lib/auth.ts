import { supabase } from './supabase';
import bcrypt from 'bcryptjs';

export interface LoginAttemptResult {
  success: boolean;
  user?: any;
  error?: string;
  accountLocked?: boolean;
  lockoutTime?: Date;
}

export interface PasswordStrength {
  score: number;
  feedback: string[];
  isValid: boolean;
}

export class AuthService {
  // Check if account is locked
  static async isAccountLocked(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('account_locked_until')
        .eq('email', email)
        .maybeSingle();

      if (error || !data) return false;

      if (data.account_locked_until) {
        const lockoutTime = new Date(data.account_locked_until);
        return lockoutTime > new Date();
      }

      return false;
    } catch (error) {
      console.error('Error checking account lock status:', error);
      return false;
    }
  }

  // Validate password strength
  static validatePasswordStrength(password: string): PasswordStrength {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('הסיסמה חייבת להכיל לפחות 8 תווים');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('הסיסמה חייבת להכיל לפחות אות גדולה אחת');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('הסיסמה חייבת להכיל לפחות אות קטנה אחת');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('הסיסמה חייבת להכיל לפחות ספרה אחת');
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push('הסיסמה חייבת להכיל לפחות תו מיוחד אחד');
    }

    return {
      score,
      feedback,
      isValid: score >= 4
    };
  }

  // Handle login attempt with security measures
  static async attemptLogin(email: string, password: string): Promise<LoginAttemptResult> {
    try {
      // Check if account is locked
      const isLocked = await this.isAccountLocked(email);
      if (isLocked) {
        const { data } = await supabase
          .from('users')
          .select('account_locked_until')
          .eq('email', email)
          .single();

        return {
          success: false,
          error: 'החשבון נעול זמנית עקב ניסיונות התחברות כושלים',
          accountLocked: true,
          lockoutTime: data?.account_locked_until ? new Date(data.account_locked_until) : undefined
        };
      }

      // Get user record
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (userError || !userRecord) {
        // Call failed login handler
        await supabase.rpc('handle_failed_login', { user_email: email });
        return {
          success: false,
          error: 'אימייל או סיסמה שגויים'
        };
      }

      // Check if email is verified (if verification is required)
      if (!userRecord.email_verified) {
        return {
          success: false,
          error: 'יש לאמת את כתובת האימייל לפני ההתחברות'
        };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, userRecord.password_hash);
      
      if (!isValidPassword) {
        // Call failed login handler
        await supabase.rpc('handle_failed_login', { user_email: email });
        return {
          success: false,
          error: 'אימייל או סיסמה שגויים'
        };
      }

      // Sign in with Supabase Auth
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        await supabase.rpc('handle_failed_login', { user_email: email });
        return {
          success: false,
          error: 'שגיאה בהתחברות'
        };
      }

      // Call successful login handler
      await supabase.rpc('handle_successful_login', { user_email: email });

      return {
        success: true,
        user: userRecord
      };

    } catch (error) {
      console.error('Login attempt error:', error);
      return {
        success: false,
        error: 'שגיאה בהתחברות'
      };
    }
  }

  // Generate secure session token
  static generateSessionToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Create user session
  static async createSession(userId: string, rememberMe: boolean = false): Promise<string> {
    const sessionToken = this.generateSessionToken();
    const expiresAt = new Date();
    
    if (rememberMe) {
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
    } else {
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours
    }

    await supabase
      .from('user_sessions')
      .insert([{
        user_id: userId,
        session_token: sessionToken,
        device_info: navigator.userAgent,
        expires_at: expiresAt.toISOString()
      }]);

    return sessionToken;
  }

  // Validate session
  static async validateSession(sessionToken: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('expires_at')
        .eq('session_token', sessionToken)
        .single();

      if (error || !data) return false;

      const expiresAt = new Date(data.expires_at);
      return expiresAt > new Date();
    } catch (error) {
      return false;
    }
  }

  // Check user permission
  static async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('user_has_permission', {
          user_id: userId,
          permission_name: permission
        });

      return !error && data === true;
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }

  // Log audit event
  static async logAuditEvent(
    userId: string,
    action: string,
    resourceType?: string,
    resourceId?: string,
    oldValues?: any,
    newValues?: any
  ): Promise<void> {
    try {
      await supabase.rpc('log_audit_event', {
        p_user_id: userId,
        p_action: action,
        p_resource_type: resourceType,
        p_resource_id: resourceId,
        p_old_values: oldValues,
        p_new_values: newValues
      });
    } catch (error) {
      console.error('Audit logging error:', error);
    }
  }

  // Generate email verification token
  static async generateEmailVerificationToken(email: string): Promise<string> {
    const token = this.generateSessionToken();
    
    await supabase
      .from('users')
      .update({ email_verification_token: token })
      .eq('email', email);

    return token;
  }

  // Verify email with token
  static async verifyEmail(token: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ 
          email_verified: true,
          email_verification_token: null 
        })
        .eq('email_verification_token', token)
        .select()
        .single();

      return !error && data !== null;
    } catch (error) {
      console.error('Email verification error:', error);
      return false;
    }
  }

  // Generate password reset token
  static async generatePasswordResetToken(email: string): Promise<boolean> {
    try {
      const token = this.generateSessionToken();
      const expires = new Date();
      expires.setHours(expires.getHours() + 1); // 1 hour expiry

      const { error } = await supabase
        .from('users')
        .update({
          password_reset_token: token,
          password_reset_expires: expires.toISOString()
        })
        .eq('email', email);

      return !error;
    } catch (error) {
      console.error('Password reset token generation error:', error);
      return false;
    }
  }

  // Reset password with token
  static async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      // Validate password strength
      const strength = this.validatePasswordStrength(newPassword);
      if (!strength.isValid) {
        throw new Error('הסיסמה אינה עומדת בדרישות האבטחה');
      }

      // Check if token is valid and not expired
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, password_reset_expires')
        .eq('password_reset_token', token)
        .single();

      if (userError || !user) return false;

      const expiresAt = new Date(user.password_reset_expires);
      if (expiresAt < new Date()) return false;

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password and clear reset token
      const { error } = await supabase
        .from('users')
        .update({
          password_hash: hashedPassword,
          password_reset_token: null,
          password_reset_expires: null,
          last_password_change: new Date().toISOString()
        })
        .eq('id', user.id);

      return !error;
    } catch (error) {
      console.error('Password reset error:', error);
      return false;
    }
  }

  // Clean up expired sessions
  static async cleanupExpiredSessions(): Promise<void> {
    try {
      await supabase.rpc('cleanup_expired_sessions');
    } catch (error) {
      console.error('Session cleanup error:', error);
    }
  }
}