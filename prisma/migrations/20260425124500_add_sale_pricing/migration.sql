-- Add suggested and real sale price tracking without introducing price history yet.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sale_price DECIMAL(12, 2);

ALTER TABLE stock_output_items
  ADD COLUMN IF NOT EXISTS suggested_unit_sale_price DECIMAL(12, 2),
  ADD COLUMN IF NOT EXISTS unit_sale_price DECIMAL(12, 2);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'chk_products_sale_price_non_negative'
      AND n.nspname = current_schema()
  ) THEN
    EXECUTE 'ALTER TABLE products ADD CONSTRAINT chk_products_sale_price_non_negative CHECK (sale_price IS NULL OR sale_price >= 0)';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'chk_stock_output_items_suggested_sale_price_non_negative'
      AND n.nspname = current_schema()
  ) THEN
    EXECUTE 'ALTER TABLE stock_output_items ADD CONSTRAINT chk_stock_output_items_suggested_sale_price_non_negative CHECK (suggested_unit_sale_price IS NULL OR suggested_unit_sale_price >= 0)';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'chk_stock_output_items_unit_sale_price_non_negative'
      AND n.nspname = current_schema()
  ) THEN
    EXECUTE 'ALTER TABLE stock_output_items ADD CONSTRAINT chk_stock_output_items_unit_sale_price_non_negative CHECK (unit_sale_price IS NULL OR unit_sale_price >= 0)';
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION prepare_stock_output_item()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_purchase_price numeric;
  v_sale_price numeric;
  v_reason text;
BEGIN
  SELECT p.purchase_price,
         p.sale_price,
         so.reason::text
    INTO v_purchase_price,
         v_sale_price,
         v_reason
  FROM products p
  JOIN stock_outputs so
    ON so.id = NEW.stock_output_id
  WHERE p.id = NEW.product_id;

  IF NEW.unit_cost IS NULL THEN
    NEW.unit_cost := v_purchase_price;
  END IF;

  IF v_reason = 'SALE' THEN
    IF NEW.suggested_unit_sale_price IS NULL THEN
      NEW.suggested_unit_sale_price := v_sale_price;
    END IF;

    IF NEW.unit_sale_price IS NULL THEN
      NEW.unit_sale_price := NEW.suggested_unit_sale_price;
    END IF;
  ELSE
    NEW.suggested_unit_sale_price := NULL;
    NEW.unit_sale_price := NULL;
  END IF;

  RETURN NEW;
END;
$$;
