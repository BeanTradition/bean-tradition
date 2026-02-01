-- Create atomic stock deduction function to prevent race conditions
CREATE OR REPLACE FUNCTION deduct_product_stock(p_id UUID, p_amount NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET stock_weight_grams = GREATEST(0, stock_weight_grams - p_amount)
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- New function to deduct from detailed stock (Roast/Intensity)
CREATE OR REPLACE FUNCTION deduct_detailed_stock(p_id UUID, p_key TEXT, p_amount NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET 
    stock_by_profile = jsonb_set(
      COALESCE(stock_by_profile, '{}'::jsonb), 
      ARRAY[p_key], 
      to_jsonb(GREATEST(0, (COALESCE((stock_by_profile->>p_key)::NUMERIC, 0) - p_amount)))
    ),
    stock_weight_grams = GREATEST(0, stock_weight_grams - p_amount)
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;
