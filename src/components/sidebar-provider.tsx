"use client";

import { createContext, useContext, useState, useEffect } from "react";

interface SidebarContextType {
  collapsed: boolean;
}

const SidebarContext = createContext<SidebarContextType>({ collapsed: false });

export function useSidebar() {
  return useContext(SidebarContext);
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem("sidebar-collapsed");
      if (saved !== null) {
        setCollapsed(JSON.parse(saved));
      }
    };

    handleStorage();
    window.addEventListener("storage", handleStorage);

    // Also listen for custom events from sidebar toggle
    const handleToggle = () => {
      const saved = localStorage.getItem("sidebar-collapsed");
      if (saved !== null) {
        setCollapsed(JSON.parse(saved));
      }
    };

    // Check periodically for changes (simpler than custom events)
    const interval = setInterval(handleToggle, 100);

    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, []);

  return (
    <SidebarContext.Provider value={{ collapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}
