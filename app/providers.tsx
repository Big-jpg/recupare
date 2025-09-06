// app/providers.tsx
"use client";

import { StackProvider, StackTheme, StackClientApp } from "@stackframe/stack";
import { Toaster } from "sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
  const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID as string | undefined;
  if (!projectId && process.env.NODE_ENV !== "production") {
    throw new Error("NEXT_PUBLIC_STACK_PROJECT_ID is not set");
  }

  // Important: client needs a token store
  // Valid options (for this package line): "cookie" or "localStorage".
  const stackClientApp = new StackClientApp({
    projectId: projectId!,
    tokenStore: "cookie",
  });

  return (
    <StackProvider app={stackClientApp}>
      <StackTheme>
        {children}
        <Toaster richColors closeButton />
      </StackTheme>
    </StackProvider>
  );
}
