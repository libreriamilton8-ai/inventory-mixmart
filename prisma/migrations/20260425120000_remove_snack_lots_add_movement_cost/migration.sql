-- Snacks no longer use lots/expiration tracking. Keep stock simple and
-- preserve cost at the movement/output level for reporting.

DROP TRIGGER IF EXISTS trg_stock_entry_items_validate_snacks ON stock_entry_items;
DROP FUNCTION IF EXISTS validate_snack_stock_entry_item();

ALTER TABLE stock_movements
  ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(12, 2);

CREATE OR REPLACE FUNCTION guard_received_stock_entry_item_mutations()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_status text;
BEGIN
  SELECT status::text
    INTO v_status
  FROM stock_entries
  WHERE id = CASE
    WHEN TG_OP = 'DELETE' THEN OLD.stock_entry_id
    ELSE NEW.stock_entry_id
  END;

  IF v_status = 'RECEIVED' THEN
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'Received stock entry items cannot be deleted';
    END IF;

    IF NEW.stock_entry_id IS DISTINCT FROM OLD.stock_entry_id
       OR NEW.product_id IS DISTINCT FROM OLD.product_id
       OR NEW.quantity IS DISTINCT FROM OLD.quantity
       OR NEW.unit_cost IS DISTINCT FROM OLD.unit_cost THEN
      RAISE EXCEPTION 'Received stock entry items are immutable';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION apply_received_stock_entry_item(p_stock_entry_item_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_product_id uuid;
  v_user_id uuid;
  v_quantity numeric;
  v_unit_cost numeric;
  v_occurred_at timestamp;
  v_product_stock_after numeric;
BEGIN
  SELECT sei.product_id,
         se.created_by_id,
         sei.quantity,
         sei.unit_cost,
         COALESCE(se.received_at, se.created_at)
    INTO v_product_id,
         v_user_id,
         v_quantity,
         v_unit_cost,
         v_occurred_at
  FROM stock_entry_items sei
  JOIN stock_entries se
    ON se.id = sei.stock_entry_id
  WHERE sei.id = p_stock_entry_item_id
    AND se.status::text = 'RECEIVED';

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM stock_movements
    WHERE stock_entry_item_id = p_stock_entry_item_id
  ) THEN
    RETURN;
  END IF;

  UPDATE products
  SET purchase_price = CASE
        WHEN current_stock + v_quantity > 0 THEN
          round(((current_stock * purchase_price) + (v_quantity * v_unit_cost)) / (current_stock + v_quantity), 2)
        ELSE v_unit_cost
      END,
      current_stock = current_stock + v_quantity,
      updated_at = now()
  WHERE id = v_product_id
  RETURNING current_stock
    INTO v_product_stock_after;

  INSERT INTO stock_movements (
    id,
    product_id,
    stock_entry_item_id,
    performed_by_id,
    movement_type,
    direction,
    quantity,
    unit_cost,
    product_stock_after,
    occurred_at,
    notes
  )
  VALUES (
    gen_random_uuid(),
    v_product_id,
    p_stock_entry_item_id,
    v_user_id,
    'PURCHASE_ENTRY'::"StockMovementType",
    'IN'::"StockMovementDirection",
    v_quantity,
    v_unit_cost,
    v_product_stock_after,
    v_occurred_at,
    'Auto-applied when stock entry reached RECEIVED status'
  );
END;
$$;

