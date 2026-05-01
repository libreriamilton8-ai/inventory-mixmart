import { Suspense } from "react";

import {
  DateRangeFilter,
  FilterBar,
  SelectFilter,
} from "@/components/filters";
import { ReportsEntriesTable } from "@/components/reports/entries-table";
import { LowStockTable } from "@/components/reports/low-stock-table";
import { ReportMetric } from "@/components/reports/metric";
import { MovementsTable } from "@/components/reports/movements-table";
import { ReportsOutputsTable } from "@/components/reports/outputs-table";
import { ReportsServicesTable } from "@/components/reports/services-table";
import { PageContentSkeleton } from "@/components/shared";
import {
  dateRangeWhere,
  defaultRangeStrings,
  sumLineCost,
  sumLineRevenue,
} from "@/lib/calc";
import { decimalToNumber, formatCurrency, productCategoryLabels } from "@/lib/format";
import { requireRole } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { ProductCategory } from "../../../../prisma/generated/client";

type ReportsPageProps = {
  searchParams: Promise<{
    from?: string;
    to?: string;
    category?: ProductCategory;
    productId?: string;
    supplierId?: string;
  }>;
};

const categories: ProductCategory[] = ["SCHOOL_SUPPLIES", "BAZAAR", "SNACKS"];

export default function ReportsPage({ searchParams }: ReportsPageProps) {
  return (
    <Suspense fallback={<PageContentSkeleton />}>
      <ReportsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ReportsContent({ searchParams }: ReportsPageProps) {
  await requireRole(["ADMIN"], "/reports");
  const params = await searchParams;
  const fallback = defaultRangeStrings(30);
  const from = params.from ?? fallback.from;
  const to = params.to ?? fallback.to;
  const dateFilter = dateRangeWhere(from, to);
  const category = params.category;
  const productId = params.productId || undefined;
  const supplierId = params.supplierId || undefined;

  const [products, suppliers] = await Promise.all([
    prisma.product.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        category: true,
        currentStock: true,
        minimumStock: true,
        purchasePrice: true,
      },
      take: 500,
    }),
    prisma.supplier.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
      take: 300,
    }),
  ]);

  const [movements, entries, outputs, services] = await Promise.all([
    prisma.stockMovement.findMany({
      where: {
        ...(dateFilter ? { occurredAt: dateFilter } : {}),
        ...(productId ? { productId } : {}),
        ...(category ? { product: { category } } : {}),
      },
      include: {
        product: { select: { name: true, category: true, unitName: true } },
      },
      orderBy: { occurredAt: "desc" },
      take: 150,
    }),
    prisma.stockEntry.findMany({
      where: {
        ...(dateFilter ? { orderedAt: dateFilter } : {}),
        ...(supplierId ? { supplierId } : {}),
      },
      include: {
        supplier: { select: { name: true } },
        items: {
          include: {
            product: { select: { name: true, category: true } },
          },
        },
      },
      orderBy: { orderedAt: "desc" },
      take: 100,
    }),
    prisma.stockOutput.findMany({
      where: {
        ...(dateFilter ? { occurredAt: dateFilter } : {}),
        ...(productId ? { items: { some: { productId } } } : {}),
      },
      include: {
        items: {
          include: {
            product: { select: { name: true, category: true } },
          },
        },
      },
      orderBy: { occurredAt: "desc" },
      take: 120,
    }),
    prisma.serviceRecord.findMany({
      where: {
        ...(dateFilter ? { serviceDate: dateFilter } : {}),
      },
      include: {
        serviceType: { select: { name: true } },
        consumptions: { include: { product: { select: { name: true } } } },
      },
      orderBy: { serviceDate: "desc" },
      take: 120,
    }),
  ]);

  const filteredProducts = products.filter(
    (product) => !category || product.category === category,
  );
  const lowStock = filteredProducts.filter(
    (product) =>
      decimalToNumber(product.currentStock) <=
      decimalToNumber(product.minimumStock),
  );
  const outOfStock = filteredProducts.filter(
    (product) => decimalToNumber(product.currentStock) <= 0,
  );
  const inventoryValue = filteredProducts.reduce(
    (sum, product) =>
      sum +
      decimalToNumber(product.currentStock) *
        decimalToNumber(product.purchasePrice),
    0,
  );
  const purchaseTotal = entries.reduce(
    (sum, entry) => sum + sumLineCost(entry.items),
    0,
  );
  const saleItems = outputs.flatMap((output) =>
    output.reason === "SALE" ? output.items : [],
  );
  const saleRevenue = sumLineRevenue(saleItems);
  const saleCost = sumLineCost(saleItems);
  const outputCost = outputs.reduce(
    (sum, output) => sum + sumLineCost(output.items),
    0,
  );

  return (
    <div>
      <FilterBar className="mb-5">
        <DateRangeFilter
          allowClear={false}
          fallbackFromValue={from}
          fallbackToValue={to}
          label="Periodo"
          placeholder="Ultimos 30 dias"
        />
        <SelectFilter
          allLabel="Todas"
          label="Categoria"
          name="category"
          options={categories.map((item) => ({
            label: productCategoryLabels[item],
            value: item,
          }))}
        />
        <SelectFilter
          allLabel="Todos"
          label="Producto"
          name="productId"
          options={products.map((product) => ({
            label: product.name,
            value: product.id,
          }))}
        />
        <SelectFilter
          allLabel="Todos"
          label="Proveedor"
          name="supplierId"
          options={suppliers.map((supplier) => ({
            label: supplier.name,
            value: supplier.id,
          }))}
        />
      </FilterBar>

      <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ReportMetric
          label="Valor inventario"
          value={formatCurrency(inventoryValue)}
        />
        <ReportMetric label="Compras periodo" value={formatCurrency(purchaseTotal)} />
        <ReportMetric label="Ingresos ventas" value={formatCurrency(saleRevenue)} />
        <ReportMetric
          label="Utilidad bruta"
          value={formatCurrency(saleRevenue - saleCost)}
        />
      </div>

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <ReportMetric label="Bajo stock" value={String(lowStock.length)} />
        <ReportMetric label="Sin stock" value={String(outOfStock.length)} />
        <ReportMetric label="Costo salidas" value={formatCurrency(outputCost)} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <MovementsTable movements={movements} />
        <LowStockTable products={lowStock} />
        <ReportsEntriesTable entries={entries} />
        <ReportsOutputsTable outputs={outputs} />
      </div>

      <ReportsServicesTable services={services} />
    </div>
  );
}
