import {
  DataTable,
  EmptyState,
  Section,
  SectionHeader,
  StatusBadge,
} from "@/components/shared";
import { sumLineCost } from "@/lib/calc";
import { formatCurrency, formatDateOnly } from "@/lib/format";

import type { EntryRow } from "./types";

export function ReportsEntriesTable({ entries }: { entries: EntryRow[] }) {
  return (
    <Section>
      <SectionHeader title="Compras por proveedor" />
      {entries.length ? (
        <DataTable headers={["Fecha", "Proveedor", "Estado", "Total"]} sticky>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td className="px-4 py-3">{formatDateOnly(entry.orderedAt)}</td>
              <td className="px-4 py-3">{entry.supplier.name}</td>
              <td className="px-4 py-3">
                <StatusBadge
                  tone={entry.status === "RECEIVED" ? "success" : "info"}
                >
                  {entry.status}
                </StatusBadge>
              </td>
              <td className="px-4 py-3">
                {formatCurrency(sumLineCost(entry.items))}
              </td>
            </tr>
          ))}
        </DataTable>
      ) : (
        <EmptyState title="Sin compras" />
      )}
    </Section>
  );
}
