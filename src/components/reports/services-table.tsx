import {
  DataTable,
  EmptyState,
  Section,
  SectionHeader,
  StatusBadge,
} from "@/components/shared";
import {
  formatDate,
  formatDecimal,
  serviceKindLabels,
  serviceStatusLabels,
} from "@/lib/format";

import type { ServiceRow } from "./types";

export function ReportsServicesTable({ services }: { services: ServiceRow[] }) {
  return (
    <Section className="mt-5">
      <SectionHeader title="Resumen de servicios" />
      {services.length ? (
        <DataTable
          headers={[
            "Fecha",
            "Servicio",
            "Tipo",
            "Estado",
            "Cantidad",
            "Consumos",
          ]}
        >
          {services.map((service) => (
            <tr key={service.id}>
              <td className="px-4 py-3">{formatDate(service.serviceDate)}</td>
              <td className="px-4 py-3">{service.serviceType.name}</td>
              <td className="px-4 py-3">{serviceKindLabels[service.kind]}</td>
              <td className="px-4 py-3">
                <StatusBadge
                  tone={service.status === "CANCELLED" ? "error" : "info"}
                >
                  {serviceStatusLabels[service.status]}
                </StatusBadge>
              </td>
              <td className="px-4 py-3">{formatDecimal(service.quantity, 3)}</td>
              <td className="px-4 py-3">{service.consumptions.length}</td>
            </tr>
          ))}
        </DataTable>
      ) : (
        <EmptyState title="Sin servicios en el periodo" />
      )}
    </Section>
  );
}
