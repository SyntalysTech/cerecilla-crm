"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  Eye,
  BookOpen,
  FileCheck,
  Plus,
  Upload,
  Trash2,
  Loader2,
  X,
  File,
  Users,
  Lock,
  Globe,
} from "lucide-react";
import { uploadDocumento, deleteDocumento } from "./actions";

interface Documento {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: string;
  archivo_url: string;
  archivo_nombre: string;
  created_at: string;
  isDefault?: boolean;
  visibilidad?: string;
}

const visibilidadLabels: Record<string, { label: string; icon: typeof Globe; color: string }> = {
  todos: { label: "Todos", icon: Globe, color: "text-green-600 bg-green-50" },
  operarios: { label: "Operarios", icon: Users, color: "text-blue-600 bg-blue-50" },
  solo_admins: { label: "Solo Admins", icon: Lock, color: "text-red-600 bg-red-50" },
};

interface DocumentosListProps {
  documentos: Documento[];
}

const tipoColors: Record<string, string> = {
  plantilla: "bg-blue-100 text-blue-700",
  guia: "bg-green-100 text-green-700",
  contrato: "bg-purple-100 text-purple-700",
  otro: "bg-gray-100 text-gray-700",
};

const tipoIcons: Record<string, typeof FileText> = {
  plantilla: FileCheck,
  guia: BookOpen,
  contrato: FileText,
  otro: File,
};

export function DocumentosList({ documentos }: DocumentosListProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploadForm, setUploadForm] = useState({
    nombre: "",
    descripcion: "",
    tipo: "otro",
    visibilidad: "todos",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    if (!selectedFile || !uploadForm.nombre) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("nombre", uploadForm.nombre);
    formData.append("descripcion", uploadForm.descripcion);
    formData.append("tipo", uploadForm.tipo);
    formData.append("visibilidad", uploadForm.visibilidad);

    const result = await uploadDocumento(formData);

    if (result.error) {
      alert(result.error);
    } else {
      setShowUploadModal(false);
      setUploadForm({ nombre: "", descripcion: "", tipo: "otro", visibilidad: "todos" });
      setSelectedFile(null);
      window.location.reload();
    }
    setUploading(false);
  }

  async function handleDelete(documentoId: string) {
    if (!confirm("¿Eliminar este documento?")) return;

    setDeleting(documentoId);
    const result = await deleteDocumento(documentoId);
    if (result.error) {
      alert(result.error);
    } else {
      window.location.reload();
    }
    setDeleting(null);
  }

  return (
    <div className="space-y-6">
      {/* Add document button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#BB292A] text-white rounded-md hover:bg-[#a02324] transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Añadir Documento
        </button>
      </div>

      {/* Documents grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documentos.map((doc) => {
          const IconComponent = tipoIcons[doc.tipo] || File;
          const visInfo = visibilidadLabels[doc.visibilidad || "todos"] || visibilidadLabels.todos;
          const VisIcon = visInfo.icon;
          return (
            <div
              key={doc.id}
              className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#BB292A]/10 flex items-center justify-center flex-shrink-0">
                  <IconComponent className="w-6 h-6 text-[#BB292A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-medium text-gray-900 truncate">
                      {doc.nombre}
                    </h3>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded ${
                        tipoColors[doc.tipo] || tipoColors.otro
                      }`}
                    >
                      {doc.tipo}
                    </span>
                    {!doc.isDefault && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded ${visInfo.color}`}>
                        <VisIcon className="w-3 h-3" />
                        {visInfo.label}
                      </span>
                    )}
                  </div>
                  {doc.descripcion && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                      {doc.descripcion}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <Link
                      href={doc.archivo_url}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#BB292A] bg-[#BB292A]/10 rounded-md hover:bg-[#BB292A]/20 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Ver
                    </Link>
                    <a
                      href={doc.archivo_url}
                      download={doc.archivo_nombre}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Descargar
                    </a>
                    {!doc.isDefault && (
                      <button
                        onClick={() => handleDelete(doc.id)}
                        disabled={deleting === doc.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        {deleting === doc.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Añadir Documento
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* File input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Archivo *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                      if (!uploadForm.nombre) {
                        setUploadForm((prev) => ({
                          ...prev,
                          nombre: file.name.replace(/\.[^/.]+$/, ""),
                        }));
                      }
                    }
                  }}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-[#BB292A] hover:bg-[#BB292A]/5 transition-colors"
                >
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2 text-[#BB292A]">
                      <FileText className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        {selectedFile.name}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-gray-500">
                      <Upload className="w-6 h-6" />
                      <span className="text-sm">Haz clic para seleccionar</span>
                    </div>
                  )}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={uploadForm.nombre}
                  onChange={(e) =>
                    setUploadForm((prev) => ({ ...prev, nombre: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
                  placeholder="Nombre del documento"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={uploadForm.descripcion}
                  onChange={(e) =>
                    setUploadForm((prev) => ({
                      ...prev,
                      descripcion: e.target.value,
                    }))
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
                  placeholder="Descripción opcional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={uploadForm.tipo}
                  onChange={(e) =>
                    setUploadForm((prev) => ({ ...prev, tipo: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
                >
                  <option value="plantilla">Plantilla</option>
                  <option value="guia">Guía</option>
                  <option value="contrato">Contrato</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visibilidad
                </label>
                <select
                  value={uploadForm.visibilidad}
                  onChange={(e) =>
                    setUploadForm((prev) => ({ ...prev, visibilidad: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#BB292A] focus:border-[#BB292A]"
                >
                  <option value="todos">Todos (visible para todos)</option>
                  <option value="operarios">Operarios (solo usuarios internos y operarios)</option>
                  <option value="solo_admins">Solo Admins (solo administradores)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Define quién puede ver este documento
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !selectedFile || !uploadForm.nombre}
                className="px-4 py-2 text-sm text-white bg-[#BB292A] rounded-md hover:bg-[#a02324] disabled:opacity-50 flex items-center gap-2"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {uploading ? "Subiendo..." : "Subir Documento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
