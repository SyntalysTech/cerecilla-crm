"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, FileText, Eye } from "lucide-react";
import { sendEmailAction } from "../actions";

interface Template {
  id: string;
  name: string;
  subject: string;
  html: string;
  text: string;
}

interface ComposeEmailFormProps {
  templates: Template[];
}

export function ComposeEmailForm({ templates }: ComposeEmailFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    to: "",
    cc: "",
    bcc: "",
    subject: "",
    html: "",
    text: "",
    templateId: "",
  });

  function handleTemplateChange(templateId: string) {
    if (!templateId) {
      setFormData(prev => ({ ...prev, templateId: "", subject: "", html: "", text: "" }));
      return;
    }

    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        templateId,
        subject: template.subject,
        html: template.html,
        text: template.text || "",
      }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await sendEmailAction({
      to: formData.to,
      cc: formData.cc || undefined,
      bcc: formData.bcc || undefined,
      subject: formData.subject,
      html: formData.html,
      text: formData.text || undefined,
      templateId: formData.templateId || undefined,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push("/emails");
      }, 1500);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
          Email enviado correctamente. Redirigiendo...
        </div>
      )}

      {/* Template selector */}
      {templates.length > 0 && (
        <div>
          <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-1">
            Usar plantilla (opcional)
          </label>
          <div className="flex gap-2">
            <select
              id="template"
              value={formData.templateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            >
              <option value="">Seleccionar plantilla...</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            {formData.templateId && (
              <button
                type="button"
                onClick={() => handleTemplateChange("")}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Recipients */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-3">
          <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-1">
            Para *
          </label>
          <input
            id="to"
            type="text"
            required
            value={formData.to}
            onChange={(e) => setFormData({ ...formData, to: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            placeholder="email@ejemplo.com, otro@ejemplo.com"
          />
          <p className="text-xs text-gray-500 mt-1">Separa múltiples direcciones con comas</p>
        </div>

        <div>
          <label htmlFor="cc" className="block text-sm font-medium text-gray-700 mb-1">
            CC
          </label>
          <input
            id="cc"
            type="text"
            value={formData.cc}
            onChange={(e) => setFormData({ ...formData, cc: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            placeholder="cc@ejemplo.com"
          />
        </div>

        <div>
          <label htmlFor="bcc" className="block text-sm font-medium text-gray-700 mb-1">
            CCO
          </label>
          <input
            id="bcc"
            type="text"
            value={formData.bcc}
            onChange={(e) => setFormData({ ...formData, bcc: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            placeholder="bcc@ejemplo.com"
          />
        </div>
      </div>

      {/* Subject */}
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
          Asunto *
        </label>
        <input
          id="subject"
          type="text"
          required
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
          placeholder="Asunto del email"
        />
      </div>

      {/* Content tabs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Contenido *
          </label>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1 text-sm text-[#BB292A] hover:underline"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? "Editar" : "Preview"}
          </button>
        </div>

        {showPreview ? (
          <div className="border border-gray-300 rounded-md p-4 min-h-[300px] bg-gray-50 overflow-auto">
            <div dangerouslySetInnerHTML={{ __html: formData.html }} />
          </div>
        ) : (
          <textarea
            required
            rows={12}
            value={formData.html}
            onChange={(e) => setFormData({ ...formData, html: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent font-mono text-sm"
            placeholder="<p>Contenido HTML del email...</p>"
          />
        )}
      </div>

      {/* Text version */}
      <div>
        <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-1">
          Versión texto plano (opcional)
        </label>
        <textarea
          id="text"
          rows={4}
          value={formData.text}
          onChange={(e) => setFormData({ ...formData, text: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent font-mono text-sm"
          placeholder="Versión sin formato para clientes que no soportan HTML..."
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || success}
          className="px-6 py-2 bg-[#BB292A] text-white text-sm font-medium rounded-md hover:bg-[#a02324] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Enviar email
            </>
          )}
        </button>
      </div>
    </form>
  );
}
