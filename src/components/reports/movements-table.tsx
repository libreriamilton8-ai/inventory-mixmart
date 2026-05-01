import {
  DataTable,
  EmptyState,
  ProductCategoryBadge,
  Section,
  SectionHeader,
  StatusBadge,
} from "@/components/shared";
import {
  formatCurrency,
  formatDate,
  formatDecimal,
  movementDirectionLabels,
  movementTypeLabels,
} from "@/lib/format";

import type { MovementRow } from "./types";

export function MovementsTable({ movements }: { movements: MovementRow[] }) {
  return (
    <Section>
      <SectionHeader title="Movimientos por periodo" />
      {movements.length ? (
        <DataTable
          headers={["Fecha", "Producto", "Tipo", "Cant.", "Costo"]}
          sticky
        >
          {movements.map((movement) => (
            <tr key={movement.id}>
              <td className="px-4 py-3">{formatDate(movement.occurredAt)}</td>
              <td className="px-4 py-3">
                <div className="space-y-2">
                  <p className="font-medium text-foreground">
                    {movement.product.name}
                  </p>
                  <ProductCategoryBadge
                    category={movement.product.category}
                    className="min-h-6 rounded-control px-2 py-0.5"
                  />
                </div>
              </td>
              <td className="px-4 py-3">
                <StatusBadge
                  tone={movement.direction === "IN" ? "success" : "warning"}
                >
                  {movementDirectionLabels[movement.direction]} -{" "}
                  {movementTypeLabels[movement.movementType]}
                </StatusBadge>
              </td>
              <td className="px-4 py-3">{formatDecimal(movement.quantity, 3)}</td>
              <td className="px-4 py-3">{formatCurrency(movement.unitCost)}</td>
            </tr>
          ))}
        </DataTable>
      ) : (
        <EmptyState title="Sin movimientos" />
      )}
    </Section>
  );
}
