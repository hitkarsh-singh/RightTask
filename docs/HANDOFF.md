# 🤝 Development Handoff Guide

This document provides everything a future developer (or future Claude session) needs to pick up development exactly where we left off.

---

## 📍 Current State

**Project**: Symbiotic Task Manager
**Phase**: 1-3 Complete (MVP)
**Location**: `~/Downloads/symbiotic-task-manager/`
**Last Updated**: January 20, 2026

### What's Working
✅ Full authentication system (register, login, JWT)
✅ Task CRUD API (create, read, update, delete, toggle)
✅ Real-time collaboration via Yjs CRDTs
✅ WebSocket synchronization across clients
✅ Modern React UI with responsive design
✅ SQLite persistence
✅ TypeScript fullstack

### What's Not Implemented (See ROADMAP.md)
❌ Elixir/Phoenix integration
❌ Neo4j graph database
❌ ML-powered features
❌ WebRTC peer-to-peer
❌ Production deployment

---

## 🚀 Quick Start (Resume Development)

### 1. Verify Environment
```bash
# Check Node.js installation
node --version  # Should be v25.3.0 or higher
npm --version   # Should be v11.7.0 or higher

# Navigate to project
cd ~/Downloads/symbiotic-task-manager
```

### 2. Install Dependencies (if needed)
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd ~/Downloads/symbiotic-task-manager/backend
npm run start:dev
```
- Runs on `http://localhost:3000`
- Auto-reloads on file changes
- Database: `symbiotic-tasks.db` (auto-created)

**Terminal 2 - Frontend:**
```bash
cd ~/Downloads/symbiotic-task-manager/frontend
npm run dev
```
- Runs on `http://localhost:5173`
- Hot module reload enabled

### 4. Test the Application

1. Open `http://localhost:5173`
2. Click "Register" and create a test account
3. Create a few tasks
4. Open another browser window (or incognito)
5. Register a different user
6. Watch real-time sync in action!

---

## 🗂️ Project Structure

```
symbiotic-task-manager/
├── backend/                    # NestJS backend
│   ├── src/
│   │   ├── auth/              # JWT authentication module
│   │   ├── tasks/             # Task CRUD module
│   │   ├── users/             # User management module
│   │   ├── yjs/               # Yjs WebSocket gateway
│   │   ├── app.module.ts      # Root module
│   │   └── main.ts            # Entry point
│   ├── package.json           # Dependencies + scripts
│   ├── tsconfig.json          # TypeScript config
│   ├── nest-cli.json          # NestJS CLI config
│   └── .env.example           # Environment variables template
│
├── frontend/                   # React + Vite frontend
│   ├── src/
│   │   ├── api/               # API client (axios)
│   │   ├── components/        # React components
│   │   ├── context/           # Auth context
│   │   ├── hooks/             # Custom hooks (useYjs)
│   │   ├── types/             # TypeScript interfaces
│   │   ├── App.tsx            # Root component
│   │   └── main.tsx           # Entry point
│   ├── package.json           # Dependencies + scripts
│   └── vite.config.ts         # Vite build config
│
├── README.md                   # Main documentation
├── PROGRESS.md                 # Completed steps tracker
├── ROADMAP.md                  # Future features roadmap
└── HANDOFF.md                  # This file
```

---

## 🔑 Key Files to Understand

### Backend Critical Files

1. **`backend/src/main.ts`**
   - Application bootstrap
   - CORS configuration
   - Global validation pipes

2. **`backend/src/yjs/yjs.gateway.ts`**
   - WebSocket gateway for CRDTs
   - Room-based document management
   - Real-time sync logic
   - **⚠️ Note**: Uses `@SubscribeMessage('join-room')` for client connections

3. **`backend/src/auth/auth.service.ts`**
   - JWT token generation
   - Password hashing (bcrypt)
   - Login/register logic

4. **`backend/src/tasks/tasks.service.ts`**
   - Task CRUD operations
   - User-scoped filtering (users only see their tasks)

### Frontend Critical Files

1. **`frontend/src/hooks/useYjs.ts`**
   - Yjs CRDT integration
   - Socket.IO connection
   - Real-time task synchronization
   - **⚠️ Known Issue**: Tasks are synced via Yjs but also persisted to API (dual write)

