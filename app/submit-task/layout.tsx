// app/submit-task/layout.tsx
import { stackServerApp } from '@/lib/stack';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { StackProvider } from '@stackframe/stack';
import Navigation from '@/components/navigation/navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Submit Task | Recupare',
  description: 'Submit a new document processing task to our AI agents',
};

// This layout is async to support auth check
export default async function SubmitTaskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Protect the route: redirect to sign-in if unauthenticated
  await stackServerApp.getUser({ or: 'redirect' });

  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} antialiased`}>
        <StackProvider app={stackServerApp}>
          <div className="min-h-screen bg-background">
            <Navigation />
            <main className="flex-1">
              {children}
            </main>
          </div>
          <Analytics />
        </StackProvider>
      </body>
    </html>
  );
}
