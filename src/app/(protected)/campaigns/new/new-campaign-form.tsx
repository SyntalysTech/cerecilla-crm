"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, Users, FileText, Eye, Filter } from "lucide-react";
import { createCampaign } from "../actions";

interface Template {
  id: string;
  name: string;
  subject: string;
  html: string;
}

interface NewCampaignFormProps {
  templates: Template[];
  totalClients: number;
}

export function NewCampaignForm({ templates, totalClients }: NewCampaignFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    templateId: "",
    subject: "",
    html: "",
    // Filter options
    filterByEstado: "",
    filterByServicio: "",
    filterByOperador: "",
  });

  function handleTemplateChange(templateId: string) {
    if (!templateId) {
      setFormData(prev => ({ ...prev, templateId: "", subject: "", html: "" }));
      return;
    }

    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        templateId,
        subject: template.subject,
        html: template.html,
      }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await createCampaign({
      name: formData.name,
      templateId: formData.templateId || undefined,
      subject: formData.subject,
      html: formData.html,
      filters: {
        estado: formData.filterByEstado || undefined,
        servicio: formData.filterByServicio || undefined,
        operador: formData.filterByOperador || undefined,
      },
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push(`/campaigns/${result.campaignId}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        {/* Campaign Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de la campaña *
          </label>
          <input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            placeholder="Ej: Newsletter Diciembre 2024"
          />
        </div>

        {/* Template Selector */}
        {templates.length > 0 && (
          <div>
            <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-1">
              <FileText className="w-4 h-4 inline mr-1" />
              Plantilla *
            </label>
            <select
              id="template"
              required
              value={formData.templateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            >
              <option value="">Seleccionar plantilla...</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Subject */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Asunto del email *
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

        {/* Preview */}
        {formData.html && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Vista previa
              </label>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-1 text-sm text-[#BB292A] hover:underline"
              >
                <Eye className="w-4 h-4" />
                {showPreview ? "Ocultar" : "Ver preview"}
              </button>
            </div>
            {showPreview && (
              <div className="border border-gray-300 rounded-md p-4 max-h-[400px] overflow-auto bg-gray-50">
                <div dangerouslySetInnerHTML={{ __html: formData.html }} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recipients Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Destinatarios</h3>
        </div>

        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
          <Users className="w-5 h-5 text-blue-600" />
          <p className="text-sm text-blue-700">
            <strong>{totalClients}</strong> clientes disponibles con email (sin contar los dados de baja)
          </p>
        </div>

        <p className="text-sm text-gray-500">
          Filtra los destinatarios para enviar a un grupo específico (opcional):
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="filterEstado" className="block text-xs font-medium text-gray-500 mb-1">
              Por estado
            </label>
            <select
              id="filterEstado"
              value={formData.filterByEstado}
              onChange={(e) => setFormData({ ...formData, filterByEstado: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            >
              <option value="">Todos los estados</option>
              <option value="LIQUIDADO">LIQUIDADO</option>
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="EN TRAMITE">EN TRAMITE</option>
              <option value="SEGUIMIENTO">SEGUIMIENTO</option>
              <option value="FALLIDO">FALLIDO</option>
            </select>
          </div>

          <div>
            <label htmlFor="filterServicio" className="block text-xs font-medium text-gray-500 mb-1">
              Por servicio
            </label>
            <select
              id="filterServicio"
              value={formData.filterByServicio}
              onChange={(e) => setFormData({ ...formData, filterByServicio: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
            >
              <option value="">Todos los servicios</option>
              <option value="Luz">Luz</option>
              <option value="Gas">Gas</option>
              <option value="Luz y Gas">Luz y Gas</option>
            </select>
          </div>

          <div>
            <label htmlFor="filterOperador" className="block text-xs font-medium text-gray-500 mb-1">
              Por operador
            </label>
            <input
              id="filterOperador"
              type="text"
              value={formData.filterByOperador}
              onChange={(e) => setFormData({ ...formData, filterByOperador: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
              placeholder="Nombre del operador..."
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || !formData.name || !formData.templateId || !formData.subject}
          className="px-6 py-2 bg-[#BB292A] text-white text-sm font-medium rounded-md hover:bg-[#a02324] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Crear y enviar campaña
            </>
          )}
        </button>
      </div>
    </form>
  );
}
