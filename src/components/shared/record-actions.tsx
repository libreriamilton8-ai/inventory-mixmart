import { RotateCcw } from "lucide-react";
import type { ReactNode } from "react";

import { StatusBadge } from "./page";
import { SubmitButton } from "./submit-button";

type ServerAction = (formData: FormData) => Promise<void> | void;

export function RecordStatusBadge({
  isActive,
  deletedAt,
}: {
  isActive: boolean;
  deletedAt?: Date | null;
}) {
  if (deletedAt) {
    return <StatusBadge tone="muted">Eliminado</StatusBadge>;
  }
  if (isActive) {
    return <StatusBadge tone="success">Activo</StatusBadge>;
  }
  return <StatusBadge tone="warning">Inactivo</StatusBadge>;
}

export function IdActionForm({
  id,
  action,
  className = "btn btn-ghost border border-border",
  children,
}: {
  id: string;
  action: ServerAction;
  className?: string;
  children: ReactNode;
}) {
  return (
    <form action={action}>
      <input name="id" type="hidden" value={id} />
      <SubmitButton className={className}>{children}</SubmitButton>
    </form>
  );
}

export function RecordActions({
  id,
  isActive,
  deletedAt,
  editTrigger,
  onActivate,
  onDeactivate,
  onSoftDelete,
  onRestore,
}: {
  id: string;
  isActive: boolean;
  deletedAt?: Date | null;
  editTrigger?: ReactNode;
  onActivate: ServerAction;
  onDeactivate: ServerAction;
  onSoftDelete: ServerAction;
  onRestore: ServerAction;
}) {
  if (deletedAt) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <IdActionForm action={onRestore} className="btn btn-secondary" id={id}>
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
          Restaurar
        </IdActionForm>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {editTrigger}
      <IdActionForm action={isActive ? onDeactivate : onActivate} id={id}>
        {isActive ? "Desactivar" : "Activar"}
      </IdActionForm>
      <IdActionForm action={onSoftDelete} id={id}>
        Ocultar
      </IdActionForm>
    </div>
  );
}
