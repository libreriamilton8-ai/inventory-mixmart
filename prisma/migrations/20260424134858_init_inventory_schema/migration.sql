-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "mixmart";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'WORKER');

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('SCHOOL_SUPPLIES', 'BAZAAR', 'SNACKS');

-- CreateEnum
CREATE TYPE "StockEntryStatus" AS ENUM ('ORDERED', 'RECEIVED');

-- CreateEnum
CREATE TYPE "StockOutputReason" AS ENUM ('SALE', 'WASTE', 'INTERNAL_USE');

-- CreateEnum
CREATE TYPE "ServiceKind" AS ENUM ('IN_HOUSE', 'OUTSOURCED');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('RECEIVED', 'IN_PROGRESS', 'COMPLETED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StockMovementDirection" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('PURCHASE_ENTRY', 'SALE', 'WASTE', 'INTERNAL_USE', 'SERVICE_CONSUMPTION');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "dni" VARCHAR(10),
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(254),
    "first_name" VARCHAR(50) NOT NULL,
    "last_name" VARCHAR(50) NOT NULL,
    "phone" VARCHAR(30),
    "date_of_birth" DATE,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" UUID NOT NULL,
    "ruc" VARCHAR(20) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(30) NOT NULL,
    "contact_name" VARCHAR(120) NOT NULL,
    "address" VARCHAR(250),
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "sku" VARCHAR(50),
    "barcode" VARCHAR(64),
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "category" "ProductCategory" NOT NULL,
    "unit_name" VARCHAR(30) NOT NULL,
    "purchase_price" DECIMAL(12,2) NOT NULL,
    "minimum_stock" DECIMAL(12,3) NOT NULL,
    "current_stock" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_suppliers" (
    "product_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "supplier_product_code" VARCHAR(60),
    "is_preferred" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "pk_product_suppliers" PRIMARY KEY ("product_id","supplier_id")
);

