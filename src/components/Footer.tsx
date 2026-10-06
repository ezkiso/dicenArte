import Link from "next/link";
import Logo from "@/components/Logo";
import WhatsAppIcon from "@/components/WhatsAppIcon";

const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "56987470959";

// lucide-react ya no incluye logos de marcas (Instagram/Facebook), así que
// se definen como SVG propios, minimalistas, en línea con la paleta blanco/
// negro/gris del sitio.
function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...props}>
      <path d="M15 3h-2a5 5 0 0 0-5 5v3H6v4h2v6h4v-6h3l1-4h-4V8a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

// RF-15: sección de contacto + redes sociales. RF-16: logo también en footer.
export default function Footer() {
  return (
    <footer id="footer" className="border-t border-base-gray-200 bg-base-black text-base-gray-200">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div>
          <Logo inverted />
          <p className="mt-3 text-sm text-base-gray-400">
            Arte y accesorios personalizados para tu mascota.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-base-white">
            Contacto
          </h3>
          <p className="text-sm">
            <a href="mailto:info@dicenarte.cl" className="hover:underline">
              info@dicenarte.cl
            </a>
          </p>
          <div className="mt-3 flex gap-4">
            <a
              href="https://instagram.com/dicenarte"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-base-gray-300 hover:text-base-white"
            >
              <InstagramIcon width={20} height={20} />
            </a>
            <a
              href="https://facebook.com/dicenarte"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="text-base-gray-300 hover:text-base-white"
            >
              <FacebookIcon width={20} height={20} />
            </a>
            <a
              href={`https://wa.me/${phone}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="text-base-gray-300 hover:text-base-white"
            >
              <WhatsAppIcon width={20} height={20} />
            </a>
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-base-white">
            Legal
          </h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/legal" className="hover:underline">
                Términos, garantía y derecho a retracto
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-base-gray-800 px-4 py-4 text-center text-xs text-base-gray-500">
        © {new Date().getFullYear()} DicenArte. Todos los derechos reservados.
      </div>
    </footer>
  );
}