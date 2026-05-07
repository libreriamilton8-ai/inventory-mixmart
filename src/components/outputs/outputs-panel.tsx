'use client';

import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';

import { DateRangePicker } from '@/components/filters/date-range-picker';
import { RecentOutputItem } from '@/components/outputs/recent-output-item';
import { DataTable } from '@/components/shared/data-table';
import {
  EmptyState,
  ProductCategoryBadge,
  Section,
  SectionHeader,
  StatusBadge,
} from '@/components/shared/page';
import { RecordDetailModal } from '@/components/shared/record-detail-modal';
import { Select } from '@/components/ui/select';
import {
  formatCurrency,
  formatDate,
  formatDateOnly,
  formatDecimal,
  stockOutputReasonLabels,
} from '@/lib/format';
import { PAGE_SIZE_OPTIONS } from '@/lib/pagination';
import { cn } from '@/lib/utils';
import type {
  StockOutputHistoryParams,
  StockOutputHistoryPayload,
  StockOutputHistoryRow,
} from '@/services/stock-output.service';

type OutputReasonValue = '' | 'SALE' | 'WASTE' | 'INTERNAL_USE';

type OutputPanelParams = {
  from: string;
  to: string;
  reason: OutputReasonValue;
  page: string;
  pageSize: string;
};

type OutputsPanelProps = {
  initialPayload: StockOutputHistoryPayload;
  initialParams: StockOutputHistoryParams;
};

