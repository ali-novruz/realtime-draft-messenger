# Realtime Draft Messenger

A real-time chat application that features **Live Drafts** - see what your friends are typing as they type it (if they opt-in).

![Logo](./apps/web/public/logo.svg)

## 🚀 Live Demo

**[https://realtimedraftmessenger.vercel.app](https://realtimedraftmessenger.vercel.app)**

## ✨ Features

- **Real-time Messaging**: Instant message delivery using Socket.io.
- **Live Drafts**: See the other person's draft in real-time (consent-based).
- **Modern UI/UX**: Sleek dark mode, smooth animations, and responsive design.
- **Privacy First**: Live drafting is opt-in per conversation.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, Tailwind CSS v4, Framer Motion (animations).
- **Backend**: Express.js, Socket.io, Redis (for drafts/presence).
- **Database**: PostgreSQL (via Prisma ORM).
- **Monorepo**: Turborepo.

## 🏃‍♂️ Running Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/ali-novruz/realtime-draft-messenger.git
   cd realtime-draft-messenger
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   Copy `.env.example` to `.env` and fill in your database and Redis credentials.

4. **Run Development Server**
   ```bash
   pnpm dev
   ```

## 📝 License

© 2026 Ali Novruz. All rights reserved.
