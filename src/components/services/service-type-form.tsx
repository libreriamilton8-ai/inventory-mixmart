import { Plus } from "lucide-react";

import { Field } from "@/components/forms";
import { SubmitButton } from "@/components/shared";
import { Select } from "@/components/ui/select";
import { createServiceType } from "@/server/actions";

export function ServiceTypeForm() {
  return (
    <form action={createServiceType} className="space-y-4 p-5">
      <div className="grid gap-3 md:grid-cols-2">
        <Field className="md:col-span-2" label="Nombre">
          <input
            className="input"
            name="name"
            placeholder="Ej. Impresion B/N, Anillado, Tecnico"
            required
          />
        </Field>
        <Field label="Tipo">
          <Select defaultValue="IN_HOUSE" name="kind">
            <option value="IN_HOUSE">Interno</option>
            <option value="OUTSOURCED">Tercerizado</option>
          </Select>
        </Field>
        <Field label="Unidad">
          <input
            className="input"
            defaultValue="servicio"
            name="unitName"
            placeholder="servicio, copia, hora..."
            required
          />
        </Field>
        <Field className="md:col-span-2" label="Descripcion">
          <textarea
            className="input min-h-16 py-2"
            name="description"
            placeholder="Detalle breve sobre el servicio."
          />
        </Field>
      </div>

      <p className="rounded-control border border-border bg-surface-muted px-3 py-2 text-[11.5px] text-muted-foreground">
        Los insumos consumidos se eligen al registrar cada servicio. Asi puedes
        usar lo que realmente gastaste sin estar atado a una receta fija.
      </p>

      <div className="flex justify-end">
        <SubmitButton>
          <Plus aria-hidden="true" className="h-4 w-4" />
          Crear tipo
        </SubmitButton>
      </div>
    </form>
  );
}
