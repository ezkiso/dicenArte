import Link from "next/link";
import Image from "next/image";

/**
 * RF-16: logo corporativo, usado en Header y Footer.
 * Placeholder tipográfico en blanco/negro — reemplazar por el isotipo
 * definitivo cuando esté listo (mismo componente, solo cambia el <svg>/markup).
 */
export default function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2 font-display text-2xl tracking-tight ${
        inverted ? "text-base-white" : "text-base-black"
      }`}
      aria-label="DicenArte — Inicio"
    >
      <Image
        src="/logo.jpg"
        alt="Logo DicenArte"
        width={60}
        height={60}
        className="h-14 w-14 object-cover"
      />
      Dicen<span className="italic">Arte</span>
    </Link>
  );
}
