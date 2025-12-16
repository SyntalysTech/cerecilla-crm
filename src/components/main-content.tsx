"use client";

import { useSidebar } from "./sidebar-provider";

export function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed, isMobile } = useSidebar();

  return (
    <main
      className={`min-h-screen transition-all duration-300 ${
        isMobile ? "ml-0" : collapsed ? "ml-[72px]" : "ml-[280px]"
      }`}
    >
      <div className={`p-4 sm:p-6 md:p-8 ${isMobile ? "pt-16" : ""}`}>{children}</div>
    </main>
  );
}
