import { PackageCheck, SpellCheck } from 'lucide-react';
import type { ReactNode } from 'react';

import {
  ActionTip,
  DataTable,
  EmptyState,
  IdActionForm,
  PaginationBar,
  ProductCategoryBadge,
  RecordDetailModal,
  Section,
  StatusBadge,
  iconBtnGood,
} from '@/components/shared';
import { dateRangeWhere, sumLineCost } from '@/lib/calc';
import {
  formatCurrency,
  formatDate,
  formatDecimal,
  stockEntryStatusLabels,
} from '@/lib/format';
import { buildPaginationMeta, readPagination } from '@/lib/pagination';
import prisma from '@/lib/prisma';
import { receiveStockEntry } from '@/server/actions';
import type {
  ProductCategory,
  StockEntryStatus,
} from '../../../prisma/generated/client';

export type EntriesSearchParams = {
  q?: string;
  from?: string;
  to?: string;
  status?: StockEntryStatus;
  supplierId?: string;
  page?: string;
  pageSize?: string;
};

export async function EntriesList({
  filters,
  searchParams,
}: {
  filters?: ReactNode;
  searchParams: EntriesSearchParams;
}) {
  const q = searchParams.q?.trim();
  const orderedAtFilter = dateRangeWhere(searchParams.from, searchParams.to);
  const pagination = readPagination(searchParams);

  const where = {
    ...(orderedAtFilter ? { orderedAt: orderedAtFilter } : {}),
    ...(searchParams.status ? { status: searchParams.status } : {}),
    ...(searchParams.supplierId ? { supplierId: searchParams.supplierId } : {}),
    ...(q
      ? { referenceNumber: { contains: q, mode: 'insensitive' as const } }
      : {}),
  };

  const [entries, totalItems] = await Promise.all([
    prisma.stockEntry.findMany({
      where,
      include: {
        supplier: { select: { name: true } },
        createdBy: { select: { firstName: true, lastName: true } },
        items: {
          include: {
            product: { select: { name: true, unitName: true, category: true } },
          },
        },
      },
      orderBy: { orderedAt: 'desc' },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.stockEntry.count({ where }),
  ]);

  const meta = buildPaginationMeta(totalItems, pagination);

  if (!entries.length) {
    return (
      <Section>
        {filters}
        <EmptyState
          title="Sin entradas"
          description="Sin resultados para los filtros."
        />
      </Section>
    );
  }

  return (
    <Section>
      {filters}
      <DataTable
        columnWidths={['17%', '18%', '12%', '20%', '9%', '12%', '12%']}
        minWidth="920px"
        headers={[
          'Referencia',
          'Proveedor',
          'Estado',
          'Fecha',
          'Items',
          'Total',
          'Acciones',
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
              <StatusBadge
                tone={entry.status === 'RECEIVED' ? 'success' : 'info'}
              >
                {stockEntryStatusLabels[entry.status]}
              </StatusBadge>
            </td>
            <td className="px-4 py-3">
              <p>{formatDate(entry.orderedAt)}</p>
              <p className="text-xs text-muted-foreground">
                Recibida: {formatDate(entry.receivedAt)}
              </p>
            </td>
            <td className="relative w-40 px-4 py-3">
              <span className="inline-flex rounded-control border border-primary-200 bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary">
                {entry.items.length} item{entry.items.length !== 1 ? 's' : ''}
              </span>
            </td>
            <td className="px-4 py-3">
              {formatCurrency(sumLineCost(entry.items))}
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-1">
                <ActionTip label="Detalle">
                  <RecordDetailModal title="Detalle entrada">
                    <EntryDetail entry={entry} />
                  </RecordDetailModal>
                </ActionTip>
                {entry.status === 'ORDERED' ? (
                  <ActionTip label="Recibir">
                    <IdActionForm
                      action={receiveStockEntry}
                      className={iconBtnGood}
                      id={entry.id}
                      label="Recibir"
                    >
                      <PackageCheck aria-hidden="true" data-icon="icon" />
                    </IdActionForm>
                  </ActionTip>
                ) : (
                  <ActionTip label="Entrada recibida">
                    <span
                      aria-label="Entrada recibida"
                      className={`${iconBtnGood} cursor-default`}
                      role="img"
                    >
                      <SpellCheck aria-hidden="true" data-icon="icon" />
                    </span>
                  </ActionTip>
                )}
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
      <PaginationBar {...meta} />
    </Section>
  );
}

type EntryDetailProps = {
  entry: {
    referenceNumber: string | null;
    status: StockEntryStatus;
    orderedAt: Date;
    receivedAt: Date | null;
    notes: string | null;
    supplier: { name: string };
    createdBy: { firstName: string; lastName: string };
    items: {
      id: string;
      quantity: { toNumber: () => number } | number | string;
      unitCost: { toNumber: () => number } | number | string;
      product: {
        name: string;
        unitName: string;
        category: ProductCategory;
      };
    }[];
  };
};

function EntryDetail({ entry }: EntryDetailProps) {
  const total = sumLineCost(entry.items);

  return (
    <div className="space-y-4 p-5">
      <div className="grid gap-3 md:grid-cols-2">
        <DetailBox
          label="Referencia"
          value={entry.referenceNumber || 'Sin referencia'}
        />
        <DetailBox label="Proveedor" value={entry.supplier.name} />
        <DetailBox label="Estado" value={stockEntryStatusLabels[entry.status]} />
        <DetailBox
          label="Registrado por"
          value={`${entry.createdBy.firstName} ${entry.createdBy.lastName}`}
        />
        <DetailBox label="Ordenada" value={formatDate(entry.orderedAt)} />
        <DetailBox
          label="Recibida"
          value={entry.receivedAt ? formatDate(entry.receivedAt) : 'Pendiente'}
        />
        <DetailBox
          className="md:col-span-2"
          label="Notas"
          value={entry.notes || 'Sin notas'}
        />
      </div>

      <div className="rounded-control border border-border bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
          <h3 className="text-sm font-semibold text-foreground">Productos</h3>
          <span className="text-sm font-semibold text-foreground">
            {formatCurrency(total)}
          </span>
        </div>
        <ul className="divide-y divide-border">
          {entry.items.map((item) => (
            <li className="px-3 py-2" key={item.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {item.product.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDecimal(item.quantity, 3)} {item.product.unitName}
                  </p>
                </div>
                <ProductCategoryBadge
                  category={item.product.category}
                  className="min-h-6 rounded-control px-2 py-0.5"
                />
              </div>
              <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                <MiniMetric
                  label="Costo unitario"
                  value={formatCurrency(item.unitCost)}
                />
                <MiniMetric
                  label="Subtotal"
                  value={formatCurrency(sumLineCost([item]))}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DetailBox({
  className,
  label,
  value,
}: {
  className?: string;
  label: string;
  value: string;
}) {
  return (
    <div className={className}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 rounded-control border border-border bg-surface-muted px-3 py-2 text-sm text-foreground">
        {value}
      </p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-control border border-border bg-surface-muted px-2 py-1.5">
      <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      <span className="mt-0.5 block font-medium text-foreground">{value}</span>
    </div>
  );
}
