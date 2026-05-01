import { PackageCheck, Plus } from "lucide-react";
import { Suspense } from "react";

import { EntryForm } from "@/components/entries/entry-form";
import {
  DateRangeFilter,
  FilterBar,
  SearchFilter,
  SelectFilter,
} from "@/components/filters";
import {
  DataTable,
  EmptyState,
  FlashMessage,
  IdActionForm,
  PageHeader,
  Section,
  StatusBadge,
  TableSkeleton,
} from "@/components/shared";
import { FormModal } from "@/components/ui/modal";
import { dateRangeWhere, sumLineCost } from "@/lib/calc";
import {
  formatCurrency,
  formatDate,
  formatDecimal,
  stockEntryStatusLabels,
} from "@/lib/format";
import { requireActiveUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { receiveStockEntry } from "@/server/actions";
import type { StockEntryStatus } from "../../../../prisma/generated/client";

type EntriesSearchParams = {
  success?: string;
  q?: string;
  from?: string;
  to?: string;
  status?: StockEntryStatus;
  supplierId?: string;
};

type EntriesPageProps = {
  searchParams: Promise<EntriesSearchParams>;
};

export default async function EntriesPage({ searchParams }: EntriesPageProps) {
  await requireActiveUser("/entries");
  const params = await searchParams;
  const [suppliers, products] = await Promise.all([
    prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
      take: 200,
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, unitName: true },
      take: 300,
    }),
  ]);

  const supplierOptions = suppliers.map((supplier) => ({
    label: supplier.name,
    value: supplier.id,
  }));

  const filterKey = JSON.stringify({
    from: params.from ?? "",
    q: params.q ?? "",
    status: params.status ?? "",
    supplierId: params.supplierId ?? "",
    to: params.to ?? "",
  });

  return (
    <div className="space-y-5">
      <PageHeader
        action={
          <FormModal
            size="xl"
            title="Nueva entrada"
            description="Registra una orden o recepcion de mercaderia."
            trigger={
              <>
                <Plus aria-hidden="true" className="h-4 w-4" />
                Nueva entrada
              </>
            }
          >
            <EntryForm products={products} suppliers={suppliers} />
          </FormModal>
        }
      />

      {params.success ? (
        <FlashMessage type="success">Entrada registrada correctamente.</FlashMessage>
      ) : null}

      <FilterBar>
        <DateRangeFilter label="Periodo de orden" />
        <SearchFilter
          label="Referencia"
          name="q"
          placeholder="Numero o codigo"
        />
        <SelectFilter
          allLabel="Todos"
          label="Estado"
          name="status"
          options={[
            { label: "Ordenada", value: "ORDERED" },
            { label: "Recibida", value: "RECEIVED" },
          ]}
        />
        <SelectFilter
          allLabel="Todos"
          label="Proveedor"
          name="supplierId"
          options={supplierOptions}
        />
      </FilterBar>

      <Suspense
        fallback={<TableSkeleton columns={7} rows={6} />}
        key={filterKey}
      >
        <EntriesList searchParams={params} />
      </Suspense>
    </div>
  );
}

async function EntriesList({ searchParams }: { searchParams: EntriesSearchParams }) {
  const q = searchParams.q?.trim();
  const orderedAtFilter = dateRangeWhere(searchParams.from, searchParams.to);

  const entries = await prisma.stockEntry.findMany({
    where: {
      ...(orderedAtFilter ? { orderedAt: orderedAtFilter } : {}),
      ...(searchParams.status ? { status: searchParams.status } : {}),
      ...(searchParams.supplierId ? { supplierId: searchParams.supplierId } : {}),
      ...(q
        ? { referenceNumber: { contains: q, mode: "insensitive" as const } }
        : {}),
    },
    include: {
      supplier: { select: { name: true } },
      createdBy: { select: { firstName: true, lastName: true } },
      items: {
        include: {
          product: { select: { name: true, unitName: true } },
        },
      },
    },
    orderBy: { orderedAt: "desc" },
    take: 100,
  });

  if (!entries.length) {
    return (
      <Section>
        <EmptyState title="Sin entradas" description="Sin resultados para los filtros." />
      </Section>
    );
  }

  return (
    <Section>
      <DataTable
        headers={[
          "Referencia",
          "Proveedor",
          "Estado",
          "Fecha",
          "Items",
          "Total",
          "Acciones",
        ]}
      >
        {entries.map((entry) => (
          <tr key={entry.id}>
            <td className="px-4 py-3">
              <p className="font-medium text-foreground">
                {entry.referenceNumber || entry.id.slice(0, 8)}
              </p>
              <p className="text-xs text-muted-foreground">
                {entry.createdBy.firstName} {entry.createdBy.lastName}
              </p>
            </td>
            <td className="px-4 py-3">{entry.supplier.name}</td>
            <td className="px-4 py-3">
              <StatusBadge tone={entry.status === "RECEIVED" ? "success" : "info"}>
                {stockEntryStatusLabels[entry.status]}
              </StatusBadge>
            </td>
            <td className="px-4 py-3">
              <p>{formatDate(entry.orderedAt)}</p>
              <p className="text-xs text-muted-foreground">
                Recibida: {formatDate(entry.receivedAt)}
              </p>
            </td>
            <td className="px-4 py-3">
              <details>
                <summary className="cursor-pointer text-primary">
                  {entry.items.length} items
                </summary>
                <ul className="mt-2 space-y-1">
                  {entry.items.map((item) => (
                    <li key={item.id}>
                      {item.product.name}: {formatDecimal(item.quantity, 3)} x{" "}
                      {formatCurrency(item.unitCost)}
                    </li>
                  ))}
                </ul>
              </details>
            </td>
            <td className="px-4 py-3">
              {formatCurrency(sumLineCost(entry.items))}
            </td>
            <td className="px-4 py-3">
              {entry.status === "ORDERED" ? (
                <IdActionForm
                  action={receiveStockEntry}
                  className="btn btn-secondary"
                  id={entry.id}
                >
                  <PackageCheck aria-hidden="true" className="h-4 w-4" />
                  Recibir
                </IdActionForm>
              ) : (
                <span className="text-xs text-muted-foreground">Aplicada</span>
              )}
            </td>
          </tr>
        ))}
      </DataTable>
    </Section>
  );
}
