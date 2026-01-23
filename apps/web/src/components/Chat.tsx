"use client"

import { useEffect, useState, useRef } from "react"
import { useSocket } from "@/lib/socket"
import { Send, Eye, EyeOff, Check, CheckCheck } from "lucide-react"
import { cn } from "@/lib/utils"

type Message = {
    id?: string
    content: string
    senderId: string
    createdAt?: Date
    sender?: { name?: string; email?: string }
    seenAt?: Date | string | null
}

type ChatProps = {
    userId: string
    token: string
    friendId?: string
    friendName?: string
}

export default function Chat({ userId, token, friendId, friendName }: ChatProps) {
    const socket = useSocket()
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [drafts, setDrafts] = useState<Record<string, string>>({})
    const [isLiveEnabled, setIsLiveEnabled] = useState(false) // Default OFF
    const [isConnected, setIsConnected] = useState(false)
    const [isFriendOnline, setIsFriendOnline] = useState(false)
    const [conversationId, setConversationId] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const seqRef = useRef(0)
    const conversationIdRef = useRef<string | null>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, drafts])

    // Generate Conversation ID
    useEffect(() => {
        if (friendId && userId) {
            const ids = [userId, friendId].sort()
            const cid = `conv_${ids[0]}_${ids[1]}`
            setConversationId(cid)
            conversationIdRef.current = cid
        }
    }, [userId, friendId])

    // Fetch messages & Mark as Seen on Load
    useEffect(() => {
        if (!conversationId) return

        const fetchMessages = async () => {
            try {
                const res = await fetch(`/api/messages?conversationId=${conversationId}`)
                if (res.ok) {
                    const data = await res.json()
                    if (data.messages) {
                        setMessages(data.messages)
                        // Mark as seen immediately if we have messages from others
                        if (socket && socket.connected) {
                            socket.emit("mark_seen", { conversationId })
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching messages:", error)
            }
        }

        fetchMessages()
    }, [conversationId, socket]) // Removed isConnected to avoid double-fetch loops, socket ref is stable enough

    // Socket Event Handlers & Room Management
    useEffect(() => {
        if (!socket || !conversationId) return

        const joinRoom = () => {
            console.log(`Joining room: ${conversationId}`)
            socket.emit("join_room", conversationId)
        }

        const onConnect = () => {
            console.log("✅ Socket connected! (Chat Component)")
            setIsConnected(true)
            joinRoom()
        }

        const onDisconnect = () => {
            console.log("❌ Socket disconnected")
            setIsConnected(false)
            setIsFriendOnline(false)
        }

        // Setup listeners
        socket.on("connect", onConnect)
        socket.on("disconnect", onDisconnect)

        // If already connected, join immediately
        if (socket.connected) {
            setIsConnected(true)
            joinRoom()
        }

        // Listen for new messages
        socket.on("message_new", (msg: Message & { tempId?: string }) => {
            console.log("📩 New message received:", msg) // Debug log
            setMessages((prev) => {
                // If it's my own message coming back, replace the optimistic one
                if (msg.tempId) {
                    const optimisticExists = prev.some(m => m.id === msg.tempId)
                    if (optimisticExists) {
                        return prev.map(m => (m.id === msg.tempId ? msg : m))
                    }
                }

                // If I already have this message ID, skip
                const exists = prev.some(m => m.id === msg.id)
                if (exists) return prev

                // Mark as seen if it's from friend
                if (msg.senderId !== userId) {
                    socket.emit("mark_seen", { conversationId })
                }

                return [...prev, msg]
            })
        })

        // Listen for read receipts
        socket.on("messages_seen", (data: { conversationId: string, userId: string, seenAt: string }) => {
            if (data.userId !== userId) {
                setMessages(prev => prev.map(m =>
                    m.senderId === userId && !m.seenAt ? { ...m, seenAt: data.seenAt } : m
                ))
            }
        })

        // Listen for user status
        socket.on("user_status", (data: { userId: string, status: 'online' | 'offline' }) => {
            if (data.userId === friendId) {
                setIsFriendOnline(data.status === 'online')
            }
        })

        socket.on("draft_update", (data: { senderId: string; text: string }) => {
            if (data.senderId !== userId) {
                setDrafts((prev) => ({ ...prev, [data.senderId]: data.text }))
            }
        })

        socket.on("draft_clear", (data: { userId: string }) => {
            if (data.userId !== userId) {
                setDrafts((prev) => {
                    const newDrafts = { ...prev }
                    delete newDrafts[data.userId]
                    return newDrafts
                })
            }
        })

        socket.on("consent_update", (data: { userId: string, enabled: boolean }) => {
            console.log(`User ${data.userId} toggled live mode: ${data.enabled}`)
        })

        return () => {
            socket.off("connect", onConnect)
            socket.off("disconnect", onDisconnect)
            socket.off("message_new")
            socket.off("messages_seen")
            socket.off("user_status")
            socket.off("draft_update")
            socket.off("draft_clear")
            socket.off("consent_update")
        }
    }, [socket, conversationId, userId, friendId])

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

        const optimisticMsg: Message = {
            id: tempId,
            content,
            senderId: userId,
            createdAt: new Date(),
            sender: { name: "Me" }
        }

        setMessages(prev => [...prev, optimisticMsg])
        setInput("")

        socket.emit("send_message", {
            conversationId,
            content,
            tempId
        })
        seqRef.current = 0
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
                socket.emit("draft_update", { conversationId, text: "", seq: 0 })
            }
        }
    }

    const getInitials = (name?: string) => (name || "User").slice(0, 2).toUpperCase()

    if (!friendId) {
        return (
            <div className="w-full h-[500px] flex items-center justify-center text-slate-400 dark:text-slate-500">
                <p>Select a friend to start chatting</p>
            </div>
        )
    }

    return (
        <div className="w-full max-w-2xl h-[600px] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-colors">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-800 dark:to-blue-900 text-white flex items-center justify-between shadow-md z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                        <span className="font-bold text-sm">{getInitials(friendName)}</span>
                    </div>
                    <div>
                        <h2 className="font-bold text-sm leading-tight flex items-center gap-2">
                            {friendName || "Chat"}
                        </h2>
                        <div className="flex items-center gap-1.5">
                            <span className={cn("w-2 h-2 rounded-full transition-colors",
                                isFriendOnline ? "bg-emerald-400" : "bg-slate-400")}>
                            </span>
                            <span className="text-xs text-white/80">
                                {isFriendOnline ? "Online" : "Offline"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="hidden sm:inline text-[10px] bg-white/10 px-2 py-1 rounded-md">
                        {isLiveEnabled ? "Sending Drafts" : "Drafts Private"}
                    </span>

                    <button
                        onClick={toggleLiveMode}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200 backdrop-blur-sm border text-xs font-medium cursor-pointer",
                            isLiveEnabled
                                ? "bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-200/50 text-white"
                                : "bg-white/10 hover:bg-white/20 border-white/10 text-white/70"
                        )}
                        title={isLiveEnabled ? "Click to Disable Live Drafts" : "Click to Enable Live Drafts"}
                    >
                        {isLiveEnabled ? <Eye className="w-3.5 h-3.5 text-emerald-300" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{isLiveEnabled ? "ON" : "OFF"}</span>
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
                        <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-3">
                            <Send className="w-8 h-8" />
                        </div>
                        <p className="text-sm">No messages yet. Start chatting!</p>
                    </div>
                )}

                {messages.map((msg, idx) => {
                    const isMe = msg.senderId === userId
                    const isOptimistic = msg.id?.startsWith('temp_')
                    return (
                        <div key={msg.id || idx} className={cn("flex flex-col max-w-[75%] min-w-0", isMe ? "ml-auto items-end" : "items-start")}>
                            <div className={cn(
                                "px-4 py-2.5 shadow-sm text-sm relative group transition-all duration-200 whitespace-pre-wrap break-words break-all",
                                isMe
                                    ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-2xl rounded-br-none"
                                    : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-bl-none",
                                isOptimistic && "opacity-70 saturate-50"
                            )}>
                                {msg.content}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1 px-1 flex items-center gap-1">
                                <span>{isMe ? "You" : msg.sender?.name || "User"}</span>
                                {isMe && (
                                    <span title={msg.seenAt ? "Seen" : "Sent"}>
                                        {msg.seenAt ? (
                                            <CheckCheck className="w-3 h-3 text-blue-500" />
                                        ) : (
                                            <Check className="w-3 h-3 text-slate-400" />
                                        )}
                                    </span>
                                )}
                                {isOptimistic && <span className="italic">(sending...)</span>}
                            </div>
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
                                <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                    Typing...
                                </span>
                            </div>
                            <div className="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 border-2 border-dashed border-emerald-200 dark:border-emerald-800 rounded-2xl rounded-bl-none italic text-sm w-full relative overflow-hidden shadow-sm whitespace-pre-wrap break-words break-all">
                                {text}
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                <div className="relative">
                    <textarea
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder={isLiveEnabled ? "Type to start live drafting..." : "Type a message..."}
                        className={cn(
                            "w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl resize-none text-sm focus:ring-2 outline-none transition-all duration-200 max-h-32 min-h-[50px] dark:text-slate-100",
                            isLiveEnabled
                                ? "border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/30 dark:border-emerald-800"
                                : "border-slate-200 dark:border-slate-700 focus:border-cyan-500 focus:ring-cyan-500/20"
                        )}
                        rows={1}
                        disabled={!isConnected}
                    />

                    <button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || !isConnected}
                        className="absolute right-2 bottom-2 p-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none transition-all duration-200 active:scale-95 cursor-pointer"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex justify-between items-center mt-2 px-1">
                    <div className="flex items-center gap-2">
                        {isLiveEnabled && (
                            <span className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                                <Eye className="w-3 h-3" />
                                <span>Visible to others</span>
                            </span>
                        )}
                        {!isLiveEnabled && (
                            <span className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                <EyeOff className="w-3 h-3" />
                                <span>Hidden draft</span>
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">Press Enter to send</span>
                </div>
            </div>
        </div>
    )
}
