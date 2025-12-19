"use client";

import { useState } from "react";
import { User, Lock, Eye, EyeOff, Check, AlertCircle } from "lucide-react";
import { updatePassword, updateProfile } from "@/lib/auth/actions";

interface ProfileFormProps {
  initialName: string;
}

export function ProfileForm({ initialName }: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nameLoading, setNameLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [nameMessage, setNameMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNameLoading(true);
    setNameMessage(null);

    const result = await updateProfile(name);

    if (result.error) {
      setNameMessage({ type: "error", text: result.error });
    } else {
      setNameMessage({ type: "success", text: "Nombre actualizado correctamente" });
    }

    setNameLoading(false);
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Las contraseñas no coinciden" });
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "La contraseña debe tener al menos 6 caracteres" });
      setLoading(false);
      return;
    }

    const result = await updatePassword(newPassword);

    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Contraseña actualizada correctamente" });
      setNewPassword("");
      setConfirmPassword("");
    }

    setLoading(false);
  }

  return (
    <div className="space-y-6">
      {/* Update Name Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#87CEEB]/20 flex items-center justify-center">
            <User className="w-5 h-5 text-[#87CEEB]" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Nombre</h3>
            <p className="text-sm text-gray-500">Tu nombre visible en el sistema</p>
          </div>
        </div>

        <form onSubmit={handleNameSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BB292A]/20 focus:border-[#BB292A] outline-none"
              placeholder="Tu nombre"
            />
          </div>

          {nameMessage && (
            <div
              className={`flex items-center gap-2 text-sm ${
                nameMessage.type === "success" ? "text-green-600" : "text-red-600"
              }`}
            >
              {nameMessage.type === "success" ? (
                <Check className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {nameMessage.text}
            </div>
          )}

          <button
            type="submit"
            disabled={nameLoading || name === initialName}
            className="px-4 py-2 bg-[#BB292A] text-white rounded-lg hover:bg-[#9a2223] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {nameLoading ? "Guardando..." : "Guardar nombre"}
          </button>
        </form>
      </div>

      {/* Change Password Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#BB292A]/10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-[#BB292A]" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Cambiar contraseña</h3>
            <p className="text-sm text-gray-500">Actualiza tu contraseña de acceso</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BB292A]/20 focus:border-[#BB292A] outline-none"
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar nueva contraseña
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BB292A]/20 focus:border-[#BB292A] outline-none"
              placeholder="Repite la nueva contraseña"
            />
          </div>

          {message && (
            <div
              className={`flex items-center gap-2 text-sm ${
                message.type === "success" ? "text-green-600" : "text-red-600"
              }`}
            >
              {message.type === "success" ? (
                <Check className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !newPassword || !confirmPassword}
            className="px-4 py-2 bg-[#BB292A] text-white rounded-lg hover:bg-[#9a2223] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {loading ? "Actualizando..." : "Cambiar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}
