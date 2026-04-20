import Script from "next/script";
import "./globals.css";

export const metadata = {
  title: "Bargad Agent Field App",
  description: "Field agent tracking and verification system",
  manifest: "/manifest.json",
  appleWebAppCapable: "yes",
  appleWebAppStatusBarStyle: "black-translucent",
};

export const viewport = {
  themeColor: "#0c0c0c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Questrial&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link
          rel="stylesheet"
          href="https://apis.mappls.com/advancedmaps/api/c0ae557754e8913f692841c11b9d979c/map_sdk_css?v=3.0"
        />
      </head>
      <body suppressHydrationWarning>
        <Script
          src="https://apis.mappls.com/advancedmaps/api/c0ae557754e8913f692841c11b9d979c/map_sdk?v=3.0&layer=vector"
          strategy="afterInteractive"
        />
        <main>{children}</main>
      </body>
    </html>
  );
}
