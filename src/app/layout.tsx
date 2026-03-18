import type { Metadata, Viewport } from "next";
import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";


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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,100..900&family=DM+Sans:opsz,wght@9..40,100..1000&family=JetBrains+Mono:wght@100..800&display=swap" rel="stylesheet" />
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
