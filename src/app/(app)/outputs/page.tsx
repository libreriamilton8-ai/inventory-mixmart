import { Plus } from "lucide-react";
import { Suspense } from "react";

import {
  DateRangeFilter,
  FilterBar,
  SelectFilter,
} from "@/components/filters";
import { OutputForm } from "@/components/outputs/output-form";
import { RecentOutputItem } from "@/components/outputs/recent-output-item";
import {
  DataTable,
  EmptyState,
  FlashMessage,
  PageHeader,
  ProductCategoryBadge,
  Section,
  SectionHeader,
  StatusBadge,
  TableSkeleton,
} from "@/components/shared";
import { FormModal } from "@/components/ui/modal";
import { dateRangeWhere, sumLineCost, sumLineRevenue } from "@/lib/calc";
import {
  formatCurrency,
  formatDate,
  formatDecimal,
  stockOutputReasonLabels,
} from "@/lib/format";
import { requireActiveUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { StockOutputReason } from "../../../../prisma/generated/client";

type OutputsSearchParams = {
  success?: string;
  error?: string;
  from?: string;
  to?: string;
  reason?: StockOutputReason;
};

type OutputsPageProps = {
  searchParams: Promise<OutputsSearchParams>;
};

export default async function OutputsPage({ searchParams }: OutputsPageProps) {
  await requireActiveUser("/outputs");
  const params = await searchParams;
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      category: true,
      unitName: true,
      currentStock: true,
      salePrice: true,
    },
    take: 300,
  });

  const filterKey = JSON.stringify({
    from: params.from ?? "",
    reason: params.reason ?? "",
    to: params.to ?? "",
  });

  return (
    <div className="space-y-5">
      <PageHeader
        action={
          <FormModal
            size="xl"
            title="Nueva salida"
            description="Registra ventas, mermas o uso interno."
            trigger={
              <>
                <Plus aria-hidden="true" className="h-4 w-4" />
                Nueva salida
              </>
            }
          >
            <OutputForm
              products={products.map((product) => ({
                id: product.id,
                name: product.name,
                category: product.category,
                unitName: product.unitName,
                currentStock: formatDecimal(product.currentStock, 3),
                salePrice: product.salePrice
                  ? formatDecimal(product.salePrice, 2)
                  : null,
              }))}
            />
          </FormModal>
        }
      />

      {params.success ? (
        <FlashMessage type="success">Salida registrada correctamente.</FlashMessage>
      ) : null}
      {params.error === "stock" ? (
        <FlashMessage type="error">
          Stock insuficiente para completar la salida.
        </FlashMessage>
      ) : null}

      <FilterBar>
        <DateRangeFilter label="Periodo de salida" />
        <SelectFilter
          allLabel="Todos"
          label="Motivo"
          name="reason"
          options={[
            { label: "Venta", value: "SALE" },
            { label: "Merma", value: "WASTE" },
            { label: "Uso interno", value: "INTERNAL_USE" },
          ]}
        />
      </FilterBar>

      <Suspense
        fallback={<TableSkeleton columns={6} rows={6} />}
        key={filterKey}
      >
        <OutputsList searchParams={params} />
      </Suspense>
    </div>
  );
}

async function OutputsList({ searchParams }: { searchParams: OutputsSearchParams }) {
  const occurredAtFilter = dateRangeWhere(searchParams.from, searchParams.to);

  const outputs = await prisma.stockOutput.findMany({
    where: {
      ...(occurredAtFilter ? { occurredAt: occurredAtFilter } : {}),
      ...(searchParams.reason ? { reason: searchParams.reason } : {}),
    },
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
      items: {
        include: {
          product: { select: { name: true, unitName: true, category: true } },
        },
      },
    },
    orderBy: { occurredAt: "desc" },
    take: 100,
  });

  const summary = outputs.reduce(
    (acc, output) => ({
      cost: acc.cost + sumLineCost(output.items),
      revenue: acc.revenue + sumLineRevenue(output.items),
      items: acc.items + output.items.length,
    }),
    { cost: 0, revenue: 0, items: 0 },
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
      <Section>
        <SectionHeader title="Historial completo" />
        {outputs.length ? (
          <DataTable
            headers={["Motivo", "Fecha", "Creado por", "Items", "Costo", "Ingreso"]}
          >
            {outputs.map((output) => {
              const cost = sumLineCost(output.items);
              const revenue = sumLineRevenue(output.items);

              return (
                <tr key={output.id}>
                  <td className="px-4 py-3">
                    <StatusBadge
                      tone={output.reason === "SALE" ? "success" : "warning"}
                    >
                      {stockOutputReasonLabels[output.reason]}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3">{formatDate(output.occurredAt)}</td>
                  <td className="px-4 py-3">
                    {output.createdBy.firstName} {output.createdBy.lastName}
                  </td>
                  <td className="px-4 py-3">
                    <details className="[&_summary::-webkit-details-marker]:hidden">
                      <summary className="inline-flex cursor-pointer list-none items-center rounded-control border border-primary-200 bg-primary-50 px-2 py-1 text-primary">
                        {output.items.length} items
                      </summary>
                      <ul className="popover-window mt-2 space-y-2">
                        {output.items.map((item) => (
                          <li
                            className="flex flex-wrap items-center gap-2"
                            key={item.id}
                          >
                            <span>
                              {item.product.name}: {formatDecimal(item.quantity, 3)}{" "}
                              {item.product.unitName}
                            </span>
                            <ProductCategoryBadge
                              category={item.product.category}
                              className="min-h-6 rounded-control px-2 py-0.5"
                            />
                          </li>
                        ))}
                      </ul>
                    </details>
                  </td>
                  <td className="px-4 py-3">{formatCurrency(cost)}</td>
                  <td className="px-4 py-3">
                    {output.reason === "SALE" ? formatCurrency(revenue) : "-"}
                  </td>
                </tr>
              );
            })}
          </DataTable>
        ) : (
          <EmptyState
            title="Sin salidas"
            description="Sin resultados para los filtros."
          />
        )}
      </Section>

      <aside className="space-y-5">
        <Section>
          <SectionHeader title="Resumen rapido" />
          <div className="space-y-3 p-4">
            <SummaryRow label="Salidas visibles" value={String(outputs.length)} />
            <SummaryRow label="Items retirados" value={String(summary.items)} />
            <SummaryRow
              label="Ingreso ventas"
              value={formatCurrency(summary.revenue)}
            />
            <SummaryRow label="Costo salidas" value={formatCurrency(summary.cost)} />
          </div>
        </Section>

        <Section>
          <SectionHeader title="Salidas recientes" />
          {outputs.length ? (
            <div className="divide-y divide-border">
              {outputs.slice(0, 5).map((output) => (
                <RecentOutputItem key={output.id} output={output} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Sin salidas"
              description="Sin resultados para los filtros."
            />
          )}
        </Section>
      </aside>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-card border border-border bg-surface-muted px-3 py-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}
