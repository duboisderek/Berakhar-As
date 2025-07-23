/*
  # Fix user registration RLS policy

  1. Security Changes
    - Update RLS policy to allow anonymous users to register
    - Ensure proper security for user registration
    - Maintain data integrity while allowing signup

  2. Policy Updates
    - Modify INSERT policy for anonymous registration
    - Keep existing policies for authenticated users
    - Add proper validation for registration data
*/

-- Drop existing restrictive INSERT policies
DROP POLICY IF EXISTS "Enable registration for anonymous users" ON users;
DROP POLICY IF EXISTS "Enable registration for authenticated users" ON users;

-- Create new policy that allows anonymous users to register
CREATE POLICY "Allow anonymous user registration"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (
    -- Allow registration with basic validation
    email IS NOT NULL 
    AND email != '' 
    AND first_name IS NOT NULL 
    AND first_name != ''
    AND last_name IS NOT NULL 
    AND last_name != ''
    AND password_hash IS NOT NULL 
    AND password_hash != ''
    AND role = 'client'  -- Force new users to be clients
    AND status = 'active'  -- Force new users to be active
  );

-- Also allow authenticated users to register (for admin creating users)
CREATE POLICY "Allow authenticated user registration"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    email IS NOT NULL 
    AND email != '' 
    AND first_name IS NOT NULL 
    AND first_name != ''
    AND last_name IS NOT NULL 
    AND last_name != ''
    AND password_hash IS NOT NULL 
    AND password_hash != ''
  );