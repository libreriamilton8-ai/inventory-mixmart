"use client";

import { usePathname, useSearchParams } from "next/navigation";

export function CurrentUrlField({ name = "redirectTo" }: { name?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  return (
    <input
      name={name}
      type="hidden"
      value={query ? `${pathname}?${query}` : pathname}
    />
  );
}
