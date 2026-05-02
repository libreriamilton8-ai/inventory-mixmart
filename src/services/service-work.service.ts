import prisma from "@/lib/prisma";
import type {
  ServiceConsumptionInput,
  ServiceRecordInput,
  ServiceTypeInput,
} from "@/services/form-schemas";
import type { ServiceKind, ServiceStatus } from "../../prisma/generated/client";

export async function createServiceTypeRecord({
  data,
}: {
  data: ServiceTypeInput;
}) {
  return prisma.serviceType.create({
    data: {
      name: data.name,
      kind: data.kind as ServiceKind,
      unitName: data.unitName,
      description: data.description,
    },
  });
}

export async function setServiceTypeActive(id: string, isActive: boolean) {
  return prisma.serviceType.update({
    where: { id },
    data: { isActive },
  });
}

export async function createServiceRecord({
  createdById,
  data,
  consumptions,
}: {
  createdById: string;
  data: ServiceRecordInput;
  consumptions: ServiceConsumptionInput[];
}) {
  const serviceType = await prisma.serviceType.findUniqueOrThrow({
    where: { id: data.serviceTypeId },
    select: { kind: true },
  });

  const record = await prisma.serviceRecord.create({
    data: {
      serviceTypeId: data.serviceTypeId,
      createdById,
      kind: serviceType.kind,
      status: data.status as ServiceStatus,
      quantity: data.quantity,
      serviceDate: new Date(data.serviceDate),
      deliveredAt:
        data.status === "DELIVERED" && data.deliveredAt
          ? new Date(data.deliveredAt)
          : null,
      externalVendorName: data.externalVendorName,
      notes: data.notes,
    },
  });

  if (consumptions.length && data.status !== "CANCELLED") {
    // Aggregate quantities per product so duplicates don't violate the unique
    // (service_record_id, product_id) constraint, and skip products already
    // covered by the legacy service_type_supplies trigger.
    const aggregated = new Map<string, number>();
    for (const item of consumptions) {
      aggregated.set(
        item.productId,
        (aggregated.get(item.productId) ?? 0) + item.quantity,
      );
    }

    for (const [productId, quantity] of aggregated.entries()) {
      try {
        await prisma.serviceConsumption.create({
          data: {
            serviceRecordId: record.id,
            productId,
            quantity,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (
          message.includes("uq_service_consumptions_service_product") ||
          message.includes("Unique constraint")
        ) {
          continue;
        }
        throw error;
      }
    }
  }

  return record;
}
