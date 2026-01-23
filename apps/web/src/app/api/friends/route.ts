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
        const userId = session.user.id
        const friends = friendships.map(f =>
            f.senderId === userId ? f.receiver : f.sender
        )

        return NextResponse.json({ friends })
    } catch (error) {
        console.error("Get friends error:", error)
        return NextResponse.json({ error: "Failed to get friends" }, { status: 500 })
    }
}
