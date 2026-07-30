import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { AuthTokenPayload } from '@repo/shared';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET env var is not set — must match the web app\'s JWT_SECRET');
}
const JWT_SECRET = process.env.JWT_SECRET || "dev-only-secret";

export const authMiddleware = (socket: Socket, next: (err?: any) => void) => {
    const token = socket.handshake.auth.token;

    if (!token) {
        return next(new Error("Authentication error: No token provided"));
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
        // Attach secure user info to socket
        socket.data.user = decoded;
        next();
    } catch (err) {
        return next(new Error("Authentication error: Invalid token"));
    }
};
