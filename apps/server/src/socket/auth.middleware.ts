import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { AuthTokenPayload } from '@repo/shared';

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me";

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
