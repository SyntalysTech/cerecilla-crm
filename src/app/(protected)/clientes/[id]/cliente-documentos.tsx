"use client";

import { useState, useRef, useEffect } from "react";
import {
  Upload,
  FileText,
  Trash2,
  Download,
  Loader2,
  File,
  Image,
  FileSpreadsheet,
  X,
} from "lucide-react";
import {
  uploadClienteDocumento,
  deleteClienteDocumento,
  type ClienteDocumento,
} from "./documentos-actions";

interface ClienteDocumentosProps {
  clienteId: string;
  documentos: ClienteDocumento[];
  isAdmin: boolean;
  currentUserEmail: string;
}

function getFileIcon(type: string | null) {
  if (!type) return File;
  if (type.startsWith("image/")) return Image;
  if (type.includes("spreadsheet") || type.includes("excel") || type.includes("csv"))
    return FileSpreadsheet;
  if (type.includes("pdf") || type.includes("word") || type.includes("document"))
    return FileText;
  return File;
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function ClienteDocumentos({
  clienteId,
  documentos,
  isAdmin,
  currentUserEmail,
}: ClienteDocumentosProps) {
  const [localDocumentos, setLocalDocumentos] = useState(documentos);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalDocumentos(documentos);
  }, [documentos]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!nombre) {
        setNombre(file.name.replace(/\.[^/.]+$/, ""));
      }
      setShowModal(true);
    }
  }

  async function handleUpload() {
    if (!selectedFile || !nombre.trim()) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("nombre", nombre.trim());
    formData.append("descripcion", descripcion.trim());

    const result = await uploadClienteDocumento(clienteId, formData);

    if (result.success && result.documento) {
      setLocalDocumentos((prev) => [result.documento as ClienteDocumento, ...prev]);
      setShowModal(false);
      setNombre("");
      setDescripcion("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      alert(result.error || "Error al subir documento");
    }
    setUploading(false);
  }

  async function handleDelete(docId: string) {
    if (!confirm("¿Estás seguro de que quieres eliminar este documento?")) return;

    const result = await deleteClienteDocumento(docId, clienteId);
    if (result.success) {
      setLocalDocumentos((prev) => prev.filter((d) => d.id !== docId));
    } else {
      alert(result.error || "Error al eliminar documento");
    }
  }

  const canDelete = (doc: ClienteDocumento) =>
    isAdmin || doc.uploaded_by_email === currentUserEmail;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-400" />
            Documentos
          </h3>
          <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-[#BB292A] text-white text-sm font-medium rounded-md hover:bg-[#a02324] transition-colors">
            <Upload className="w-4 h-4" />
            Subir
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp"
            />
          </label>
        </div>

        {/* Documents List */}
        <div className="max-h-80 overflow-y-auto">
          {localDocumentos.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              No hay documentos adjuntos
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {localDocumentos.map((doc) => {
                const FileIcon = getFileIcon(doc.archivo_type);
                return (
                  <div
                    key={doc.id}
                    className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <FileIcon className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {doc.nombre}
                      </p>
                      <p className="text-xs text-gray-500">
                        {doc.archivo_nombre}
                        {doc.archivo_size && ` · ${formatFileSize(doc.archivo_size)}`}
                      </p>
                      <p className="text-xs text-gray-400">
                        {doc.uploaded_by_email?.split("@")[0]} · {formatDate(doc.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <a
                        href={doc.archivo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-[#BB292A] hover:bg-gray-100 rounded-md"
                        title="Descargar"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      {canDelete(doc) && (
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Subir documento</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setNombre("");
                  setDescripcion("");
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedFile && (
              <div className="mb-4 p-3 bg-gray-50 rounded-md flex items-center gap-3">
                <File className="w-8 h-8 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del documento *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
                  placeholder="Ej: Contrato de luz"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
                  placeholder="Añade una descripción..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setNombre("");
                  setDescripcion("");
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !nombre.trim()}
                className="px-4 py-2 bg-[#BB292A] text-white text-sm font-medium rounded-md hover:bg-[#a02324] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Subir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
