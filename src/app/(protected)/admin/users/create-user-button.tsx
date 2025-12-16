"use client";

import { useState } from "react";
import {
  Plus,
  X,
  Loader2,
  Mail,
  Lock,
  User,
  Phone,
  Building,
  FileText,
  Send,
  Key,
} from "lucide-react";
import { createUser } from "./actions";
import { UserRole, roleLabels } from "./constants";

export function CreateUserButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [authMethod, setAuthMethod] = useState<"magic_link" | "password">("magic_link");

  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    role: "agent" as UserRole,
    phone: "",
    department: "",
    notes: "",
    password: "",
    confirmPassword: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (authMethod === "password" && formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    if (authMethod === "password" && formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setLoading(false);
      return;
    }

    const result = await createUser({
      email: formData.email,
      full_name: formData.full_name,
      role: formData.role,
      phone: formData.phone || undefined,
      department: formData.department || undefined,
      notes: formData.notes || undefined,
      send_magic_link: authMethod === "magic_link",
      password: authMethod === "password" ? formData.password : undefined,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setFormData({
          email: "",
          full_name: "",
          role: "agent",
          phone: "",
          department: "",
          notes: "",
          password: "",
          confirmPassword: "",
        });
      }, 2000);
      setLoading(false);
    }
  }

  function handleClose() {
    setIsOpen(false);
    setError(null);
    setSuccess(false);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-[#BB292A] text-white text-sm font-medium rounded-md hover:bg-[#a02324] transition-colors"
      >
        <Plus className="w-4 h-4" />
        Crear usuario
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={handleClose}
          />

          {/* Modal content */}
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Crear nuevo usuario</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Añade un nuevo miembro al equipo
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Success message */}
            {success && (
              <div className="p-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium text-green-800">Usuario creado</h3>
                  <p className="text-sm text-green-600 mt-1">
                    {authMethod === "magic_link"
                      ? "Se ha enviado un email de invitación"
                      : "El usuario puede iniciar sesión con su contraseña"}
                  </p>
                </div>
              </div>
            )}

            {/* Form */}
            {!success && (
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                    {error}
                  </div>
                )}

                {/* Basic info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
                      placeholder="usuario@cerecilla.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <User className="w-4 h-4 inline mr-1" />
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
                      placeholder="Nombre Apellido"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
                      placeholder="+34 600 000 000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Building className="w-4 h-4 inline mr-1" />
                      Departamento
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="comercial">Comercial</option>
                      <option value="energia">Energía</option>
                      <option value="telefonia">Telefonía</option>
                      <option value="seguros">Seguros</option>
                      <option value="alarmas">Alarmas</option>
                      <option value="administracion">Administración</option>
                      <option value="direccion">Dirección</option>
                    </select>
                  </div>
                </div>

                {/* Role selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rol del usuario *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {(Object.keys(roleLabels) as UserRole[]).map((roleKey) => {
                      const { label, description, color } = roleLabels[roleKey];
                      return (
                        <button
                          key={roleKey}
                          type="button"
                          onClick={() => setFormData({ ...formData, role: roleKey })}
                          className={`p-3 border rounded-lg text-left transition-colors ${
                            formData.role === roleKey
                              ? "border-[#BB292A] bg-red-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${color}`}>
                            {label}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">{description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Auth method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de acceso *
                  </label>
                  <div className="flex gap-4">
                    <label
                      className={`flex-1 p-4 border rounded-lg cursor-pointer transition-colors ${
                        authMethod === "magic_link"
                          ? "border-[#BB292A] bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="authMethod"
                        value="magic_link"
                        checked={authMethod === "magic_link"}
                        onChange={() => setAuthMethod("magic_link")}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${authMethod === "magic_link" ? "bg-[#BB292A] text-white" : "bg-gray-100 text-gray-600"}`}>
                          <Send className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Enviar invitación</p>
                          <p className="text-xs text-gray-500">
                            El usuario recibirá un email para configurar su acceso
                          </p>
                        </div>
                      </div>
                    </label>
                    <label
                      className={`flex-1 p-4 border rounded-lg cursor-pointer transition-colors ${
                        authMethod === "password"
                          ? "border-[#BB292A] bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="authMethod"
                        value="password"
                        checked={authMethod === "password"}
                        onChange={() => setAuthMethod("password")}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${authMethod === "password" ? "bg-[#BB292A] text-white" : "bg-gray-100 text-gray-600"}`}>
                          <Key className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Contraseña manual</p>
                          <p className="text-xs text-gray-500">
                            Establece una contraseña directamente
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Password fields */}
                {authMethod === "password" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Lock className="w-4 h-4 inline mr-1" />
                        Contraseña *
                      </label>
                      <input
                        type="password"
                        required={authMethod === "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Lock className="w-4 h-4 inline mr-1" />
                        Confirmar contraseña *
                      </label>
                      <input
                        type="password"
                        required={authMethod === "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
                        placeholder="Repite la contraseña"
                      />
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Notas internas
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BB292A] focus:border-transparent"
                    placeholder="Notas sobre este usuario (solo visible para admins)..."
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-[#BB292A] text-white text-sm font-medium rounded-md hover:bg-[#a02324] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {authMethod === "magic_link" ? "Crear y enviar invitación" : "Crear usuario"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
