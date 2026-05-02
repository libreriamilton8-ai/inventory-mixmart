import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

import { decimalToNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export type AttentionItem = {
  product: {
    id: string;
    name: string;
    sku: string | null;
    currentStock: { toNumber: () => number } | number | string;
    minimumStock: { toNumber: () => number } | number | string;
  };
  status: "out" | "low";
};

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
  const total = outOfStock + lowStock;

  return (
    <section className="rounded-card border border-border bg-card p-4 sm:p-6">
      <header className="flex items-center justify-between gap-3">
        <h3 className="font-display text-[17px] font-medium sm:text-[18px]">
          Atencion
        </h3>
        <Link
          className="text-[12px] font-medium text-muted-foreground transition hover:text-foreground"
          href="/stock?status=low"
        >
          Ver stock
        </Link>
      </header>

      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
        <Chip active>{`Todos - ${total}`}</Chip>
        <Chip>{`Sin stock - ${outOfStock}`}</Chip>
        <Chip>{`Bajo - ${lowStock}`}</Chip>
      </div>

      {items.length ? (
        <ul className="mt-3 grid gap-2 sm:block sm:space-y-2">
          {items.map(({ product, status }) => (
            <AttentionRow key={product.id} product={product} status={status} />
          ))}
        </ul>
      ) : (
        <div className="mt-6 flex items-center gap-2 text-[12.5px] text-muted-foreground">
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
        "grid grid-cols-[1fr_auto] items-center gap-2.5 rounded-[12px] border px-3.5 py-3",
        isOut
          ? "border-error/18 bg-error-surface"
          : "border-transparent bg-warning-surface",
      )}
    >
      <div className="min-w-0">
        <p
          className={cn(
            "truncate text-[13px] font-medium",
            isOut ? "text-error" : "text-foreground",
          )}
        >
          {product.name}
        </p>
        <p
          className={cn(
            "mt-0.5 truncate font-mono text-[11px] tracking-[0.02em]",
            isOut ? "text-error/70" : "text-muted-foreground",
          )}
        >
          {product.sku ?? "Sin SKU"} - min {Math.round(minimum)}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-pill px-2.5 py-1 text-[11px] font-semibold",
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
}: {
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-pill border px-2.5 py-1 text-[11.5px] font-medium",
        active
          ? "border-transparent bg-foreground text-background"
          : "border-transparent bg-surface-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}
