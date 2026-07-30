
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@repo/database"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { AuthTokenPayload } from "@repo/shared"

// Only enforced at actual runtime — `next build`'s page-data-collection phase
// also sets NODE_ENV=production but hasn't been given real env vars yet.
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
    throw new Error('JWT_SECRET env var is not set — required in production to sign socket tokens')
}
const JWT_SECRET = process.env.JWT_SECRET || "dev-only-secret"

export const { handlers, auth, signIn, signOut } = NextAuth({
    secret: process.env.AUTH_SECRET,
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
