"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Mail,
  FileText,
  User,
  LogOut,
  ChevronUp,
  Settings,
  Shield,
} from "lucide-react";
import { logout } from "@/lib/auth/actions";

interface SidebarProps {
  userEmail: string;
  userName?: string | null;
  userRole?: "user" | "admin" | "super_admin";
}

const navigation = [
  {
    category: "General",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    category: "Communication",
    items: [
      { name: "Emails", href: "/emails", icon: Mail },
      { name: "Email Templates", href: "/email-templates", icon: FileText },
    ],
  },
];

const adminNavigation = {
  category: "Administración",
  items: [
    { name: "Usuarios", href: "/admin/users", icon: Shield },
    { name: "Configuración", href: "/admin/settings", icon: Settings },
  ],
};

export function Sidebar({ userEmail, userName, userRole = "user" }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isAdmin = userRole === "admin" || userRole === "super_admin";

  // Build navigation based on role
  const fullNavigation = isAdmin
    ? [...navigation, adminNavigation]
    : navigation;

  // Restore collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setCollapsed(JSON.parse(saved));
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem("sidebar-collapsed", JSON.stringify(newState));
  };

  // Role badge
  const getRoleBadge = () => {
    if (userRole === "super_admin") {
      return (
        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-[#BB292A] text-white rounded">
          SUPER ADMIN
        </span>
      );
    }
    if (userRole === "admin") {
      return (
        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-[#87CEEB] text-gray-800 rounded">
          ADMIN
        </span>
      );
    }
    return null;
  };

  return (
    <>
      {/* Collapse button - outside sidebar */}
      <button
        onClick={toggleCollapsed}
        className={`fixed top-5 z-50 p-1.5 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 text-gray-500 transition-all duration-300 ${
          collapsed ? "left-[60px]" : "left-[268px]"
        }`}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>

      <aside
        className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-40 ${
          collapsed ? "w-[72px]" : "w-[280px]"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <Image
              src="/logos/logo-isotope-cerezas.png"
              alt="Cerecilla"
              width={32}
              height={32}
              className="flex-shrink-0"
            />
            {!collapsed && (
              <span className="font-semibold text-[#BB292A] whitespace-nowrap">
                CerecillaCRM
              </span>
            )}
          </Link>
        </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {fullNavigation.map((group) => (
          <div key={group.category} className="mb-6">
            {!collapsed && (
              <h3 className="px-3 mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                {group.category}
              </h3>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                        isActive
                          ? "bg-[#BB292A]/10 text-[#BB292A] font-medium"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      } ${collapsed ? "justify-center" : ""}`}
                      title={collapsed ? item.name : undefined}
                    >
                      <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-[#BB292A]" : ""}`} />
                      {!collapsed && <span>{item.name}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User profile */}
      <div className="border-t border-gray-200 p-3 relative">
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className={`w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-[#87CEEB] flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-gray-700" />
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 text-left overflow-hidden">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {userName || userEmail.split("@")[0]}
                  </p>
                  {getRoleBadge()}
                </div>
                <p className="text-xs text-gray-500 truncate">{userEmail}</p>
              </div>
              <ChevronUp
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  profileOpen ? "" : "rotate-180"
                }`}
              />
            </>
          )}
        </button>

        {/* Profile dropdown */}
        {profileOpen && (
          <div
            className={`absolute bottom-full mb-2 bg-white border border-gray-200 rounded-md shadow-lg py-1 ${
              collapsed ? "left-full ml-2 w-48" : "left-3 right-3"
            }`}
          >
            <Link
              href="/profile"
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => setProfileOpen(false)}
            >
              <User className="w-4 h-4" />
              Mi perfil
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </form>
          </div>
        )}
      </div>
    </aside>
    </>
  );
}
