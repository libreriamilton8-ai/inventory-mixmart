import { Plus } from "lucide-react";

import { Field } from "@/components/forms";
import { SubmitButton } from "@/components/shared";
import { createSupplier, updateSupplier } from "@/server/actions";

export type SupplierFormValues = {
  id: string;
  ruc: string;
  name: string;
  phone: string;
  contactName: string;
  address: string | null;
  notes: string | null;
};

export function SupplierForm({ supplier }: { supplier?: SupplierFormValues }) {
  const isEdit = Boolean(supplier);

  return (
    <form
      action={isEdit ? updateSupplier : createSupplier}
      className="grid gap-4 p-6 md:grid-cols-3"
    >
      {isEdit && supplier ? (
        <input name="id" type="hidden" value={supplier.id} />
      ) : null}
      <Field label="RUC">
        <input className="input" defaultValue={supplier?.ruc} name="ruc" required />
      </Field>
      <Field className="md:col-span-2" label="Nombre">
        <input className="input" defaultValue={supplier?.name} name="name" required />
      </Field>
      <Field label="Telefono">
        <input
          className="input"
          defaultValue={supplier?.phone}
          name="phone"
          required
        />
      </Field>
      <Field className="md:col-span-2" label="Contacto">
        <input
          className="input"
          defaultValue={supplier?.contactName}
          name="contactName"
          required
        />
      </Field>
      <Field className="md:col-span-3" label="Direccion">
        <input
          className="input"
          defaultValue={supplier?.address ?? ""}
          name="address"
        />
      </Field>
      <Field className="md:col-span-3" label="Notas">
        <textarea
          className="input min-h-24 py-2"
          defaultValue={supplier?.notes ?? ""}
          name="notes"
        />
      </Field>
      <div className="flex justify-end md:col-span-3">
        <SubmitButton>
          <Plus aria-hidden="true" className="h-4 w-4" />
          {isEdit ? "Guardar cambios" : "Crear proveedor"}
        </SubmitButton>
      </div>
    </form>
  );
}
