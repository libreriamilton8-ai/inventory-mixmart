"use client";

import { Eye } from "lucide-react";
import type { ReactNode } from "react";

import { FormModal } from "@/components/ui/modal";

import { iconBtnEdit } from "./record-action-styles";

type RecordDetailModalProps = {
  title: string;
  description?: string;
  children: ReactNode;
  label?: string;
  size?: "sm" | "md" | "lg" | "xl";
};

export function RecordDetailModal({
  title,
  description,
  children,
  label = "Ver detalle",
  size = "lg",
}: RecordDetailModalProps) {
  return (
    <FormModal
      description={description}
      size={size}
      title={title}
      trigger={<Eye aria-hidden="true" data-icon="icon" />}
      triggerAriaLabel={label}
      triggerClassName={iconBtnEdit}
    >
      {children}
    </FormModal>
  );
}
