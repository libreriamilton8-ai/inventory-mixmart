import { Plus } from "lucide-react";

import { Field } from "@/components/forms";
import { SubmitButton } from "@/components/shared";
import { Select } from "@/components/ui/select";
import { createStockEntry } from "@/server/actions";

type SupplierOption = {
  id: string;
  name: string;
};

type ProductOption = {
  id: string;
  name: string;
  unitName: string;
};

const ITEM_ROWS = 6;

export function EntryForm({
  suppliers,
  products,
}: {
  suppliers: SupplierOption[];
  products: ProductOption[];
}) {
  return (
    <form action={createStockEntry} className="space-y-5 p-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Field className="md:col-span-2" label="Proveedor">
          <Select name="supplierId" required>
            <option value="">Seleccionar</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Estado">
          <Select defaultValue="ORDERED" name="status">
            <option value="ORDERED">Ordenada</option>
            <option value="RECEIVED">Recibida</option>
          </Select>
        </Field>
        <Field label="Referencia">
          <input className="input" name="referenceNumber" />
        </Field>
      </div>

      <div className="overflow-x-auto rounded-card border border-border">
        <table className="table-operational">
          <thead className="table-operational-head">
            <tr>
              <th className="px-3 py-2">Producto</th>
              <th className="px-3 py-2">Cantidad</th>
              <th className="px-3 py-2">Costo unit.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Array.from({ length: ITEM_ROWS }).map((_, index) => (
              <tr key={index}>
                <td className="px-3 py-2">
                  <Select name="productId">
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
                    name="quantity"
                    step="0.001"
                    type="number"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    className="input"
                    min="0"
                    name="unitCost"
                    step="0.01"
                    type="number"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Field className="block" label="Notas">
        <textarea className="input min-h-20 py-2" name="notes" />
      </Field>

      <div className="flex justify-end">
        <SubmitButton>
          <Plus aria-hidden="true" className="h-4 w-4" />
          Registrar entrada
        </SubmitButton>
      </div>
    </form>
  );
}
