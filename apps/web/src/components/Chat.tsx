"use client"

import { useEffect, useState, useRef } from "react"
import { useSocket } from "@/lib/socket"
import { Send, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"

type Message = {
    id?: string
    content: string
    senderId: string
    createdAt?: Date
    sender?: { name?: string; email?: string }
}

type ChatProps = {
    userId: string
    token: string
    friendId?: string
}

export default function Chat({ userId, token, friendId }: ChatProps) {
    const socket = useSocket()
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [drafts, setDrafts] = useState<Record<string, string>>({})
    const [isLiveEnabled, setIsLiveEnabled] = useState(false) // Default OFF per plan
    const [isConnected, setIsConnected] = useState(false)
    const [conversationId, setConversationId] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const seqRef = useRef(0)

    // Store latest conversationId in ref for use in event listeners
    const conversationIdRef = useRef<string | null>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, drafts])

    // Generate a simple conversation ID from two user IDs (sorted for consistency)
    useEffect(() => {
        if (friendId && userId) {
            const ids = [userId, friendId].sort()
            const cid = `conv_${ids[0]}_${ids[1]}`
            setConversationId(cid)
            conversationIdRef.current = cid // Update ref
        }
    }, [userId, friendId])

    useEffect(() => {
        if (!socket) return

        const onConnect = () => {
            console.log("✅ Socket connected! (Chat Component)")
            setIsConnected(true)

            // Critical Fix: Re-join room on reconnection
            if (conversationIdRef.current) {
                console.log(`Re-joining room: ${conversationIdRef.current}`)
                socket.emit("join_room", conversationIdRef.current, (response: any) => {
                    if (response?.status === 'ok') {
                        console.log(`Successfully re-joined room: ${conversationIdRef.current}`)
                    } else {
                        console.error(`Failed to re-join room:`, response)
                    }
                })
            }
        }

        const onDisconnect = () => {
            console.log("❌ Socket disconnected")
            setIsConnected(false)
        }

        socket.on("connect", onConnect)
        socket.on("disconnect", onDisconnect)
        socket.on("connect_error", (err) => {
            console.error("Socket connection error:", err.message)
        })

        // Initial connection state check
        if (socket.connected) {
            onConnect()
        }

        // Listen for new messages
        socket.on("message_new", (msg: Message & { tempId?: string }) => {
            console.log("Received message:", msg)
            setMessages((prev) => {
                // If we have a tempId, replace the optimistic message
                if (msg.tempId) {
                    const exists = prev.some(m => m.id === msg.id)
                    if (exists) return prev // Duplicate check

                    // Replace temp message with real one
                    return prev.map(m => (m.id === msg.tempId ? msg : m))
                }
                // Otherwise just add it (incoming from others)
                return [...prev, msg]
            })
        })

        // Listen for draft updates
        socket.on("draft_update", (data: { senderId: string; text: string; conversationId: string }) => {
            if (data.senderId !== userId) {
                setDrafts((prev) => ({ ...prev, [data.senderId]: data.text }))
            }
        })

        // Listen for draft clear
        socket.on("draft_clear", (data: { userId: string; conversationId: string }) => {
            if (data.userId !== userId) {
                setDrafts((prev) => {
                    const newDrafts = { ...prev }
                    delete newDrafts[data.userId]
                    return newDrafts
                })
            }
        })

        // Listen for consent updates
        socket.on("consent_update", (data: { userId: string, conversationId: string, enabled: boolean }) => {
            // Can add toast or indicator if needed
            console.log(`User ${data.userId} toggled live mode: ${data.enabled}`)
        })

        return () => {
            socket.off("connect", onConnect)
            socket.off("disconnect", onDisconnect)
            socket.off("connect_error")
            socket.off("message_new")
            socket.off("draft_update")
            socket.off("draft_clear")
            socket.off("consent_update")
        }
    }, [socket, conversationId]) // Re-run if conversationId changes to ensure ref is fresh? No, Connect listener uses Ref. But we need to ensure listeners are bound.

    // Effect to join room when conversationId becomes available (initial load)
    useEffect(() => {
        if (socket?.connected && conversationId) {
            console.log(`Initial join request for: ${conversationId}`)
            socket.emit("join_room", conversationId, (response: any) => {
                if (response?.status === 'ok') console.log("Joined room verified")
            })
        }
    }, [socket, conversationId, isConnected]) // Joined when socket *connects* or ID changes

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value
        setInput(text)

        if (socket && isLiveEnabled && conversationId) {
            seqRef.current += 1
            socket.emit("draft_update", {
                conversationId,
                text,
                seq: seqRef.current
            })
        }
    }

    const sendMessage = (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!input.trim() || !socket || !conversationId) return

        const content = input
        const tempId = `temp_${Date.now()}`

        // Optimistic Update
        const optimisticMsg: Message = {
            id: tempId,
            content,
            senderId: userId,
            createdAt: new Date(),
            sender: { name: "Me (sending...)" }
        }

        setMessages(prev => [...prev, optimisticMsg])
        setInput("")

        socket.emit("send_message", {
            conversationId,
            content,
            tempId
        })

        seqRef.current = 0

        // Clear local draft display
        if (isLiveEnabled) {
            socket.emit("draft_update", { conversationId, text: "", seq: 0 })
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    const toggleLiveMode = () => {
        const newState = !isLiveEnabled
        setIsLiveEnabled(newState)
        if (socket && conversationId) {
            socket.emit("consent_update", { conversationId, enabled: newState })
            if (!newState) {
                // Clear draft immediately if disabled
                socket.emit("draft_update", { conversationId, text: "", seq: 0 })
            }
        }
    }

    if (!friendId) {
        return (
            <div className="w-full h-[500px] flex items-center justify-center text-slate-400">
                <p>Bir arkadaş seçin</p>
            </div>
        )
    }

    return (
        <div className="w-full max-w-2xl h-[500px] flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white flex items-center justify-between shadow-md z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                        <span className="font-bold text-sm">CM</span>
                    </div>
                    <div>
                        <h2 className="font-bold text-sm leading-tight">Live Chat</h2>
                        <div className="flex items-center gap-1.5">
                            <span className={cn("w-2 h-2 rounded-full", isConnected ? "bg-emerald-400 animate-pulse" : "bg-red-400")}></span>
                            <span className="text-xs text-white/80">{isConnected ? "Online" : "Connecting..."}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Status Text for User */}
                    <span className="text-[10px] bg-white/10 px-2 py-1 rounded-md">
                        {isLiveEnabled ? "Sending Drafts" : "Drafts Private"}
                    </span>

                    <button
                        onClick={toggleLiveMode}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all backdrop-blur-sm border text-xs font-medium",
                            isLiveEnabled
                                ? "bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-200/50 text-white"
                                : "bg-white/10 hover:bg-white/20 border-white/10 text-white/70"
                        )}
                        title={isLiveEnabled ? "Click to Disable Live Drafts" : "Click to Enable Live Drafts"}
                    >
                        {isLiveEnabled ? <Eye className="w-3.5 h-3.5 text-emerald-300" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{isLiveEnabled ? "ON" : "OFF"}</span>
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
                        <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center mb-3">
                            <Send className="w-8 h-8" />
                        </div>
                        <p className="text-sm">No messages yet. Start chatting!</p>
                    </div>
                )}

                {messages.map((msg, idx) => {
                    const isMe = msg.senderId === userId
                    const isOptimistic = msg.id?.startsWith('temp_')
                    return (
                        <div key={msg.id || idx} className={cn("flex flex-col max-w-[80%]", isMe ? "ml-auto items-end" : "items-start")}>
                            <div className={cn(
                                "px-4 py-2.5 shadow-sm text-sm relative group transition-all",
                                isMe
                                    ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-2xl rounded-br-none"
                                    : "bg-white text-slate-800 border border-slate-100 rounded-2xl rounded-bl-none",
                                isOptimistic && "opacity-70 saturate-50"
                            )}>
                                {msg.content}
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1 px-1 flex items-center gap-1">
                                {isMe ? "You" : msg.sender?.name || "User"}
                                {isOptimistic && <span className="italic">(sending...)</span>}
                            </span>
                        </div>
                    )
                })}

                {/* Live Drafts */}
                {Object.entries(drafts).map(([senderId, text]) => {
                    if (senderId === userId || !text) return null
                    return (
                        <div key={senderId} className="flex flex-col max-w-[80%] items-start animate-fade-in">
                            <div className="flex items-center gap-2 mb-1 pl-1">
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-[10px] font-medium text-emerald-600 uppercase tracking-wider">
                                    Typing...
                                </span>
                            </div>
                            <div className="px-4 py-2.5 bg-emerald-50 text-emerald-800 border-2 border-dashed border-emerald-200 rounded-2xl rounded-bl-none italic text-sm w-full relative overflow-hidden shadow-sm">
                                {text}
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
                <div className="relative">
                    <textarea
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder={isLiveEnabled ? "Type to start live drafting..." : "Type a message..."}
                        className={cn(
                            "w-full pl-4 pr-12 py-3 bg-slate-50 border rounded-xl resize-none text-sm focus:ring-2 outline-none transition-all max-h-32 min-h-[50px]",
                            isLiveEnabled
                                ? "border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20 bg-emerald-50/30"
                                : "border-slate-200 focus:border-cyan-500 focus:ring-cyan-500/20"
                        )}
                        rows={1}
                        disabled={!isConnected}
                    />

                    <button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || !isConnected}
                        className="absolute right-2 bottom-2 p-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex justify-between items-center mt-2 px-1">
                    <div className="flex items-center gap-2">
                        {isLiveEnabled && (
                            <span className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded-full">
                                <Eye className="w-3 h-3" />
                                <span>Visible to others</span>
                            </span>
                        )}
                        {!isLiveEnabled && (
                            <span className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                <EyeOff className="w-3 h-3" />
                                <span>Hidden draft</span>
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] text-slate-400">Press Enter to send</span>
                </div>
            </div>
        </div>
    )
}
