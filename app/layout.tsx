import type { Metadata } from "next";
import SessionProvider from "@/components/providers/SessionProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "BoxPratico Marketing",
  description: "Sistema de mídia indoor / digital signage",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <SessionProvider>
          <AuthProvider>
            <SettingsProvider>{children}</SettingsProvider>
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
