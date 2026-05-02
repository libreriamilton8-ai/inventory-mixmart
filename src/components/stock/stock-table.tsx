import {
  EmptyState,
  ProductCategoryBadge,
  Section,
  StatusBadge,
} from "@/components/shared";
import { getDatabaseConnection } from "@/lib/database-url";
import { decimalToNumber, formatDate, formatDecimal, movementTypeLabels } from "@/lib/format";
import prisma from "@/lib/prisma";
import {
  Prisma,
  type ProductCategory,
  type StockMovementType,
} from "../../../prisma/generated/client";

type StockRow = {
  id: string;
  name: string;
  category: ProductCategory;
  unitName: string;
  currentStock: string;
  minimumStock: string;
  lastMovementType: StockMovementType | null;
  lastMovementAt: Date | null;
};

function quoteIdentifier(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

type StockListParams = {
  q?: string;
  category?: ProductCategory;
  status?: "all" | "low" | "out";
};

export async function StockTable({ params }: { params: StockListParams }) {
  const q = params.q?.trim() ?? "";
  const category = params.category;
  const status = params.status ?? "all";

  const schema = Prisma.raw(quoteIdentifier(getDatabaseConnection().schema));
  const qPattern = q ? `%${q}%` : null;

  // Single query: products + latest movement via lateral join.
  // Replaces the previous N+1 (one extra query per product for stockMovements take:1).
  const rows = await prisma.$queryRaw<StockRow[]>`
    SELECT
      product.id::text          AS "id",
      product.name              AS "name",
      product.category::text    AS "category",
      product.unit_name         AS "unitName",
      product.current_stock::text AS "currentStock",
      product.minimum_stock::text AS "minimumStock",
      latest.movement_type::text AS "lastMovementType",
      latest.occurred_at        AS "lastMovementAt"
    FROM ${schema}.products product
    LEFT JOIN LATERAL (
      SELECT m.movement_type, m.occurred_at
      FROM ${schema}.stock_movements m
      WHERE m.product_id = product.id
      ORDER BY m.occurred_at DESC
      LIMIT 1
    ) latest ON TRUE
    WHERE product.is_active = TRUE
      ${qPattern ? Prisma.sql`AND product.name ILIKE ${qPattern}` : Prisma.empty}
      ${category ? Prisma.sql`AND product.category::text = ${category}` : Prisma.empty}
      ${
        status === "out"
          ? Prisma.sql`AND product.current_stock <= 0`
          : status === "low"
            ? Prisma.sql`AND product.current_stock <= product.minimum_stock`
            : Prisma.empty
      }
    ORDER BY product.category ASC, product.name ASC
    LIMIT 200
  `;

  if (!rows.length) {
    return (
      <Section>
        <EmptyState
          title="Sin productos"
          description="No hay stock con esos filtros."
        />
      </Section>
    );
  }

  return (
    <Section>
      <div className="overflow-x-auto">
        <table className="table-operational">
          <thead className="table-operational-head">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Minimo</th>
              <th className="px-4 py-3">Unidad</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Ultimo movimiento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => {
              const current = decimalToNumber(row.currentStock);
              const minimum = decimalToNumber(row.minimumStock);
              const tone =
                current <= 0 ? "error" : current <= minimum ? "warning" : "success";
              const stateLabel =
                current <= 0 ? "Sin stock" : current <= minimum ? "Bajo" : "OK";

              return (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {row.name}
                  </td>
                  <td className="px-4 py-3">
                    <ProductCategoryBadge category={row.category} />
                  </td>
                  <td className="px-4 py-3">{formatDecimal(row.currentStock, 3)}</td>
                  <td className="px-4 py-3">{formatDecimal(row.minimumStock, 3)}</td>
                  <td className="px-4 py-3">{row.unitName}</td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={tone}>{stateLabel}</StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.lastMovementType && row.lastMovementAt
                      ? `${movementTypeLabels[row.lastMovementType]} - ${formatDate(row.lastMovementAt)}`
                      : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
