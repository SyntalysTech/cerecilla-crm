"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Edit, Trash2, MoreVertical } from "lucide-react";
import { deleteTemplate } from "./actions";

interface Template {
  id: string;
  name: string;
  subject: string;
  created_at: string;
  updated_at: string;
}

interface TemplatesListProps {
  templates: Template[];
}

export function TemplatesList({ templates }: TemplatesListProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Estás seguro de eliminar la plantilla "${name}"?`)) {
      return;
    }

    setDeleting(id);
    await deleteTemplate(id);
    setDeleting(null);
    setOpenMenu(null);
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
              Nombre
            </th>
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
              Asunto
            </th>
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
              Creada
            </th>
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
              Última edición
            </th>
            <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {templates.map((template) => (
            <tr key={template.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-[#BB292A]/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-[#BB292A]" />
                  </div>
                  <span className="font-medium text-gray-900">{template.name}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {template.subject}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {new Date(template.created_at).toLocaleDateString("es-ES")}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {new Date(template.updated_at).toLocaleDateString("es-ES")}
              </td>
              <td className="px-6 py-4 text-right relative">
                <button
                  onClick={() => setOpenMenu(openMenu === template.id ? null : template.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <MoreVertical className="w-4 h-4 text-gray-500" />
                </button>

                {openMenu === template.id && (
                  <div className="absolute right-6 top-full mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-10">
                    <Link
                      href={`/email-templates/${template.id}`}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setOpenMenu(null)}
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(template.id, template.name)}
                      disabled={deleting === template.id}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      {deleting === template.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
