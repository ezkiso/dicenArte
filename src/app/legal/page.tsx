import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos, garantía y política de privacidad",
  alternates: { canonical: "/legal" },
  robots: { index: true, follow: true },
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
          compra y el despacho del pedido. El recibo generado por la página es el respaldo de
          la venta. No usamos ni
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

      <section id="servicios-mascotas" className="mt-10 scroll-mt-24 border-t border-base-gray-200 pt-8">
        <h2 className="mb-3 font-display text-2xl">Condiciones para servicios de cuidado de mascotas</h2>
        <p className="mb-6 text-sm leading-6 text-base-gray-700">
          Estas condiciones aplican al cuidado a domicilio, paseos y hospedaje que se acuerden
          previamente. Antes de iniciar, las partes deben dejar por escrito el servicio, fechas,
          precio, instrucciones de cuidado y contactos para emergencias. Este resumen no sustituye
          asesoría legal ni limita derechos o responsabilidades establecidos por ley.
        </p>

        <h3 className="mb-2 font-semibold text-base-black">Responsabilidades de quien entrega a la mascota</h3>
        <ul className="mb-6 list-disc space-y-2 pl-5 text-sm leading-6 text-base-gray-700">
          <li>
            Entregar información veraz y completa sobre identificación, salud, alergias, conducta,
            temores, intentos de escape, mordeduras o incidentes previos, tratamientos y necesidades
            especiales. Informar si el perro tiene una calificación o medidas especiales de seguridad.
          </li>
          <li>
            Proporcionar instrucciones escritas de alimentación y medicamentos, sus dosis y horarios,
            junto con alimento, correa, arnés, transportadora u otros elementos necesarios para el
            servicio acordado.
          </li>
          <li>
            Facilitar un teléfono de emergencia, datos de una clínica veterinaria y una persona
            alternativa de contacto. Acordar antes del servicio cómo actuar y financiar una atención
            veterinaria urgente.
          </li>
          <li>
            Cumplir las obligaciones de tenencia responsable que le corresponden, incluidas las
            medidas necesarias para evitar que el animal cause daños, sin perjuicio de la evaluación
            legal de cada caso.
          </li>
          <li>
            Entregar y retirar al animal en los horarios y condiciones previamente acordados, y avisar
            oportunamente cualquier cambio relevante.
          </li>
        </ul>

        <h3 className="mb-2 font-semibold text-base-black">Responsabilidades de la cuidadora</h3>
        <ul className="mb-6 list-disc space-y-2 pl-5 text-sm leading-6 text-base-gray-700">
          <li>
            Tratar al animal con respeto, proporcionarle cuidado, agua, alimento, descanso y resguardo
            adecuados a las instrucciones y necesidades informadas, evitando maltrato y sufrimientos
            innecesarios.
          </li>
          <li>
            Mantener una supervisión y un entorno razonablemente seguros durante el período acordado,
            adoptar medidas para prevenir escapes y daños, y no entregar el cuidado a otra persona sin
            autorización.
          </li>
          <li>
            Seguir las instrucciones acordadas y administrar solo medicamentos previamente informados
            y autorizados, dentro de sus capacidades. El servicio no reemplaza evaluación ni atención
            veterinaria.
          </li>
          <li>
            Avisar prontamente al responsable ante enfermedad, lesión, escape u otro incidente; ante
            una urgencia, contactar a los teléfonos y clínica acordados y adoptar medidas razonables
            para proteger al animal, dejando constancia de lo ocurrido.
          </li>
          <li>
            En los paseos, utilizar los elementos de sujeción acordados y respetar las medidas de
            seguridad que correspondan al animal y a la normativa aplicable.
          </li>
        </ul>

        <h3 className="mb-2 font-semibold text-base-black">Responsabilidad y hospedaje</h3>
        <p className="mb-4 text-sm leading-6 text-base-gray-700">
          La Ley N° 21.020 establece deberes para las personas responsables de animales de compañía,
          y la Ley N° 20.380 exige cuidado y trato adecuado a quienes tengan un animal. La aceptación
          de estas condiciones no libera a la cuidadora ni al dueño de las responsabilidades que les
          correspondan conforme a la ley; estas se determinarán según las circunstancias de cada caso.
        </p>
        <p className="mb-4 text-sm leading-6 text-base-gray-700">
          El hospedaje puede quedar sujeto a los requisitos aplicables a centros de mantención temporal
          de animales. Antes de ofrecerlo, deben verificarse las autorizaciones, registros y condiciones
          exigibles para la modalidad y el lugar ante las autoridades competentes.
        </p>
        <p className="text-sm leading-6 text-base-gray-700">
          Fuentes oficiales: {" "}
          <a href="https://www.bcn.cl/leychile/navegar?idNorma=1106037" target="_blank" rel="noopener noreferrer" className="underline">
            Ley N° 21.020
          </a>{" "}
          y {" "}
          <a href="https://www.bcn.cl/leychile/navegar?idNorma=1006858" target="_blank" rel="noopener noreferrer" className="underline">
            Ley N° 20.380
          </a>
          . Este texto es informativo y debe ser revisado por un profesional legal antes de usarse como
          contrato de prestación de servicios.
        </p>
      </section>
    </div>
  );
}
