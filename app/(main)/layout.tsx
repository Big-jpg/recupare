// app/(main)/layout.tsx
"use client";

import { Suspense } from "react";
import { StackProvider, StackTheme } from "@stackframe/stack";
import Navigation from "@/components/navigation";
import { stackServerApp } from "@/lib/stack";
import { Toaster } from "sonner";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    // This layout is client and WILL be wrapped by Next in a Suspense boundary.
    <StackProvider app={stackServerApp}>
      <StackTheme>
        {/* Skip link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
        >
          Skip to main content
        </a>

        <Navigation />

        <div id="main-content" className="min-h-screen bg-background">
          <Suspense fallback={null}>{children}</Suspense>
        </div>

        <Toaster />
      </StackTheme>
    </StackProvider>
  );
}
