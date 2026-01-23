import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@repo/database"
import { auth } from "@/lib/auth"

// Accept or reject friend request
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { friendshipId, action } = await request.json()

        if (!friendshipId || !["accept", "reject"].includes(action)) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 })
        }

        // Verify the user is the receiver
        const friendship = await prisma.friendship.findFirst({
            where: {
                id: friendshipId,
                receiverId: session.user.id,
                status: "PENDING"
            }
        })

        if (!friendship) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 })
        }

        const updated = await prisma.friendship.update({
            where: { id: friendshipId },
            data: {
                status: action === "accept" ? "ACCEPTED" : "REJECTED"
            },
            include: {
                sender: { select: { id: true, name: true, email: true, image: true } },
                receiver: { select: { id: true, name: true, email: true, image: true } }
            }
        })

        return NextResponse.json({ friendship: updated })
    } catch (error) {
        console.error("Respond error:", error)
        return NextResponse.json({ error: "Failed to respond" }, { status: 500 })
    }
}