-- CreateTable
CREATE TABLE "stock_entries" (
    "id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "status" "StockEntryStatus" NOT NULL,
    "ordered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "received_at" TIMESTAMP(3),
    "reference_number" VARCHAR(50),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_entry_items" (
    "id" UUID NOT NULL,
    "stock_entry_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "inventory_lot_id" UUID,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit_cost" DECIMAL(12,2) NOT NULL,
    "lot_number" VARCHAR(80),
    "expiration_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_entry_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_lots" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "supplier_id" UUID,
    "lot_number" VARCHAR(80) NOT NULL,
    "expiration_date" DATE NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "initial_quantity" DECIMAL(12,3) NOT NULL,
    "current_quantity" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "unit_cost" DECIMAL(12,2),
    "last_movement_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_outputs" (
    "id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "reason" "StockOutputReason" NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_outputs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_output_items" (
    "id" UUID NOT NULL,
    "stock_output_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit_cost" DECIMAL(12,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_output_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_types" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "kind" "ServiceKind" NOT NULL,
    "unit_name" VARCHAR(30) NOT NULL DEFAULT 'unit',
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "service_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_type_supplies" (
    "id" UUID NOT NULL,
    "service_type_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity_per_unit" DECIMAL(12,3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "service_type_supplies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_records" (
    "id" UUID NOT NULL,
    "service_type_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "kind" "ServiceKind" NOT NULL,
    "status" "ServiceStatus" NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "service_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivered_at" TIMESTAMP(3),
    "external_vendor_name" VARCHAR(120),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_consumptions" (
    "id" UUID NOT NULL,
    "service_record_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_consumptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "inventory_lot_id" UUID,
    "stock_entry_item_id" UUID,
    "stock_output_item_id" UUID,
    "service_consumption_id" UUID,
    "performed_by_id" UUID,
    "movement_type" "StockMovementType" NOT NULL,
    "direction" "StockMovementDirection" NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "product_stock_after" DECIMAL(12,3) NOT NULL,
    "lot_stock_after" DECIMAL(12,3),
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_users_dni" ON "users"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "uq_users_username" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "uq_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_deleted_name" ON "users"("deleted_at", "last_name", "first_name");

-- CreateIndex
CREATE INDEX "idx_users_role_deleted" ON "users"("role", "deleted_at");

-- CreateIndex
CREATE INDEX "idx_users_active_name" ON "users"("is_active", "last_name", "first_name");

-- CreateIndex
CREATE INDEX "idx_users_role_active" ON "users"("role", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "uq_suppliers_ruc" ON "suppliers"("ruc");

-- CreateIndex
CREATE INDEX "idx_suppliers_deleted_name" ON "suppliers"("deleted_at", "name");

-- CreateIndex
CREATE INDEX "idx_suppliers_active_name" ON "suppliers"("is_active", "name");

-- CreateIndex
CREATE UNIQUE INDEX "uq_products_sku" ON "products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "uq_products_barcode" ON "products"("barcode");

-- CreateIndex
CREATE INDEX "idx_products_deleted_name" ON "products"("deleted_at", "name");

-- CreateIndex
CREATE INDEX "idx_products_category_deleted_name" ON "products"("category", "deleted_at", "name");

-- CreateIndex
CREATE INDEX "idx_products_deleted_current_stock" ON "products"("deleted_at", "current_stock");

-- CreateIndex
CREATE INDEX "idx_products_active_name" ON "products"("is_active", "name");

-- CreateIndex
CREATE INDEX "idx_products_category_active_name" ON "products"("category", "is_active", "name");

-- CreateIndex
CREATE INDEX "idx_products_active_current_stock" ON "products"("is_active", "current_stock");

-- CreateIndex
CREATE INDEX "idx_product_suppliers_product_deleted" ON "product_suppliers"("product_id", "deleted_at");

-- CreateIndex
CREATE INDEX "idx_product_suppliers_supplier_deleted_preferred" ON "product_suppliers"("supplier_id", "deleted_at", "is_preferred");

-- CreateIndex
CREATE INDEX "idx_product_suppliers_supplier_preferred" ON "product_suppliers"("supplier_id", "is_preferred");

-- CreateIndex
CREATE INDEX "idx_stock_entries_supplier_ordered_at" ON "stock_entries"("supplier_id", "ordered_at");

-- CreateIndex
CREATE INDEX "idx_stock_entries_status_ordered_at" ON "stock_entries"("status", "ordered_at");

-- CreateIndex
CREATE INDEX "idx_stock_entries_received_at" ON "stock_entries"("received_at");

-- CreateIndex
CREATE INDEX "idx_stock_entry_items_entry" ON "stock_entry_items"("stock_entry_id");

-- CreateIndex
CREATE INDEX "idx_stock_entry_items_product" ON "stock_entry_items"("product_id");

-- CreateIndex
CREATE INDEX "idx_stock_entry_items_inventory_lot" ON "stock_entry_items"("inventory_lot_id");

-- CreateIndex
CREATE INDEX "idx_stock_entry_items_product_expiration" ON "stock_entry_items"("product_id", "expiration_date");

-- CreateIndex
CREATE INDEX "idx_inventory_lots_product_expiration" ON "inventory_lots"("product_id", "expiration_date");

-- CreateIndex
CREATE INDEX "idx_inventory_lots_expiration_quantity" ON "inventory_lots"("expiration_date", "current_quantity");

-- CreateIndex
CREATE UNIQUE INDEX "uq_inventory_lots_product_lot_expiration" ON "inventory_lots"("product_id", "lot_number", "expiration_date");

-- CreateIndex
CREATE INDEX "idx_stock_outputs_reason_occurred_at" ON "stock_outputs"("reason", "occurred_at");

-- CreateIndex
CREATE INDEX "idx_stock_outputs_created_by_occurred_at" ON "stock_outputs"("created_by_id", "occurred_at");

-- CreateIndex
CREATE INDEX "idx_stock_output_items_output" ON "stock_output_items"("stock_output_id");

-- CreateIndex
CREATE INDEX "idx_stock_output_items_product" ON "stock_output_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_service_types_name" ON "service_types"("name");

-- CreateIndex
CREATE INDEX "idx_service_types_deleted_name" ON "service_types"("deleted_at", "name");

-- CreateIndex
CREATE INDEX "idx_service_types_kind_deleted" ON "service_types"("kind", "deleted_at");

-- CreateIndex
CREATE INDEX "idx_service_types_active_name" ON "service_types"("is_active", "name");

-- CreateIndex
CREATE INDEX "idx_service_types_kind_active" ON "service_types"("kind", "is_active");

-- CreateIndex
CREATE INDEX "idx_service_type_supplies_type_deleted" ON "service_type_supplies"("service_type_id", "deleted_at");

-- CreateIndex
CREATE INDEX "idx_service_type_supplies_product_deleted" ON "service_type_supplies"("product_id", "deleted_at");

-- CreateIndex
CREATE INDEX "idx_service_type_supplies_product" ON "service_type_supplies"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_service_type_supplies_service_product" ON "service_type_supplies"("service_type_id", "product_id");

-- CreateIndex
CREATE INDEX "idx_service_records_service_date" ON "service_records"("service_date");

-- CreateIndex
CREATE INDEX "idx_service_records_created_by_date" ON "service_records"("created_by_id", "service_date");

-- CreateIndex
CREATE INDEX "idx_service_records_kind_status_date" ON "service_records"("kind", "status", "service_date");

-- CreateIndex
CREATE INDEX "idx_service_records_type_date" ON "service_records"("service_type_id", "service_date");

-- CreateIndex
CREATE INDEX "idx_service_consumptions_product" ON "service_consumptions"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_service_consumptions_service_product" ON "service_consumptions"("service_record_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_stock_movements_stock_entry_item" ON "stock_movements"("stock_entry_item_id");

-- CreateIndex
CREATE INDEX "idx_stock_movements_occurred_at" ON "stock_movements"("occurred_at");

-- CreateIndex
CREATE INDEX "idx_stock_movements_product_occurred_at" ON "stock_movements"("product_id", "occurred_at");

-- CreateIndex
CREATE INDEX "idx_stock_movements_type_occurred_at" ON "stock_movements"("movement_type", "occurred_at");

-- CreateIndex
CREATE INDEX "idx_stock_movements_direction_occurred_at" ON "stock_movements"("direction", "occurred_at");

-- CreateIndex
CREATE INDEX "idx_stock_movements_performed_by_occurred_at" ON "stock_movements"("performed_by_id", "occurred_at");

-- CreateIndex
CREATE INDEX "idx_stock_movements_lot_occurred_at" ON "stock_movements"("inventory_lot_id", "occurred_at");

-- CreateIndex
CREATE INDEX "idx_stock_movements_output_item" ON "stock_movements"("stock_output_item_id");

-- CreateIndex
CREATE INDEX "idx_stock_movements_service_consumption" ON "stock_movements"("service_consumption_id");

-- AddForeignKey
ALTER TABLE "product_suppliers" ADD CONSTRAINT "product_suppliers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_suppliers" ADD CONSTRAINT "product_suppliers_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_entries" ADD CONSTRAINT "stock_entries_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_entries" ADD CONSTRAINT "stock_entries_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_entry_items" ADD CONSTRAINT "stock_entry_items_stock_entry_id_fkey" FOREIGN KEY ("stock_entry_id") REFERENCES "stock_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_entry_items" ADD CONSTRAINT "stock_entry_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_entry_items" ADD CONSTRAINT "stock_entry_items_inventory_lot_id_fkey" FOREIGN KEY ("inventory_lot_id") REFERENCES "inventory_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_lots" ADD CONSTRAINT "inventory_lots_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_outputs" ADD CONSTRAINT "stock_outputs_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_output_items" ADD CONSTRAINT "stock_output_items_stock_output_id_fkey" FOREIGN KEY ("stock_output_id") REFERENCES "stock_outputs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_output_items" ADD CONSTRAINT "stock_output_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_type_supplies" ADD CONSTRAINT "service_type_supplies_service_type_id_fkey" FOREIGN KEY ("service_type_id") REFERENCES "service_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_type_supplies" ADD CONSTRAINT "service_type_supplies_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_service_type_id_fkey" FOREIGN KEY ("service_type_id") REFERENCES "service_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_consumptions" ADD CONSTRAINT "service_consumptions_service_record_id_fkey" FOREIGN KEY ("service_record_id") REFERENCES "service_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_consumptions" ADD CONSTRAINT "service_consumptions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_inventory_lot_id_fkey" FOREIGN KEY ("inventory_lot_id") REFERENCES "inventory_lots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_stock_entry_item_id_fkey" FOREIGN KEY ("stock_entry_item_id") REFERENCES "stock_entry_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_stock_output_item_id_fkey" FOREIGN KEY ("stock_output_item_id") REFERENCES "stock_output_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_service_consumption_id_fkey" FOREIGN KEY ("service_consumption_id") REFERENCES "service_consumptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_performed_by_id_fkey" FOREIGN KEY ("performed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Business rules: checks, triggers, stock movements and history guards

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'chk_products_purchase_price_non_negative'
      AND n.nspname = current_schema()
  ) THEN
    EXECUTE 'ALTER TABLE products ADD CONSTRAINT chk_products_purchase_price_non_negative CHECK (purchase_price >= 0)';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'chk_products_minimum_stock_non_negative'
      AND n.nspname = current_schema()
  ) THEN
    EXECUTE 'ALTER TABLE products ADD CONSTRAINT chk_products_minimum_stock_non_negative CHECK (minimum_stock >= 0)';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'chk_products_current_stock_non_negative'
      AND n.nspname = current_schema()
  ) THEN
    EXECUTE 'ALTER TABLE products ADD CONSTRAINT chk_products_current_stock_non_negative CHECK (current_stock >= 0)';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'chk_stock_entries_status_received_at'
      AND n.nspname = current_schema()
  ) THEN
    EXECUTE 'ALTER TABLE stock_entries ADD CONSTRAINT chk_stock_entries_status_received_at CHECK (
      (status = ''ORDERED'' AND received_at IS NULL)
      OR (status = ''RECEIVED'' AND received_at IS NOT NULL AND received_at >= ordered_at)
    )';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'chk_stock_entry_items_quantity_positive'
      AND n.nspname = current_schema()
  ) THEN
    EXECUTE 'ALTER TABLE stock_entry_items ADD CONSTRAINT chk_stock_entry_items_quantity_positive CHECK (quantity > 0)';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'chk_stock_entry_items_unit_cost_non_negative'
      AND n.nspname = current_schema()
  ) THEN
    EXECUTE 'ALTER TABLE stock_entry_items ADD CONSTRAINT chk_stock_entry_items_unit_cost_non_negative CHECK (unit_cost >= 0)';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'chk_inventory_lots_initial_quantity_positive'
      AND n.nspname = current_schema()
  ) THEN
    EXECUTE 'ALTER TABLE inventory_lots ADD CONSTRAINT chk_inventory_lots_initial_quantity_positive CHECK (initial_quantity > 0)';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'chk_inventory_lots_current_quantity_non_negative'
      AND n.nspname = current_schema()
  ) THEN
    EXECUTE 'ALTER TABLE inventory_lots ADD CONSTRAINT chk_inventory_lots_current_quantity_non_negative CHECK (current_quantity >= 0)';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'chk_inventory_lots_unit_cost_non_negative'
      AND n.nspname = current_schema()
  ) THEN
    EXECUTE 'ALTER TABLE inventory_lots ADD CONSTRAINT chk_inventory_lots_unit_cost_non_negative CHECK (unit_cost IS NULL OR unit_cost >= 0)';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'chk_stock_output_items_quantity_positive'
      AND n.nspname = current_schema()
  ) THEN
    EXECUTE 'ALTER TABLE stock_output_items ADD CONSTRAINT chk_stock_output_items_quantity_positive CHECK (quantity > 0)';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'chk_service_type_supplies_quantity_positive'
      AND n.nspname = current_schema()
  ) THEN
    EXECUTE 'ALTER TABLE service_type_supplies ADD CONSTRAINT chk_service_type_supplies_quantity_positive CHECK (quantity_per_unit > 0)';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'chk_service_records_quantity_positive'
      AND n.nspname = current_schema()
  ) THEN
    EXECUTE 'ALTER TABLE service_records ADD CONSTRAINT chk_service_records_quantity_positive CHECK (quantity > 0)';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'chk_service_records_status_delivered_at'
      AND n.nspname = current_schema()
  ) THEN
    EXECUTE 'ALTER TABLE service_records ADD CONSTRAINT chk_service_records_status_delivered_at CHECK (
      (status = ''DELIVERED'' AND delivered_at IS NOT NULL AND delivered_at >= service_date)
      OR (status <> ''DELIVERED'' AND delivered_at IS NULL)
    )';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'chk_service_consumptions_quantity_positive'
      AND n.nspname = current_schema()
  ) THEN
    EXECUTE 'ALTER TABLE service_consumptions ADD CONSTRAINT chk_service_consumptions_quantity_positive CHECK (quantity > 0)';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'chk_stock_movements_quantity_positive'
      AND n.nspname = current_schema()
  ) THEN
    EXECUTE 'ALTER TABLE stock_movements ADD CONSTRAINT chk_stock_movements_quantity_positive CHECK (quantity > 0)';
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_product_suppliers_preferred_per_product
  ON product_suppliers (product_id)
  WHERE is_preferred;

