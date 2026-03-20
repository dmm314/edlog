import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces, JetBrains_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const bodyFont = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

const displayFont = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});


export const metadata: Metadata = {
  title: "Edlog — Digital Curriculum Logbook",
  description:
    "Fill your curriculum logbook in under 60 seconds. Built for Cameroonian secondary schools.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Edlog",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#08111f",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable}`}
    >
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var root=document.documentElement;var t=localStorage.getItem('edlog-theme');var intensity=localStorage.getItem('edlog-dynamic-intensity')==='calm'?'calm':'vibrant';root.dataset.intensity=intensity;if(t==='dark'||t==='night'){root.classList.add('dark')}else if(t==='light'){root.classList.add('light')}else if(window.matchMedia('(prefers-color-scheme:dark)').matches){root.classList.add('dark')}else{root.classList.add('light')}}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <SessionProvider>
            <ToastProvider>{children}</ToastProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
