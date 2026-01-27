# 🌀 RightTask (Symbiotic Task Manager)

A modern, real-time collaborative task management application powered by **CRDTs** (Conflict-free Replicated Data Types) using **Yjs**. Built as a learning project and portfolio piece to explore cutting-edge web technologies.

**🚀 LIVE DEMO:** https://righttask.netlify.app

> **Status:** Deployed to production! Phase 1-3, 5 complete and fully functional with Neo4j graph visualization.

## ✨ Features

### Phase 1-3, 5 (Completed)
**Note:** Phase 4 (Elixir/Phoenix) was skipped - went directly to Phase 5
- ✅ **Real-time Collaboration**: Multiple users can edit tasks simultaneously with zero conflicts using Yjs CRDTs
- ✅ **JWT Authentication**: Secure user registration and login
- ✅ **RESTful Task API**: Full CRUD operations for task management
- ✅ **WebSocket Sync**: Instant task synchronization across all connected clients
- ✅ **Modern UI**: Responsive, gradient-based design with smooth animations
- ✅ **TypeScript**: Full type safety across frontend and backend
- ✅ **Task Dependencies**: Connect tasks with DEPENDS_ON relationships
- ✅ **Cycle Detection**: Prevents circular dependencies automatically
- ✅ **Graph Visualization**: Interactive D3.js force-directed graph of task dependencies
- ✅ **Neo4j Integration**: Graph database for relationship tracking and analysis
- ✅ **Dependency Editor**: Add/remove task dependencies with real-time validation

### Future Roadmap (See ROADMAP.md)
- 🔮 Task contagion animation with ripple effects
- 🔮 Critical path detection and highlighting
- 🔮 Skills system with task requirements and recommendations
- 🔮 Elixir/Phoenix integration for massive WebSocket scalability
- 🔮 ML-powered task prioritization
- 🔮 Peer-to-peer "energy stream" co-working channel

## 🏗️ Architecture

```
symbiotic-task-manager/
├── backend/          # NestJS API + WebSocket server
│   ├── src/
│   │   ├── auth/     # JWT authentication
│   │   ├── tasks/    # Task CRUD operations
│   │   ├── users/    # User management
│   │   ├── graph/    # Neo4j service & graph sync
│   │   ├── dependencies/  # Dependency management & cycle detection
│   │   └── yjs/      # Yjs WebSocket gateway (CRDT sync)
│   └── symbiotic-tasks.db  # SQLite database
│
├── frontend/         # React + TypeScript + Vite
│   ├── src/
│   │   ├── api/      # API client (axios)
│   │   ├── components/  # React components (including D3 graph)
│   │   ├── context/  # Auth context
│   │   ├── hooks/    # Custom hooks (useYjs)
│   │   └── types/    # TypeScript types
│   └── ...
│
└── docs/            # Additional documentation (includes NEO4J_SETUP.md)
```

## 🛠️ Tech Stack

### Current (Phase 1-3, 5)
| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React + TypeScript + Vite | Fast, modern UI with full type safety |
| **Visualization** | D3.js | Interactive force-directed graph visualization |
| **State Management** | React Context API | User authentication state |
| **Real-time Sync** | Yjs + Socket.IO | CRDT-based conflict-free collaboration |
| **Backend API** | NestJS + TypeScript | RESTful API with dependency injection |
| **WebSocket** | Socket.IO (NestJS) | Real-time bidirectional communication |
| **Database (CRUD)** | SQLite + TypeORM | Lightweight, file-based database |
| **Database (Graph)** | Neo4j Aura | Graph database for dependencies & relationships |
| **Authentication** | JWT + Passport | Stateless token-based auth |

### Future Stack (Roadmap)
- **Elixir/Phoenix**: Scalable WebSocket handling (millions of connections)
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

### Optional: Neo4j Setup (for Graph Features)

To enable task dependency visualization:

1. Follow the guide in **[docs/NEO4J_SETUP.md](docs/NEO4J_SETUP.md)**
2. Add Neo4j credentials to `backend/.env`
3. Restart the backend server

**Note:** The app works without Neo4j, but graph visualization features will be disabled.

### First-time Usage

1. Open `http://localhost:5173` in your browser
2. Click "Register" to create an account
3. Create some tasks
4. Add dependencies between tasks (if Neo4j is configured)
5. Watch the interactive graph visualization update in real-time!
6. Open another browser window (or incognito) to see real-time collaboration!

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

### Task Dependencies & Graph Visualization

RightTask uses a **dual database strategy** to combine the best of both worlds:

- **SQLite**: Fast CRUD operations for tasks
- **Neo4j**: Graph relationships for dependencies

**Key Features:**
- **Dependency Tracking**: Link tasks with "depends on" relationships
- **Cycle Detection**: Automatically prevents circular dependencies
- **Visual Graph**: Interactive D3.js force-directed graph shows task relationships
- **Color Coding**: Green (completed), Blue (active), Purple (selected)
- **Interactive**: Drag nodes, hover for details, click to select

**How it works:**
1. User creates dependency via dropdown in task card
2. Backend validates (no cycles, no self-dependencies)
3. Relationship stored in both SQLite (IDs) and Neo4j (graph edges)
4. D3.js visualization updates in real-time
5. Graph syncs automatically when tasks or dependencies change

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

**Main Documentation (root):**
- **PROGRESS.md**: Complete implementation history (all phases)
- **ROADMAP.md**: Future features and planned phases

**Technical Documentation (docs/):**
- **[GETTING_STARTED.md](docs/GETTING_STARTED.md)**: Quick start guide for local development
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)**: Complete deployment guide + production status
- **[PHOENIX.md](docs/PHOENIX.md)**: Phoenix WebSocket server guide (Phase 4)
- **[NEO4J_SETUP.md](docs/NEO4J_SETUP.md)**: Neo4j Aura setup (Phase 5)
- **[HANDOFF.md](docs/HANDOFF.md)**: Developer resumption guide
- **[PROJECT_SUMMARY.md](docs/PROJECT_SUMMARY.md)**: Project achievements summary
- **[ORIGINAL_VISION.md](docs/ORIGINAL_VISION.md)**: Original project vision
- **[TROUBLESHOOTING_PRODUCTION.md](docs/TROUBLESHOOTING_PRODUCTION.md)**: Production troubleshooting
- **[DEPLOYMENT_TESTING_CHECKLIST.md](docs/DEPLOYMENT_TESTING_CHECKLIST.md)**: Testing checklist

## 🤝 Contributing

This is a personal learning project, but suggestions are welcome! Open an issue or submit a PR.

## 📝 License

MIT License - feel free to use this project for learning!

---

**Built by:** Hitkarsh
**Date:** January 2026
**Purpose:** Learning project exploring CRDTs, real-time collaboration, and modern web technologies