CREATE OR REPLACE FUNCTION prevent_history_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION '% rows are append-only and cannot be deleted', TG_TABLE_NAME;
END;
$$;

CREATE OR REPLACE FUNCTION prevent_stock_movement_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'stock_movements rows are immutable';
END;
$$;

CREATE OR REPLACE FUNCTION prepare_stock_entry()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status::text = 'RECEIVED' AND NEW.received_at IS NULL THEN
    NEW.received_at := now();
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.status::text = 'RECEIVED' AND NEW.status::text <> 'RECEIVED' THEN
      RAISE EXCEPTION 'Received stock entries cannot be reverted to another status';
    END IF;

    IF OLD.status::text = 'RECEIVED'
       AND (
         NEW.supplier_id IS DISTINCT FROM OLD.supplier_id
         OR NEW.ordered_at IS DISTINCT FROM OLD.ordered_at
         OR NEW.received_at IS DISTINCT FROM OLD.received_at
       ) THEN
      RAISE EXCEPTION 'Received stock entries are immutable except for notes and reference number';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION validate_snack_stock_entry_item()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_category text;
BEGIN
  SELECT category::text
    INTO v_category
  FROM products
  WHERE id = NEW.product_id;

  IF v_category = 'SNACKS' THEN
    IF NEW.lot_number IS NULL OR btrim(NEW.lot_number) = '' THEN
      RAISE EXCEPTION 'Snack stock entry items require lot_number';
    END IF;

    IF NEW.expiration_date IS NULL THEN
      RAISE EXCEPTION 'Snack stock entry items require expiration_date';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

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
       OR NEW.unit_cost IS DISTINCT FROM OLD.unit_cost
       OR NEW.lot_number IS DISTINCT FROM OLD.lot_number
       OR NEW.expiration_date IS DISTINCT FROM OLD.expiration_date THEN
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
  v_supplier_id uuid;
  v_user_id uuid;
  v_category text;
  v_quantity numeric;
  v_unit_cost numeric;
  v_lot_number text;
  v_expiration_date date;
  v_occurred_at timestamp;
  v_inventory_lot_id uuid;
  v_product_stock_after numeric;
  v_lot_stock_after numeric;