export function OutputsPanel({
  initialPayload,
  initialParams,
}: OutputsPanelProps) {
  const [payload, setPayload] = useState(initialPayload);
  const [params, setParams] = useState<OutputPanelParams>(() => ({
    from: initialParams.from ?? '',
    to: initialParams.to ?? '',
    reason: normalizeReason(initialParams.reason),
    page: initialPayload.meta.page > 1 ? String(initialPayload.meta.page) : '1',
    pageSize: String(initialPayload.meta.pageSize),
  }));
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const rangeLabel = getRangeLabel(params);
  const summaryLabel = params.reason
    ? `${rangeLabel} - ${stockOutputReasonLabels[params.reason]}`
    : rangeLabel;

  const loadHistory = async (nextParams: OutputPanelParams) => {
    setParams(nextParams);
    setPending(true);
    setFailed(false);
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    const query = new URLSearchParams();
    if (nextParams.from) query.set('from', nextParams.from);
    if (nextParams.to) query.set('to', nextParams.to);
    if (nextParams.reason) query.set('reason', nextParams.reason);
    if (nextParams.page !== '1') query.set('page', nextParams.page);
    query.set('pageSize', nextParams.pageSize);

    try {
      const response = await fetch(`/api/outputs/history?${query}`, {
        cache: 'no-store',
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error('Unable to load outputs.');
      }

      const nextPayload = (await response.json()) as StockOutputHistoryPayload;
      setPayload(nextPayload);
      setParams((current) => ({
        ...current,
        page: String(nextPayload.meta.page),
        pageSize: String(nextPayload.meta.pageSize),
      }));
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setFailed(true);
      }
    } finally {
      if (abortRef.current === controller) {
        setPending(false);
      }
    }
  };

  const updateFilters = (patch: Partial<OutputPanelParams>) => {
    void loadHistory({
      ...params,
      ...patch,
      page: '1',
    });
  };

  const updatePage = (page: number) => {
    void loadHistory({
      ...params,
      page: String(page),
    });
  };

  const updatePageSize = (pageSize: string) => {
    void loadHistory({
      ...params,
      page: '1',
      pageSize,
    });
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_18rem]">
      <Section>
        <SectionHeader title="Historial completo" />
        <section
          aria-label="Filtros"
          className="border-b border-border bg-surface px-4 py-3"
        >
          <div className="flex flex-wrap items-end gap-3">
            <FilterField className="sm:w-72" label="Periodo de salida">
              <DateRangePicker
                ariaLabel="Periodo de salida"
                fromValue={params.from}
                onChange={({ from, to }) => updateFilters({ from, to })}
                placeholder="Rango de fechas"
                toValue={params.to}
                triggerClassName="h-10 min-h-10 rounded-[8px] px-3 py-1.5 text-sm font-normal"
              />
            </FilterField>
            <FilterField
              className="basis-[calc(50%-0.375rem)] sm:w-48"
              label="Motivo"
            >
              <Select
                className="h-10 min-h-10 gap-2 rounded-[8px] px-3 py-1.5 text-sm font-normal"
                onValueChange={(next) =>
                  updateFilters({ reason: normalizeReason(next) })
                }
                placeholder="Todos"
                value={params.reason}
              >
                <option value="">Todos</option>
                <option value="SALE">Venta</option>
                <option value="WASTE">Merma</option>
                <option value="INTERNAL_USE">Uso interno</option>
              </Select>
            </FilterField>

            <div className="ml-auto flex items-center gap-2">
              {pending ? (
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary"
                />
              ) : null}
              <button
                className="inline-flex h-10 items-center gap-1.5 rounded-[8px] border border-primary-200 bg-transparent px-3 text-xs font-medium text-primary transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:border-border disabled:text-muted-foreground disabled:hover:bg-transparent"
                disabled={
                  pending || !(params.from || params.to || params.reason)
                }
                onClick={() =>
                  void loadHistory({
                    from: '',
                    to: '',
                    reason: '',
                    page: '1',
                    pageSize: params.pageSize,
                  })
                }
                type="button"
              >
                <RotateCcw aria-hidden="true" className="size-3.5" />
                Limpiar
              </button>
            </div>
          </div>
          {failed ? (
            <p className="mt-2 text-xs text-error">
              No se pudo actualizar el historial.
            </p>
          ) : null}
        </section>

        <div className={cn('transition-opacity', pending ? 'opacity-60' : '')}>
          {payload.outputs.length ? (
            <DataTable
              headers={[
                'Motivo',
                'Fecha',
                'Creado por',
                'Items',
                'Costo',
                'Ingreso',
                'Detalle',
              ]}
            >
              {payload.outputs.map((output) => (
                <tr key={output.id}>
                  <td className="px-4 py-3">
                    <StatusBadge
                      tone={output.reason === 'SALE' ? 'success' : 'warning'}
                    >
                      {stockOutputReasonLabels[output.reason]}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3">{formatDate(output.occurredAt)}</td>
                  <td className="px-4 py-3">
                    {output.createdBy.firstName} {output.createdBy.lastName}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-control border border-primary-200 bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary">
                      {output.items.length} item
                      {output.items.length !== 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatCurrency(output.cost)}</td>
                  <td className="px-4 py-3">
                    {output.reason === 'SALE'
                      ? formatCurrency(output.revenue)
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <ActionTip label="Detalle">
                      <RecordDetailModal title="Detalle salida">
                        <OutputDetail output={output} />
                      </RecordDetailModal>
                    </ActionTip>
                  </td>
                </tr>
              ))}
            </DataTable>
          ) : (
            <EmptyState title="Sin salidas" description="Sin resultados." />
          )}
        </div>
        <OutputsPagination
          meta={payload.meta}
          onPage={updatePage}
          onPageSize={updatePageSize}
          pending={pending}
        />
      </Section>

      <aside className="space-y-3">
        <Section>
          <SectionHeader description={summaryLabel} title="Resumen rapido" />
          <div className="space-y-3 p-4">
            <SummaryRow
              label="Salidas del rango"
              value={String(payload.summary.outputs)}
            />
            <SummaryRow
              label="Items retirados"
              value={String(payload.summary.items)}
            />
            <SummaryRow
              label="Ingreso ventas"
              value={formatCurrency(payload.summary.revenue)}
            />
            <SummaryRow
              label="Costo salidas"
              value={formatCurrency(payload.summary.cost)}
            />
          </div>
        </Section>

        <Section>
          <SectionHeader title="Salidas recientes" />
          {payload.outputs.length ? (
            <div className="divide-y divide-border">
              {payload.outputs.slice(0, 5).map((output) => (
                <RecentOutputItem key={output.id} output={output} />
              ))}
            </div>
          ) : (
            <EmptyState title="Sin salidas" description="Sin resultados." />
          )}
        </Section>
      </aside>
    </div>
  );
}

