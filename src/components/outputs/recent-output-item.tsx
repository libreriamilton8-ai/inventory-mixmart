import {
  BriefcaseBusiness,
  CircleAlert,
  ListFilter,
  ShoppingCart,
} from "lucide-react";

import { ProductCategoryBadge } from "@/components/shared";
import { sumLineRevenue } from "@/lib/calc";
import {
  formatCurrency,
  formatDate,
  formatDecimal,
  stockOutputReasonLabels,
} from "@/lib/format";
import type {
  ProductCategory,
  StockOutputReason,
} from "../../../prisma/generated/client";

const reasonIcon: Record<StockOutputReason, typeof ShoppingCart> = {
  SALE: ShoppingCart,
  WASTE: CircleAlert,
  INTERNAL_USE: BriefcaseBusiness,
};

type DecimalLike = { toNumber: () => number } | number | string | null;

export type RecentOutput = {
  id: string;
  reason: StockOutputReason;
  occurredAt: Date;
  items: {
    id: string;
    quantity: DecimalLike;
    unitCost: DecimalLike;
    unitSalePrice: DecimalLike;
    product: {
      name: string;
      unitName: string;
      category: ProductCategory;
    };
  }[];
};

export function RecentOutputItem({ output }: { output: RecentOutput }) {
  const revenue = sumLineRevenue(output.items);
  const Icon = reasonIcon[output.reason];

  return (
    <details className="group px-4 py-3 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card border border-primary-100 bg-primary-50 text-primary">
          <Icon aria-hidden="true" className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-foreground">
              {stockOutputReasonLabels[output.reason]}
            </span>
            <span className="shrink-0 text-sm font-semibold text-foreground">
              {output.reason === "SALE" ? formatCurrency(revenue) : "-"}
            </span>
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {formatDate(output.occurredAt)} - {output.items.length} items
          </span>
        </span>
      </summary>
      <div className="popover-window mt-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <ListFilter aria-hidden="true" className="h-3.5 w-3.5" />
          Detalle
        </div>
        <div className="space-y-2">
          {output.items.map((item) => (
            <div
              className="rounded-control border border-border bg-surface px-2 py-2"
              key={item.id}
            >
              <p className="text-sm font-medium text-foreground">
                {item.product.name}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {formatDecimal(item.quantity, 3)} {item.product.unitName}
                </span>
                <ProductCategoryBadge
                  category={item.product.category}
                  className="min-h-6 rounded-control px-2 py-0.5"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}