BEGIN
  SELECT sei.product_id,
         se.supplier_id,
         se.created_by_id,
         p.category::text,
         sei.quantity,
         sei.unit_cost,
         sei.lot_number,
         sei.expiration_date,
         COALESCE(se.received_at, se.created_at)
    INTO v_product_id,
         v_supplier_id,
         v_user_id,
         v_category,
         v_quantity,
         v_unit_cost,
         v_lot_number,
         v_expiration_date,
         v_occurred_at
  FROM stock_entry_items sei
  JOIN stock_entries se
    ON se.id = sei.stock_entry_id
  JOIN products p
    ON p.id = sei.product_id
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

  IF v_category = 'SNACKS' THEN
    IF v_lot_number IS NULL OR btrim(v_lot_number) = '' OR v_expiration_date IS NULL THEN
      RAISE EXCEPTION 'Snack stock entries require lot_number and expiration_date before reception';
    END IF;

    INSERT INTO inventory_lots (
      id,
      product_id,
      supplier_id,
      lot_number,
      expiration_date,
      received_at,
      initial_quantity,
      current_quantity,
      unit_cost,
      last_movement_at,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      v_product_id,
      v_supplier_id,
      v_lot_number,
      v_expiration_date,
      v_occurred_at,
      v_quantity,
      v_quantity,
      v_unit_cost,
      v_occurred_at,
      now(),
      now()
    )
    ON CONFLICT (product_id, lot_number, expiration_date)
    DO UPDATE SET
      supplier_id = COALESCE(inventory_lots.supplier_id, EXCLUDED.supplier_id),
      initial_quantity = inventory_lots.initial_quantity + EXCLUDED.initial_quantity,
      current_quantity = inventory_lots.current_quantity + EXCLUDED.current_quantity,
      unit_cost = EXCLUDED.unit_cost,
      last_movement_at = EXCLUDED.last_movement_at,
      updated_at = now()
    RETURNING id, current_quantity
      INTO v_inventory_lot_id, v_lot_stock_after;

    UPDATE stock_entry_items
    SET inventory_lot_id = v_inventory_lot_id
    WHERE id = p_stock_entry_item_id
      AND inventory_lot_id IS DISTINCT FROM v_inventory_lot_id;
  END IF;

  UPDATE products
  SET current_stock = current_stock + v_quantity,
      updated_at = now()
  WHERE id = v_product_id
  RETURNING current_stock
    INTO v_product_stock_after;

  INSERT INTO stock_movements (
    id,
    product_id,
    inventory_lot_id,
    stock_entry_item_id,
    performed_by_id,
    movement_type,
    direction,
    quantity,
    product_stock_after,
    lot_stock_after,
    occurred_at,
    notes
  )
  VALUES (
    gen_random_uuid(),
    v_product_id,
    v_inventory_lot_id,
    p_stock_entry_item_id,
    v_user_id,
    'PURCHASE_ENTRY'::"StockMovementType",
    'IN'::"StockMovementDirection",
    v_quantity,
    v_product_stock_after,
    v_lot_stock_after,
    v_occurred_at,
    'Auto-applied when stock entry reached RECEIVED status'
  );
