"use client";

import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2, AlertTriangle, Clock, Users, Shield, Thermometer, Download } from "lucide-react";

export default function GuiaEmailsPage() {
  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back link */}
      <div className="flex items-center justify-between mb-6" data-print-hidden="true">
        <Link
          href="/documentos"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Documentos
        </Link>
        <button
          onClick={handleDownloadPDF}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#BB292A] text-white text-sm font-medium rounded-md hover:bg-[#a02324] transition-colors"
        >
          <Download className="w-4 h-4" />
          Descargar PDF
        </button>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-[#BB292A] to-[#8B1E1F] rounded-lg p-6 text-white mb-8 print:bg-[#BB292A] print:rounded-none">
        <div className="flex items-center gap-3 mb-2">
          <Thermometer className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Guía de Calentamiento de Emails</h1>
        </div>
        <p className="text-white/80">
          Cómo evitar que los emails del CRM lleguen a spam
        </p>
      </div>

      {/* Status check */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-green-800">Configuración técnica completada</h3>
            <p className="text-sm text-green-700 mt-1">
              Amazon SES, SPF, DKIM y DMARC ya están configurados correctamente.
              El siguiente paso es &quot;calentar&quot; el dominio para ganar reputación.
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="space-y-8">
        {/* What is warming */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">¿Qué es el calentamiento de emails?</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Cuando un dominio es nuevo enviando correos, los proveedores (Gmail, Outlook, Yahoo, etc.)
            no confían en él y pueden enviar los emails directamente a spam.
          </p>
          <p className="text-gray-600">
            El &quot;calentamiento&quot; es el proceso de enviar emails gradualmente durante varias semanas
            para que los proveedores vean que:
          </p>
          <ul className="mt-3 space-y-2">
            <li className="flex items-center gap-2 text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Los destinatarios abren los emails
            </li>
            <li className="flex items-center gap-2 text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Los destinatarios responden
            </li>
            <li className="flex items-center gap-2 text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Nadie marca los emails como spam
            </li>
          </ul>
        </section>

        {/* Week by week plan */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Plan de Calentamiento (4 semanas)</h2>
          </div>

          <div className="space-y-4">
            {/* Week 1 */}
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <h3 className="font-medium text-gray-900">Semana 1 - Inicio suave</h3>
              <p className="text-sm text-gray-600 mt-1">
                <strong>Enviar: 10-20 emails/día</strong>
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• Solo a contactos conocidos (clientes actuales, colaboradores)</li>
                <li>• Pedir que respondan al email (aunque sea un &quot;OK&quot;)</li>
                <li>• Si llega a spam, pedir que lo marquen como &quot;No es spam&quot;</li>
              </ul>
            </div>

            {/* Week 2 */}
            <div className="border-l-4 border-green-500 pl-4 py-2">
              <h3 className="font-medium text-gray-900">Semana 2 - Aumentar gradualmente</h3>
              <p className="text-sm text-gray-600 mt-1">
                <strong>Enviar: 30-50 emails/día</strong>
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• Empezar a incluir algunos contactos nuevos</li>
                <li>• Mantener emails a conocidos para asegurar respuestas</li>
                <li>• Monitorear tasa de apertura en Amazon SES</li>
              </ul>
            </div>

            {/* Week 3 */}
            <div className="border-l-4 border-yellow-500 pl-4 py-2">
              <h3 className="font-medium text-gray-900">Semana 3 - Volumen medio</h3>
              <p className="text-sm text-gray-600 mt-1">
                <strong>Enviar: 75-100 emails/día</strong>
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• Mezclar contactos conocidos y nuevos</li>
                <li>• Variar el contenido de los emails</li>
                <li>• Asegurar que hay interacción (clics en enlaces)</li>
              </ul>
            </div>

            {/* Week 4+ */}
            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <h3 className="font-medium text-gray-900">Semana 4+ - Volumen normal</h3>
              <p className="text-sm text-gray-600 mt-1">
                <strong>Enviar: 150-200+ emails/día</strong>
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• Ir aumentando según necesidad</li>
                <li>• El dominio ya tiene reputación</li>
                <li>• Seguir monitoreando tasas de entrega</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Tips for recipients */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Pedir a los destinatarios</h2>
          </div>

          <p className="text-gray-600 mb-4">
            Durante las primeras semanas, es importante que los destinatarios hagan estas acciones:
          </p>

          <div className="grid gap-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#BB292A] text-white text-sm font-bold">1</span>
              <div>
                <p className="font-medium text-gray-900">Responder al email</p>
                <p className="text-sm text-gray-600">Aunque sea un simple &quot;Recibido&quot;. Las respuestas mejoran mucho la reputación.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#BB292A] text-white text-sm font-bold">2</span>
              <div>
                <p className="font-medium text-gray-900">Marcar como &quot;No es spam&quot;</p>
                <p className="text-sm text-gray-600">Si el email llega a spam, sacarlo de ahí y marcarlo como legítimo.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#BB292A] text-white text-sm font-bold">3</span>
              <div>
                <p className="font-medium text-gray-900">Añadir remitente a contactos</p>
                <p className="text-sm text-gray-600">Guardar noreply@cerecilla.com en su libreta de contactos.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#BB292A] text-white text-sm font-bold">4</span>
              <div>
                <p className="font-medium text-gray-900">Hacer clic en algún enlace</p>
                <p className="text-sm text-gray-600">Los clics en enlaces también suman puntos de reputación.</p>
              </div>
            </div>
          </div>
        </section>

        {/* What to avoid */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Qué evitar</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-2 text-gray-600">
              <span className="text-red-500 font-bold">✗</span>
              <span><strong>No enviar muchos emails de golpe</strong> - Empezar siempre gradualmente</span>
            </div>
            <div className="flex items-start gap-2 text-gray-600">
              <span className="text-red-500 font-bold">✗</span>
              <span><strong>No usar palabras spam</strong> en el asunto: GRATIS, URGENTE, OFERTA, !!!, €€€</span>
            </div>
            <div className="flex items-start gap-2 text-gray-600">
              <span className="text-red-500 font-bold">✗</span>
              <span><strong>No enviar solo imágenes</strong> - Los emails deben tener texto real</span>
            </div>
            <div className="flex items-start gap-2 text-gray-600">
              <span className="text-red-500 font-bold">✗</span>
              <span><strong>No enviar a direcciones inválidas</strong> - Limpiar la lista de contactos</span>
            </div>
            <div className="flex items-start gap-2 text-gray-600">
              <span className="text-red-500 font-bold">✗</span>
              <span><strong>No ignorar los bounces</strong> - Si un email rebota, eliminar ese contacto</span>
            </div>
          </div>
        </section>

        {/* Best practices */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Buenas prácticas permanentes</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-2 text-gray-600">
              <span className="text-green-500 font-bold">✓</span>
              <span>Usar un asunto claro y descriptivo (no engañoso)</span>
            </div>
            <div className="flex items-start gap-2 text-gray-600">
              <span className="text-green-500 font-bold">✓</span>
              <span>Incluir dirección física de la empresa en el pie del email</span>
            </div>
            <div className="flex items-start gap-2 text-gray-600">
              <span className="text-green-500 font-bold">✓</span>
              <span>Ofrecer opción de darse de baja (requerido por ley)</span>
            </div>
            <div className="flex items-start gap-2 text-gray-600">
              <span className="text-green-500 font-bold">✓</span>
              <span>Mantener un ratio texto/imágenes equilibrado</span>
            </div>
            <div className="flex items-start gap-2 text-gray-600">
              <span className="text-green-500 font-bold">✓</span>
              <span>Enviar contenido relevante y esperado por el destinatario</span>
            </div>
            <div className="flex items-start gap-2 text-gray-600">
              <span className="text-green-500 font-bold">✓</span>
              <span>Monitorear métricas en Amazon SES (bounces, complaints, delivery rate)</span>
            </div>
          </div>
        </section>

        {/* Summary box */}
        <div className="bg-[#BB292A]/5 border border-[#BB292A]/20 rounded-lg p-6">
          <h3 className="font-semibold text-[#BB292A] mb-3">Resumen rápido</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-900 mb-1">Semana 1:</p>
              <p className="text-gray-600">10-20 emails/día a conocidos</p>
            </div>
            <div>
              <p className="font-medium text-gray-900 mb-1">Semana 2:</p>
              <p className="text-gray-600">30-50 emails/día</p>
            </div>
            <div>
              <p className="font-medium text-gray-900 mb-1">Semana 3:</p>
              <p className="text-gray-600">75-100 emails/día</p>
            </div>
            <div>
              <p className="font-medium text-gray-900 mb-1">Semana 4+:</p>
              <p className="text-gray-600">150-200+ emails/día</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            <strong>Clave:</strong> Pedir a los destinatarios que respondan y marquen como &quot;no spam&quot; durante las primeras semanas.
          </p>
        </div>
      </div>
    </div>
  );
}
