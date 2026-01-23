"use client"

import { useState, useEffect } from "react"
import { Search, UserPlus, Check, X, MessageCircle, Users } from "lucide-react"
import { cn } from "@/lib/utils"

type User = {
    id: string
    name: string | null
    email: string
    image: string | null
}

type Friendship = {
    id: string
    sender: User
    receiver: User
    status: string
}

type FriendsListProps = {
    onSelectFriend: (friend: User) => void
    selectedFriendId?: string
}

export default function FriendsList({ onSelectFriend, selectedFriendId }: FriendsListProps) {
    const [friends, setFriends] = useState<User[]>([])
    const [pendingRequests, setPendingRequests] = useState<Friendship[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<User[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends")

    // Load friends and requests
    useEffect(() => {
        loadFriends()
        loadRequests()
    }, [])

    const loadFriends = async () => {
        try {
            const res = await fetch("/api/friends")
            const data = await res.json()
            if (data.friends) setFriends(data.friends)
        } catch (error) {
            console.error("Failed to load friends:", error)
        }
    }

    const loadRequests = async () => {
        try {
            const res = await fetch("/api/friends/requests")
            const data = await res.json()
            if (data.received) setPendingRequests(data.received)
        } catch (error) {
            console.error("Failed to load requests:", error)
        }
    }

    // Search users
    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([])
            return
        }

        const timer = setTimeout(async () => {
            setIsSearching(true)
            try {
                const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`)
                const data = await res.json()
                if (data.users) setSearchResults(data.users)
            } catch (error) {
                console.error("Search failed:", error)
            } finally {
                setIsSearching(false)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [searchQuery])

    const sendFriendRequest = async (receiverId: string) => {
        try {
            const res = await fetch("/api/friends/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ receiverId })
            })
            if (res.ok) {
                setSearchQuery("")
                setSearchResults([])
                alert("Friend request sent!")
            }
        } catch (error) {
            console.error("Failed to send request:", error)
        }
    }

    const respondToRequest = async (friendshipId: string, action: "accept" | "reject") => {
        try {
            const res = await fetch("/api/friends/respond", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ friendshipId, action })
            })
            if (res.ok) {
                loadRequests()
                loadFriends()
            }
        } catch (error) {
            console.error("Failed to respond:", error)
        }
    }

    return (
        <div className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full transition-colors">
            {/* Search */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search users..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none dark:text-slate-100"
                    />
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div className="mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50 relative">
                        {searchResults.map((user) => (
                            <div key={user.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.name || user.email}</p>
                                    <p className="text-xs text-slate-500">{user.email}</p>
                                </div>
                                <button
                                    onClick={() => sendFriendRequest(user.id)}
                                    className="p-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                                >
                                    <UserPlus className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800">
                <button
                    onClick={() => setActiveTab("friends")}
                    className={cn(
                        "flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                        activeTab === "friends"
                            ? "text-cyan-600 dark:text-cyan-400 border-b-2 border-cyan-600 dark:border-cyan-400"
                            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    )}
                >
                    <Users className="w-4 h-4" />
                    Friends
                </button>
                <button
                    onClick={() => setActiveTab("requests")}
                    className={cn(
                        "flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 relative",
                        activeTab === "requests"
                            ? "text-cyan-600 dark:text-cyan-400 border-b-2 border-cyan-600 dark:border-cyan-400"
                            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    )}
                >
                    <UserPlus className="w-4 h-4" />
                    Requests
                    {pendingRequests.length > 0 && (
                        <span className="absolute top-2 right-4 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                            {pendingRequests.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === "friends" ? (
                    friends.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No friends yet</p>
                            <p className="text-xs mt-1">Search users above</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {friends.map((friend) => (
                                <button
                                    key={friend.id}
                                    onClick={() => onSelectFriend(friend)}
                                    className={cn(
                                        "w-full p-4 flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                                        selectedFriendId === friend.id && "bg-cyan-50 dark:bg-cyan-900/10"
                                    )}
                                >
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                        {(friend.name || friend.email).slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{friend.name || friend.email}</p>
                                        <p className="text-xs text-slate-500 truncate">{friend.email}</p>
                                    </div>
                                    <MessageCircle className="w-5 h-5 text-slate-400" />
                                </button>
                            ))}
                        </div>
                    )
                ) : (
                    pendingRequests.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                            <UserPlus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No pending requests</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {pendingRequests.map((request) => (
                                <div key={request.id} className="p-4 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                                        {(request.sender.name || request.sender.email).slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{request.sender.name || request.sender.email}</p>
                                        <p className="text-xs text-slate-500 truncate">{request.sender.email}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => respondToRequest(request.id, "accept")}
                                            className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => respondToRequest(request.id, "reject")}
                                            className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    )
}
