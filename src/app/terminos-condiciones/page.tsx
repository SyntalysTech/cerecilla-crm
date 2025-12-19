import Link from "next/link";

export const metadata = {
  title: "Términos y Condiciones | Cerecilla",
  description: "Términos y condiciones de uso de los servicios de Cerecilla SL",
};

export default function TerminosCondicionesPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Términos y Condiciones</h1>

        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Información General</h2>
            <p>
              Los presentes Términos y Condiciones regulan el uso de los servicios ofrecidos por
              <strong> CERECILLA SL</strong>, con domicilio social en Calle Lope de Vega 10 Esc Izq 4º6ª,
              08005 Barcelona, y CIF [Número CIF].
            </p>
            <p className="mt-2">
              El acceso y uso de nuestros servicios implica la aceptación plena de estos términos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Servicios</h2>
            <p>
              CERECILLA SL ofrece servicios de intermediación y gestión en el sector energético,
              incluyendo pero no limitado a:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Asesoramiento en contratación de suministro eléctrico</li>
              <li>Asesoramiento en contratación de suministro de gas</li>
              <li>Gestión de cambios de titularidad</li>
              <li>Gestión de altas y bajas de suministro</li>
              <li>Optimización de tarifas energéticas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Obligaciones del Usuario</h2>
            <p>El usuario se compromete a:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Proporcionar información veraz y actualizada</li>
              <li>No utilizar los servicios con fines ilícitos o contrarios a estos términos</li>
              <li>Mantener la confidencialidad de sus credenciales de acceso</li>
              <li>Comunicar cualquier uso no autorizado de su cuenta</li>
              <li>Cumplir con la normativa aplicable</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Propiedad Intelectual</h2>
            <p>
              Todos los contenidos del sitio web y servicios de CERECILLA (textos, imágenes, logotipos,
              software, etc.) son propiedad de CERECILLA SL o de sus licenciantes y están protegidos
              por las leyes de propiedad intelectual e industrial.
            </p>
            <p className="mt-2">
              Queda prohibida la reproducción, distribución, comunicación pública o transformación
              de estos contenidos sin autorización expresa.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Limitación de Responsabilidad</h2>
            <p>
              CERECILLA SL no será responsable de:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Interrupciones en el servicio por causas ajenas a su control</li>
              <li>Daños derivados del uso incorrecto de los servicios</li>
              <li>Contenidos de terceros enlazados desde nuestros servicios</li>
              <li>Decisiones tomadas por las compañías suministradoras</li>
              <li>Errores en la información proporcionada por el usuario</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Protección de Datos</h2>
            <p>
              El tratamiento de datos personales se realizará conforme a nuestra{" "}
              <Link href="/politica-privacidad" className="text-[#BB292A] hover:underline">
                Política de Privacidad
              </Link>{" "}
              y la normativa de protección de datos aplicable (RGPD y LOPDGDD).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Comunicaciones Electrónicas</h2>
            <p>
              Al proporcionarnos su dirección de correo electrónico, acepta recibir comunicaciones
              relacionadas con nuestros servicios. Puede darse de baja de las comunicaciones comerciales
              en cualquier momento utilizando el enlace incluido en cada email o contactando con nosotros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Modificaciones</h2>
            <p>
              CERECILLA SL se reserva el derecho de modificar estos términos en cualquier momento.
              Las modificaciones entrarán en vigor desde su publicación. El uso continuado de los
              servicios implica la aceptación de los términos modificados.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Resolución de Conflictos</h2>
            <p>
              Para cualquier controversia derivada de estos términos, las partes se someten a los
              Juzgados y Tribunales de Barcelona, con renuncia expresa a cualquier otro fuero que
              pudiera corresponderles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Contacto</h2>
            <p>
              Para cualquier consulta relacionada con estos términos, puede contactarnos en:
            </p>
            <p className="mt-2">
              <strong>Email:</strong> info@cerecilla.com<br />
              <strong>Dirección:</strong> Calle Lope de Vega 10 Esc Izq 4º6ª, 08005 Barcelona
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
          <Link href="/politica-privacidad" className="hover:text-[#BB292A]">Política de Privacidad</Link>
          <span>|</span>
          <Link href="/" className="hover:text-[#BB292A]">Volver al inicio</Link>
        </div>
      </main>
    </div>
  );
}
