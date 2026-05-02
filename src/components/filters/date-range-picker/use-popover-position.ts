'use client';

import { useEffect, useLayoutEffect, useState, type RefObject } from 'react';

export type PopoverPosition = {
  left: number;
  top: number;
  width: number;
  placement: 'bottom' | 'top';
};

export function usePopoverPosition(
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  containerRef: RefObject<HTMLElement | null>,
  popoverRef: RefObject<HTMLElement | null>,
  onClose: () => void,
) {
  const [position, setPosition] = useState<PopoverPosition | null>(null);

  useLayoutEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const width = Math.min(352, window.innerWidth - 16);
      const height = 430;
      const bottomSpace = window.innerHeight - rect.bottom;
      const placement =
        bottomSpace < height && rect.top > height ? 'top' : 'bottom';

      setPosition({
        left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
        top: placement === 'bottom' ? rect.bottom + 8 : rect.top - 8,
        width,
        placement,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, triggerRef]);

  useEffect(() => {
    if (!open) return;

    const closeOnOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        containerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }

      onClose();
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('mousedown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open, containerRef, popoverRef, onClose]);

  return position;
}
