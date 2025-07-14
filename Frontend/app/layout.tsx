import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./Navbar";
import { WalletProvider } from "./components/WalletContext";

export const metadata: Metadata = {
  title: {
    default: "ZamnaSec - Blockchain Security and Invariant Management",
    template: "%s | ZamnaSec",
  },
  description: "Secure blockchain application for deploying and managing smart contract invariants. Professional invariant management with advanced security features.",
  keywords: ["blockchain", "smart contracts", "security", "invariants", "web3", "ethereum", "defi"],
  authors: [{ name: "ZamnaSec Team" }],
  creator: "ZamnaSec",
  publisher: "ZamnaSec",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://zamnasec.xyz'),
  openGraph: {
    title: "ZamnaSec - Blockchain Security Platform",
    description: "Professional blockchain security and invariant management platform",
    url: "/",
    siteName: "ZamnaSec",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "ZamnaSec Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZamnaSec - Blockchain Security Platform",
    description: "Professional blockchain security and invariant management platform",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes here
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="theme-color" content="#1d293b" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* Preconnect to improve performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-300 antialiased"
        suppressHydrationWarning
      >
        <WalletProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <footer className="text-center py-4 text-xs text-slate-500 border-t border-blue-100 bg-white/80">
              <p>&copy; {new Date().getFullYear()} ZamnaSec. All rights reserved.</p>
            </footer>
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
