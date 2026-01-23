"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => {
    return useContext(SocketContext);
};

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "https://realtime-draft-messenger.onrender.com";

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === "loading" || !session?.user) return;

        // @ts-ignore
        const token = session.user.socketToken;
        // @ts-ignore
        const userId = session.user.id;

        // Disconnect existing socket if user/token changes
        if (socket) {
            socket.disconnect();
        }

        const socketIo = io(SOCKET_URL, {
            query: { userId },
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 10, // Increased attempts
            reconnectionDelay: 2000,
            autoConnect: true,
        });

        socketIo.on("connect", () => {
            console.log("✅ Socket connected! ID:", socketIo.id);
        });

        socketIo.on("connect_error", (error) => {
            console.error("❌ Socket connection error:", error.message);
        });

        setSocket(socketIo);

        return () => {
            // Only disconnect if component unmounts OR dependencies change relevantly
            // Ideally we persist socket across navs, but nextjs context handles this
            console.log("🧹 Cleaning up socket connection");
            socketIo.disconnect();
        };
    }, [session?.user?.id, status]); // Only re-run if ID changes, not just any session update

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
