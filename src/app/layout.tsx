import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Asteria Club Esprit — Management Platform",
  description: "Internal operating system for Asteria Club Esprit: members, org structure, scheduling, Kanban tasks, and QR attendance.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-surface-alt text-ink antialiased flex flex-col">
        {children}
      </body>
    </html>
  );
}
