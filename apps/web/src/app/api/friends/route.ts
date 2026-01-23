import { NextResponse } from "next/server"
import { prisma } from "@repo/database"
import { auth } from "@/lib/auth"

// Get accepted friends list
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const friendships = await prisma.friendship.findMany({
            where: {
                status: "ACCEPTED",
                OR: [
                    { senderId: session.user.id },
                    { receiverId: session.user.id }
                ]
            },
            include: {
                sender: { select: { id: true, name: true, email: true, image: true } },
                receiver: { select: { id: true, name: true, email: true, image: true } }
            },
            orderBy: { updatedAt: "desc" }
        })

        // Extract the friend (the other person)
        // Extract the friend (the other person) and get unread count
        const userId = session.user.id
        const friendsWithUnread = await Promise.all(friendships.map(async (f) => {
            const friend = f.senderId === userId ? f.receiver : f.sender

            // Construct conversation ID
            const ids = [userId, friend.id].sort()
            const conversationId = `conv_${ids[0]}_${ids[1]}`

            // Count unread messages from this friend
            const unreadCount = await prisma.message.count({
                where: {
                    conversationId,
                    senderId: friend.id,
                    seenAt: null
                }
            })

            return {
                ...friend,
                unreadCount
            }
        }))

        return NextResponse.json({ friends: friendsWithUnread })
    } catch (error) {
        console.error("Get friends error:", error)
        return NextResponse.json({ error: "Failed to get friends" }, { status: 500 })
    }
}
