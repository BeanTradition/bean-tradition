-- Create a sequence for order numbering
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Add order_number column to orders table if it doesn't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number TEXT;

-- Function to generate the formatted ID: BTIN + YEAR + 4-digit sequence
CREATE OR REPLACE FUNCTION generate_bt_order_number()
RETURNS TRIGGER AS $$
DECLARE
    year_suffix TEXT;
    seq_val INT;
BEGIN
    year_suffix := TO_CHAR(CURRENT_DATE, 'YY');
    -- Get next value from sequence
    seq_val := NEXTVAL('order_number_seq');
    
    -- Combine: BTIN + 26 + 0001
    NEW.order_number := 'BTIN' || year_suffix || LPAD(seq_val::TEXT, 4, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set order_number on insert
DROP TRIGGER IF EXISTS trg_generate_order_number ON orders;
CREATE TRIGGER trg_generate_order_number
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION generate_bt_order_number();

-- Backfill existing orders if any (optional but good for consistency)
DO $$
DECLARE
    r RECORD;
    year_suffix TEXT;
    seq_val INT;
BEGIN
    FOR r IN (SELECT id, created_at FROM orders WHERE order_number IS NULL ORDER BY created_at ASC) LOOP
        year_suffix := TO_CHAR(r.created_at, 'YY');
        seq_val := NEXTVAL('order_number_seq');
        UPDATE orders SET order_number = 'BTIN' || year_suffix || LPAD(seq_val::TEXT, 4, '0') WHERE id = r.id;
    END LOOP;
END $$;
