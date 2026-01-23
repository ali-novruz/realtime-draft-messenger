import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@repo/database"
import { auth } from "@/lib/auth"

// Get pending friend requests
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const received = await prisma.friendship.findMany({
            where: {
                receiverId: session.user.id,
                status: "PENDING"
            },
            include: {
                sender: { select: { id: true, name: true, email: true, image: true } }
            },
            orderBy: { createdAt: "desc" }
        })

        const sent = await prisma.friendship.findMany({
            where: {
                senderId: session.user.id,
                status: "PENDING"
            },
            include: {
                receiver: { select: { id: true, name: true, email: true, image: true } }
            },
            orderBy: { createdAt: "desc" }
        })

        return NextResponse.json({ received, sent })
    } catch (error) {
        console.error("Get requests error:", error)
        return NextResponse.json({ error: "Failed to get requests" }, { status: 500 })
    }
}
