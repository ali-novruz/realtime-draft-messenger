"use client";

import { useEffect, useState, useCallback } from "react";
import { useSocket } from "../lib/socket";

// Simple debounce utility
function useDebounce(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export function useLiveDraft(conversationId: string, userId: string) {
    const socket = useSocket();
    const [draft, setDraft] = useState("");
    const [remoteDraft, setRemoteDraft] = useState<{ userId: string, text: string } | null>(null);
    const [isConsentEnabled, setIsConsentEnabled] = useState(false);

    // Send draft updates
    const debouncedDraft = useDebounce(draft, 100); // 100ms debounce

    useEffect(() => {
        if (!socket || !isConsentEnabled) return;

        // Simple seq generator based on timestamp
        const seq = Date.now();

        socket.emit("draft_update", {
            conversationId,
            text: debouncedDraft,
            seq
        });
    }, [debouncedDraft, socket, conversationId, isConsentEnabled]);

    // Listen for remote drafts
    useEffect(() => {
        if (!socket) return;

        socket.on("draft_update", (data: { senderId: string, text: string }) => {
            // Only show if different user
            if (data.senderId !== userId) {
                setRemoteDraft({ userId: data.senderId, text: data.text });
            }
        });

        socket.on("draft_clear", () => {
            setRemoteDraft(null);
        });

        socket.on("consent_update", (data: { userId: string, enabled: boolean }) => {
            // Handle consent logic (e.g. show notification)
            console.log("Consent updated:", data);
        });

        return () => {
            socket.off("draft_update");
            socket.off("draft_clear");
            socket.off("consent_update");
        };
    }, [socket, userId]);

    const toggleConsent = useCallback(() => {
        const newState = !isConsentEnabled;
        setIsConsentEnabled(newState);
        socket?.emit("consent_update", { conversationId, enabled: newState });
        if (!newState) setDraft(""); // Clear local when disabled
    }, [isConsentEnabled, socket, conversationId]);

    return {
        draft,
        setDraft,
        remoteDraft,
        isConsentEnabled,
        toggleConsent
    };
}
