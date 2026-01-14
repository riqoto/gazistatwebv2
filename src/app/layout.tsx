import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gazistat Report Builder",
  description: "Low-code dashboard builder for Gazistat",
};

import { AuthProvider } from "@/contexts/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${roboto.variable} antialiased`}>
        <AuthProvider>
          <Theme accentColor="blue" radius="small" scaling="95%">
            {children}
          </Theme>
        </AuthProvider>
      </body>
    </html>
  );
}
