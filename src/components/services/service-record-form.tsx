import { Plus } from "lucide-react";

import { Field } from "@/components/forms";
import { SubmitButton } from "@/components/shared";
import { Select } from "@/components/ui/select";
import { serviceKindLabels } from "@/lib/format";
import { createServiceRecord } from "@/server/actions";
import type { ServiceKind } from "../../../prisma/generated/client";

type ServiceTypeOption = {
  id: string;
  name: string;
  kind: ServiceKind;
};

function dateTimeLocalValue() {
  return new Date().toISOString().slice(0, 16);
}

export function ServiceRecordForm({
  serviceTypes,
}: {
  serviceTypes: ServiceTypeOption[];
}) {
  return (
    <form action={createServiceRecord} className="grid gap-4 p-6 md:grid-cols-2">
      <Field className="md:col-span-2" label="Tipo">
        <Select name="serviceTypeId" required>
          <option value="">Seleccionar</option>
          {serviceTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name} - {serviceKindLabels[type.kind]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Estado">
        <Select defaultValue="RECEIVED" name="status">
          <option value="RECEIVED">Recibido</option>
          <option value="IN_PROGRESS">En proceso</option>
          <option value="COMPLETED">Completado</option>
          <option value="DELIVERED">Entregado</option>
          <option value="CANCELLED">Cancelado</option>
        </Select>
      </Field>
      <Field label="Cantidad">
        <input
          className="input"
          defaultValue="1"
          min="0.001"
          name="quantity"
          required
          step="0.001"
          type="number"
        />
      </Field>
      <Field label="Fecha servicio">
        <input
          className="input"
          defaultValue={dateTimeLocalValue()}
          name="serviceDate"
          required
          type="datetime-local"
        />
      </Field>
      <Field label="Fecha entrega">
        <input className="input" name="deliveredAt" type="datetime-local" />
      </Field>
      <Field className="md:col-span-2" label="Proveedor externo">
        <input className="input" name="externalVendorName" />
      </Field>
      <Field className="md:col-span-2" label="Notas">
        <textarea className="input min-h-20 py-2" name="notes" />
      </Field>
      <div className="flex justify-end md:col-span-2">
        <SubmitButton>
          <Plus aria-hidden="true" className="h-4 w-4" />
          Registrar servicio
        </SubmitButton>
      </div>
    </form>
  );
}
