-- Migration to add stock_weight_grams to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_weight_grams NUMERIC DEFAULT 10000; -- Default 10kg
