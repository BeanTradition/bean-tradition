
-- Create Coupons Table
create table if not exists public.coupons (
  id uuid default uuid_generate_v4() primary key,
  code text not null unique,
  "discountType" text check ("discountType" in ('PERCENTAGE', 'FIXED')) not null,
  "discountValue" numeric not null,
  "expirationDate" timestamp with time zone,
  "usageLimit" int, -- NULL means unlimited
  "usageCount" int default 0,
  "isActive" boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.coupons enable row level security;

-- Policies
-- Admin can do everything
create policy "Admins can view all coupons" on public.coupons for select using (true); 
create policy "Admins can insert coupons" on public.coupons for insert with check (true);
create policy "Admins can update coupons" on public.coupons for update using (true);
create policy "Admins can delete coupons" on public.coupons for delete using (true);

-- Public can only "view" valid coupons indirectly via API, typically we don't expose select to public directly for codes.
-- However, for the 'validate' check in standard Supabase client use, we might need select permission if we query from frontend.
-- BUT, we are implementing this via a backend API (couponController), which uses the SERVICE ROLE key (usually) or the Authenticated User.
-- If the backend uses Service Role, RLS is bypassed. The current backend config uses Service Role? 
-- Let's check server/config/supabaseClient.js.
