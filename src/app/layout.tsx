import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GuestHub Hotel Service Panel",
  description: "Hotel operations dashboard built on raw SQL and PostgreSQL",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
