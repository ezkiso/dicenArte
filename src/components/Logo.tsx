import Link from "next/link";

/**
 * RF-16: logo corporativo, usado en Header y Footer.
 * Placeholder tipográfico en blanco/negro — reemplazar por el isotipo
 * definitivo cuando esté listo (mismo componente, solo cambia el <svg>/markup).
 */
export default function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link
      href="/"
      className={`font-display text-2xl tracking-tight ${
        inverted ? "text-base-white" : "text-base-black"
      }`}
      aria-label="DicenArte — Inicio"
    >
      Dicen<span className="italic">Arte</span>
    </Link>
  );
}
