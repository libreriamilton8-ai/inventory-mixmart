import {
  ActionTip,
  DataTable,
  EmptyState,
  PaginationBar,
  RecordDetailModal,
  Section,
  SectionHeader,
  StatusBadge,
} from "@/components/shared";
import type { ReactNode } from "react";
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
  filters,
  searchParams,
}: {
  filters?: ReactNode;
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
        serviceType: { select: { name: true, unitName: true } },
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
      {filters}
      {records.length ? (
        <DataTable
          columnWidths={["22%", "12%", "13%", "10%", "18%", "13%", "12%"]}
          headers={[
            "Servicio",
            "Tipo",
            "Estado",
            "Cantidad",
            "Fecha",
            "Consumo",
            "Detalle",
          ]}
          minWidth="920px"
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
                <td className="relative w-40 px-4 py-3">
                  {record.consumptions.length ? (
                    <details className="relative">
                      <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-control border border-border bg-surface-muted px-2 py-0.5 text-xs font-medium text-foreground [&::-webkit-details-marker]:hidden">
                        {formatCurrency(consumptionCost)}
                      </summary>
                      <div className="absolute left-0 top-full z-30 mt-1 w-64 rounded-card border border-border bg-surface p-2 shadow-md">
                        <ul className="space-y-1">
                          {record.consumptions.map((item) => (
                            <li className="text-xs text-foreground" key={item.id}>
                              <span className="font-medium">{item.product.name}</span>
                              <span className="text-muted-foreground">
                                {" "}— {formatDecimal(item.quantity, 0)} {item.product.unitName}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </details>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <ActionTip label="Detalle">
                    <RecordDetailModal title="Detalle servicio">
                      <ServiceRecordDetail
                        consumptionCost={consumptionCost}
                        record={record}
                      />
                    </RecordDetailModal>
                  </ActionTip>
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

type ServiceRecordDetailProps = {
  consumptionCost: number;
  record: {
    kind: ServiceKind;
    status: ServiceStatus;
    quantity: { toNumber: () => number } | number | string;
    serviceDate: Date;
    deliveredAt: Date | null;
    externalVendorName: string | null;
    notes: string | null;
    serviceType: {
      name: string;
      unitName: string;
    };
    createdBy: {
      firstName: string;
      lastName: string;
    };
    consumptions: {
      id: string;
      quantity: { toNumber: () => number } | number | string;
      product: {
        name: string;
        unitName: string;
        purchasePrice: { toNumber: () => number } | number | string;
      };
    }[];
  };
};

function ServiceRecordDetail({
  consumptionCost,
  record,
}: ServiceRecordDetailProps) {
  return (
    <div className="space-y-4 p-5">
      <div className="grid gap-3 md:grid-cols-2">
        <DetailBox label="Servicio" value={record.serviceType.name} />
        <DetailBox label="Tipo" value={serviceKindLabels[record.kind]} />
        <DetailBox label="Estado" value={serviceStatusLabels[record.status]} />
        <DetailBox
          label="Cantidad"
          value={`${formatDecimal(record.quantity, 3)} ${record.serviceType.unitName}`}
        />
        <DetailBox label="Fecha" value={formatDate(record.serviceDate)} />
        <DetailBox
          label="Entregado"
          value={record.deliveredAt ? formatDate(record.deliveredAt) : "Pendiente"}
        />
        <DetailBox
          label="Registrado por"
          value={`${record.createdBy.firstName} ${record.createdBy.lastName}`}
        />
        <DetailBox
          label="Proveedor externo"
          value={record.externalVendorName || "No aplica"}
        />
        <DetailBox
          className="md:col-span-2"
          label="Notas"
          value={record.notes || "Sin notas"}
        />
      </div>

      <div className="rounded-control border border-border bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
          <h3 className="text-sm font-semibold text-foreground">Insumos</h3>
          <span className="text-sm font-semibold text-foreground">
            {formatCurrency(consumptionCost)}
          </span>
        </div>
        {record.consumptions.length ? (
          <ul className="divide-y divide-border">
            {record.consumptions.map((item) => (
              <li
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                key={item.id}
              >
                <span className="font-medium text-foreground">
                  {item.product.name}
                </span>
                <span className="text-muted-foreground">
                  {formatDecimal(item.quantity, 3)} {item.product.unitName}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-3 py-3 text-sm text-muted-foreground">
            Sin insumos consumidos.
          </p>
        )}
      </div>
    </div>
  );
}

function DetailBox({
  className,
  label,
  value,
}: {
  className?: string;
  label: string;
  value: string;
}) {
  return (
    <div className={className}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 rounded-control border border-border bg-surface-muted px-3 py-2 text-sm text-foreground">
        {value}
      </p>
    </div>
  );
}
