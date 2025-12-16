"use client";

import { createContext, useContext, useState, useEffect } from "react";

interface SidebarContextType {
  collapsed: boolean;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  isMobile: boolean;
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  mobileOpen: false,
  setMobileOpen: () => {},
  isMobile: false,
});

export function useSidebar() {
  return useContext(SidebarContext);
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    const handleStorage = () => {
      const saved = localStorage.getItem("sidebar-collapsed");
      if (saved !== null) {
        setCollapsed(JSON.parse(saved));
      }
    };

    handleStorage();
    window.addEventListener("storage", handleStorage);

    // Check periodically for changes
    const interval = setInterval(handleStorage, 100);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("resize", checkMobile);
      clearInterval(interval);
    };
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <SidebarContext.Provider value={{ collapsed, mobileOpen, setMobileOpen, isMobile }}>
      {children}
    </SidebarContext.Provider>
  );
}
