import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Minimal",
  description: "A calm space for your day, nutrition, training and focus.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
