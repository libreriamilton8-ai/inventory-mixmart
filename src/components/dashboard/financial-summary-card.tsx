"use client";

import { useRef, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

import { Select } from "@/components/ui/select";
import {
  DATE_RANGE_KEYS,
  DATE_RANGE_LABELS,
  type DateRangeKey,
} from "@/lib/date-range";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DashboardFinancialSummary } from "@/services/dashboard.service";

type FinancialSummaryCardProps = {
  entriesToday: number;
  initialSummary: DashboardFinancialSummary;
  inventoryCost: number;
  outOfStockCount: number;
  outputsToday: number;
  salesToday: number;
};

export function FinancialSummaryCard({
  entriesToday,
  initialSummary,
  inventoryCost,
  outOfStockCount,
  outputsToday,
  salesToday,
}: FinancialSummaryCardProps) {
  const [summary, setSummary] = useState(initialSummary);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const positive = summary.revenueChange >= 0;
  const todayLabel = new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    weekday: "long",
  }).format(new Date());

  const loadRange = async (rangeKey: string) => {
    const nextRange = rangeKey as DateRangeKey;
    setSummary((current) => ({
      ...current,
      rangeKey: nextRange,
      rangeLabel: DATE_RANGE_LABELS[nextRange],
    }));
    setPending(true);
    setFailed(false);
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(
        `/api/dashboard/financial-summary?range=${nextRange}`,
        {
          cache: "no-store",
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        throw new Error("Unable to load financial summary.");
      }

      const nextSummary = (await response.json()) as DashboardFinancialSummary;
      setSummary(nextSummary);
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setFailed(true);
      }
    } finally {
      if (abortRef.current === controller) {
        setPending(false);
      }
    }
  };

  return (
    <div className="grid gap-3.5 xl:grid-cols-[3fr_1fr]">
      <section className="card-ink p-4 sm:p-7">
        <div className="relative z-[1] flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h2 className="font-display text-[21px] font-medium tracking-tight sm:text-[25px]">
            Resumen financiero
          </h2>
          <div className="w-full sm:w-52">
            <Select
              aria-label="Rango del resumen financiero"
              onValueChange={loadRange}
              value={summary.rangeKey}
              variant="ink"
            >
              {DATE_RANGE_KEYS.map((key) => (
                <option key={key} value={key}>
                  {DATE_RANGE_LABELS[key]}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div
          className={cn(
            "relative z-[1] mt-5 grid gap-5 transition-opacity lg:grid-cols-[1.6fr_1fr] lg:items-start",
            pending ? "opacity-60" : "opacity-100",
          )}
        >
          <div>
            <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-ink-foreground/50">
              Ingresos
            </p>
            <p className="mt-4 break-words font-display text-[42px] font-medium leading-[1.05] tracking-tight text-ink-foreground sm:mt-6 sm:text-[72px]">
              {formatCurrency(summary.revenue)}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-[11.5px] text-ink-foreground/60">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[11px] font-medium",
                  positive
                    ? "bg-accent-300/22 text-accent-300"
                    : "bg-danger-500/18 text-danger-300",
                )}
              >
                {positive ? (
                  <TrendingUp className="h-3 w-3" strokeWidth={2.4} />
                ) : (
                  <TrendingDown className="h-3 w-3" strokeWidth={2.4} />
                )}
                {positive ? "+" : ""}
                {summary.revenueChange.toFixed(1)}%
              </span>
              <span>
                {summary.rangeLabel.toLowerCase()} - {summary.rangeDetail}
              </span>
            </div>
            {failed ? (
              <p className="mt-3 text-[11.5px] text-danger-300">
                No se pudo actualizar el resumen. Intenta nuevamente.
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-white/8 pt-5 lg:flex lg:grid-cols-1 lg:flex-col lg:gap-5 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
            <FinancialMetric
              label="Costo de inventario"
              note="Valorizacion al cierre"
              value={formatCurrency(inventoryCost)}
            />
            <FinancialMetric
              label="Margen bruto"
              note="Ganancia bruta"
              value={formatCurrency(summary.grossProfit)}
              valueClassName="text-accent-300"
            />
          </div>
        </div>
      </section>

      <aside className="grid grid-cols-3 gap-2 rounded-card border border-border bg-card p-3 sm:flex sm:flex-col sm:p-5">
        <div className="col-span-3 sm:col-span-1">
          <h3 className="font-display text-[16px] font-medium">Hoy</h3>
          <p className="mt-1 text-[11.5px] text-muted-foreground">{todayLabel}</p>
        </div>
        <SnapshotRow
          label="Entradas"
          value={String(entriesToday)}
          dotClass="bg-accent-500"
        />
        <SnapshotRow
          label="Salidas"
          value={String(outputsToday)}
          dotClass="bg-secondary-500"
        />
        <SnapshotRow
          label="Ventas"
          value={String(salesToday)}
          dotClass="bg-primary"
        />
        {outOfStockCount > 0 ? (
          <div className="col-span-3 mt-1 flex items-start gap-2.5 rounded-[10px] bg-error-surface p-3">
            <span className="font-display text-[22px] font-medium leading-none text-error">
              {outOfStockCount}
            </span>
            <span className="text-[11.5px] font-medium leading-tight text-error">
              {outOfStockCount === 1
                ? "Producto sin stock"
                : "Productos sin stock"}
              <span className="mt-0.5 block text-[11px] font-normal text-error/75">
                requiere reposicion urgente
              </span>
            </span>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function FinancialMetric({
  label,
  note,
  value,
  valueClassName,
}: {
  label: string;
  note: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div>
      <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-ink-foreground/50">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 break-words font-display text-[20px] font-medium tracking-tight text-ink-foreground/95 sm:text-[24px]",
          valueClassName,
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-[11px] text-ink-foreground/55">{note}</p>
    </div>
  );
}

function SnapshotRow({
  label,
  value,
  dotClass,
}: {
  label: string;
  value: string;
  dotClass: string;
}) {
  return (
    <div className="rounded-[10px] bg-surface-muted px-2.5 py-2 sm:flex sm:items-baseline sm:justify-between sm:border-b sm:border-dashed sm:border-border sm:bg-transparent sm:px-0 sm:py-2.5">
      <span className="inline-flex items-center gap-2 text-[11.5px] text-muted-foreground">
        <span className={cn("h-1.5 w-1.5 rounded-full", dotClass)} />
        {label}
      </span>
      <span className="mt-1 block font-display text-[18px] font-medium text-foreground sm:mt-0">
        {value}
      </span>
    </div>
  );
}
