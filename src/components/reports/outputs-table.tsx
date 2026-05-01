import {
  DataTable,
  EmptyState,
  Section,
  SectionHeader,
} from "@/components/shared";
import { sumLineCost, sumLineRevenue } from "@/lib/calc";
import {
  formatCurrency,
  formatDate,
  stockOutputReasonLabels,
} from "@/lib/format";

import type { OutputRow } from "./types";

export function ReportsOutputsTable({ outputs }: { outputs: OutputRow[] }) {
  return (
    <Section>
      <SectionHeader title="Salidas y utilidad" />
      {outputs.length ? (
        <DataTable headers={["Fecha", "Motivo", "Costo", "Ingreso"]} sticky>
          {outputs.map((output) => {
            const cost = sumLineCost(output.items);
            const revenue = sumLineRevenue(output.items);

            return (
              <tr key={output.id}>
                <td className="px-4 py-3">{formatDate(output.occurredAt)}</td>
                <td className="px-4 py-3">
                  {stockOutputReasonLabels[output.reason]}
                </td>
                <td className="px-4 py-3">{formatCurrency(cost)}</td>
                <td className="px-4 py-3">
                  {output.reason === "SALE" ? formatCurrency(revenue) : "-"}
                </td>
              </tr>
            );
          })}
        </DataTable>
      ) : (
        <EmptyState title="Sin salidas" />
      )}
    </Section>
  );
}