2. **`frontend/src/context/AuthContext.tsx`**
   - Global authentication state
   - localStorage token persistence
   - Login/logout methods

3. **`frontend/src/components/TaskList.tsx`**
   - Main task management UI
   - Combines API calls with Yjs updates

---

## 🐛 Known Issues & TODOs

### Issues to Fix

1. **Yjs Sync Strategy**
   - **Problem**: Currently doing dual write (API + Yjs)
   - **Impact**: Potential race conditions
   - **Fix**: Choose one source of truth (recommend: API persists, Yjs only for real-time sync)
   - **Location**: `frontend/src/components/TaskList.tsx` lines 20-40

2. **Error Handling**
   - **Problem**: Limited error feedback in UI
   - **Impact**: Users don't know why operations fail
   - **Fix**: Add toast notifications or error modals
   - **Location**: All components

3. **Authentication UX**
   - **Problem**: No "remember me" option
   - **Impact**: Users logged out on browser close
   - **Fix**: Add persistent session option
   - **Location**: `frontend/src/context/AuthContext.tsx`

### Security TODOs

1. **JWT Secret**
   - Currently using hardcoded secret: `your-secret-key-change-in-production`
   - **Fix**: Create `.env` file with `JWT_SECRET=<random-string>`
   - **Location**: `backend/src/auth/auth.module.ts` line 13

2. **CORS Configuration**
   - Currently allows `http://localhost:5173` only
   - **Fix**: Add production frontend URL when deploying
   - **Location**: `backend/src/main.ts` line 9

3. **Rate Limiting**
   - No protection against brute-force login attempts
   - **Fix**: Add @nestjs/throttler
   - **Location**: `backend/src/auth/auth.controller.ts`

---

## 📊 Database Schema

### User Table
```typescript
{
  id: string (uuid, primary key)
  email: string (unique)
  username: string
  password: string (bcrypt hashed)
  createdAt: Date
}
```

### Task Table
```typescript
{
  id: string (uuid, primary key)
  title: string
  description: string (nullable)
  completed: boolean (default: false)
  priority: number (default: 0, for future ML)
  createdAt: Date
  updatedAt: Date
  userId: string (foreign key → User.id)
}
```

### To View Database
```bash
# Install SQLite CLI (if needed)
brew install sqlite

# Open database
cd ~/Downloads/symbiotic-task-manager/backend
sqlite3 symbiotic-tasks.db

# View tables
.tables

# View users
SELECT * FROM users;

# View tasks
SELECT * FROM tasks;

# Exit
.quit
```

---

## 🧪 Testing the Application

### Manual Testing Checklist

**Authentication:**
- [ ] Register a new user
- [ ] Login with correct credentials
- [ ] Login with wrong credentials (should fail)
- [ ] Logout
- [ ] Token persists after page refresh

**Task Management:**
- [ ] Create a new task
- [ ] Edit task title/description
- [ ] Toggle task completion
- [ ] Delete a task
- [ ] Tasks persist after page refresh

**Real-time Collaboration:**
- [ ] Open two browser windows
- [ ] Register different users in each
- [ ] Create a task in window 1
- [ ] Verify it appears in window 2 (real-time)
- [ ] Edit task in window 2
- [ ] Verify changes reflect in window 1

---

## 🛠️ Common Development Tasks

### Add a New API Endpoint

1. **Create DTO** (if needed):
   ```typescript
   // backend/src/tasks/dto/index.ts
   export class NewFeatureDto {
     @IsString()
     fieldName: string;
   }
   ```

2. **Add Service Method**:
   ```typescript
   // backend/src/tasks/tasks.service.ts
   async newMethod(data: NewFeatureDto) {
     // Business logic here
   }
   ```

3. **Add Controller Route**:
   ```typescript
   // backend/src/tasks/tasks.controller.ts
   @Post('new-endpoint')
   newEndpoint(@Body() dto: NewFeatureDto, @Request() req) {
     return this.tasksService.newMethod(dto);
   }
   ```

4. **Update Frontend API Client**:
   ```typescript
   // frontend/src/api/tasks.ts
   async newFeature(data: NewFeatureDto): Promise<Response> {
     const response = await apiClient.post('/tasks/new-endpoint', data);
     return response.data;
   }
   ```

