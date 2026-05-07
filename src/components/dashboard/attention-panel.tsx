"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useState, type ReactNode } from "react";

import { decimalToNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export type AttentionItem = {
  product: {
    id: string;
    name: string;
    sku: string | null;
    currentStock: number | string;
    minimumStock: number | string;
  };
  status: "out" | "low";
};

type AttentionFilter = "all" | AttentionItem["status"];

type AttentionPanelProps = {
  items: AttentionItem[];
  outOfStock: number;
  lowStock: number;
};

export function AttentionPanel({
  items,
  outOfStock,
  lowStock,
}: AttentionPanelProps) {
  const [filter, setFilter] = useState<AttentionFilter>("all");
  const total = outOfStock + lowStock;
  const filters: { label: string; value: AttentionFilter; count: number }[] = [
    { label: "Todos", value: "all", count: total },
    { label: "Sin stock", value: "out", count: outOfStock },
    { label: "Bajo", value: "low", count: lowStock },
  ];
  const visibleItems = items
    .filter((item) => filter === "all" || item.status === filter)
    .slice(0, 5);

  return (
    <section className="rounded-card border border-border bg-card p-3 sm:p-6">
      <header className="flex items-center justify-between gap-3">
        <h3 className="font-display text-[16px] font-medium sm:text-[18px]">
          Atención
        </h3>
        <Link
          className="text-[12px] font-medium text-muted-foreground transition hover:text-foreground"
          href="/stock?status=low"
        >
          Ver stock
        </Link>
      </header>

      <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-1 sm:mt-3">
        {filters.map((item) => (
          <Chip
            active={filter === item.value}
            key={item.value}
            onClick={() => setFilter(item.value)}
          >
            {`${item.label} - ${item.count}`}
          </Chip>
        ))}
      </div>

      {visibleItems.length ? (
        <ul className="mt-2 flex flex-col gap-1.5 sm:mt-2.5">
          {visibleItems.map(({ product, status }) => (
            <AttentionRow key={product.id} product={product} status={status} />
          ))}
        </ul>
      ) : (
        <div className="mt-4 flex items-center gap-2 text-[12.5px] text-muted-foreground sm:mt-6">
          <AlertTriangle className="h-4 w-4 text-accent-600" strokeWidth={2} />
          Todo el stock dentro de los minimos.
        </div>
      )}
    </section>
  );
}

function AttentionRow({
  product,
  status,
}: {
  product: AttentionItem["product"];
  status: AttentionItem["status"];
}) {
  const isOut = status === "out";
  const stock = decimalToNumber(product.currentStock);
  const minimum = decimalToNumber(product.minimumStock);

  return (
    <li
      className={cn(
        "grid grid-cols-[1fr_auto] items-center gap-2 rounded-[12px] border px-3 py-2 sm:gap-2.5 sm:px-3.5 sm:py-2.5",
        isOut
          ? "border-error/18 bg-error-surface"
          : "border-transparent bg-warning-surface",
      )}
    >
      <div className="min-w-0">
        <p
          className={cn(
            "truncate text-[12.5px] font-medium sm:text-[13px]",
            isOut ? "text-error" : "text-foreground",
          )}
        >
          {product.name}
        </p>
        <p
          className={cn(
            "mt-0.5 truncate font-mono text-[10.5px] tracking-[0.02em] sm:text-[11px]",
            isOut ? "text-error/70" : "text-muted-foreground",
          )}
        >
          {product.sku ?? "Sin SKU"} - min {Math.round(minimum)}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-pill px-2 py-0.5 text-[10.5px] font-semibold sm:px-2.5 sm:py-1 sm:text-[11px]",
          isOut
            ? "bg-error text-error-foreground"
            : "bg-warning text-warning-foreground",
        )}
      >
        {isOut ? "Sin stock" : `${Math.round(stock)} / ${Math.round(minimum)}`}
      </span>
    </li>
  );
}

function Chip({
  active = false,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-pill border px-2.5 py-1 text-[11px] font-medium transition sm:text-[11.5px]",
        active
          ? "border-transparent bg-foreground text-background"
          : "border-transparent bg-surface-muted text-muted-foreground hover:border-border hover:text-foreground",
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
