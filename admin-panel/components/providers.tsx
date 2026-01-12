"use client";

import { SessionProvider } from "next-auth/react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ToastProvider } from "@/components/toast-provider";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <LanguageProvider>
            <SessionProvider>
                <ToastProvider>{children}</ToastProvider>
            </SessionProvider>
        </LanguageProvider>
    );
}
