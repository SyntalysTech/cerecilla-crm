import Link from "next/link";

export const metadata = {
  title: "LOPD - Protección de Datos | Cerecilla",
  description: "Información sobre protección de datos de Cerecilla SL conforme al RGPD",
};

export default function LOPDPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Información sobre Protección de Datos (LOPD/RGPD)</h1>

        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6 text-gray-700">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <p className="text-blue-800">
              De conformidad con lo dispuesto en el Reglamento (UE) 2016/679 de 27 de abril de 2016 (GDPR) y la
              Ley Orgánica 3/2018 de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD),
              le informamos sobre el tratamiento de sus datos personales.
            </p>
          </div>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Responsable del Tratamiento</h2>
            <table className="w-full border-collapse">
              <tbody>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-medium">Identidad:</td>
                  <td className="py-2">CERECILLA SL</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-medium">CIF:</td>
                  <td className="py-2">[Número CIF]</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-medium">Dirección:</td>
                  <td className="py-2">Calle Lope de Vega 10 Esc Izq 4º6ª, 08005 Barcelona</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-medium">Email:</td>
                  <td className="py-2">lopd@cerecilla.com</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">Delegado de Protección de Datos:</td>
                  <td className="py-2">lopd@cerecilla.com</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Finalidades del Tratamiento</h2>
            <p>Sus datos personales serán tratados para las siguientes finalidades:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Gestión comercial:</strong> Atención de consultas, presupuestos y contratación de servicios</li>
              <li><strong>Prestación de servicios:</strong> Gestión de contratos de suministro de luz y gas</li>
              <li><strong>Comunicaciones comerciales:</strong> Envío de información sobre productos, ofertas y promociones</li>
              <li><strong>Gestión administrativa:</strong> Facturación, contabilidad y obligaciones fiscales</li>
              <li><strong>Mejora del servicio:</strong> Análisis estadísticos y encuestas de satisfacción</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Base Jurídica del Tratamiento</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Ejecución de contrato:</strong> El tratamiento es necesario para la prestación del servicio contratado</li>
              <li><strong>Consentimiento:</strong> Para el envío de comunicaciones comerciales</li>
              <li><strong>Interés legítimo:</strong> Para la mejora de nuestros servicios y prevención del fraude</li>
              <li><strong>Obligación legal:</strong> Para el cumplimiento de obligaciones fiscales y mercantiles</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Categorías de Datos Tratados</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Datos identificativos (nombre, apellidos, DNI/NIE/CIF)</li>
              <li>Datos de contacto (dirección, teléfono, email)</li>
              <li>Datos bancarios (para la gestión de cobros y pagos)</li>
              <li>Datos de suministro (CUPS, consumos, potencias)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Plazo de Conservación</h2>
            <p>
              Los datos se conservarán durante el tiempo necesario para cumplir con la finalidad para la que se
              recabaron y para determinar las posibles responsabilidades que se pudieran derivar. Aplicaremos los
              plazos de prescripción establecidos legalmente:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Datos fiscales: 4 años</li>
              <li>Datos mercantiles: 6 años</li>
              <li>Datos de clientes tras fin de relación: según plazos de prescripción aplicables</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Derechos del Interesado</h2>
            <p>Puede ejercer los siguientes derechos:</p>
            <div className="grid md:grid-cols-2 gap-4 mt-3">
              <div className="bg-gray-50 p-3 rounded">
                <strong>Acceso:</strong> Conocer qué datos tratamos
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <strong>Rectificación:</strong> Corregir datos inexactos
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <strong>Supresión:</strong> Solicitar la eliminación de datos
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <strong>Oposición:</strong> Oponerse al tratamiento
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <strong>Limitación:</strong> Limitar el tratamiento
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <strong>Portabilidad:</strong> Recibir sus datos en formato estructurado
              </div>
            </div>
            <p className="mt-4">
              Para ejercer estos derechos, envíe su solicitud a <strong>lopd@cerecilla.com</strong> adjuntando
              copia de su documento de identidad.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Reclamaciones</h2>
            <p>
              Si considera que el tratamiento de sus datos no es adecuado, puede presentar una reclamación ante
              la <strong>Agencia Española de Protección de Datos</strong> (www.aepd.es).
            </p>
          </section>

          <div className="bg-gray-100 p-4 rounded-lg mt-6">
            <p className="text-sm text-gray-600 italic">
              La información contenida en cualquier mensaje y/o archivo(s) adjunto(s), enviada desde CERECILLA.COM,
              es confidencial/privilegiada y está destinada a ser leída sólo por la(s) persona(s) a la(s) que va dirigida.
              Si lo ha recibido por error, por favor conteste al remitente, y posteriormente proceda a borrarlo de su sistema.
            </p>
          </div>

          <p className="text-sm text-gray-500 mt-8">
            Última actualización: {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Footer links */}
        <div className="mt-8 flex flex-wrap gap-4 text-sm text-gray-600">
          <Link href="/politica-privacidad" className="hover:text-[#BB292A]">Política de Privacidad</Link>
          <span>|</span>
          <Link href="/terminos-condiciones" className="hover:text-[#BB292A]">Términos y Condiciones</Link>
          <span>|</span>
          <Link href="/" className="hover:text-[#BB292A]">Volver al inicio</Link>
        </div>
      </main>
    </div>
  );
}