END;
$$;

CREATE OR REPLACE FUNCTION after_insert_stock_entry_item()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM apply_received_stock_entry_item(NEW.id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION after_receive_stock_entry()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_item record;
BEGIN
  IF NEW.status::text = 'RECEIVED' THEN
    IF TG_OP = 'INSERT' OR OLD.status::text <> 'RECEIVED' THEN
      FOR v_item IN
        SELECT id
        FROM stock_entry_items
        WHERE stock_entry_id = NEW.id
        ORDER BY created_at, id
      LOOP
        PERFORM apply_received_stock_entry_item(v_item.id);
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
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
  p_notes text
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_category text;
  v_product_stock_after numeric;
  v_remaining numeric := p_quantity;
  v_lot record;
  v_taken numeric;
  v_lot_stock_after numeric;
BEGIN
  UPDATE products
  SET current_stock = current_stock - p_quantity,
      updated_at = now()
  WHERE id = p_product_id
    AND current_stock >= p_quantity
  RETURNING category::text, current_stock
    INTO v_category, v_product_stock_after;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for product %', p_product_id;
  END IF;

  IF v_category = 'SNACKS' THEN
    FOR v_lot IN
      SELECT id, current_quantity
      FROM inventory_lots
      WHERE product_id = p_product_id
        AND current_quantity > 0
      ORDER BY expiration_date, received_at, created_at, id
      FOR UPDATE
    LOOP
      EXIT WHEN v_remaining <= 0;

      v_taken := LEAST(v_remaining, v_lot.current_quantity);

      UPDATE inventory_lots
      SET current_quantity = current_quantity - v_taken,
          last_movement_at = COALESCE(p_occurred_at, now()),
          updated_at = now()
      WHERE id = v_lot.id
      RETURNING current_quantity
        INTO v_lot_stock_after;

      INSERT INTO stock_movements (
        id,
        product_id,
        inventory_lot_id,
        stock_output_item_id,
        service_consumption_id,
        performed_by_id,
        movement_type,
        direction,
        quantity,
        product_stock_after,
        lot_stock_after,
        occurred_at,
        notes
      )
      VALUES (
        gen_random_uuid(),
        p_product_id,
        v_lot.id,
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
        v_taken,
        v_product_stock_after,
        v_lot_stock_after,
        COALESCE(p_occurred_at, now()),
        p_notes
      );

      v_remaining := v_remaining - v_taken;
    END LOOP;

    IF v_remaining > 0 THEN
      RAISE EXCEPTION 'Lot stock is inconsistent for snack product %', p_product_id;
    END IF;
  ELSE
    INSERT INTO stock_movements (
      id,
      product_id,
      stock_output_item_id,
      service_consumption_id,
      performed_by_id,
      movement_type,
      direction,
      quantity,
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
      v_product_stock_after,
      COALESCE(p_occurred_at, now()),
      p_notes
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION prevent_stock_output_item_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'stock_output_items are immutable once created';
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
    'Auto-applied from stock output item'
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION guard_service_type_kind_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.kind IS DISTINCT FROM OLD.kind
     AND EXISTS (
       SELECT 1
       FROM service_records
       WHERE service_type_id = OLD.id
     ) THEN
    RAISE EXCEPTION 'ServiceType.kind cannot change after service records exist';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION validate_service_record_kind()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_expected_kind text;
BEGIN
  SELECT kind::text
    INTO v_expected_kind
  FROM service_types
  WHERE id = NEW.service_type_id;

  IF v_expected_kind IS NULL THEN
    RAISE EXCEPTION 'service_type_id % does not exist', NEW.service_type_id;
  END IF;

  IF NEW.kind::text <> v_expected_kind THEN
    RAISE EXCEPTION 'ServiceRecord.kind must match ServiceType.kind';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION guard_service_record_mutations()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'service_records rows are append-only and cannot be deleted';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM service_consumptions
    WHERE service_record_id = OLD.id
  ) THEN
    IF NEW.service_type_id IS DISTINCT FROM OLD.service_type_id
       OR NEW.kind IS DISTINCT FROM OLD.kind
       OR NEW.quantity IS DISTINCT FROM OLD.quantity
       OR NEW.service_date IS DISTINCT FROM OLD.service_date THEN
      RAISE EXCEPTION 'Service records with applied consumptions cannot change quantity, kind, type, or service date';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION after_insert_service_record()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.kind::text = 'IN_HOUSE' AND NEW.status::text <> 'CANCELLED' THEN
    INSERT INTO service_consumptions (
      id,
      service_record_id,
      product_id,
      quantity,
      created_at
    )
    SELECT gen_random_uuid(),
           NEW.id,
           sts.product_id,
           sts.quantity_per_unit * NEW.quantity,
           NEW.created_at
    FROM service_type_supplies sts
    WHERE sts.service_type_id = NEW.service_type_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION prevent_service_consumption_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'service_consumptions are immutable once created';
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
    'Auto-applied from service consumption'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stock_entries_prepare ON stock_entries;
CREATE TRIGGER trg_stock_entries_prepare
BEFORE INSERT OR UPDATE ON stock_entries
FOR EACH ROW
EXECUTE FUNCTION prepare_stock_entry();

DROP TRIGGER IF EXISTS trg_stock_entries_apply_after_receive ON stock_entries;
CREATE TRIGGER trg_stock_entries_apply_after_receive
AFTER INSERT OR UPDATE ON stock_entries
FOR EACH ROW
EXECUTE FUNCTION after_receive_stock_entry();

DROP TRIGGER IF EXISTS trg_stock_entries_prevent_delete ON stock_entries;
CREATE TRIGGER trg_stock_entries_prevent_delete
BEFORE DELETE ON stock_entries
FOR EACH ROW
EXECUTE FUNCTION prevent_history_delete();

DROP TRIGGER IF EXISTS trg_stock_entry_items_validate_snacks ON stock_entry_items;
CREATE TRIGGER trg_stock_entry_items_validate_snacks
BEFORE INSERT OR UPDATE ON stock_entry_items
FOR EACH ROW
EXECUTE FUNCTION validate_snack_stock_entry_item();

DROP TRIGGER IF EXISTS trg_stock_entry_items_guard_received_mutations ON stock_entry_items;
CREATE TRIGGER trg_stock_entry_items_guard_received_mutations
BEFORE UPDATE OR DELETE ON stock_entry_items
FOR EACH ROW
EXECUTE FUNCTION guard_received_stock_entry_item_mutations();

DROP TRIGGER IF EXISTS trg_stock_entry_items_apply_after_insert ON stock_entry_items;
CREATE TRIGGER trg_stock_entry_items_apply_after_insert
AFTER INSERT ON stock_entry_items
FOR EACH ROW
EXECUTE FUNCTION after_insert_stock_entry_item();

DROP TRIGGER IF EXISTS trg_stock_outputs_prevent_delete ON stock_outputs;
CREATE TRIGGER trg_stock_outputs_prevent_delete
BEFORE DELETE ON stock_outputs
FOR EACH ROW
EXECUTE FUNCTION prevent_history_delete();

DROP TRIGGER IF EXISTS trg_stock_output_items_prevent_mutation ON stock_output_items;
CREATE TRIGGER trg_stock_output_items_prevent_mutation
BEFORE UPDATE OR DELETE ON stock_output_items
FOR EACH ROW
EXECUTE FUNCTION prevent_stock_output_item_mutation();

DROP TRIGGER IF EXISTS trg_stock_output_items_apply_after_insert ON stock_output_items;
CREATE TRIGGER trg_stock_output_items_apply_after_insert
AFTER INSERT ON stock_output_items
FOR EACH ROW
EXECUTE FUNCTION after_insert_stock_output_item();

DROP TRIGGER IF EXISTS trg_service_types_guard_kind ON service_types;
CREATE TRIGGER trg_service_types_guard_kind
BEFORE UPDATE ON service_types
FOR EACH ROW
EXECUTE FUNCTION guard_service_type_kind_mutation();

DROP TRIGGER IF EXISTS trg_service_records_validate_kind ON service_records;
CREATE TRIGGER trg_service_records_validate_kind
BEFORE INSERT OR UPDATE ON service_records
FOR EACH ROW
EXECUTE FUNCTION validate_service_record_kind();

DROP TRIGGER IF EXISTS trg_service_records_guard_mutations ON service_records;
CREATE TRIGGER trg_service_records_guard_mutations
BEFORE UPDATE OR DELETE ON service_records
FOR EACH ROW
EXECUTE FUNCTION guard_service_record_mutations();

DROP TRIGGER IF EXISTS trg_service_records_apply_after_insert ON service_records;
CREATE TRIGGER trg_service_records_apply_after_insert
AFTER INSERT ON service_records
FOR EACH ROW
EXECUTE FUNCTION after_insert_service_record();

DROP TRIGGER IF EXISTS trg_service_consumptions_prevent_mutation ON service_consumptions;
CREATE TRIGGER trg_service_consumptions_prevent_mutation
BEFORE UPDATE OR DELETE ON service_consumptions
FOR EACH ROW
EXECUTE FUNCTION prevent_service_consumption_mutation();

DROP TRIGGER IF EXISTS trg_service_consumptions_apply_after_insert ON service_consumptions;
CREATE TRIGGER trg_service_consumptions_apply_after_insert
AFTER INSERT ON service_consumptions
FOR EACH ROW
EXECUTE FUNCTION after_insert_service_consumption();

DROP TRIGGER IF EXISTS trg_stock_movements_prevent_mutation ON stock_movements;
CREATE TRIGGER trg_stock_movements_prevent_mutation
BEFORE UPDATE OR DELETE ON stock_movements
FOR EACH ROW
EXECUTE FUNCTION prevent_stock_movement_mutation();

