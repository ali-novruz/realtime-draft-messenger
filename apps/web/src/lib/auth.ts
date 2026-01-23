
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@repo/database"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { AuthTokenPayload } from "@repo/shared"

// IMPORTANT: In production, use process.env.NEXTAUTH_SECRET
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me"

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string }
                })

                if (!user || !user.passwordHash) return null

                const isValid = await bcrypt.compare(credentials.password as string, user.passwordHash)
                if (!isValid) return null

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                // Generate secure socket token
                const socketPayload: AuthTokenPayload = { userId: user.id || "", email: user.email || "" }
                token.socketToken = jwt.sign(socketPayload, JWT_SECRET, { expiresIn: '1d' })
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                // @ts-ignore
                session.user.id = token.id as string
                // @ts-ignore
                session.user.socketToken = token.socketToken as string
            }
            return session
        }
    },
    pages: {
        signIn: '/login',
    }
})
