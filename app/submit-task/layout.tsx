// app/submit-task/layout.tsx
import { stackServerApp } from '@/lib/stack';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { StackProvider } from '@stackframe/stack';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Agentic Document Intelligence',
    template: '%s | Agentic Document Intelligence',
  },
  description:
    'Submit agentic AI jobs for document retrieval, parsing (OCR/table extraction), QA, translation, and export. Ingest PDFs, images, emails, and more.',
  keywords: [
    'agentic ai',
    'document intelligence',
    'document parsing',
    'ocr',
    'table extraction',
    'retrieval',
    'vector search',
    'translation',
    'workflow automation',
    'document processing',
  ],
  authors: [{ name: 'Product Engineering Team' }],
  creator: 'Product Engineering Team',
  publisher: 'Product Engineering Team',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://on-prem-to-cloud-data-lineage.vercel.app',
    siteName: 'Agentic Document Intelligence',
    title: 'Submit Agentic Document Tasks',
    description:
      'Create retrieval, parsing, translation, and export jobs with agentic AI workflows.',
    images: [
      {
        url: '/og-image-data-lineage.png', // swap when new asset is ready
        width: 1200,
        height: 630,
        alt: 'Agentic Document Intelligence — submit task',
        type: 'image/png',
      },
    ],
  },
  applicationName: 'Agentic Document Intelligence',
  referrer: 'origin-when-cross-origin',
  category: 'productivity',
  other: {
    'theme-color': '#1e293b',
    'color-scheme': 'dark light',
    'format-detection': 'telephone=no',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'Doc Intelligence',
    'msapplication-TileColor': '#1e293b',
    'msapplication-config': '/browserconfig.xml',
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    other: [{ rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#1e293b' }],
  },
  manifest: '/site.webmanifest',
};

// ✅ Async for auth
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 🔐 Protect the route
  await stackServerApp.getUser({ or: 'redirect' });

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
                "Submit agentic AI tasks for document retrieval (vector search), OCR/table extraction, schema mapping, translation, QA, and export.",
              url: "https://on-prem-to-cloud-data-lineage.vercel.app/submit-task",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web Browser",
              creator: {
                "@type": "Organization",
                name: "Product Engineering Team",
              },
              featureList: [
                "Vector search (RAG) across document stores",
                "OCR and table extraction from PDFs/images",
                "Schema-mapped field extraction and validation",
                "Multilingual translation with quality checks",
                "Agentic workflow orchestration and monitoring",
              ],
            }),
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <StackProvider app={stackServerApp}>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
          >
            Skip to main content
          </a>
          <div id="main-content" className="min-h-screen bg-background">
            {children}
          </div>
          <Analytics />
        </StackProvider>
      </body>
    </html>
  );
}