function FilterField({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <label
      className={cn(
        'relative block min-w-0 flex-1 basis-full pt-2 sm:basis-auto',
        className,
      )}
    >
      <span className="absolute left-3 top-0 z-10 bg-surface px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function OutputsPagination({
  meta,
  onPage,
  onPageSize,
  pending,
}: {
  meta: StockOutputHistoryPayload['meta'];
  onPage: (page: number) => void;
  onPageSize: (size: string) => void;
  pending: boolean;
}) {
  const canPrev = meta.page > 1;
  const canNext = meta.page < meta.totalPages;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface px-4 py-2.5 text-xs">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span>
          {meta.totalItems > 0
            ? `${meta.start}-${meta.end} de ${meta.totalItems}`
            : 'Sin resultados'}
        </span>
        {pending ? (
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary"
          />
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2">
          <span className="text-muted-foreground">Mostrar</span>
          <Select
            aria-label="Filas por pagina"
            className="h-8 min-h-8 w-20 px-2 py-0 text-xs"
            onValueChange={onPageSize}
            value={String(meta.pageSize)}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={String(size)}>
                {size}
              </option>
            ))}
          </Select>
        </label>

        <div className="flex items-center gap-1">
          <IconButton
            disabled={!canPrev || pending}
            icon={ChevronLeft}
            label="Pagina anterior"
            onClick={() => onPage(meta.page - 1)}
          />
          <span className="min-w-[64px] text-center font-medium text-foreground">
            {meta.page} / {meta.totalPages}
          </span>
          <IconButton
            disabled={!canNext || pending}
            icon={ChevronRight}
            label="Pagina siguiente"
            onClick={() => onPage(meta.page + 1)}
          />
        </div>
      </div>
    </div>
  );
}

function IconButton({
  disabled,
  icon: Icon,
  label,
  onClick,
}: {
  disabled: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="inline-flex size-8 items-center justify-center rounded-[8px] border border-border bg-surface-elevated text-muted-foreground transition hover:border-primary-300 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
    </button>
  );
}

function OutputDetail({ output }: { output: StockOutputHistoryRow }) {
  return (
    <div className="space-y-4 p-5">
      <div className="grid gap-3 md:grid-cols-2">
        <DetailBox
          label="Motivo"
          value={stockOutputReasonLabels[output.reason]}
        />
        <DetailBox label="Fecha" value={formatDate(output.occurredAt)} />
        <DetailBox
          label="Creado por"
          value={`${output.createdBy.firstName} ${output.createdBy.lastName}`}
        />
        <DetailBox
          label="Items"
          value={`${output.items.length} item${output.items.length !== 1 ? 's' : ''}`}
        />
        <DetailBox label="Costo" value={formatCurrency(output.cost)} />
        <DetailBox
          label="Ingreso"
          value={
            output.reason === 'SALE' ? formatCurrency(output.revenue) : '-'
          }
        />
        <DetailBox
          className="md:col-span-2"
          label="Notas"
          value={output.notes || 'Sin notas'}
        />
      </div>

      <div className="rounded-control border border-border bg-surface">
        <div className="border-b border-border px-3 py-2">
          <h3 className="text-sm font-semibold text-foreground">Productos</h3>
        </div>
        <ul className="divide-y divide-border">
          {output.items.map((item) => (
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
                  label="Precio venta"
                  value={
                    output.reason === 'SALE'
                      ? formatCurrency(item.unitSalePrice)
                      : '-'
                  }
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-card border border-border bg-surface-muted px-3 py-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

function ActionTip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] font-medium text-background opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        {label}
      </span>
    </span>
  );
}

function normalizeReason(reason?: string | null): OutputReasonValue {
  return reason === 'SALE' || reason === 'WASTE' || reason === 'INTERNAL_USE'
    ? reason
    : '';
}

function getRangeLabel(params: OutputPanelParams) {
  const from = params.from ? formatDateValue(params.from) : '';
  const to = params.to ? formatDateValue(params.to) : '';

  if (from && to) {
    return `${from} - ${to}`;
  }
  if (from) {
    return `Desde ${from}`;
  }
  if (to) {
    return `Hasta ${to}`;
  }
  return 'Todo el historial';
}

function formatDateValue(value: string) {
  return formatDateOnly(`${value}T00:00:00`);
}
