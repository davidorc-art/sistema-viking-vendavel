-- Add missing columns for InfinitePay and User Isolation (RLS)

-- Appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS payment_link_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT,
ADD COLUMN IF NOT EXISTS payment_url TEXT,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Transactions table
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Professionals table
ALTER TABLE professionals
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Inventory table
ALTER TABLE inventory
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Drinks table
ALTER TABLE drinks
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Rewards table
ALTER TABLE rewards
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Loyalty Transactions table
ALTER TABLE loyalty_transactions
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Consent Forms table
ALTER TABLE consent_forms
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Blocked Times table
ALTER TABLE blocked_times
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Management Categories table
ALTER TABLE management_categories
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Management Rules table
ALTER TABLE management_rules
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Settings table (if it exists as a table)
-- ALTER TABLE settings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
