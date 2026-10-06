import type { Metadata } from "next";
import Link from "next/link";
import { Cat, Dog, House, Info, MessageCircle } from "lucide-react";

const whatsappPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "56987470959";

const services = [
  {
    name: "Cat-Sister",
    description: "Una hora de cuidado de tu gato a domicilio.",
    icon: Cat,
    message: "Hola, quisiera consultar por el servicio de Cat-sister.",
  },
  {
    name: "Paseo de mascotas",
    description: "Paseos para uno o más perros. El precio varía según el porte y la cantidad.",
    icon: Dog,
    message: "Hola, quisiera consultar por un paseo de perro. El porte es [pequeño/mediano/grande] y serían [cantidad] perro(s).",
  },
  {
    name: "Hospedaje de mascotas",
    description: "Hospedaje por noche. Consulta disponibilidad y precio.",
    icon: House,
    message: "Hola, quisiera consultar por el hospedaje de mascotas.",
  },
];

export const metadata: Metadata = {
  title: "Servicios para mascotas",
  description:
    "Conoce Cat-Sister, hospedaje de mascotas y paseo de mascotas. Consulta disponibilidad y precios por WhatsApp.",
  keywords: [
    "servicios para mascotas",
    "Cat-Sister",
    "hospedaje de mascotas",
    "paseo de mascotas",
    "cuidado de mascotas",
    "Dicen Arte",
  ],
  openGraph: {
    title: "Dicen Arte | Arte Personalizado y servicios para mascotas",
    description:
      "Servicios para mascotas: Cat-Sister, hospedaje de mascotas y paseo de mascotas. Atención en Providencia, Ñuñoa, Santiago Centro, Macul y La Florida.",
  },
  twitter: {
    title: "Dicen Arte | Arte Personalizado y servicios para mascotas",
    description:
      "Servicios para mascotas: Cat-Sister, hospedaje de mascotas y paseo de mascotas.",
  },
};

export default function ServiciosPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8 border-b border-base-gray-200 pb-6">
        <h1 className="font-display text-3xl text-base-black">Servicios para mascotas</h1>
      </header>

      <section className="mb-8 border border-base-gray-300 bg-base-gray-50 p-5" role="note" aria-labelledby="care-notice-title">
        <div className="flex items-start gap-3">
          <Info size={20} className="mt-0.5 shrink-0 text-base-gray-700" aria-hidden="true" />
          <div>
            <h2 id="care-notice-title" className="font-semibold text-base-black">
              Aviso importante antes de entregar a tu mascota
            </h2>
            <p className="mt-2 text-sm leading-6 text-base-gray-700">
              Antes de confirmar un servicio, informa por escrito la salud, conducta, alimentación,
              medicamentos y necesidades de tu mascota. También se acordarán las instrucciones de
              cuidado y el procedimiento ante una urgencia. La cuidadora debe tratarla con cuidado y
              cumplir sus deberes legales; estas condiciones no eliminan la responsabilidad que
              corresponda a ninguna de las partes.
            </p>
            <Link href="/legal#servicios-mascotas" className="mt-3 inline-block text-sm font-semibold underline underline-offset-4">
              Leer responsabilidades y condiciones completas
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <article key={service.name} className="flex flex-col border border-base-gray-200 bg-base-white p-5">
              <Icon size={24} strokeWidth={1.5} aria-hidden="true" />
              <h2 className="mt-4 font-display text-2xl text-base-black">{service.name}</h2>
              <p className="mt-2 min-h-12 text-sm text-base-gray-600">{service.description}</p>
              <p className="mt-4 text-sm font-semibold text-base-black">Consultar precio</p>
              <a
                href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(service.message)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-base-black underline underline-offset-4 hover:text-base-gray-600"
              >
                <MessageCircle size={16} aria-hidden="true" />
                Consultar por WhatsApp
              </a>
            </article>
          );
        })}
      </div>

      <section className="mt-10 border-t border-base-gray-200 pt-6" aria-labelledby="service-area-title">
        <h2 id="service-area-title" className="font-display text-2xl text-base-black">
          Comunas de atención
        </h2>
        <p className="mt-2 text-sm leading-6 text-base-gray-700">
          Providencia, Ñuñoa, Santiago Centro, Macul y La Florida. La disponibilidad y cualquier
          costo de traslado se confirman antes de reservar.
        </p>
      </section>
    </div>
  );
}