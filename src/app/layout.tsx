import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CerecillaCRM",
  description: "CRM para Cerecilla SL",
  icons: {
    icon: "/logos/logo-isotope-cerezas.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
