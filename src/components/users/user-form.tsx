import { Plus } from "lucide-react";

import { Field } from "@/components/forms";
import { SubmitButton } from "@/components/shared";
import { Select } from "@/components/ui/select";
import { roleLabels } from "@/lib/format";
import { createUser, updateUser } from "@/server/actions";
import type { UserRole } from "../../../prisma/generated/client";

const roles: UserRole[] = ["ADMIN", "WORKER"];

export type UserFormValues = {
  id: string;
  username: string;
  email: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  dni: string | null;
  role: UserRole;
};

export function UserForm({ user }: { user?: UserFormValues }) {
  const isEdit = Boolean(user);

  return (
    <form
      action={isEdit ? updateUser : createUser}
      className="grid gap-4 p-6 md:grid-cols-3"
    >
      {isEdit && user ? <input name="id" type="hidden" value={user.id} /> : null}
      <Field label="Usuario">
        <input
          className="input"
          defaultValue={user?.username}
          name="username"
          required
        />
      </Field>
      <Field label="Correo">
        <input
          className="input"
          defaultValue={user?.email ?? ""}
          name="email"
          type="email"
        />
      </Field>
      <Field label="Rol">
        <Select defaultValue={user?.role ?? "WORKER"} name="role">
          {roles.map((role) => (
            <option key={role} value={role}>
              {roleLabels[role]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Nombre">
        <input
          className="input"
          defaultValue={user?.firstName}
          name="firstName"
          required
        />
      </Field>
      <Field label="Apellido">
        <input
          className="input"
          defaultValue={user?.lastName}
          name="lastName"
          required
        />
      </Field>
      <Field label="Telefono">
        <input className="input" defaultValue={user?.phone ?? ""} name="phone" />
      </Field>
      <Field label="DNI">
        <input className="input" defaultValue={user?.dni ?? ""} name="dni" />
      </Field>
      <Field
        className="md:col-span-2"
        label={isEdit ? "Nueva contrasena" : "Contrasena inicial"}
      >
        <input
          className="input"
          minLength={8}
          name="password"
          required={!isEdit}
          type="password"
        />
      </Field>
      <div className="flex justify-end md:col-span-3">
        <SubmitButton>
          <Plus aria-hidden="true" className="h-4 w-4" />
          {isEdit ? "Guardar cambios" : "Crear usuario"}
        </SubmitButton>
      </div>
    </form>
  );
}
