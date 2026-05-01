import { decimalToNumber } from "@/lib/format";

type DecimalLike = { toNumber: () => number } | number | string | null | undefined;

export type CostItem = {
  quantity: DecimalLike;
  unitCost: DecimalLike;
};

export type SaleItem = {
  quantity: DecimalLike;
  unitSalePrice: DecimalLike;
};

export function sumLineCost(items: readonly CostItem[]) {
  return items.reduce(
    (total, item) =>
      total + decimalToNumber(item.quantity) * decimalToNumber(item.unitCost),
    0,
  );
}

export function sumLineRevenue(items: readonly SaleItem[]) {
  return items.reduce(
    (total, item) =>
      total + decimalToNumber(item.quantity) * decimalToNumber(item.unitSalePrice),
    0,
  );
}

export function dateRangeWhere(from?: string, to?: string) {
  const filter: { gte?: Date; lte?: Date } = {};
  if (from) {
    filter.gte = new Date(`${from}T00:00:00.000`);
  }
  if (to) {
    filter.lte = new Date(`${to}T23:59:59.999`);
  }
  return Object.keys(filter).length ? filter : undefined;
}

export function defaultRangeStrings(daysBack = 30) {
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - daysBack);
  return {
    from: from.toISOString().slice(0, 10),
    to: today.toISOString().slice(0, 10),
  };
}
