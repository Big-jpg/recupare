// app/(main)/layout.tsx
"use client";

import { Suspense } from "react";
import Navigation from "@/components/navigation";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
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
    </>
  );
}
