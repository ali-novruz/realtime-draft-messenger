import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { connectRedis } from './services/redis.service';
import { setupSocketHandlers } from './socket/handler';
import { authMiddleware } from './socket/auth.middleware';

const app = express();

// Allow all origins in development, specific origins in production
const allowedOrigins: string[] = [
    "http://localhost:3000",
    "https://realtimedraftmessenger.vercel.app",
    "https://realtime-draft-messenger.vercel.app",
    process.env.CORS_ORIGIN || ""
].filter((origin): origin is string => Boolean(origin));

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Connect Redis
connectRedis().catch(console.error);

// Auth Middleware
io.use(authMiddleware);

// Handlers
setupSocketHandlers(io);

app.get('/', (req, res) => {
    res.send(`Live Draft Chat Server Running`);
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
