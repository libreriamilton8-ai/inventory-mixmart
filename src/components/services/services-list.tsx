import {
  DataTable,
  EmptyState,
  PaginationBar,
  Section,
  SectionHeader,
  StatusBadge,
} from "@/components/shared";
import { dateRangeWhere } from "@/lib/calc";
import {
  decimalToNumber,
  formatCurrency,
  formatDate,
  formatDecimal,
  serviceKindLabels,
  serviceStatusLabels,
} from "@/lib/format";
import { buildPaginationMeta, readPagination } from "@/lib/pagination";
import prisma from "@/lib/prisma";
import type {
  ServiceKind,
  ServiceStatus,
} from "../../../prisma/generated/client";

export type ServicesSearchParams = {
  from?: string;
  to?: string;
  kind?: ServiceKind;
  status?: ServiceStatus;
  serviceTypeId?: string;
  page?: string;
  pageSize?: string;
};

export async function ServicesList({
  searchParams,
}: {
  searchParams: ServicesSearchParams;
}) {
  const dateFilter = dateRangeWhere(searchParams.from, searchParams.to);
  const pagination = readPagination(searchParams);

  const where = {
    ...(dateFilter ? { serviceDate: dateFilter } : {}),
    ...(searchParams.kind ? { kind: searchParams.kind } : {}),
    ...(searchParams.status ? { status: searchParams.status } : {}),
    ...(searchParams.serviceTypeId
      ? { serviceTypeId: searchParams.serviceTypeId }
      : {}),
  };

  const [records, totalItems] = await Promise.all([
    prisma.serviceRecord.findMany({
      where,
      include: {
        serviceType: { select: { name: true } },
        createdBy: { select: { firstName: true, lastName: true } },
        consumptions: {
          include: {
            product: {
              select: { name: true, unitName: true, purchasePrice: true },
            },
          },
        },
      },
      orderBy: { serviceDate: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.serviceRecord.count({ where }),
  ]);

  const meta = buildPaginationMeta(totalItems, pagination);

  return (
    <Section>
      <SectionHeader title="Servicios recientes" />
      {records.length ? (
        <DataTable
          headers={[
            "Servicio",
            "Tipo",
            "Estado",
            "Cantidad",
            "Fecha",
            "Consumo",
          ]}
        >
          {records.map((record) => {
            const consumptionCost = record.consumptions.reduce(
              (sum, item) =>
                sum +
                decimalToNumber(item.quantity) *
                  decimalToNumber(item.product.purchasePrice),
              0,
            );

            return (
              <tr key={record.id}>
                <td className="px-4 py-3 font-medium text-foreground">
                  {record.serviceType.name}
                </td>
                <td className="px-4 py-3">{serviceKindLabels[record.kind]}</td>
                <td className="px-4 py-3">
                  <StatusBadge
                    tone={record.status === "CANCELLED" ? "error" : "info"}
                  >
                    {serviceStatusLabels[record.status]}
                  </StatusBadge>
                </td>
                <td className="px-4 py-3">{formatDecimal(record.quantity, 3)}</td>
                <td className="px-4 py-3">{formatDate(record.serviceDate)}</td>
                <td className="px-4 py-3">
                  {record.consumptions.length ? (
                    <details>
                      <summary className="cursor-pointer text-primary">
                        {formatCurrency(consumptionCost)}
                      </summary>
                      <ul className="mt-2 space-y-1">
                        {record.consumptions.map((item) => (
                          <li key={item.id}>
                            {item.product.name}: {formatDecimal(item.quantity, 3)}{" "}
                            {item.product.unitName}
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            );
          })}
        </DataTable>
      ) : (
        <EmptyState
          title="Sin servicios"
          description="Sin resultados para los filtros."
        />
      )}
      <PaginationBar {...meta} />
    </Section>
  );
}
