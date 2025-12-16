import { redirect } from "next/navigation";
import { getUserWithProfile } from "@/lib/auth/actions";
import { Sidebar } from "@/components/sidebar";
import { SidebarProvider } from "@/components/sidebar-provider";
import { MainContent } from "@/components/main-content";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserWithProfile();

  if (!user) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50">
        <Sidebar
          userEmail={user.email}
          userName={user.full_name}
          userRole={user.role}
        />
        <MainContent>{children}</MainContent>
      </div>
    </SidebarProvider>
  );
}
