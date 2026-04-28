-- Create blocked_times table
CREATE TABLE IF NOT EXISTS public.blocked_times (
    id TEXT PRIMARY KEY,
    professional_id TEXT NOT NULL,
    professional_name TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    duration INTEGER NOT NULL,
    reason TEXT
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.blocked_times ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.blocked_times FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.blocked_times FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.blocked_times FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.blocked_times FOR DELETE USING (true);
