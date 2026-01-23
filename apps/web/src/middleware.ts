import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
    const isLoggedIn = !!req.auth
    const isOnLoginPage = req.nextUrl.pathname === "/login"
    const isOnRegisterPage = req.nextUrl.pathname === "/register"
    const isAuthPage = isOnLoginPage || isOnRegisterPage

    // Allow API routes
    if (req.nextUrl.pathname.startsWith("/api")) {
        return NextResponse.next()
    }

    // Redirect to login if not logged in and trying to access protected page
    if (!isLoggedIn && !isAuthPage) {
        return NextResponse.redirect(new URL("/login", req.nextUrl))
    }

    // Redirect to home if logged in and trying to access auth pages
    if (isLoggedIn && isAuthPage) {
        return NextResponse.redirect(new URL("/", req.nextUrl))
    }

    return NextResponse.next()
})

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
}
