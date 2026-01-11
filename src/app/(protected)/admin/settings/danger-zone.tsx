"use client";

import { useState } from "react";
import { Trash2, AlertTriangle, Loader2, Users, Building2 } from "lucide-react";
import { deleteAllClientes, deleteAllOperarios } from "./actions";

type DeleteType = "clientes" | "operarios" | null;

export function DangerZone() {
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [showConfirm, setShowConfirm] = useState<DeleteType>(null);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleDelete = async (type: DeleteType) => {
    if (confirmText !== "BORRAR TODO") {
      setResult({ type: "error", message: "Escribe 'BORRAR TODO' para confirmar" });
      return;
    }

    setDeleting(true);
    setResult(null);

    try {
      const res = type === "clientes" ? await deleteAllClientes() : await deleteAllOperarios();
      const label = type === "clientes" ? "clientes" : "operarios";
      if (res.error) {
        setResult({ type: "error", message: res.error });
      } else {
        setResult({ type: "success", message: `Se han eliminado ${res.count} ${label} correctamente` });
        setShowConfirm(null);
        setConfirmText("");
      }
    } catch {
      setResult({ type: "error", message: `Error al eliminar los ${type}` });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-red-200 overflow-hidden">
      <div className="p-6 border-b border-red-100 bg-red-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-medium text-red-900">Zona de Peligro</h3>
            <p className="text-sm text-red-700">Acciones destructivas e irreversibles</p>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-4">
        {/* Borrar todos los clientes */}
        <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50/50">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-red-500" />
            <div>
              <h4 className="font-medium text-gray-900">Borrar todos los clientes</h4>
              <p className="text-sm text-gray-600">
                Elimina permanentemente todos los clientes de la base de datos. Esta accion no se puede deshacer.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowConfirm(showConfirm === "clientes" ? null : "clientes")}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors flex items-center gap-2 flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            Borrar Clientes
          </button>
        </div>

        {/* Confirmacion clientes */}
        {showConfirm === "clientes" && (
          <div className="p-4 border border-red-300 rounded-lg bg-red-100">
            <p className="text-sm text-red-800 mb-3">
              <strong>Atencion:</strong> Esta accion eliminara TODOS los clientes de forma permanente.
              Escribe <code className="bg-red-200 px-1 rounded">BORRAR TODO</code> para confirmar:
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Escribe BORRAR TODO"
                className="flex-1 px-3 py-2 border border-red-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                onClick={() => handleDelete("clientes")}
                disabled={deleting || confirmText !== "BORRAR TODO"}
                className="px-4 py-2 bg-red-700 text-white text-sm font-medium rounded-md hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  "Confirmar"
                )}
              </button>
              <button
                onClick={() => {
                  setShowConfirm(null);
                  setConfirmText("");
                  setResult(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Borrar todos los operarios */}
        <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50/50">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-red-500" />
            <div>
              <h4 className="font-medium text-gray-900">Borrar todos los operarios</h4>
              <p className="text-sm text-gray-600">
                Elimina permanentemente todos los operarios de la base de datos. Esta accion no se puede deshacer.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowConfirm(showConfirm === "operarios" ? null : "operarios")}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors flex items-center gap-2 flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            Borrar Operarios
          </button>
        </div>

        {/* Confirmacion operarios */}
        {showConfirm === "operarios" && (
          <div className="p-4 border border-red-300 rounded-lg bg-red-100">
            <p className="text-sm text-red-800 mb-3">
              <strong>Atencion:</strong> Esta accion eliminara TODOS los operarios de forma permanente.
              Escribe <code className="bg-red-200 px-1 rounded">BORRAR TODO</code> para confirmar:
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Escribe BORRAR TODO"
                className="flex-1 px-3 py-2 border border-red-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                onClick={() => handleDelete("operarios")}
                disabled={deleting || confirmText !== "BORRAR TODO"}
                className="px-4 py-2 bg-red-700 text-white text-sm font-medium rounded-md hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  "Confirmar"
                )}
              </button>
              <button
                onClick={() => {
                  setShowConfirm(null);
                  setConfirmText("");
                  setResult(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Resultado */}
        {result && (
          <div
            className={`p-3 rounded-lg text-sm ${
              result.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {result.message}
          </div>
        )}
      </div>
    </div>
  );
}
