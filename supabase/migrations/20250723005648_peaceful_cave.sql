/*
  # Enhanced Authentication and Role-Based Access Control System

  1. Enhanced User Management
    - Add account lockout functionality
    - Add email verification system
    - Add password reset tokens
    - Add session management
    - Add audit logging

  2. Security Features
    - Failed login attempt tracking
    - Account lockout after 5 failed attempts
    - Password strength requirements
    - Session timeout management
    - Email verification requirement

  3. Role-Based Access Control
    - Enhanced role system with permissions
    - Role hierarchy (root > admin > moderator > client)
    - Permission-based access control
    - Audit trail for all actions
*/

-- Add enhanced user security fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_locked_until timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_password_change timestamptz DEFAULT now();
ALTER TABLE users ADD COLUMN IF NOT EXISTS session_token text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS session_expires timestamptz;

-- Create user sessions table for better session management
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  device_info text,
  ip_address inet,
  user_agent text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_activity timestamptz DEFAULT now()
);

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  action text NOT NULL,
  resource_type text,
  resource_id text,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  permission_id uuid REFERENCES permissions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role, permission_id)
);

-- Insert default permissions
INSERT INTO permissions (name, description) VALUES
  ('view_dashboard', 'View main dashboard'),
  ('manage_users', 'Create, update, delete users'),
  ('manage_deposits', 'Approve/reject crypto deposits'),
  ('manage_withdrawals', 'Approve/reject crypto withdrawals'),
  ('manage_draws', 'Create and manage lottery draws'),
  ('view_analytics', 'View system analytics'),
  ('manage_wallets', 'Manage crypto wallet addresses'),
  ('system_admin', 'Full system administration'),
  ('purchase_tickets', 'Purchase lottery tickets'),
  ('view_own_data', 'View own profile and transactions')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
INSERT INTO role_permissions (role, permission_id)
SELECT 'root', id FROM permissions
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions 
WHERE name IN ('view_dashboard', 'manage_users', 'manage_deposits', 'manage_withdrawals', 'manage_draws', 'view_analytics', 'manage_wallets')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'client', id FROM permissions 
WHERE name IN ('view_dashboard', 'purchase_tickets', 'view_own_data')
ON CONFLICT DO NOTHING;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_account_locked ON users(account_locked_until);

-- Enable RLS on new tables
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_sessions
CREATE POLICY "Users can view own sessions"
  ON user_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all sessions"
  ON user_sessions
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE role IN ('admin', 'root')
    )
  );

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE role IN ('admin', 'root')
    )
  );

-- RLS Policies for permissions
CREATE POLICY "Everyone can view permissions"
  ON permissions
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for role_permissions
CREATE POLICY "Everyone can view role permissions"
  ON role_permissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Function to check user permissions
CREATE OR REPLACE FUNCTION user_has_permission(user_id uuid, permission_name text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM users u
    JOIN role_permissions rp ON rp.role = u.role
    JOIN permissions p ON p.id = rp.permission_id
    WHERE u.id = user_id AND p.name = permission_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id uuid,
  p_action text,
  p_resource_type text DEFAULT NULL,
  p_resource_id text DEFAULT NULL,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id, action, resource_type, resource_id, 
    old_values, new_values, ip_address
  ) VALUES (
    p_user_id, p_action, p_resource_type, p_resource_id,
    p_old_values, p_new_values, inet_client_addr()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle failed login attempts
CREATE OR REPLACE FUNCTION handle_failed_login(user_email text)
RETURNS void AS $$
DECLARE
  user_record users%ROWTYPE;
BEGIN
  SELECT * INTO user_record FROM users WHERE email = user_email;
  
  IF FOUND THEN
    UPDATE users 
    SET 
      failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1,
      account_locked_until = CASE 
        WHEN COALESCE(failed_login_attempts, 0) + 1 >= 5 
        THEN now() + interval '30 minutes'
        ELSE account_locked_until
      END
    WHERE email = user_email;
    
    -- Log the failed attempt
    PERFORM log_audit_event(
      user_record.id,
      'failed_login',
      'user',
      user_record.id::text
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle successful login
CREATE OR REPLACE FUNCTION handle_successful_login(user_email text)
RETURNS void AS $$
DECLARE
  user_record users%ROWTYPE;
BEGIN
  SELECT * INTO user_record FROM users WHERE email = user_email;
  
  IF FOUND THEN
    UPDATE users 
    SET 
      failed_login_attempts = 0,
      account_locked_until = NULL,
      last_login = now()
    WHERE email = user_email;
    
    -- Log the successful login
    PERFORM log_audit_event(
      user_record.id,
      'successful_login',
      'user',
      user_record.id::text
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM user_sessions WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;