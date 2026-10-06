"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Expand, X } from "lucide-react";

export default function ImageZoom({
  src,
  alt,
  className,
  children,
}: {
  src: string;
  alt: string;
  className: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const trigger = triggerRef.current;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Ver imagen ampliada: ${alt}`}
        title="Ver imagen ampliada"
        onClick={() => setOpen(true)}
        className={className}
      >
        {children ?? <Expand size={18} aria-hidden="true" />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Imagen ampliada: ${alt}`}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-base-black/90 p-4"
        >
          <button
            type="button"
            autoFocus
            aria-label="Cerrar imagen ampliada"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center bg-base-white text-base-black"
          >
            <X size={22} aria-hidden="true" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[90vh] max-w-[92vw] object-contain"
          />
        </div>
      )}
    </>
  );
}