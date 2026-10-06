import Link from "next/link";
import Image from "next/image";
import { beauRivage } from "@/lib/fonts";

/**
 * RF-16: logo corporativo, usado en Header y Footer.
 * Placeholder tipográfico en blanco/negro — reemplazar por el isotipo
 * definitivo cuando esté listo (mismo componente, solo cambia el <svg>/markup).
 */
export default function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link
      href="/"
      className={`${beauRivage.className} flex items-center gap-2 text-3xl ${
        inverted ? "text-base-white" : "text-base-black"
      }`}
      aria-label="DicenArte — Inicio"
    >
      <Image
        src="/logo.jpeg"
        alt="Logo DicenArte"
        width={60}
        height={60}
        priority
        className="h-14 w-14 rounded-full object-cover"
      />
      DicenArte
    </Link>
  );
}
