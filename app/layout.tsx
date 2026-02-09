import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Player } from "@/components/Player";
import { MobileNav } from "@/components/MobileNav";
import { ToastContainer } from "@/components/Toast";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "Kudo - Music Player",
  description: "Stream your favorite music with Kudo",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kudo",
  },
  icons: {
    icon: "/kudo-logo.png",
    apple: "/kudo-logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        <AuthProvider>
          <div style={{
            height: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            backgroundColor: '#000000',
          }}>
            {/* Main View - Spotify style with gaps */}
            <div style={{
              display: 'flex',
              flex: 1,
              gap: '8px',
              padding: '8px',
              overflow: 'hidden',
            }} className="main-view">
              {/* Sidebar - hidden on mobile */}
              <div className="hide-mobile">
                <Sidebar />
              </div>

              {/* Main content with rounded corners */}
              <main style={{
                flex: 1,
                backgroundColor: '#121212',
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  WebkitOverflowScrolling: 'touch',
                }}>
                  {children}
                </div>
              </main>
            </div>

            {/* Mobile Navigation */}
            <MobileNav />

            {/* Player */}
            <Player />

            {/* Toast Notifications */}
            <ToastContainer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
