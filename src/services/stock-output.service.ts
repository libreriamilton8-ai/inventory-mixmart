import prisma from "@/lib/prisma";
import { dateRangeWhere, sumLineCost, sumLineRevenue } from "@/lib/calc";
import { decimalToNumber } from "@/lib/format";
import { buildPaginationMeta, readPagination } from "@/lib/pagination";
import type {
  StockOutputInput,
  StockOutputItemInput,
} from "@/services/form-schemas";
import {
  StockOutputReason as StockOutputReasonValues,
  type ProductCategory,
  type StockOutputReason,
} from "../../prisma/generated/client";

const outputReasons = Object.values(StockOutputReasonValues);

type DecimalLike = { toNumber: () => number } | number | string | null;

export type StockOutputHistoryParams = {
  from?: string;
  to?: string;
  reason?: string;
  page?: string;
  pageSize?: string;
};

export type StockOutputHistoryRow = {
  id: string;
  reason: StockOutputReason;
  occurredAt: string;
  notes: string | null;
  cost: number;
  revenue: number;
  createdBy: {
    firstName: string;
    lastName: string;
  };
  items: {
    id: string;
    quantity: string;
    unitCost: string | null;
    unitSalePrice: string | null;
    product: {
      name: string;
      unitName: string;
      category: ProductCategory;
    };
  }[];
};

export type StockOutputHistoryPayload = {
  outputs: StockOutputHistoryRow[];
  summary: {
    outputs: number;
    items: number;
    revenue: number;
    cost: number;
  };
  meta: ReturnType<typeof buildPaginationMeta>;
};

function normalizeOutputReason(
  reason?: string,
): StockOutputReason | undefined {
  return outputReasons.includes(reason as StockOutputReason)
    ? (reason as StockOutputReason)
    : undefined;
}

function decimalString(value: DecimalLike) {
  return value === null || value === undefined ? null : String(value);
}

export function isInsufficientStockError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return message.includes("Insufficient stock");
}

export async function getStockOutputHistory(
  params: StockOutputHistoryParams,
): Promise<StockOutputHistoryPayload> {
  const occurredAtFilter = dateRangeWhere(params.from, params.to);
  const reason = normalizeOutputReason(params.reason);
  const pagination = readPagination(params);

  const where = {
    ...(occurredAtFilter ? { occurredAt: occurredAtFilter } : {}),
    ...(reason ? { reason } : {}),
  };

  const [outputs, totalItems, summaryItems] = await Promise.all([
    prisma.stockOutput.findMany({
      where,
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        items: {
          include: {
            product: { select: { name: true, unitName: true, category: true } },
          },
        },
      },
      orderBy: { occurredAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.stockOutput.count({ where }),
    prisma.stockOutputItem.findMany({
      where: { stockOutput: where },
      select: {
        quantity: true,
        unitCost: true,
        unitSalePrice: true,
        stockOutput: { select: { reason: true } },
      },
    }),
  ]);

  const summary = summaryItems.reduce(
    (acc, item) => {
      const cost =
        decimalToNumber(item.quantity) * decimalToNumber(item.unitCost);
      const revenue =
        item.stockOutput.reason === "SALE"
          ? decimalToNumber(item.quantity) *
            decimalToNumber(item.unitSalePrice)
          : 0;

      return {
        cost: acc.cost + cost,
        revenue: acc.revenue + revenue,
        items: acc.items + 1,
      };
    },
    { cost: 0, revenue: 0, items: 0 },
  );

  return {
    outputs: outputs.map((output) => ({
      id: output.id,
      reason: output.reason,
      occurredAt: output.occurredAt.toISOString(),
      notes: output.notes,
      cost: sumLineCost(output.items),
      revenue: output.reason === "SALE" ? sumLineRevenue(output.items) : 0,
      createdBy: output.createdBy,
      items: output.items.map((item) => ({
        id: item.id,
        quantity: String(item.quantity),
        unitCost: decimalString(item.unitCost),
        unitSalePrice: decimalString(item.unitSalePrice),
        product: item.product,
      })),
    })),
    summary: {
      ...summary,
      outputs: totalItems,
    },
    meta: buildPaginationMeta(totalItems, pagination),
  };
}

export async function createStockOutputRecord({
  createdById,
  data,
  items,
}: {
  createdById: string;
  data: StockOutputInput;
  items: StockOutputItemInput[];
}) {
  return prisma.stockOutput.create({
    data: {
      createdById,
      reason: data.reason as StockOutputReason,
      notes: data.notes,
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitSalePrice:
            data.reason === "SALE" && typeof item.unitSalePrice === "number"
              ? item.unitSalePrice
              : undefined,
        })),
      },
    },
  });
}
