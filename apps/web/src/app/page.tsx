"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import Chat from "@/components/Chat"
import FriendsList from "@/components/FriendsList"
import { ThemeToggle } from "@/components/ThemeToggle"
import { MessageCircle, LogOut, User, Users } from "lucide-react"

type Friend = {
  id: string
  name: string | null
  email: string
  image: string | null
}

export default function Home() {
  const { data: session, status } = useSession()
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 animate-pulse flex items-center justify-center shadow-xl shadow-blue-500/20">
            <MessageCircle className="w-8 h-8 text-white animate-bounce" />
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null // Middleware handles redirect
  }

  return (
    <div className="h-full bg-slate-100 dark:bg-slate-950 flex flex-col transition-colors duration-300 overflow-hidden">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative flex items-center justify-center">
              {/* Logo with Glow Effect */}
              <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full"></div>
              <img src="/logo.svg" alt="Logo" className="w-full h-full object-contain relative z-10 drop-shadow-md" />
            </div>
            <h1 className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 hidden sm:block">
              Realtime Draft Messenger
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
              <User className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {session.user?.name || session.user?.email}
              </span>
            </div>

            <button
              onClick={() => signOut()}
              className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Split View */}
      <main className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full overflow-hidden p-2 md:p-4 gap-4">
        {/* Left Sidebar - Friends List */}
        <section className="flex-shrink-0 md:h-full overflow-hidden rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800">
          <FriendsList
            onSelectFriend={setSelectedFriend}
            selectedFriendId={selectedFriend?.id}
          />
        </section>

        {/* Right Panel - Chat */}
        <section className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-300 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden h-full">
          {selectedFriend ? (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="mb-4 flex items-center gap-3 flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
                  {(selectedFriend.name || selectedFriend.email).slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">{selectedFriend.name || selectedFriend.email}</h2>
                  <p className="text-sm text-slate-500">{selectedFriend.email}</p>
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <Chat
                  userId={session?.user?.id || ""}
                  token={session?.user?.socketToken || ""}
                  friendId={selectedFriend.id}
                  friendName={selectedFriend.name || selectedFriend.email}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
              <div className="w-24 h-24 rounded-3xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-4">
                <Users className="w-12 h-12" />
              </div>
              <h2 className="text-xl font-bold text-slate-600 dark:text-slate-300 mb-2">Select a friend</h2>
              <p className="text-sm text-center max-w-sm">
                Choose a friend from the list on the left to start chatting.
                Use the search box to find new people.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
