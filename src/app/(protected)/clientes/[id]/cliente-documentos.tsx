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
  allClienteIds?: string[]; // For uploading to multiple clients at once
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
  allClienteIds,
}: ClienteDocumentosProps) {
  // Use all client IDs if provided, otherwise just the current one
  const targetClienteIds = allClienteIds && allClienteIds.length > 1 ? allClienteIds : [clienteId];
  const [localDocumentos, setLocalDocumentos] = useState(documentos);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [descripcion, setDescripcion] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalDocumentos(documentos);
  }, [documentos]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) {
      const filesArray = Array.from(files);
      setSelectedFiles(filesArray);
      // Initialize file names with original names (without extension)
      setFileNames(filesArray.map(f => f.name.replace(/\.[^/.]+$/, "")));
      setShowModal(true);
    }
  }

  async function handleUpload() {
    // Validate that we have files and all have names
    if (selectedFiles.length === 0) return;
    const hasEmptyName = fileNames.some(name => !name.trim());
    if (hasEmptyName) {
      alert("Por favor, introduce un nombre para todos los documentos");
      return;
    }

    setUploading(true);

    const uploadedDocs: ClienteDocumento[] = [];
    let errorCount = 0;

    // Upload each file to all target clients
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const nombre = fileNames[i];

      // Upload to all target clients
      const uploadPromises = targetClienteIds.map(async (targetId) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("nombre", nombre.trim());
        formData.append("descripcion", descripcion.trim());
        return uploadClienteDocumento(targetId, formData);
      });

      const results = await Promise.all(uploadPromises);
      const currentResult = results[0]; // Result for the current client

      if (currentResult.success && currentResult.documento) {
        uploadedDocs.push(currentResult.documento as ClienteDocumento);
      } else {
        errorCount++;
      }
    }

    // Update local state with all uploaded docs
    if (uploadedDocs.length > 0) {
      setLocalDocumentos((prev) => [...uploadedDocs, ...prev]);
    }

    // Reset form
    setShowModal(false);
    setSelectedFiles([]);
    setFileNames([]);
    setDescripcion("");
    if (fileInputRef.current) fileInputRef.current.value = "";

    // Show result message
    if (errorCount > 0) {
      alert(`Se subieron ${uploadedDocs.length} documentos. ${errorCount} fallaron.`);
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

  // Solo admins pueden eliminar documentos
  const canDelete = () => isAdmin;

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
          <div>
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" />
              Documentos
            </h3>
            {targetClienteIds.length > 1 && (
              <p className="text-xs text-blue-600 mt-0.5">
                Se subirán a las {targetClienteIds.length} fichas creadas
              </p>
            )}
          </div>
          <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-[#BB292A] text-white text-sm font-medium rounded-md hover:bg-[#a02324] transition-colors">
            <Upload className="w-4 h-4" />
            Subir
            <input
              ref={fileInputRef}
              type="file"
              multiple
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
                      {canDelete() && (
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
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Subir {selectedFiles.length > 1 ? `${selectedFiles.length} documentos` : "documento"}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedFiles([]);
                  setFileNames([]);
                  setDescripcion("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Files list with individual name inputs */}
            <div className="space-y-3 mb-4">
              {selectedFiles.map((file, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center gap-3 mb-2">
                    <File className="w-6 h-6 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600 truncate">
                        {file.name} · {formatFileSize(file.size)}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const newFiles = selectedFiles.filter((_, i) => i !== index);
                        const newNames = fileNames.filter((_, i) => i !== index);
                        if (newFiles.length === 0) {
                          setShowModal(false);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }
                        setSelectedFiles(newFiles);
                        setFileNames(newNames);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500"
                      title="Quitar archivo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={fileNames[index] || ""}
                    onChange={(e) => {
                      const newNames = [...fileNames];
                      newNames[index] = e.target.value;
                      setFileNames(newNames);
                    }}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
                    placeholder="Nombre del documento *"
                  />
                </div>
              ))}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción general (opcional)
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
                placeholder="Añade una descripción para todos los documentos..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedFiles([]);
                  setFileNames([]);
                  setDescripcion("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || selectedFiles.length === 0 || fileNames.some(n => !n.trim())}
                className="px-4 py-2 bg-[#BB292A] text-white text-sm font-medium rounded-md hover:bg-[#a02324] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Subiendo {selectedFiles.length > 1 ? `${selectedFiles.length} archivos...` : "..."}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Subir {selectedFiles.length > 1 ? `${selectedFiles.length} archivos` : ""}
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
