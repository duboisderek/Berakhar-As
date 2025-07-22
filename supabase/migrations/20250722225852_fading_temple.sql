@@ .. @@
-- Create crypto_withdrawals table
CREATE TABLE IF NOT EXISTS crypto_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  crypto_type crypto_type NOT NULL,
  crypto_amount numeric(20,8) NOT NULL,
  destination_address text NOT NULL,
  ils_amount numeric(10,2) NOT NULL,
  exchange_rate numeric(15,6) NOT NULL,
  status deposit_status DEFAULT 'pending',
  processed_by uuid REFERENCES users(id),
  processed_at timestamptz,
  transaction_hash text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for crypto_withdrawals
CREATE INDEX IF NOT EXISTS idx_crypto_withdrawals_user_id ON crypto_withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_withdrawals_status ON crypto_withdrawals(status);

-- Enable RLS for crypto_withdrawals
ALTER TABLE crypto_withdrawals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for crypto_withdrawals
CREATE POLICY "Users can create withdrawals"
  ON crypto_withdrawals
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = uid());

CREATE POLICY "Users can read own withdrawals"
  ON crypto_withdrawals
  FOR SELECT
  TO authenticated
  USING (user_id = uid());

CREATE POLICY "Admins can manage all withdrawals"
  ON crypto_withdrawals
  FOR ALL
  TO authenticated
  USING (uid() IN (
    SELECT id FROM users WHERE role IN ('admin', 'root')
  ));

@@ .. @@