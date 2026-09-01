import type { Metadata } from "next";
import { Archivo_Black, Space_Grotesk, Syne, IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";

const archivoBlack = Archivo_Black({ weight: "400", subsets: ["latin"], variable: "--font-archivo" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });
const syne = Syne({ weight: ["700", "800"], subsets: ["latin"], variable: "--font-syne" });
const ibmPlexSansThai = IBM_Plex_Sans_Thai({ 
  weight: ["400", "500", "600", "700"], 
  subsets: ["thai", "latin"], 
  variable: "--font-ibm-plex-thai" 
});

export const metadata: Metadata = {
  title: "SumStar OS",
  description: "Creative Studio Editorial AI OS",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={`${archivoBlack.variable} ${spaceGrotesk.variable} ${syne.variable} ${ibmPlexSansThai.variable} font-sans flex flex-col antialiased h-screen overflow-hidden bg-background text-foreground`}>
        <ThemeProvider>
          <Sidebar />
          <div className="flex-1 overflow-hidden flex flex-col pb-20 md:pb-0 md:pt-16 relative">
            {children}
          </div>
          {/* Desktop Footer (Status Bar) */}
          <footer className="hidden md:flex h-8 bg-black text-white items-center justify-between px-6 text-[10px] font-mono uppercase tracking-widest shrink-0 z-50">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> SYSTEM ONLINE</span>
              <span className="opacity-50">|</span>
              <span className="opacity-70">SUMSTAR OS v1.0</span>
            </div>
            <div className="flex items-center gap-4 opacity-70">
              <span>CREATIVE STUDIO EDITION</span>
              <span className="opacity-50">|</span>
              <span>© {new Date().getFullYear()}</span>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}

