"use client";

import { SessionProvider } from "next-auth/react";
import { SocketProvider } from "@/lib/socket";
import { ThemeProvider } from "next-themes"

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <SocketProvider>
                    {children}
                </SocketProvider>
            </ThemeProvider>
        </SessionProvider>
    );
}
