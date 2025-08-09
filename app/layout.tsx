import './globals.css';
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "../stack";
import { stackServerApp } from '@/lib/stack';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { StackProvider, StackTheme } from '@stackframe/stack'; 
import Navigation from '@/components/navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  // Basic metadata
  title: {
    default: 'Data Lineage Dashboard',
    template: '%s | Data Lineage Dashboard'
  },
  description: 'Explore your Microsoft Fabric Medallion Architecture with comprehensive data lineage visualization. Track Bronze, Silver, and Gold layer transformations with enterprise-grade insights.',

  // Keywords for SEO
  keywords: [
    'data lineage',
    'microsoft fabric',
    'medallion architecture',
    'bronze silver gold',
    'data transformation',
    'data governance',
    'data catalog',
    'data visualization',
    'enterprise data',
    'data pipeline',
    'data flow',
    'data mapping'
  ],

  // Author and creator information
  authors: [{ name: 'Data Engineering Team' }],
  creator: 'Data Engineering Team',
  publisher: 'Data Engineering Team',

  // Robots and indexing
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
    siteName: 'Data Lineage Dashboard',
    title: 'Data Lineage Dashboard - Microsoft Fabric Medallion Architecture',
    description: 'Comprehensive data lineage visualization for Bronze, Silver, and Gold layers. Track transformations, relationships, and data flow with enterprise-grade insights.',

    // OG Image configuration
    images: [
      {
        url: '/og-image-data-lineage.png', // The image we generated
        width: 1200,
        height: 630,
        alt: 'Data Lineage Dashboard - Microsoft Fabric Medallion Architecture visualization showing Bronze, Silver, and Gold data layers',
        type: 'image/png',
      },
      {
        url: '/og-image-data-lineage.png',
        width: 800,
        height: 600,
        alt: 'Data Lineage Dashboard - Comprehensive data transformation tracking',
        type: 'image/png',
      }
    ],
  },
  // App-specific metadata
  applicationName: 'Data Lineage Dashboard',
  referrer: 'origin-when-cross-origin',

  // Category for app stores
  category: 'productivity',

  other: {
    // Custom meta tags
    'theme-color': '#1e293b',
    'color-scheme': 'dark light',
    'format-detection': 'telephone=no',

    // PWA-related
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'Data Lineage',

    // Microsoft-specific
    'msapplication-TileColor': '#1e293b',
    'msapplication-config': '/browserconfig.xml',
  },

  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#1e293b' },
    ],
  },

  manifest: '/site.webmanifest',
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Additional meta tags that can't be set via Metadata API */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#1e293b" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />

        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* DNS prefetch for better performance */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />

        {/* Structured Data JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Data Lineage Dashboard",
              "description": "Comprehensive data lineage visualization for Microsoft Fabric Medallion Architecture",
              "url": "https://on-prem-to-cloud-data-lineage.vercel.app/",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web Browser",
              "creator": {
                "@type": "Organization",
                "name": "Data Engineering Team"
              },
              "featureList": [
                "Data lineage visualization",
                "Bronze, Silver, Gold layer tracking",
                "Transformation mapping",
                "Relationship analysis",
                "Data governance insights"
              ]
            })
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}><StackProvider app={stackServerApp}><StackTheme><StackProvider app={stackServerApp}><StackTheme>
        {/* Skip to main content for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
        >
          Skip to main content
        </a>

        {/* Navigation Header */}
        <Navigation />

        {/* Main content wrapper */}
        <div id="main-content" className="min-h-screen bg-background">
          {children}
        </div>

        <Analytics />
      </StackTheme></StackProvider></StackTheme></StackProvider></body>
    </html>
  )
}

