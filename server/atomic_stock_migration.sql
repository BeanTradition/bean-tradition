-- Create atomic stock deduction function to prevent race conditions
CREATE OR REPLACE FUNCTION deduct_product_stock(p_id UUID, p_amount NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET stock_weight_grams = GREATEST(0, stock_weight_grams - p_amount)
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;
