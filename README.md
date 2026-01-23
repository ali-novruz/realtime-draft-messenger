# Realtime Draft Messenger

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)
![Version](https://img.shields.io/badge/version-1.0.0-purple.svg)

**Realtime Draft Messenger** is a next-generation chat application that redefines instant messaging with **Live Drafts**. See exactly what your friends are typing, character by character, in real-time—bringing the intimacy of face-to-face conversation to the digital world.

![Logo](./apps/web/public/logo.svg)

## 🚀 Live Demo

**[https://realtimedraftmessenger.vercel.app](https://realtimedraftmessenger.vercel.app)**

---

## ✨ Key Features

- **👀 Live Drafts**: Opt-in to share your keystrokes in real-time. See thoughts form before they are sent.
- **⚡ Instant Messaging**: Powered by Socket.io and Redis for ultra-low latency delivery.
- **🎨 Modern UI/UX**:
  - **Glassmorphism** aesthetics with vibrant gradients.
  - **Dark Mode** support with smooth transitions.
  - **Responsive Design** for mobile and desktop.
- **🔒 Privacy Focused**: Live drafting is disabled by default and can be toggled per conversation.
- **👥 Friend System**: Send requests, accept friends, and see online status.

---

## 🛠️ Technology Stack

This project is built as a highly scalable monorepo using **Turborepo**.

| Core | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 14, React 19, Tailwind CSS v4, Framer Motion, Lucide Icons |
| **Backend** | Node.js, Express, Socket.io, TypeScript |
| **Database** | PostgreSQL, Prisma ORM |
| **Cache/State** | Redis (Upstash) |
| **Auth** | NextAuth.js v5 |
| **Deployment** | Vercel (Web), Render (Server) |

---

## 📂 Project Structure

```bash
.
├── apps
│   ├── web      # Next.js frontend application
│   └── server   # Express + Socket.io backend server
├── packages
│   ├── database # Prisma schema and client
│   └── shared   # Shared TypeScript types and Zod schemas
└── README.md
```

---

## 🏃‍♂️ Getting Started

### Prerequisites
- Node.js 18+
- pnpm
- PostgreSQL Database
- Redis Instance

### Installation

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
   Create a `.env` file in `apps/web` and `apps/server` based on `.env.example`.
   
   **Required Variables:**
   - `DATABASE_URL`
   - `REDIS_URL`
   - `NEXTAUTH_SECRET`

4. **Database Setup**
   ```bash
   pnpm db:push
   ```

5. **Run Development Server**
   ```bash
   pnpm dev
   ```

---

## 📄 License

Distributed under the **MIT License**. See below for more information.

```text
MIT License

Copyright (c) 2026 Ali Novruz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📞 Contact

**Ali Novruz**

- **Website**: [alinovruz.app](https://alinovruz.app)
- **Email**: [alinovruz29@gmail.com](mailto:alinovruz29@gmail.com)
- **LinkedIn**: [Ali Novruz](https://linkedin.com/in/ali-novruz-447115356)
- **GitHub**: [@ali-novruz](https://github.com/ali-novruz)

Only for hiring or professional inquiries. All rights reserved.
