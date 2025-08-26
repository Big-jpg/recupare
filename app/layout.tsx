// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { StackProvider } from '@stackframe/stack';
import { stackServerApp } from '@/lib/stack';
import './globals.css';

const inter = Inter({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: 'Recupare - Agentic Document Intelligence',
    template: '%s | Recupare',
  },
  description:
    'Agentic AI for document retrieval, parsing, translation, and processing. Enterprise-grade document intelligence with AI agents.',
  keywords: [
    'agentic ai',
    'document intelligence',
    'document processing',
    'ai agents',
    'enterprise',
    'automation',
    'translation',
    'parsing',
    'workflow',
  ],
  authors: [{ name: 'Ross Farrell' }],
  creator: 'Ross Farrell',
  publisher: 'Recupare',
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
    url: 'https://recupare.vercel.app/',
    siteName: 'Recupare - Agentic Document Intelligence',
    title: 'Agentic AI for Document Processing',
    description:
      'Enterprise-grade document intelligence with AI agents for retrieval, parsing, translation, and workflow automation.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Recupare - Agentic Document Intelligence',
      },
    ],
  },
  applicationName: 'Recupare',
  referrer: 'origin-when-cross-origin',
  category: 'productivity',
  other: {
    'theme-color': '#1e293b',
    'color-scheme': 'dark light',
    'format-detection': 'telephone=no',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'Recupare',
    'msapplication-TileColor': '#1e293b',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#1e293b" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
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

