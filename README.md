# 🌀 Symbiotic Task Manager

A modern, real-time collaborative task management application powered by **CRDTs** (Conflict-free Replicated Data Types) using **Yjs**. Built as a learning project and portfolio piece to explore cutting-edge web technologies.

## ✨ Features

### Phase 1-3 (Completed)
- ✅ **Real-time Collaboration**: Multiple users can edit tasks simultaneously with zero conflicts using Yjs CRDTs
- ✅ **JWT Authentication**: Secure user registration and login
- ✅ **RESTful Task API**: Full CRUD operations for task management
- ✅ **WebSocket Sync**: Instant task synchronization across all connected clients
- ✅ **Modern UI**: Responsive, gradient-based design with smooth animations
- ✅ **TypeScript**: Full type safety across frontend and backend

### Future Roadmap (See ROADMAP.md)
- 🔮 Elixir/Phoenix integration for massive WebSocket scalability
- 🔮 Neo4j graph database for task dependency visualization
- 🔮 ML-powered task prioritization
- 🔮 Peer-to-peer "energy stream" co-working channel
- 🔮 Graph-based "task contagion" visualization

## 🏗️ Architecture

```
symbiotic-task-manager/
├── backend/          # NestJS API + WebSocket server
│   ├── src/
│   │   ├── auth/     # JWT authentication
│   │   ├── tasks/    # Task CRUD operations
│   │   ├── users/    # User management
│   │   └── yjs/      # Yjs WebSocket gateway (CRDT sync)
│   └── symbiotic-tasks.db  # SQLite database
│
├── frontend/         # React + TypeScript + Vite
│   ├── src/
│   │   ├── api/      # API client (axios)
│   │   ├── components/  # React components
│   │   ├── context/  # Auth context
│   │   ├── hooks/    # Custom hooks (useYjs)
│   │   └── types/    # TypeScript types
│   └── ...
│
└── docs/            # Additional documentation
```

## 🛠️ Tech Stack

### Current (Phase 1-3)
| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React + TypeScript + Vite | Fast, modern UI with full type safety |
| **State Management** | React Context API | User authentication state |
| **Real-time Sync** | Yjs + Socket.IO | CRDT-based conflict-free collaboration |
| **Backend API** | NestJS + TypeScript | RESTful API with dependency injection |
| **WebSocket** | Socket.IO (NestJS) | Real-time bidirectional communication |
| **Database** | SQLite + TypeORM | Lightweight, file-based database |
| **Authentication** | JWT + Passport | Stateless token-based auth |

### Future Stack (Roadmap)
- **Elixir/Phoenix**: Scalable WebSocket handling (millions of connections)
- **Neo4j**: Graph database for task relationships
- **Python/FastAPI**: ML service for priority prediction
- **TensorFlow.js**: Client-side ML inference
- **WebRTC**: Peer-to-peer collaboration features

## 🚀 Getting Started

### Prerequisites
- Node.js v20+ (installed during setup)
- npm v9+
- Git

### Installation

1. **Clone the repository:**
   ```bash
   cd ~/Downloads/symbiotic-task-manager
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```
Backend will run on `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend will run on `http://localhost:5173`

### First-time Usage

1. Open `http://localhost:5173` in your browser
2. Click "Register" to create an account
3. Create some tasks
4. Open another browser window (or incognito) to see real-time collaboration!

## 🎯 Key Features Explained

### CRDT-based Real-time Collaboration

This app uses **Yjs**, a CRDT library, to enable truly conflict-free real-time editing:

- **No "last write wins" problems**: Multiple users can edit the same task list simultaneously
- **Automatic conflict resolution**: Changes merge intelligently without user intervention
- **Offline-first**: Changes sync automatically when connection resumes
- **Peer-aware**: See updates from other users in real-time

**How it works:**
1. Frontend connects to WebSocket server
2. Joins a shared "room" (Yjs document)
3. Local changes are sent as Yjs updates
4. Server broadcasts updates to all connected clients
5. Yjs automatically merges changes conflict-free

### Architecture Decisions

**Why SQLite instead of PostgreSQL?**
- Easier setup (no external database server needed)
- Perfect for learning/portfolio projects
- Can be swapped for PostgreSQL in production (TypeORM makes this trivial)

**Why NestJS only (no Elixir yet)?**
- Learning project: build incrementally
- NestJS handles WebSockets fine for moderate scale
- Elixir/Phoenix documented as future migration path

**Why Socket.IO for Yjs instead of y-websocket?**
- Better integration with NestJS ecosystem
- More control over connection handling
- Easier to add auth middleware later

## 📚 Learning Resources

This project demonstrates:
- **CRDT architecture** (Yjs)
- **WebSocket real-time sync** (Socket.IO)
- **JWT authentication** (Passport)
- **TypeScript fullstack development**
- **NestJS dependency injection**
- **React Context API**
- **RESTful API design**

## 🔐 Security Notes

⚠️ **This is a learning project**. For production use:
- Change `JWT_SECRET` in backend `.env`
- Use HTTPS in production
- Add rate limiting
- Implement CSRF protection
- Use environment-specific configs

## 📖 Documentation

- **PROGRESS.md**: Completed implementation steps
- **ROADMAP.md**: Future feature roadmap (Elixir, Neo4j, ML, etc.)
- **HANDOFF.md**: Guide for resuming development in future sessions
- **docs/**: Detailed technical documentation

## 🤝 Contributing

This is a personal learning project, but suggestions are welcome! Open an issue or submit a PR.

## 📝 License

MIT License - feel free to use this project for learning!

---

**Built by:** Hitkarsh
**Date:** January 2026
**Purpose:** Learning project exploring CRDTs, real-time collaboration, and modern web technologies
