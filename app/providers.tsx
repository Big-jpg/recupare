"use client";

import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "@/lib/stack";
import { Toaster } from "sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <StackProvider app={stackServerApp}>
            <StackTheme>
                {children}
                <Toaster richColors closeButton />
            </StackTheme>
        </StackProvider>
    );
}
