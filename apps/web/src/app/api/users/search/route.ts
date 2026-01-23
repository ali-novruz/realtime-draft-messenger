import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@repo/database"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const query = searchParams.get("q")

        if (!query || query.length < 2) {
            return NextResponse.json({ users: [] })
        }

        const users = await prisma.user.findMany({
            where: {
                AND: [
                    { id: { not: session.user.id } },
                    {
                        OR: [
                            { email: { contains: query, mode: "insensitive" } },
                            { name: { contains: query, mode: "insensitive" } }
                        ]
                    }
                ]
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true
            },
            take: 10
        })

        return NextResponse.json({ users })
    } catch (error) {
        console.error("Search error:", error)
        return NextResponse.json({ error: "Search failed" }, { status: 500 })
    }
}
