-- Run this in your Supabase SQL Editor to create the queries table

CREATE TABLE IF NOT EXISTS public.queries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL
);

-- Optional: Enable RLS and add policies if needed
ALTER TABLE public.queries ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit a query
CREATE POLICY "Enable insert for all users" ON public.queries FOR INSERT WITH CHECK (true);

-- Only admins can view queries (Modify with your admin logic if needed)
CREATE POLICY "Enable read for admins" ON public.queries FOR SELECT USING (auth.role() = 'service_role');
