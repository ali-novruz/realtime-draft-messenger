import { Server, Socket } from 'socket.io';
import { setDraft, deleteDraft } from '../services/redis.service';
import { prisma } from '@repo/database';
import { AuthTokenPayload } from '@repo/shared';

// Helper to ensure conversation exists
const ensureConversation = async (conversationId: string, senderId: string) => {
    // conversationId format: conv_userId1_userId2
    // We need to parse this to ensure both users are added if creating new
    if (!conversationId.startsWith('conv_')) return null;

    const parts = conversationId.replace('conv_', '').split('_');
    if (parts.length !== 2) return null;

    const user1 = parts[0];
    const user2 = parts[1];

    // Verify sender is one of the participants
    if (senderId !== user1 && senderId !== user2) return null;

    // Try to find existing conversation
    // Note: Since we use strict ID format, checking by ID is enough
    let conversation = await prisma.conversation.findUnique({
        where: { id: conversationId }
    });

    if (!conversation) {
        console.log(`Creating new conversation: ${conversationId}`);
        // Create conversation and members
        conversation = await prisma.conversation.create({
            data: {
                id: conversationId,
                members: {
                    create: [
                        { userId: user1 },
                        { userId: user2 }
                    ]
                }
            }
        });
    }

    return conversation;
};

const onlineUsers = new Map<string, Set<string>>(); // userId -> Set<socketId>

export const setupSocketHandlers = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        // Safe user info from JWT middleware
        const user = socket.data.user as AuthTokenPayload;
        const userId = user.userId;

        console.log(`✅ User connected: ${userId}`);

        // Handle Presence
        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set());
            // Broadcast online status to everyone (simplified for MVP)
            io.emit('user_status', { userId, status: 'online' });
        }
        onlineUsers.get(userId)?.add(socket.id);

        // Join personal user room for notifications
        socket.join(`user_${userId}`);

        socket.on('join_room', async (conversationId: string, callback?: (response: any) => void) => {
            try {
                // Validate conversation ID format basic check
                if (!conversationId.startsWith('conv_')) {
                    if (callback) callback({ status: 'error', message: 'Invalid conversation ID' });
                    return;
                }

                await socket.join(conversationId);
                console.log(`User ${userId} joined room: ${conversationId}`);

                // Send initial presence of the other user in this conversation
                const parts = conversationId.replace('conv_', '').split('_');
                const otherUserId = parts.find(p => p !== userId);
                if (otherUserId) {
                    const isOnline = onlineUsers.has(otherUserId);
                    socket.emit('user_status', {
                        userId: otherUserId,
                        status: isOnline ? 'online' : 'offline'
                    });
                }

                // Ack to client
                if (callback) callback({ status: 'ok', conversationId });
            } catch (error) {
                console.error(`Error joining room ${conversationId}:`, error);
                if (callback) callback({ status: 'error', message: 'Failed to join room' });
            }
        });

        socket.on('draft_update', async (data: { conversationId: string, text: string, seq: number }) => {
            const { conversationId, text, seq } = data;

            // Broadcast to room immediately for minimal latency
            // socket.to(...) broadcasts to everyone associated with the sender's socket in that room, BUT NOT THE SENDER
            socket.to(conversationId).emit('draft_update', {
                senderId: userId,
                text,
                seq,
                conversationId
            });

            // Async persist to Redis (fire and forget)
            // Using setDraft wrapper for safety
            setDraft(`draft:${conversationId}:${userId}`, JSON.stringify({ text, seq })).catch(console.error);
        });

        socket.on('send_message', async (data: { conversationId: string, content: string, tempId?: string }) => {
            const { conversationId, content, tempId } = data;

            try {
                // Critical fix: Ensure conversation exists before creating message
                await ensureConversation(conversationId, userId);

                const message = await prisma.message.create({
                    data: {
                        content,
                        conversationId, // Now guaranteed to exist
                        senderId: userId
                    },
                    include: { sender: true }
                });

                // Emit to room (including sender to confirm delivery/replace optimistic)
                io.to(conversationId).emit('message_new', { ...message, tempId });

                // Also emit to recipient's personal room for UNREAD BADGES (if they are not in the conversation)
                // Identify the other user
                const parts = conversationId.replace('conv_', '').split('_');
                const recipientId = parts.find(p => p !== userId);
                if (recipientId) {
                    io.to(`user_${recipientId}`).emit('message_new', { ...message, tempId });
                }

                // Clear draft
                const key = `draft:${conversationId}:${userId}`;
                await deleteDraft(key);
                io.to(conversationId).emit('draft_clear', { userId, conversationId });

            } catch (e) {
                console.error("❌ Error sending message:", e);
                // Optionally emit error back to sender
                socket.emit('error', { message: 'Failed to send message', tempId });
            }
        });

        socket.on('mark_seen', async (data: { conversationId: string }) => {
            const { conversationId } = data;
            try {
                // Update all messages in conversation where sender is NOT me and seenAt is null
                await prisma.message.updateMany({
                    where: {
                        conversationId,
                        senderId: { not: userId },
                        seenAt: null
                    },
                    data: {
                        seenAt: new Date()
                    }
                });

                // Notify room that messages were seen by this user
                io.to(conversationId).emit('messages_seen', {
                    conversationId,
                    userId, // who saw the messages
                    seenAt: new Date()
                });
            } catch (error) {
                console.error("Error marking seen:", error);
            }
        });

        socket.on('consent_update', async (data: { conversationId: string, enabled: boolean }) => {
            const { conversationId, enabled } = data;

            // Broadcast to everyone in room including sender (so state syncing is easier if needed, though usually just .to is enough)
            // socket.to is better here to avoid redrawing sender's own toggle if optimistic
            socket.to(conversationId).emit('consent_update', {
                userId,
                conversationId,
                enabled
            });

            if (!enabled) {
                const key = `draft:${conversationId}:${userId}`;
                await deleteDraft(key);
                io.to(conversationId).emit('draft_clear', { userId, conversationId });
            }
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${userId}`);
            const userSockets = onlineUsers.get(userId);
            if (userSockets) {
                userSockets.delete(socket.id);
                if (userSockets.size === 0) {
                    onlineUsers.delete(userId);
                    io.emit('user_status', { userId, status: 'offline' });
                }
            }
        });
    });
};
