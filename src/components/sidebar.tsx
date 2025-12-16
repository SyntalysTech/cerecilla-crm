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
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { logout, type UserRole } from "@/lib/auth/actions";
import { useSidebar } from "./sidebar-provider";

interface SidebarProps {
  userEmail: string;
  userName?: string | null;
  userRole?: UserRole;
}

const navigation = [
  {
    category: "General",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "CerecIA Chat", href: "/cerecia", icon: Sparkles },
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

export function Sidebar({ userEmail, userName, userRole = "viewer" }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { mobileOpen, setMobileOpen, isMobile } = useSidebar();

  const isAdmin = userRole === "admin" || userRole === "super_admin" || userRole === "manager";

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

  // Close mobile menu on navigation
  const handleNavClick = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
    setProfileOpen(false);
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

  // Determine if sidebar should be visible
  const sidebarVisible = isMobile ? mobileOpen : true;
  const sidebarWidth = isMobile ? "w-[280px]" : (collapsed ? "w-[72px]" : "w-[280px]");

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-gray-600 md:hidden"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop collapse button */}
      {!isMobile && (
        <button
          onClick={toggleCollapsed}
          className={`fixed top-5 z-50 p-1.5 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 text-gray-500 transition-all duration-300 hidden md:block ${
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
      )}

      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-50 ${sidebarWidth} ${
          isMobile
            ? mobileOpen
              ? "translate-x-0"
              : "-translate-x-full"
            : "translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden" onClick={handleNavClick}>
            <Image
              src="/logos/logo-isotope-cerezas.png"
              alt="Cerecilla"
              width={32}
              height={32}
              className="flex-shrink-0"
            />
            {(!collapsed || isMobile) && (
              <span className="font-semibold whitespace-nowrap">
                <span className="text-[#BB292A]">Cerecilla</span>
                <span className="text-gray-800">CRM</span>
              </span>
            )}
          </Link>

          {/* Mobile close button */}
          {isMobile && (
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {fullNavigation.map((group) => (
            <div key={group.category} className="mb-6">
              {(!collapsed || isMobile) && (
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
                        onClick={handleNavClick}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                          isActive
                            ? "bg-[#BB292A]/10 text-[#BB292A] font-medium"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        } ${collapsed && !isMobile ? "justify-center" : ""}`}
                        title={collapsed && !isMobile ? item.name : undefined}
                      >
                        <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-[#BB292A]" : ""}`} />
                        {(!collapsed || isMobile) && <span>{item.name}</span>}
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
              collapsed && !isMobile ? "justify-center" : ""
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-[#87CEEB] flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-gray-700" />
            </div>
            {(!collapsed || isMobile) && (
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
                collapsed && !isMobile ? "left-full ml-2 w-48" : "left-3 right-3"
              }`}
            >
              <Link
                href="/profile"
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={handleNavClick}
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
