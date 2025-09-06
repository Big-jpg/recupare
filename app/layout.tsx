// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Agentic Document Intelligence",
    template: "%s | Agentic Document Intelligence",
  },
  description:
    "Agentic AI for document retrieval, parsing, and translation. Ingest PDFs, images, and text; extract structured data; translate across languages; and orchestrate end-to-end workflows with AI agents.",
  keywords: [
    "agentic ai",
    "document intelligence",
    "document retrieval",
    "document parsing",
    "ocr",
    "pdf extraction",
    "translation",
    "rag",
    "chunking",
    "embeddings",
    "vector search",
    "workflow automation",
    "invoice processing",
    "azure content understanding",
  ],
  authors: [{ name: "Product Engineering Team" }],
  creator: "Product Engineering Team",
  publisher: "Product Engineering Team",
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
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://recupare-invoicepipe.vercel.app",
    siteName: "Agentic Document Intelligence",
    title: "Agentic AI for Retrieval, Parsing, and Translation",
    description:
      "Upload documents, extract fields, translate, and automate review with AI agents. Built for reliability and scale.",
    images: [
      {
        url: "/og-image-doc-intel.svg",
        width: 1200,
        height: 630,
        alt: "Agentic Document Intelligence",
        type: "image/svg+xml",
      },
    ],
  },
  applicationName: "Agentic Document Intelligence",
  referrer: "origin-when-cross-origin",
  category: "productivity",
  other: {
    "theme-color": "#1e293b",
    "color-scheme": "dark light",
    "format-detection": "telephone=no",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Doc Intelligence",
    "msapplication-TileColor": "#1e293b",
    "msapplication-config": "/browserconfig.xml",
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [{ rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#1e293b" }],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#1e293b" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Agentic Document Intelligence",
              description:
                "Agentic AI platform for document retrieval, parsing, OCR, invoice processing, and multilingual translation with end-to-end workflow automation.",
              url: "https://recupare-invoicepipe.vercel.app/",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web Browser",
              creator: { "@type": "Organization", name: "Product Engineering Team" },
              featureList: [
                "Document retrieval with vector search (RAG)",
                "OCR and table extraction from PDFs and images",
                "Invoice processing with Azure Content Understanding",
                "Schema-mapped field extraction",
                "Multilingual translation",
                "Agentic workflow orchestration and monitoring",
              ],
            }),
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
