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
  ServicesList,
  type ServicesSearchParams,
} from "@/components/services/services-list";
import {
  FlashMessage,
  PageHeader,
  TableSkeleton,
} from "@/components/shared";
import { FormModal } from "@/components/ui/modal";
import { serviceKindLabels } from "@/lib/format";
import { requireActiveUser } from "@/lib/auth";
import { canManageCatalog } from "@/lib/permissions";
import prisma from "@/lib/prisma";

type ServicesPageProps = {
  searchParams: Promise<
    ServicesSearchParams & { success?: string; error?: string }
  >;
};

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const [user, params, serviceTypes, products] = await Promise.all([
    requireActiveUser("/services"),
    searchParams,
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

  const canManage = canManageCatalog(user.role);
  const inHouseTypes = serviceTypes.filter((type) => type.kind === "IN_HOUSE");
  const outsourcedTypes = serviceTypes.filter(
    (type) => type.kind === "OUTSOURCED",
  );

  const serviceTypeOptions = serviceTypes.map((type) => ({
    label: `${type.name} - ${serviceKindLabels[type.kind]}`,
    value: type.id,
  }));

  const filterKey = `${params.from ?? ""}|${params.to ?? ""}|${params.kind ?? ""}|${params.status ?? ""}|${params.serviceTypeId ?? ""}`;

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
