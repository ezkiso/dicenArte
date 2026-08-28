import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos, garantía y política de privacidad",
};

// RF-08: garantía legal y T&C visibles en una página propia (y enlazados
// desde el checkout). RNF-08: se explicita el uso restringido de datos.
export default function LegalPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 font-display text-3xl">Información legal</h1>

      <section className="mb-10">
        <h2 className="mb-2 font-display text-xl">Derecho a retracto</h2>
        <p className="text-base-gray-700">
          De acuerdo con la Ley N° 19.496 sobre Protección de los Derechos de los
          Consumidores, los productos <strong>personalizados o hechos por encargo</strong>{" "}
          no están sujetos al derecho a retracto de 10 días, dado que se confeccionan según
          las especificaciones entregadas por el comprador (nombre de la mascota, diseño,
          medidas, etc.).
        </p>
      </section>

      <section className="mb-10">
        <h2 className="mb-2 font-display text-xl">Garantía legal</h2>
        <p className="text-base-gray-700">
          Todos los productos cuentan con Garantía Legal de <strong>6 meses</strong> desde la
          fecha de entrega por defectos de fabricación, conforme a la normativa vigente. Para
          hacerla efectiva, contáctanos a{" "}
          <a href="mailto:info@dicenarte.cl" className="underline">
            info@dicenarte.cl
          </a>{" "}
          con tu número de orden.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="mb-2 font-display text-xl">Envíos</h2>
        <p className="text-base-gray-700">
          Los plazos y costos de envío se muestran en el checkout antes de confirmar el pago,
          y dependen de la comuna de despacho. El tiempo estimado de confección de productos
          personalizados es de 5 a 10 días hábiles antes del despacho.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="mb-2 font-display text-xl">Tratamiento de datos personales</h2>
        <p className="text-base-gray-700">
          Recopilamos tu nombre, correo, teléfono y dirección exclusivamente para gestionar tu
          compra, el despacho del pedido y la emisión de la boleta electrónica. No usamos ni
          compartimos tus datos con fines distintos, ni con terceros, sin tu autorización
          explícita adicional, en cumplimiento de la Ley N° 19.628 sobre Protección de la Vida
          Privada.
        </p>
      </section>

      <section>
        <h2 className="mb-2 font-display text-xl">Medios de pago</h2>
        <p className="text-base-gray-700">
          Los pagos se procesan a través de Webpay (Transbank). DicenArte no almacena, procesa
          ni tiene acceso a los números de tu tarjeta en ningún momento.
        </p>
      </section>
    </div>
  );
}
