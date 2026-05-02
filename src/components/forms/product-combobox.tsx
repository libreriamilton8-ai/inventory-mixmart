"use client";

import { Check, ChevronDown, Search, X } from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

export type ProductComboboxOption = {
  id: string;
  name: string;
  category?: string;
  unitName?: string;
  currentStock?: string;
  hint?: string;
};

type Position = { top: number; left: number; width: number };

type ProductComboboxProps = {
  ariaLabel?: string;
  name: string;
  options: ProductComboboxOption[];
  defaultValue?: string;
  onSelect?: (option: ProductComboboxOption | null) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

export function ProductCombobox({
  ariaLabel,
  name,
  options,
  defaultValue,
  onSelect,
  placeholder = "Buscar producto...",
  required,
  disabled,
  className,
}: ProductComboboxProps) {
  const initialOption =
    options.find((option) => option.id === defaultValue) ?? null;
  const [selected, setSelected] = useState<ProductComboboxOption | null>(
    initialOption,
  );
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return options.slice(0, 50);

    const tokens = trimmed.split(/\s+/);
    return options
      .filter((option) => {
        const haystack =
          `${option.name} ${option.category ?? ""} ${option.hint ?? ""}`.toLowerCase();
        return tokens.every((token) => haystack.includes(token));
      })
      .slice(0, 50);
  }, [options, query]);

  useEffect(() => {
    if (!open) return;

    const close = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current?.contains(target) ||
        document.getElementById(listboxId)?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, listboxId]);

  useLayoutEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition({
        top: rect.bottom + 4,
        left: Math.max(
          8,
          Math.min(rect.left, window.innerWidth - rect.width - 8),
        ),
        width: rect.width,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
      setActiveIndex(0);
    }
  }, [open]);

  const choose = (option: ProductComboboxOption) => {
    setSelected(option);
    onSelect?.(option);
    setOpen(false);
    setQuery("");
  };

  const clear = () => {
    setSelected(null);
    onSelect?.(null);
    setQuery("");
  };

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <input type="hidden" name={name} value={selected?.id ?? ""} required={required} />
      <button
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={cn(
          "input flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 pr-9 text-left text-sm font-medium transition",
          selected ? "pr-16" : "pr-9",
          disabled ? "cursor-not-allowed opacity-50" : "hover:border-primary-300",
        )}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        ref={triggerRef}
        type="button"
      >
        <span
          className={cn(
            "min-w-0 truncate",
            selected ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {selected ? selected.name : placeholder}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          strokeWidth={2.2}
        />
      </button>
      {selected && !disabled ? (
        <button
          aria-label="Quitar seleccion"
          className="absolute right-9 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-error-surface hover:text-error"
          onClick={(event) => {
            event.stopPropagation();
            clear();
          }}
          type="button"
        >
          <X aria-hidden="true" className="h-3 w-3" />
        </button>
      ) : null}

      {open && position
        ? createPortal(
            <div
              className="z-[80] flex max-h-80 flex-col overflow-hidden rounded-[14px] border border-border bg-surface-elevated shadow-elevated"
              id={listboxId}
              role="listbox"
              style={{
                position: "fixed",
                top: position.top,
                left: position.left,
                width: position.width,
                minWidth: 280,
              }}
            >
              <div className="flex items-center gap-2 border-b border-border bg-surface px-3 py-2">
                <Search aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      setActiveIndex((current) =>
                        Math.min(current + 1, filtered.length - 1),
                      );
                    } else if (event.key === "ArrowUp") {
                      event.preventDefault();
                      setActiveIndex((current) => Math.max(current - 1, 0));
                    } else if (event.key === "Enter" && filtered[activeIndex]) {
                      event.preventDefault();
                      choose(filtered[activeIndex]);
                    }
                  }}
                  placeholder="Buscar por nombre, categoria..."
                  ref={inputRef}
                  type="text"
                  value={query}
                />
              </div>
              <div className="max-h-64 overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                    Sin coincidencias
                  </div>
                ) : (
                  filtered.map((option, index) => (
                    <button
                      aria-selected={selected?.id === option.id}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition",
                        index === activeIndex
                          ? "bg-primary-50 text-primary-800"
                          : "hover:bg-surface-muted",
                      )}
                      key={option.id}
                      onClick={() => choose(option)}
                      onMouseEnter={() => setActiveIndex(index)}
                      role="option"
                      type="button"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {option.name}
                        </span>
                        {option.hint || option.currentStock ? (
                          <span className="block truncate text-[11px] text-muted-foreground">
                            {[option.hint, option.currentStock]
                              .filter(Boolean)
                              .join(" - ")}
                          </span>
                        ) : null}
                      </span>
                      {selected?.id === option.id ? (
                        <Check
                          aria-hidden="true"
                          className="h-4 w-4 shrink-0 text-primary"
                        />
                      ) : null}
                    </button>
                  ))
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