CREATE OR REPLACE FUNCTION consume_product_stock(
  p_product_id uuid,
  p_quantity numeric,
  p_movement_type text,
  p_stock_output_item_id uuid,
  p_service_consumption_id uuid,
  p_performed_by_id uuid,
  p_occurred_at timestamp,
  p_unit_cost numeric,
  p_notes text
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_product_stock_after numeric;
  v_unit_cost numeric;
BEGIN
  UPDATE products
  SET current_stock = current_stock - p_quantity,
      updated_at = now()
  WHERE id = p_product_id
    AND current_stock >= p_quantity
  RETURNING current_stock, COALESCE(p_unit_cost, purchase_price)
    INTO v_product_stock_after, v_unit_cost;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for product %', p_product_id;
  END IF;

  INSERT INTO stock_movements (
    id,
    product_id,
    stock_output_item_id,
    service_consumption_id,
    performed_by_id,
    movement_type,
    direction,
    quantity,
    unit_cost,
    product_stock_after,
    occurred_at,
    notes
  )
  VALUES (
    gen_random_uuid(),
    p_product_id,
    p_stock_output_item_id,
    p_service_consumption_id,
    p_performed_by_id,
    CASE p_movement_type
      WHEN 'SALE' THEN 'SALE'::"StockMovementType"
      WHEN 'WASTE' THEN 'WASTE'::"StockMovementType"
      WHEN 'INTERNAL_USE' THEN 'INTERNAL_USE'::"StockMovementType"
      ELSE 'SERVICE_CONSUMPTION'::"StockMovementType"
    END,
    'OUT'::"StockMovementDirection",
    p_quantity,
    v_unit_cost,
    v_product_stock_after,
    COALESCE(p_occurred_at, now()),
    p_notes
  );
END;
$$;

CREATE OR REPLACE FUNCTION prepare_stock_output_item()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.unit_cost IS NULL THEN
    SELECT purchase_price
      INTO NEW.unit_cost
    FROM products
    WHERE id = NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION after_insert_stock_output_item()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_reason text;
  v_user_id uuid;
  v_occurred_at timestamp;
BEGIN
  SELECT reason::text, created_by_id, occurred_at
    INTO v_reason, v_user_id, v_occurred_at
  FROM stock_outputs
  WHERE id = NEW.stock_output_id;

  PERFORM consume_product_stock(
    NEW.product_id,
    NEW.quantity,
    v_reason,
    NEW.id,
    NULL,
    v_user_id,
    v_occurred_at,
    NEW.unit_cost,
    'Auto-applied from stock output item'
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION after_insert_service_consumption()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_service_date timestamp;
BEGIN
  SELECT created_by_id, service_date
    INTO v_user_id, v_service_date
  FROM service_records
  WHERE id = NEW.service_record_id;

  PERFORM consume_product_stock(
    NEW.product_id,
    NEW.quantity,
    'SERVICE_CONSUMPTION',
    NULL,
    NEW.id,
    v_user_id,
    v_service_date,
    NULL,
    'Auto-applied from service consumption'
  );

  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS consume_product_stock(uuid, numeric, text, uuid, uuid, uuid, timestamp, text);

UPDATE stock_movements sm
SET unit_cost = sei.unit_cost
FROM stock_entry_items sei
WHERE sm.stock_entry_item_id = sei.id
  AND sm.unit_cost IS NULL;

UPDATE stock_movements sm
SET unit_cost = il.unit_cost
FROM inventory_lots il
WHERE sm.inventory_lot_id = il.id
  AND sm.unit_cost IS NULL
  AND il.unit_cost IS NOT NULL;

UPDATE stock_movements sm
SET unit_cost = COALESCE(soi.unit_cost, p.purchase_price)
FROM stock_output_items soi
JOIN products p
  ON p.id = soi.product_id
WHERE sm.stock_output_item_id = soi.id
  AND sm.unit_cost IS NULL;

UPDATE stock_movements sm
SET unit_cost = p.purchase_price
FROM service_consumptions sc
JOIN products p
  ON p.id = sc.product_id
WHERE sm.service_consumption_id = sc.id
  AND sm.unit_cost IS NULL;

UPDATE stock_output_items soi
SET unit_cost = COALESCE(soi.unit_cost, p.purchase_price)
FROM products p
WHERE p.id = soi.product_id
  AND soi.unit_cost IS NULL;

ALTER TABLE stock_movements
  DROP CONSTRAINT IF EXISTS stock_movements_inventory_lot_id_fkey;

ALTER TABLE stock_entry_items
  DROP CONSTRAINT IF EXISTS stock_entry_items_inventory_lot_id_fkey;

ALTER TABLE stock_entry_items
  DROP COLUMN IF EXISTS inventory_lot_id,
  DROP COLUMN IF EXISTS lot_number,
  DROP COLUMN IF EXISTS expiration_date;

ALTER TABLE stock_movements
  DROP COLUMN IF EXISTS inventory_lot_id,
  DROP COLUMN IF EXISTS lot_stock_after;

DROP TABLE IF EXISTS inventory_lots;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'chk_stock_output_items_unit_cost_non_negative'
      AND n.nspname = current_schema()
  ) THEN
    EXECUTE 'ALTER TABLE stock_output_items ADD CONSTRAINT chk_stock_output_items_unit_cost_non_negative CHECK (unit_cost IS NULL OR unit_cost >= 0)';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'chk_stock_movements_unit_cost_non_negative'
      AND n.nspname = current_schema()
  ) THEN
    EXECUTE 'ALTER TABLE stock_movements ADD CONSTRAINT chk_stock_movements_unit_cost_non_negative CHECK (unit_cost IS NULL OR unit_cost >= 0)';
  END IF;
END
$$;

DROP TRIGGER IF EXISTS trg_stock_output_items_prepare ON stock_output_items;
CREATE TRIGGER trg_stock_output_items_prepare
BEFORE INSERT ON stock_output_items
FOR EACH ROW
EXECUTE FUNCTION prepare_stock_output_item();
