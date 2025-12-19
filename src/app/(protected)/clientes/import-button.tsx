"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, Check, AlertCircle, X } from "lucide-react";

interface ImportButtonProps {
  type: "clientes" | "operarios";
}

interface ProgressState {
  current: number;
  total: number;
  imported: number;
  errors: number;
  status: "reading" | "importing" | "done" | "error";
  message?: string;
  lastError?: string;
}

export function ImportButton({ type }: ImportButtonProps) {
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setShowModal(false);
    setProgress(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setShowModal(true);
    setProgress({ current: 0, total: 0, imported: 0, errors: 0, status: "reading" });

    abortControllerRef.current = new AbortController();

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        setProgress({
          current: 0,
          total: 0,
          imported: 0,
          errors: 0,
          status: "error",
          message: data.error || "Error al importar",
        });
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No reader available");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              setProgress({
                current: parsed.current || 0,
                total: parsed.total || 0,
                imported: parsed.imported || 0,
                errors: parsed.errors || 0,
                status: parsed.status || "importing",
                message: parsed.message,
                lastError: parsed.lastError,
              });
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      // Auto close and refresh after success
      setTimeout(() => {
        setShowModal(false);
        setProgress(null);
        window.location.reload();
      }, 1500);
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        setProgress(null);
      } else {
        setProgress({
          current: 0,
          total: 0,
          imported: 0,
          errors: 0,
          status: "error",
          message: "Error de conexión",
        });
      }
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const progressPercent = progress?.total ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx,.xls"
        className="hidden"
      />
      <button
        onClick={handleClick}
        disabled={showModal}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#BB292A] text-white rounded-md hover:bg-[#a02324] transition-colors disabled:opacity-50"
      >
        <Upload className="w-4 h-4" />
        Importar Excel
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Importando {type === "clientes" ? "Clientes" : "Operarios"}
              </h3>
              {progress?.status !== "done" && progress?.status !== "reading" && (
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {progress?.status === "reading" && (
              <div className="flex items-center gap-3 py-4">
                <Loader2 className="w-6 h-6 animate-spin text-[#BB292A]" />
                <span className="text-gray-600">Leyendo archivo Excel...</span>
              </div>
            )}

            {progress?.status === "importing" && (
              <div className="space-y-4">
                {/* Progress bar */}
                <div className="relative">
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#BB292A] transition-all duration-300 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-white mix-blend-difference">
                      {progressPercent}%
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{progress.current}</div>
                    <div className="text-xs text-gray-500">de {progress.total}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{progress.imported}</div>
                    <div className="text-xs text-gray-500">importados</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{progress.errors}</div>
                    <div className="text-xs text-gray-500">errores</div>
                  </div>
                </div>

                <p className="text-sm text-gray-500 text-center">
                  No cierres esta ventana...
                </p>
              </div>
            )}

            {progress?.status === "done" && (
              <div className="text-center py-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${progress.imported > 0 ? "bg-green-100" : "bg-yellow-100"}`}>
                  {progress.imported > 0 ? (
                    <Check className="w-8 h-8 text-green-600" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-yellow-600" />
                  )}
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  {progress.imported > 0 ? "¡Importación completada!" : "Importación fallida"}
                </h4>
                <p className="text-gray-600">
                  {progress.imported} registros importados correctamente
                  {progress.errors > 0 && `, ${progress.errors} errores`}
                </p>
                {progress.lastError && (
                  <p className="text-sm text-red-600 mt-2 bg-red-50 p-2 rounded">
                    Error: {progress.lastError}
                  </p>
                )}
              </div>
            )}

            {progress?.status === "error" && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Error en la importación
                </h4>
                <p className="text-gray-600">{progress.message}</p>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setProgress(null);
                  }}
                  className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
