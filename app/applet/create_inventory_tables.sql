-- Create inventory table
CREATE TABLE IF NOT EXISTS public.inventory (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    stock NUMERIC NOT NULL,
    min_stock NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    status TEXT NOT NULL,
    price NUMERIC NOT NULL
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.inventory FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.inventory FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.inventory FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.inventory FOR DELETE USING (true);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC NOT NULL,
    stock NUMERIC NOT NULL,
    rating NUMERIC NOT NULL,
    image TEXT
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.products FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.products FOR DELETE USING (true);

-- Create drinks table
CREATE TABLE IF NOT EXISTS public.drinks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC NOT NULL,
    stock NUMERIC NOT NULL,
    rating NUMERIC NOT NULL,
    icon TEXT
);

ALTER TABLE public.drinks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.drinks FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.drinks FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.drinks FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.drinks FOR DELETE USING (true);

-- Create rewards table
CREATE TABLE IF NOT EXISTS public.rewards (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    points NUMERIC NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL
);

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.rewards FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.rewards FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.rewards FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.rewards FOR DELETE USING (true);

-- Create loyalty_transactions table
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    points NUMERIC NOT NULL,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    date TEXT NOT NULL
);

ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.loyalty_transactions FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.loyalty_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.loyalty_transactions FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.loyalty_transactions FOR DELETE USING (true);

-- Create consent_forms table
CREATE TABLE IF NOT EXISTS public.consent_forms (
    id TEXT PRIMARY KEY,
    appointment_id TEXT NOT NULL,
    client_id TEXT NOT NULL,
    type TEXT NOT NULL,
    signed_at TEXT NOT NULL,
    signature TEXT NOT NULL,
    professional_signature TEXT,
    client_cpf TEXT,
    client_birth_date TEXT,
    guardian_name TEXT,
    guardian_doc TEXT,
    guardian_birth_date TEXT,
    guardian_photo TEXT,
    guardian_face_photo TEXT,
    minor_photo TEXT,
    answers JSONB NOT NULL
);

ALTER TABLE public.consent_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.consent_forms FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.consent_forms FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.consent_forms FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.consent_forms FOR DELETE USING (true);