### Add a New React Component

1. **Create Component File**:
   ```typescript
   // frontend/src/components/NewFeature.tsx
   export function NewFeature() {
     return <div>New Feature</div>;
   }
   ```

2. **Import in App**:
   ```typescript
   // frontend/src/App.tsx
   import { NewFeature } from './components/NewFeature';
   ```

3. **Add Styling** (if needed):
   ```css
   /* frontend/src/App.css */
   .new-feature { ... }
   ```

---

## 🚢 Next Feature to Build

**Recommended**: Start with Phase 5 (Neo4j Graph Database)

### Why?
- Visually impressive for portfolio
- Demonstrates graph DB skills
- Builds on existing task structure
- Clear deliverable: "Task Contagion" visualization

### Implementation Steps

1. **Set up Neo4j**:
   ```bash
   # Sign up for Neo4j Aura free tier
   https://console.neo4j.io/

   # Get connection credentials
   # Add to backend/.env:
   NEO4J_URI=neo4j+s://xxx.databases.neo4j.io
   NEO4J_USERNAME=neo4j
   NEO4J_PASSWORD=xxx
   ```

2. **Install Neo4j Driver**:
   ```bash
   cd backend
   npm install neo4j-driver
   ```

3. **Create Graph Module**:
   ```bash
   cd backend/src
   mkdir graph
   # Create graph.service.ts, graph.module.ts
   ```

4. **Add Task Dependencies**:
   - Add `dependsOn` field to Task entity (array of task IDs)
   - Update TasksService to handle dependencies
   - Create graph nodes/relationships in Neo4j

5. **Build Visualization**:
   ```bash
   cd frontend
   npm install d3 @types/d3
   ```
   - Create `TaskGraph.tsx` component
   - Fetch graph data from Neo4j
   - Render force-directed graph

**Estimated Time**: 1-2 weeks

---

## 📞 Getting Help

### If Stuck on Backend
- **NestJS Docs**: https://docs.nestjs.com/
- **TypeORM Docs**: https://typeorm.io/
- **Yjs Docs**: https://docs.yjs.dev/

### If Stuck on Frontend
- **React Docs**: https://react.dev/
- **Vite Docs**: https://vitejs.dev/
- **Socket.IO Client Docs**: https://socket.io/docs/v4/client-api/

### If Stuck on Yjs
- **Yjs Guide**: https://docs.yjs.dev/getting-started/
- **Shared Editing Explained**: https://github.com/yjs/yjs#Yjs-CRDT-Algorithm

---

## 🎯 Session Resumption Checklist

When resuming development (or a new Claude session):

1. [ ] Read this HANDOFF.md file completely
2. [ ] Review PROGRESS.md to see what's done
3. [ ] Review ROADMAP.md to see what's next
4. [ ] Check README.md for architecture overview
5. [ ] Start backend and frontend servers
6. [ ] Test the current functionality
7. [ ] Pick next feature from ROADMAP.md
8. [ ] Update PROGRESS.md as you build
9. [ ] Update this HANDOFF.md with any new insights

---

## 💾 Backup Reminder

**Before making major changes:**
```bash
# Create a backup
cd ~/Downloads
tar -czf symbiotic-task-manager-backup-$(date +%Y%m%d).tar.gz symbiotic-task-manager/

# Or use Git
cd symbiotic-task-manager
git init
git add .
git commit -m "Phase 1-3 complete - pre-Neo4j"
```

---

## 🎓 Learning Resources for Next Phases

**Neo4j**:
- Free Course: https://graphacademy.neo4j.com/
- Cypher Query Language: https://neo4j.com/docs/cypher-manual/

**Elixir/Phoenix**:
- Official Guide: https://hexdocs.pm/phoenix/
- Free Book: https://www.phoenixframework.org/

**Machine Learning**:
- Scikit-learn: https://scikit-learn.org/stable/
- FastAPI: https://fastapi.tiangolo.com/

**WebRTC**:
- MDN Guide: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API

---

**Last Updated**: January 20, 2026
**Status**: Ready for Phase 4+ 🚀
**Next Session**: Start with Neo4j integration (Phase 5)
