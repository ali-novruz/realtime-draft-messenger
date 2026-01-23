import { NextResponse } from "next/server"
import { prisma } from "@repo/database"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const conversationId = searchParams.get("conversationId")

        if (!conversationId) {
            return NextResponse.json({ error: "Missing conversationId" }, { status: 400 })
        }

        const userId = session.user.id

        // Verify user is a member of this conversation
        const membership = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { members: true }
        })

        if (!membership) {
            return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
        }

        const isMember = membership.members.some(m => m.userId === userId)
        if (!isMember) {
            // Return empty or error. Better to return error or empty for security.
            return NextResponse.json({ error: "Not authorized for this conversation" }, { status: 403 })
        }

        // Fetch messages
        const messages = await prisma.message.findMany({
            where: { conversationId },
            include: {
                sender: {
                    select: { name: true, email: true }
                }
            },
            orderBy: { createdAt: 'asc' },
            take: 100 // Limit to last 100 for performance
        })

        return NextResponse.json({ messages })

    } catch (error) {
        console.error("Get messages error:", error)
        return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }
}
