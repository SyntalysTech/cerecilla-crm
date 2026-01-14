"use client";

import { useState } from "react";
import {
  FileText,
  Phone,
  User,
  Calendar,
  Eye,
  CheckCircle,
  Clock,
  Zap,
  Flame,
  Smartphone,
  Shield,
  Bell,
  HelpCircle,
  X,
  ExternalLink,
  Building2,
  Euro,
  Gauge,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { markFileReviewed, addFileNote, getFileData } from "./actions";

interface ReceivedFile {
  id: string;
  cliente_id: string | null;
  phone_number: string;
  sender_name: string | null;
  whatsapp_media_id: string;
  media_type: string;
  mime_type: string | null;
  ai_analysis: {
    tipo?: string;
    compania?: string;
    importe_total?: string;
    periodo?: string;
    consumo?: string;
    potencia_contratada?: string;
    tarifa?: string;
    nombre_titular?: string;
    direccion?: string;
    cups?: string;
    resumen?: string;
    puntos_ahorro?: string[];
  } | null;
  detected_tipo: string | null;
  detected_compania: string | null;
  detected_importe: string | null;
  detected_cups: string | null;
  status: string;
  created_at: string;
  analyzed_at: string | null;
  reviewed: boolean;
  reviewed_at: string | null;
  notes: string | null;
  cliente?: {
    id: string;
    nombre_apellidos: string | null;
    telefono: string | null;
  } | null;
}

interface ReceivedFilesClientProps {
  initialFiles: ReceivedFile[];
  error?: string;
}

function getTipoIcon(tipo: string | null) {
  switch (tipo) {
    case "luz":
      return <Zap className="w-5 h-5 text-yellow-500" />;
    case "gas":
      return <Flame className="w-5 h-5 text-orange-500" />;
    case "telefonia":
      return <Smartphone className="w-5 h-5 text-blue-500" />;
    case "seguro":
      return <Shield className="w-5 h-5 text-green-500" />;
    case "alarma":
      return <Bell className="w-5 h-5 text-red-500" />;
    default:
      return <HelpCircle className="w-5 h-5 text-gray-400" />;
  }
}

function getTipoLabel(tipo: string | null) {
  switch (tipo) {
    case "luz":
      return "Luz";
    case "gas":
      return "Gas";
    case "telefonia":
      return "Telefonía";
    case "seguro":
      return "Seguro";
    case "alarma":
      return "Alarma";
    case "otro":
      return "Otro";
    default:
      return "Desconocido";
  }
}

function getTipoBgColor(tipo: string | null) {
  switch (tipo) {
    case "luz":
      return "bg-yellow-100 text-yellow-800";
    case "gas":
      return "bg-orange-100 text-orange-800";
    case "telefonia":
      return "bg-blue-100 text-blue-800";
    case "seguro":
      return "bg-green-100 text-green-800";
    case "alarma":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function ReceivedFilesClient({ initialFiles, error }: ReceivedFilesClientProps) {
  const [files, setFiles] = useState(initialFiles);
  const [selectedFile, setSelectedFile] = useState<ReceivedFile | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "reviewed">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredFiles = files.filter((file) => {
    if (filter === "pending" && file.reviewed) return false;
    if (filter === "reviewed" && !file.reviewed) return false;
    if (typeFilter !== "all" && file.detected_tipo !== typeFilter) return false;
    return true;
  });

  const handleMarkReviewed = async (fileId: string) => {
    const result = await markFileReviewed(fileId);
    if (!result.error) {
      setFiles(
        files.map((f) =>
          f.id === fileId
            ? { ...f, reviewed: true, reviewed_at: new Date().toISOString() }
            : f
        )
      );
      if (selectedFile?.id === fileId) {
        setSelectedFile({ ...selectedFile, reviewed: true, reviewed_at: new Date().toISOString() });
      }
    }
  };

  const handleAddNote = async (fileId: string, note: string) => {
    const result = await addFileNote(fileId, note);
    if (!result.error) {
      setFiles(files.map((f) => (f.id === fileId ? { ...f, notes: note } : f)));
      if (selectedFile?.id === fileId) {
        setSelectedFile({ ...selectedFile, notes: note });
      }
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="text-sm text-gray-500 block mb-1">Estado</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as "all" | "pending" | "reviewed")}
              className="border rounded-md px-3 py-2 text-sm"
            >
              <option value="all">Todos</option>
              <option value="pending">Pendientes</option>
              <option value="reviewed">Revisados</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-500 block mb-1">Tipo</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm"
            >
              <option value="all">Todos</option>
              <option value="luz">Luz</option>
              <option value="gas">Gas</option>
              <option value="telefonia">Telefonía</option>
              <option value="seguro">Seguro</option>
              <option value="alarma">Alarma</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div className="flex items-end">
            <span className="text-sm text-gray-500">
              {filteredFiles.length} de {files.length} archivos
            </span>
          </div>
        </div>
      </div>

      {/* Files Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredFiles.map((file) => (
          <div
            key={file.id}
            className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border-l-4 ${
              file.reviewed ? "border-green-500" : "border-yellow-500"
            }`}
            onClick={() => setSelectedFile(file)}
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getTipoIcon(file.detected_tipo)}
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTipoBgColor(
                      file.detected_tipo
                    )}`}
                  >
                    {getTipoLabel(file.detected_tipo)}
                  </span>
                </div>
                {file.reviewed ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-500" />
                )}
              </div>

              {/* Sender info */}
              <div className="space-y-1 mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">
                    {file.sender_name || "Desconocido"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{file.phone_number}</span>
                </div>
              </div>

              {/* Analysis data */}
              {file.ai_analysis && (
                <div className="space-y-1 text-sm border-t pt-3">
                  {file.detected_compania && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span>{file.detected_compania}</span>
                    </div>
                  )}
                  {file.detected_importe && (
                    <div className="flex items-center gap-2">
                      <Euro className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-[#BB292A]">
                        {file.detected_importe}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Date */}
              <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>
                  {new Date(file.created_at).toLocaleString("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredFiles.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No hay facturas para mostrar</p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedFile && (
        <FileDetailModal
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
          onMarkReviewed={handleMarkReviewed}
          onAddNote={handleAddNote}
        />
      )}
    </div>
  );
}

function FileDetailModal({
  file,
  onClose,
  onMarkReviewed,
  onAddNote,
}: {
  file: ReceivedFile;
  onClose: () => void;
  onMarkReviewed: (id: string) => void;
  onAddNote: (id: string, note: string) => void;
}) {
  const [note, setNote] = useState(file.notes || "");
  const [saving, setSaving] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);

  const analysis = file.ai_analysis;

  const handleSaveNote = async () => {
    setSaving(true);
    await onAddNote(file.id, note);
    setSaving(false);
  };

  const handleViewFile = async () => {
    setLoadingFile(true);
    try {
      const result = await getFileData(file.id);
      if (result.success && result.fileData) {
        // Create a data URL and open in new tab or download
        const dataUrl = `data:${result.mimeType};base64,${result.fileData}`;

        if (result.mediaType === "image") {
          // Open image in new tab
          const win = window.open();
          if (win) {
            win.document.write(`<img src="${dataUrl}" style="max-width:100%; height:auto;" />`);
          }
        } else {
          // Download document
          const link = document.createElement("a");
          link.href = dataUrl;
          link.download = `factura_${file.detected_tipo || "documento"}_${new Date(file.created_at).toISOString().split("T")[0]}.${result.mimeType?.includes("pdf") ? "pdf" : "jpg"}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        alert("No se pudo cargar el archivo");
      }
    } catch (error) {
      console.error("Error loading file:", error);
      alert("Error al cargar el archivo");
    } finally {
      setLoadingFile(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getTipoIcon(file.detected_tipo)}
            <div>
              <h2 className="text-lg font-semibold">
                Factura de {getTipoLabel(file.detected_tipo)}
              </h2>
              <p className="text-sm text-gray-500">
                {file.sender_name || file.phone_number}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Contact info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                Remitente
              </label>
              <p className="font-medium">{file.sender_name || "—"}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                Teléfono
              </label>
              <p className="font-medium">{file.phone_number}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                Recibido
              </label>
              <p>
                {new Date(file.created_at).toLocaleString("es-ES", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                Cliente vinculado
              </label>
              {file.cliente ? (
                <Link
                  href={`/clientes/${file.cliente.id}`}
                  className="text-[#BB292A] hover:underline flex items-center gap-1"
                >
                  {file.cliente.nombre_apellidos || file.cliente.telefono}
                  <ExternalLink className="w-3 h-3" />
                </Link>
              ) : (
                <p className="text-gray-400">No vinculado</p>
              )}
            </div>
          </div>

          {/* View File Button */}
          <div className="flex justify-center">
            <button
              onClick={handleViewFile}
              disabled={loadingFile}
              className="flex items-center gap-2 px-6 py-3 bg-[#BB292A] text-white rounded-lg hover:bg-[#9a2122] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Eye className="w-5 h-5" />
              {loadingFile ? "Cargando..." : file.media_type === "image" ? "Ver Imagen" : "Descargar PDF"}
            </button>
          </div>

          {/* AI Analysis */}
          {analysis && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Análisis Automático
              </h3>

              {/* Summary */}
              {analysis.resumen && (
                <div className="bg-white rounded p-3">
                  <p className="text-sm">{analysis.resumen}</p>
                </div>
              )}

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {analysis.compania && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <div>
                      <span className="text-gray-500 text-xs">Compañía:</span>
                      <p className="font-medium">{analysis.compania}</p>
                    </div>
                  </div>
                )}
                {analysis.importe_total && (
                  <div className="flex items-center gap-2">
                    <Euro className="w-4 h-4 text-gray-400" />
                    <div>
                      <span className="text-gray-500 text-xs">Importe:</span>
                      <p className="font-medium text-[#BB292A]">
                        {analysis.importe_total}
                      </p>
                    </div>
                  </div>
                )}
                {analysis.consumo && (
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-gray-400" />
                    <div>
                      <span className="text-gray-500 text-xs">Consumo:</span>
                      <p className="font-medium">{analysis.consumo}</p>
                    </div>
                  </div>
                )}
                {analysis.potencia_contratada && (
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-gray-400" />
                    <div>
                      <span className="text-gray-500 text-xs">Potencia:</span>
                      <p className="font-medium">{analysis.potencia_contratada}</p>
                    </div>
                  </div>
                )}
                {analysis.periodo && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <span className="text-gray-500 text-xs">Período:</span>
                      <p className="font-medium">{analysis.periodo}</p>
                    </div>
                  </div>
                )}
                {analysis.tarifa && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <div>
                      <span className="text-gray-500 text-xs">Tarifa:</span>
                      <p className="font-medium">{analysis.tarifa}</p>
                    </div>
                  </div>
                )}
                {analysis.cups && (
                  <div className="col-span-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <span className="text-gray-500 text-xs">CUPS:</span>
                      <p className="font-medium font-mono text-xs">
                        {analysis.cups}
                      </p>
                    </div>
                  </div>
                )}
                {analysis.nombre_titular && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <span className="text-gray-500 text-xs">Titular:</span>
                      <p className="font-medium">{analysis.nombre_titular}</p>
                    </div>
                  </div>
                )}
                {analysis.direccion && (
                  <div className="col-span-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <span className="text-gray-500 text-xs">Dirección:</span>
                      <p className="font-medium">{analysis.direccion}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Savings tips */}
              {analysis.puntos_ahorro && analysis.puntos_ahorro.length > 0 && (
                <div className="bg-yellow-50 rounded p-3">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">
                    💡 Observaciones
                  </h4>
                  <ul className="space-y-1">
                    {analysis.puntos_ahorro.map((tip, i) => (
                      <li key={i} className="text-sm text-yellow-700">
                        • {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-sm font-medium block mb-2">
              Notas internas
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Añade notas sobre esta factura..."
              className="w-full border rounded-lg p-3 text-sm min-h-[100px]"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleSaveNote}
                disabled={saving}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar nota"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {file.reviewed ? (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                Revisado{" "}
                {file.reviewed_at &&
                  new Date(file.reviewed_at).toLocaleDateString("es-ES")}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-yellow-600">
                <Clock className="w-4 h-4" />
                Pendiente de revisión
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {!file.reviewed && (
              <button
                onClick={() => onMarkReviewed(file.id)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Marcar como revisado
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
