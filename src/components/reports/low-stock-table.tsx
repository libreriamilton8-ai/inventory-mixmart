import {
  DataTable,
  EmptyState,
  ProductCategoryBadge,
  Section,
  SectionHeader,
  StatusBadge,
} from "@/components/shared";
import { decimalToNumber, formatDecimal } from "@/lib/format";

import type { ReportProduct } from "./types";

export function LowStockTable({ products }: { products: ReportProduct[] }) {
  return (
    <Section>
      <SectionHeader title="Stock bajo y sin stock" />
      {products.length ? (
        <DataTable headers={["Producto", "Categoria", "Stock", "Minimo"]} sticky>
          {products.map((product) => (
            <tr key={product.id}>
              <td className="px-4 py-3 font-medium text-foreground">
                {product.name}
              </td>
              <td className="px-4 py-3">
                <ProductCategoryBadge category={product.category} />
              </td>
              <td className="px-4 py-3">
                <StatusBadge
                  tone={
                    decimalToNumber(product.currentStock) <= 0
                      ? "error"
                      : "warning"
                  }
                >
                  {formatDecimal(product.currentStock, 3)}
                </StatusBadge>
              </td>
              <td className="px-4 py-3">
                {formatDecimal(product.minimumStock, 3)}
              </td>
            </tr>
          ))}
        </DataTable>
      ) : (
        <EmptyState title="Sin alertas de stock" />
      )}
    </Section>
  );
}
