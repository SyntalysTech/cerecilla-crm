import Link from "next/link";

export const metadata = {
  title: "Política de Privacidad | Cerecilla",
  description: "Política de privacidad de Cerecilla SL",
};

export default function PoliticaPrivacidadPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#BB292A] text-white py-4">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/" className="text-2xl font-bold hover:opacity-90">
            Cerecilla
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Política de Privacidad</h1>

        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Responsable del Tratamiento</h2>
            <p>
              <strong>CERECILLA SL</strong><br />
              CIF: [Número CIF]<br />
              Dirección: Calle Lope de Vega 10 Esc Izq 4º6ª, 08005 Barcelona<br />
              Email: lopd@cerecilla.com<br />
              Teléfono: [Número de teléfono]
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Finalidad del Tratamiento</h2>
            <p>
              Los datos personales que nos proporcione serán tratados con las siguientes finalidades:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Gestión de la relación comercial con nuestros clientes</li>
              <li>Prestación de servicios energéticos (luz y gas)</li>
              <li>Envío de comunicaciones comerciales sobre nuestros productos y servicios</li>
              <li>Gestión administrativa y contable</li>
              <li>Atención a consultas y solicitudes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Legitimación</h2>
            <p>
              El tratamiento de sus datos se realiza sobre las siguientes bases legales:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Ejecución de un contrato o relación precontractual</li>
              <li>Consentimiento del interesado</li>
              <li>Interés legítimo del responsable</li>
              <li>Cumplimiento de obligaciones legales</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Destinatarios</h2>
            <p>
              Sus datos no serán cedidos a terceros salvo obligación legal. Podrán tener acceso a sus datos:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Administraciones públicas competentes</li>
              <li>Proveedores de servicios necesarios para la prestación del servicio</li>
              <li>Entidades bancarias para la gestión de pagos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Conservación de Datos</h2>
            <p>
              Los datos se conservarán mientras exista un interés mutuo para mantener la finalidad del tratamiento.
              Una vez finalizada la relación, los datos se conservarán durante los plazos legalmente establecidos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Derechos del Interesado</h2>
            <p>
              Puede ejercer sus derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento
              y portabilidad dirigiéndose a:
            </p>
            <p className="mt-2">
              <strong>Email:</strong> lopd@cerecilla.com<br />
              <strong>Dirección:</strong> Calle Lope de Vega 10 Esc Izq 4º6ª, 08005 Barcelona
            </p>
            <p className="mt-2">
              Asimismo, tiene derecho a presentar una reclamación ante la Agencia Española de Protección de Datos
              (www.aepd.es).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Medidas de Seguridad</h2>
            <p>
              CERECILLA SL ha adoptado las medidas técnicas y organizativas necesarias para garantizar la seguridad
              de los datos personales y evitar su alteración, pérdida, tratamiento o acceso no autorizado.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Modificaciones</h2>
            <p>
              CERECILLA SL se reserva el derecho a modificar esta política de privacidad para adaptarla a
              novedades legislativas o jurisprudenciales. En caso de cambios significativos, se lo comunicaremos.
            </p>
          </section>

          <p className="text-sm text-gray-500 mt-8">
            Última actualización: {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Footer links */}
        <div className="mt-8 flex flex-wrap gap-4 text-sm text-gray-600">
          <Link href="/lopd" className="hover:text-[#BB292A]">LOPD</Link>
          <span>|</span>
          <Link href="/terminos-condiciones" className="hover:text-[#BB292A]">Términos y Condiciones</Link>
          <span>|</span>
          <Link href="/" className="hover:text-[#BB292A]">Volver al inicio</Link>
        </div>
      </main>
    </div>
  );
}
