import { Plus } from "lucide-react";

import { Field } from "@/components/forms";
import { SubmitButton } from "@/components/shared";
import { Select } from "@/components/ui/select";
import { createServiceType } from "@/server/actions";

type ProductOption = {
  id: string;
  name: string;
  unitName: string;
};

const SUPPLY_ROWS = 4;

export function ServiceTypeForm({ products }: { products: ProductOption[] }) {
  return (
    <form action={createServiceType} className="space-y-5 p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field className="md:col-span-2" label="Nombre">
          <input className="input" name="name" required />
        </Field>
        <Field label="Tipo">
          <Select defaultValue="IN_HOUSE" name="kind">
            <option value="IN_HOUSE">Interno</option>
            <option value="OUTSOURCED">Tercerizado</option>
          </Select>
        </Field>
        <Field label="Unidad">
          <input className="input" defaultValue="servicio" name="unitName" required />
        </Field>
        <Field className="md:col-span-2" label="Descripcion">
          <textarea className="input min-h-16 py-2" name="description" />
        </Field>
      </div>

      <div className="overflow-x-auto rounded-card border border-border">
        <table className="table-operational">
          <thead className="table-operational-head">
            <tr>
              <th className="px-3 py-2">Insumo</th>
              <th className="px-3 py-2">Cantidad por unidad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Array.from({ length: SUPPLY_ROWS }).map((_, index) => (
              <tr key={index}>
                <td className="px-3 py-2">
                  <Select name="supplyProductId">
                    <option value="">Seleccionar</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.unitName})
                      </option>
                    ))}
                  </Select>
                </td>
                <td className="px-3 py-2">
                  <input
                    className="input"
                    min="0.001"
                    name="quantityPerUnit"
                    step="0.001"
                    type="number"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <SubmitButton>
          <Plus aria-hidden="true" className="h-4 w-4" />
          Crear tipo
        </SubmitButton>
      </div>
    </form>
  );
}
