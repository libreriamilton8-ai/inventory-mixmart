import { Plus } from "lucide-react";
import { Suspense } from "react";

import {
  DateRangeFilter,
  FilterBar,
  SelectFilter,
} from "@/components/filters";
import { ServiceRecordForm } from "@/components/services/service-record-form";
import { ServiceTypeForm } from "@/components/services/service-type-form";
import { ServiceTypeList } from "@/components/services/service-type-list";
import {
  DataTable,
  EmptyState,
  FlashMessage,
  PageHeader,
  Section,
  SectionHeader,
  StatusBadge,
  TableSkeleton,
} from "@/components/shared";
import { FormModal } from "@/components/ui/modal";
import {
  formatCurrency,
  formatDate,
  formatDecimal,
  serviceKindLabels,
  serviceStatusLabels,
} from "@/lib/format";
import { dateRangeWhere } from "@/lib/calc";
import { decimalToNumber } from "@/lib/format";
import { requireActiveUser } from "@/lib/auth";
import { canManageCatalog } from "@/lib/permissions";
import prisma from "@/lib/prisma";
import type {
  ServiceKind,
  ServiceStatus,
} from "../../../../prisma/generated/client";

type ServicesSearchParams = {
  success?: string;
  error?: string;
  from?: string;
  to?: string;
  kind?: ServiceKind;
  status?: ServiceStatus;
  serviceTypeId?: string;
};

type ServicesPageProps = {
  searchParams: Promise<ServicesSearchParams>;
};

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const user = await requireActiveUser("/services");
  const params = await searchParams;
  const canManage = canManageCatalog(user.role);

  const [serviceTypes, products] = await Promise.all([
    prisma.serviceType.findMany({
      where: { isActive: true },
      include: {
        supplies: {
          include: {
            product: { select: { name: true, unitName: true } },
          },
        },
      },
      orderBy: [{ kind: "asc" }, { name: "asc" }],
      take: 100,
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, unitName: true, currentStock: true },
      orderBy: { name: "asc" },
      take: 300,
    }),
  ]);

  const inHouseTypes = serviceTypes.filter((type) => type.kind === "IN_HOUSE");
  const outsourcedTypes = serviceTypes.filter((type) => type.kind === "OUTSOURCED");

  const serviceTypeOptions = serviceTypes.map((type) => ({
    label: `${type.name} - ${serviceKindLabels[type.kind]}`,
    value: type.id,
  }));

  const filterKey = JSON.stringify({
    from: params.from ?? "",
    kind: params.kind ?? "",
    serviceTypeId: params.serviceTypeId ?? "",
    status: params.status ?? "",
    to: params.to ?? "",
  });

  return (
    <div className="space-y-5">
      <PageHeader
        action={
          <div className="flex flex-wrap gap-2">
            <FormModal
              size="lg"
              title="Registrar servicio"
              description="Captura el servicio que se entrega."
              trigger={
                <>
                  <Plus aria-hidden="true" className="h-4 w-4" />
                  Registrar servicio
                </>
              }
            >
              <ServiceRecordForm serviceTypes={serviceTypes} />
            </FormModal>

            {canManage ? (
              <FormModal
                size="xl"
                title="Nuevo tipo de servicio"
                description="Define un servicio reutilizable con sus insumos."
                triggerClassName="btn-soft"
                trigger={
                  <>
                    <Plus aria-hidden="true" className="h-4 w-4" />
                    Nuevo tipo
                  </>
                }
              >
                <ServiceTypeForm products={products} />
              </FormModal>
            ) : null}
          </div>
        }
      />

      {params.success ? (
        <FlashMessage type="success">Servicio guardado correctamente.</FlashMessage>
      ) : null}
      {params.error === "stock" ? (
        <FlashMessage type="error">
          Stock insuficiente para consumir insumos.
        </FlashMessage>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <ServiceTypeList
          canManage={canManage}
          title="Servicios internos"
          types={inHouseTypes}
        />
        <ServiceTypeList
          canManage={canManage}
          title="Servicios tercerizados"
          types={outsourcedTypes}
        />
      </div>

      <FilterBar>
        <DateRangeFilter label="Periodo de servicio" />
        <SelectFilter
          allLabel="Todos"
          label="Tipo"
          name="kind"
          options={[
            { label: "Interno", value: "IN_HOUSE" },
            { label: "Tercerizado", value: "OUTSOURCED" },
          ]}
        />
        <SelectFilter
          allLabel="Todos"
          label="Estado"
          name="status"
          options={[
            { label: "Recibido", value: "RECEIVED" },
            { label: "En proceso", value: "IN_PROGRESS" },
            { label: "Completado", value: "COMPLETED" },
            { label: "Entregado", value: "DELIVERED" },
            { label: "Cancelado", value: "CANCELLED" },
          ]}
        />
        <SelectFilter
          allLabel="Todos"
          label="Servicio"
          name="serviceTypeId"
          options={serviceTypeOptions}
        />
      </FilterBar>

      <Suspense
        fallback={<TableSkeleton columns={6} rows={6} />}
        key={filterKey}
      >
        <ServicesList searchParams={params} />
      </Suspense>
    </div>
  );
}

async function ServicesList({
  searchParams,
}: {
  searchParams: ServicesSearchParams;
}) {
  const dateFilter = dateRangeWhere(searchParams.from, searchParams.to);

  const records = await prisma.serviceRecord.findMany({
    where: {
      ...(dateFilter ? { serviceDate: dateFilter } : {}),
      ...(searchParams.kind ? { kind: searchParams.kind } : {}),
      ...(searchParams.status ? { status: searchParams.status } : {}),
      ...(searchParams.serviceTypeId
        ? { serviceTypeId: searchParams.serviceTypeId }
        : {}),
    },
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
    take: 100,
  });

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
    </Section>
  );
}
