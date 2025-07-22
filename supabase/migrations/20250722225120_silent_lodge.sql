/*
  # Fix User Registration RLS Policy

  1. Security Updates
    - Add policy to allow anonymous users to register (insert into users table)
    - This enables the registration flow to work properly
    - Users can insert their own records during registration

  2. Changes
    - Add "Enable registration for anonymous users" policy
    - Allows INSERT operations for anon role during registration
*/

-- Add policy to allow user registration
CREATE POLICY "Enable registration for anonymous users"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Also allow authenticated users to insert (for edge cases)
CREATE POLICY "Enable registration for authenticated users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);