"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FileText, Edit, Trash2, MoreVertical, Eye, Copy } from "lucide-react";
import { deleteTemplate, duplicateTemplate } from "./actions";

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
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    }

    if (openMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openMenu]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Estás seguro de eliminar la plantilla "${name}"?`)) {
      return;
    }

    setDeleting(id);
    await deleteTemplate(id);
    setDeleting(null);
    setOpenMenu(null);
  }

  function handleEdit(id: string) {
    setOpenMenu(null);
    router.push(`/email-templates/${id}`);
  }

  function handlePreview(id: string) {
    setOpenMenu(null);
    router.push(`/email-templates/${id}/preview`);
  }

  async function handleDuplicate(id: string) {
    setDuplicating(id);
    const result = await duplicateTemplate(id);
    setDuplicating(null);
    setOpenMenu(null);
    if (result.error) {
      alert(`Error al duplicar: ${result.error}`);
    } else {
      router.refresh();
    }
  }

  return (
    <>
      {/* Mobile view - Cards */}
      <div className="md:hidden space-y-3">
        {templates.map((template) => (
          <div
            key={template.id}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-[#BB292A]/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-[#BB292A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{template.name}</h3>
                  <p className="text-sm text-gray-500 truncate">{template.subject}</p>
                </div>
              </div>

              <div className="relative" ref={openMenu === template.id ? menuRef : null}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenu(openMenu === template.id ? null : template.id);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <MoreVertical className="w-4 h-4 text-gray-500" />
                </button>

                {openMenu === template.id && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                    <button
                      type="button"
                      onClick={() => handlePreview(template.id)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                    >
                      <Eye className="w-4 h-4" />
                      Ver plantilla
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(template.id)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicate(template.id)}
                      disabled={duplicating === template.id}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 text-left"
                    >
                      <Copy className="w-4 h-4" />
                      {duplicating === template.id ? "Duplicando..." : "Duplicar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(template.id, template.name)}
                      disabled={deleting === template.id}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 text-left"
                    >
                      <Trash2 className="w-4 h-4" />
                      {deleting === template.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
              <span>Creada: {new Date(template.created_at).toLocaleDateString("es-ES")}</span>
              <span>Editada: {new Date(template.updated_at).toLocaleDateString("es-ES")}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop view - Table */}
      <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-visible">
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
                <td className="px-6 py-4 text-right">
                  <div className="relative inline-block" ref={openMenu === template.id ? menuRef : null}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenu(openMenu === template.id ? null : template.id);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>

                    {openMenu === template.id && (
                      <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                        <button
                          type="button"
                          onClick={() => handlePreview(template.id)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                        >
                          <Eye className="w-4 h-4" />
                          Ver plantilla
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(template.id)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                        >
                          <Edit className="w-4 h-4" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(template.id)}
                          disabled={duplicating === template.id}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 text-left"
                        >
                          <Copy className="w-4 h-4" />
                          {duplicating === template.id ? "Duplicando..." : "Duplicar"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(template.id, template.name)}
                          disabled={deleting === template.id}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 text-left"
                        >
                          <Trash2 className="w-4 h-4" />
                          {deleting === template.id ? "Eliminando..." : "Eliminar"}
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
