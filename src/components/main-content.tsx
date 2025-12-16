"use client";

import { useSidebar } from "./sidebar-provider";

export function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <main
      className={`min-h-screen transition-all duration-300 ${
        collapsed ? "ml-[72px]" : "ml-[280px]"
      }`}
    >
      <div className="p-8">{children}</div>
    </main>
  );
}
