"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import Chat from "@/components/Chat"
import FriendsList from "@/components/FriendsList"
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
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
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h1 className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 hidden sm:block">
              Live Draft Messenger
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
              <User className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">
                {session.user?.name || session.user?.email}
              </span>
            </div>

            <button
              onClick={() => signOut()}
              className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Split View */}
      <main className="flex-1 flex max-w-7xl mx-auto w-full">
        {/* Left Sidebar - Friends List */}
        <FriendsList
          onSelectFriend={setSelectedFriend}
          selectedFriendId={selectedFriend?.id}
        />

        {/* Right Panel - Chat */}
        <div className="flex-1 flex flex-col bg-slate-50 p-6">
          {selectedFriend ? (
            <div className="flex-1 flex flex-col">
              <div className="mb-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold">
                  {(selectedFriend.name || selectedFriend.email).slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-bold text-lg text-slate-900">{selectedFriend.name || selectedFriend.email}</h2>
                  <p className="text-sm text-slate-500">{selectedFriend.email}</p>
                </div>
              </div>
              {/* @ts-ignore */}
              <Chat userId={session.user.id} token={session.user.socketToken} friendId={selectedFriend.id} />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <div className="w-24 h-24 rounded-3xl bg-slate-200 flex items-center justify-center mb-4">
                <Users className="w-12 h-12" />
              </div>
              <h2 className="text-xl font-bold text-slate-600 mb-2">Bir arkadaş seçin</h2>
              <p className="text-sm text-center max-w-sm">
                Sol taraftaki listeden bir arkadaş seçerek sohbet başlatın.
                Yeni arkadaş eklemek için arama kutusunu kullanın.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
