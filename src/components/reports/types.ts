import type {
  ProductCategory,
  ServiceKind,
  ServiceStatus,
  StockEntryStatus,
  StockMovementDirection,
  StockMovementType,
  StockOutputReason,
} from "../../../prisma/generated/client";

type DecimalLike = { toNumber: () => number } | number | string | null;

export type ReportProduct = {
  id: string;
  name: string;
  category: ProductCategory;
  currentStock: DecimalLike;
  minimumStock: DecimalLike;
  purchasePrice: DecimalLike;
};

export type ReportSupplier = {
  id: string;
  name: string;
};

export type MovementRow = {
  id: string;
  occurredAt: Date;
  direction: StockMovementDirection;
  movementType: StockMovementType;
  quantity: DecimalLike;
  unitCost: DecimalLike;
  product: {
    name: string;
    category: ProductCategory;
    unitName: string;
  };
};

export type EntryRow = {
  id: string;
  orderedAt: Date;
  status: StockEntryStatus;
  supplier: {
    name: string;
  };
  items: {
    quantity: DecimalLike;
    unitCost: DecimalLike;
    product: {
      name: string;
      category: ProductCategory;
    };
  }[];
};

export type OutputRow = {
  id: string;
  occurredAt: Date;
  reason: StockOutputReason;
  items: {
    quantity: DecimalLike;
    unitCost: DecimalLike;
    unitSalePrice: DecimalLike;
    product: {
      name: string;
      category: ProductCategory;
    };
  }[];
};

export type ServiceRow = {
  id: string;
  serviceDate: Date;
  kind: ServiceKind;
  status: ServiceStatus;
  quantity: DecimalLike;
  serviceType: {
    name: string;
  };
  consumptions: {
    product: {
      name: string;
    };
  }[];
};
