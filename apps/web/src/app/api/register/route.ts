
import { NextResponse } from "next/server";
import { prisma } from "@repo/database";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { email, password, name } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: "User already exists" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                name,
                passwordHash: hashedPassword,
                image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
            }
        });

        // Initialize user with demo conversation implicitly for MVP
        // In real app, user would create room efficiently
        const DEMO_ROOM = "demo-room-1";
        await prisma.conversation.upsert({
            where: { id: DEMO_ROOM },
            update: {},
            create: { id: DEMO_ROOM }
        });

        await prisma.conversationMember.create({
            data: {
                userId: user.id,
                conversationId: DEMO_ROOM,
                liveDraftEnabled: false
            }
        });

        return NextResponse.json({ user });
    } catch (e) {
        console.error("Register error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
