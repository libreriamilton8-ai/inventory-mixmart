"use client";

import {
  CheckCircle2,
  CircleAlert,
  Info,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

type ToastInput = {
  type?: ToastType;
  title: string;
  description?: string;
  duration?: number;
};

type ToastItem = Required<Pick<ToastInput, "type" | "title">> &
  Omit<ToastInput, "type" | "title"> & {
    id: number;
  };

type ToastContextValue = {
  toast: (input: ToastInput) => void;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toastConfig: Record<
  ToastType,
  {
    icon: LucideIcon;
    className: string;
    iconClassName: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    className: "border-success-border bg-success-surface text-success",
    iconClassName: "text-success",
  },
  error: {
    icon: CircleAlert,
    className: "border-error-border bg-error-surface text-error",
    iconClassName: "text-error",
  },
  info: {
    icon: Info,
    className: "border-primary-200 bg-primary-50 text-primary",
    iconClassName: "text-primary",
  },
};

let nextToastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback((input: ToastInput) => {
    const id = ++nextToastId;
    const item: ToastItem = {
      id,
      type: input.type ?? "info",
      title: input.title,
      description: input.description,
      duration: input.duration ?? 4500,
    };

    setToasts((current) => [item, ...current].slice(0, 4));

    window.setTimeout(() => {
      setToasts((current) => current.filter((toastItem) => toastItem.id !== id));
    }, item.duration);
  }, []);

  const value = useMemo(() => ({ dismiss, toast }), [dismiss, toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport dismiss={dismiss} toasts={toasts} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within <ToastProvider>");
  }

  return context;
}

export function ToastOnLoad({
  clearParams = ["success", "error"],
  description,
  title,
  type = "info",
}: ToastInput & {
  clearParams?: string[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const shownRef = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    if (shownRef.current) return;
    shownRef.current = true;

    toast({ description, title, type });

    if (!clearParams.length) return;

    const next = new URLSearchParams(searchParams.toString());
    clearParams.forEach((key) => next.delete(key));
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [clearParams, description, pathname, router, searchParams, title, toast, type]);

  return null;
}

function ToastViewport({
  dismiss,
  toasts,
}: {
  dismiss: (id: number) => void;
  toasts: ToastItem[];
}) {
  if (!toasts.length) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="fixed right-3 top-3 z-[100] flex w-[min(92vw,360px)] flex-col gap-2 sm:right-5 sm:top-5"
      role="status"
    >
      {toasts.map((item) => (
        <ToastCard dismiss={dismiss} item={item} key={item.id} />
      ))}
    </div>
  );
}

function ToastCard({
  dismiss,
  item,
}: {
  dismiss: (id: number) => void;
  item: ToastItem;
}) {
  const config = toastConfig[item.type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-[10px] border px-3 py-3 shadow-elevated backdrop-blur",
        config.className,
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn("mt-0.5 size-4 shrink-0", config.iconClassName)}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight">{item.title}</p>
        {item.description ? (
          <p className="mt-1 text-xs leading-5 opacity-80">{item.description}</p>
        ) : null}
      </div>
      <button
        aria-label="Cerrar notificacion"
        className="inline-flex size-6 shrink-0 items-center justify-center rounded-control opacity-70 transition hover:bg-black/5 hover:opacity-100"
        onClick={() => dismiss(item.id)}
        type="button"
      >
        <X aria-hidden="true" className="size-3.5" />
      </button>
    </div>
  );
}
