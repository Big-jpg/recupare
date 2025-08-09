// app/dashboard/layout.tsx
import { stackServerApp } from '@/lib/stack';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { StackProvider } from '@stackframe/stack';


const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Data Lineage Dashboard',
    template: '%s | Data Lineage Dashboard',
  },
  description:
    'Explore your Microsoft Fabric Medallion Architecture with comprehensive data lineage visualization. Track Bronze, Silver, and Gold layer transformations with enterprise-grade insights.',
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
    'data mapping',
  ],
  authors: [{ name: 'Data Engineering Team' }],
  creator: 'Data Engineering Team',
  publisher: 'Data Engineering Team',
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
    description:
      'Comprehensive data lineage visualization for Bronze, Silver, and Gold layers. Track transformations, relationships, and data flow with enterprise-grade insights.',
    images: [
      {
        url: '/og-image-data-lineage.png',
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
      },
    ],
  },
  applicationName: 'Data Lineage Dashboard',
  referrer: 'origin-when-cross-origin',
  category: 'productivity',
  other: {
    'theme-color': '#1e293b',
    'color-scheme': 'dark light',
    'format-detection': 'telephone=no',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'Data Lineage',
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

// ✅ This layout is now async to support auth check
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 🔐 Protect the route: redirect to sign-in if unauthenticated
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
              name: "Data Lineage Dashboard",
              description:
                "Comprehensive data lineage visualization for Microsoft Fabric Medallion Architecture",
              url: "https://on-prem-to-cloud-data-lineage.vercel.app/",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web Browser",
              creator: {
                "@type": "Organization",
                name: "Data Engineering Team",
              },
              featureList: [
                "Data lineage visualization",
                "Bronze, Silver, Gold layer tracking",
                "Transformation mapping",
                "Relationship analysis",
                "Data governance insights",
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
