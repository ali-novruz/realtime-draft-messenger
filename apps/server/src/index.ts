import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { connectRedis } from './services/redis.service';
import { setupSocketHandlers } from './socket/handler';
import { authMiddleware } from './socket/auth.middleware';

const app = express();

// CORS_ORIGIN is a comma-separated list of allowed origins for production;
// localhost is always allowed for local development.
const allowedOrigins: string[] = [
    "http://localhost:3000",
    ...(process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean) ?? [])
];

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

// Schema sync (`prisma db push`) runs in docker-entrypoint.sh before this
// process starts, so by the time we're here the schema is already current.
httpServer.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
