/*
  # Hebrew Crypto Lottery System Schema

  1. New Tables
    - `users` - User accounts with roles and ILS balance
    - `crypto_wallets` - Admin-managed crypto wallet addresses
    - `crypto_deposits` - User crypto deposits awaiting validation
    - `crypto_withdrawals` - User withdrawal requests
    - `draws` - Lottery draws with winning numbers
    - `tickets` - User lottery tickets
    - `transactions` - Transaction history
    
  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Users can only access their own data
    - Admins can manage system data
*/

-- Create enum types
CREATE TYPE user_role AS ENUM ('client', 'admin', 'root');
CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'ticket_purchase', 'winnings', 'admin_adjustment');
CREATE TYPE crypto_type AS ENUM ('BTC', 'ETH', 'USDT_ERC20', 'USDT_TRC20');
CREATE TYPE deposit_status AS ENUM ('pending', 'confirmed', 'rejected');
CREATE TYPE draw_status AS ENUM ('scheduled', 'active', 'completed', 'cancelled');

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role user_role DEFAULT 'client',
  balance_ils decimal(10,2) DEFAULT 0.00,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  status text DEFAULT 'active',
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crypto wallets (admin configured)
CREATE TABLE IF NOT EXISTS crypto_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crypto_type crypto_type NOT NULL,
  wallet_address text NOT NULL,
  wallet_name text,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Crypto deposits
CREATE TABLE IF NOT EXISTS crypto_deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  crypto_type crypto_type NOT NULL,
  crypto_amount decimal(20,8) NOT NULL,
  wallet_address text NOT NULL,
  transaction_hash text,
  ils_amount decimal(10,2) NOT NULL,
  exchange_rate decimal(15,6) NOT NULL,
  status deposit_status DEFAULT 'pending',
  validated_by uuid REFERENCES users(id),
  validated_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Crypto withdrawals
CREATE TABLE IF NOT EXISTS crypto_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  crypto_type crypto_type NOT NULL,
  crypto_amount decimal(20,8) NOT NULL,
  destination_address text NOT NULL,
  ils_amount decimal(10,2) NOT NULL,
  exchange_rate decimal(15,6) NOT NULL,
  status deposit_status DEFAULT 'pending',
  processed_by uuid REFERENCES users(id),
  processed_at timestamptz,
  transaction_hash text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Lottery draws
CREATE TABLE IF NOT EXISTS draws (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_date timestamptz NOT NULL,
  winning_numbers integer[] CHECK (array_length(winning_numbers, 1) = 6),
  jackpot_amount decimal(12,2) DEFAULT 0.00,
  total_tickets integer DEFAULT 0,
  status draw_status DEFAULT 'scheduled',
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Lottery tickets
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  draw_id uuid REFERENCES draws(id) NOT NULL,
  numbers integer[] CHECK (array_length(numbers, 1) = 6),
  cost_ils decimal(6,2) DEFAULT 50.00,
  matches integer DEFAULT 0,
  winning_amount decimal(10,2) DEFAULT 0.00,
  is_winner boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Transaction history
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  type transaction_type NOT NULL,
  amount_ils decimal(10,2) NOT NULL,
  description text NOT NULL,
  reference_id uuid, -- Can reference deposits, withdrawals, tickets, etc.
  balance_before decimal(10,2),
  balance_after decimal(10,2),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'root')
    )
  );

-- Crypto wallets policies
CREATE POLICY "Everyone can view active wallets"
  ON crypto_wallets FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage wallets"
  ON crypto_wallets FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'root')
    )
  );

-- Crypto deposits policies
CREATE POLICY "Users can read own deposits"
  ON crypto_deposits FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create deposits"
  ON crypto_deposits FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all deposits"
  ON crypto_deposits FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'root')
    )
  );

-- Crypto withdrawals policies
CREATE POLICY "Users can read own withdrawals"
  ON crypto_withdrawals FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create withdrawals"
  ON crypto_withdrawals FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all withdrawals"
  ON crypto_withdrawals FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'root')
    )
  );

-- Draws policies
CREATE POLICY "Everyone can view draws"
  ON draws FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage draws"
  ON draws FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'root')
    )
  );

-- Tickets policies
CREATE POLICY "Users can read own tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create tickets"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('admin', 'root')
    )
  );

-- Transactions policies
CREATE POLICY "Users can read own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Insert initial crypto wallets (admin will configure real addresses)
INSERT INTO crypto_wallets (crypto_type, wallet_address, wallet_name, is_active) VALUES
('BTC', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 'Main BTC Wallet', true),
('ETH', '0x742d35Cc6634C0532925a3b8D23201e1a7E9Ed17', 'Main ETH Wallet', true),
('USDT_ERC20', '0x742d35Cc6634C0532925a3b8D23201e1a7E9Ed17', 'Main USDT ERC20 Wallet', true),
('USDT_TRC20', 'TQn9Y2khEsLJW1ChVWFMSMeRDow5CNYEGD', 'Main USDT TRC20 Wallet', true);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_crypto_deposits_user_id ON crypto_deposits(user_id);
CREATE INDEX idx_crypto_deposits_status ON crypto_deposits(status);
CREATE INDEX idx_crypto_withdrawals_user_id ON crypto_withdrawals(user_id);
CREATE INDEX idx_crypto_withdrawals_status ON crypto_withdrawals(status);
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_draw_id ON tickets(draw_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_draws_status ON draws(status);
CREATE INDEX idx_draws_draw_date ON draws(draw_date);