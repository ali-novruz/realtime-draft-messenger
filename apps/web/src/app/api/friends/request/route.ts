import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@repo/database"
import { auth } from "@/lib/auth"

// Send friend request
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { receiverId } = await request.json()

        if (!receiverId) {
            return NextResponse.json({ error: "Receiver ID required" }, { status: 400 })
        }

        if (receiverId === session.user.id) {
            return NextResponse.json({ error: "Cannot send request to yourself" }, { status: 400 })
        }

        // Check if friendship already exists
        const existing = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { senderId: session.user.id, receiverId },
                    { senderId: receiverId, receiverId: session.user.id }
                ]
            }
        })

        if (existing) {
            return NextResponse.json({ error: "Friend request already exists" }, { status: 400 })
        }

        const friendship = await prisma.friendship.create({
            data: {
                senderId: session.user.id,
                receiverId
            },
            include: {
                receiver: { select: { id: true, name: true, email: true, image: true } }
            }
        })

        return NextResponse.json({ friendship })
    } catch (error) {
        console.error("Friend request error:", error)
        return NextResponse.json({ error: "Failed to send request" }, { status: 500 })
    }
}
