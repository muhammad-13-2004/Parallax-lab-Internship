import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { CartProvider } from "@/lib/cart-provider";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { Toaster } from "sonner";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const APP_NAME = "Northline";

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "Northline is a catalog of considered goods — electronics, clothing, home, and more.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/__grok/icon-180.png" }],
  },
  manifest: "/__grok/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#161513",
};

const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem("northline-theme");
    var dark = stored === "dark" || (stored !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${fraunces.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh bg-background font-sans text-foreground">
        <PreviewHostBridge />
        <ThemeProvider>
          <CartProvider>
            <div className="flex min-h-dvh flex-col">
              <Header />
              {children}
              <Footer />
            </div>
            <Toaster
              position="bottom-right"
              richColors
              toastOptions={{
                className:
                  "bg-surface text-foreground shadow-border border-border",
              }}
            />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
