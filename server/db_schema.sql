-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users Table
create table public.users (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text not null unique,
  password text not null, -- Hashed password
  "isAdmin" boolean default false,
  phone text,
  address jsonb, -- Stores { street, city, pincode, state }
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Products Table
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text not null,
  image text not null,
  tags text[], -- Array of strings
  intensity int,
  roast text check (roast in ('Light', 'Medium', 'Dark')),
  category text check (category in ('Beans', 'Filter Powder', 'Instant')),
  "tastingNotes" text,
  "bestFor" text,
  variants jsonb, -- Stores array of { weight, price }
  "numReviews" int default 0,
  "countInStock" int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Orders Table
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id),
  "orderItems" jsonb not null, -- Stores detailed items array
  "shippingAddress" jsonb not null,
  "paymentMethod" text not null default 'Razorpay',
  "paymentResult" jsonb, -- Stores { id, status, email_address }
  "taxPrice" numeric default 0.0,
  "shippingPrice" numeric default 0.0,
  "totalPrice" numeric default 0.0,
  "isPaid" boolean default false,
  "paidAt" timestamp with time zone,
  "isDelivered" boolean default false,
  "deliveredAt" timestamp with time zone,
  status text default 'Pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) - Optional if using only Service Role in backend, 
-- but good practice if you ever connect frontend directly.
alter table public.users enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;

-- Policies (Simple public access for now as backend handles auth)
create policy "Public users are viewable by everyone" on public.users for select using (true);
create policy "Public products are viewable by everyone" on public.products for select using (true);
create policy "Public orders are viewable by everyone" on public.orders for select using (true);
