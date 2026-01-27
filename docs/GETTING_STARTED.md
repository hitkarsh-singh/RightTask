# 🎬 Getting Started with Symbiotic Task Manager

Welcome! This guide will get you up and running with your new real-time collaborative task manager in minutes.

---

## ⚡ Quick Start (3 Steps)

### 1. Open Two Terminal Windows

**Terminal 1 - Backend Server:**
```bash
cd ~/Downloads/symbiotic-task-manager/backend
npm run start:dev
```

You should see:
```
🚀 Symbiotic Task Manager API running on http://localhost:3000
```

**Terminal 2 - Frontend Server:**
```bash
cd ~/Downloads/symbiotic-task-manager/frontend
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 2. Open Your Browser

Navigate to: **http://localhost:5173**

### 3. Create Your First Account

1. Click **"Register"**
2. Fill in:
   - Email: `test@example.com`
   - Username: `testuser`
   - Password: `password123`
3. Click **"Register"**

You're in! 🎉

---

## 🧪 Testing Real-Time Collaboration

The magic of this app is **CRDT-based real-time sync**. Here's how to test it:

### Method 1: Two Browser Windows

1. **Keep your current window open** (logged in as `testuser`)
2. **Open a new incognito/private window**: http://localhost:5173
3. **Register a second user**:
   - Email: `demo@example.com`
   - Username: `demouser`
   - Password: `demo123`
4. **In the first window**: Create a task "Test Task"
5. **Watch the second window**: The task appears instantly! ✨

### Method 2: Two Different Browsers

1. **Chrome**: Login as user 1
2. **Firefox/Safari**: Login as user 2
3. **Create/edit/delete tasks in either**
4. **Watch them sync in real-time**

---

## 📝 What to Try

### Basic Features
- ✅ Create a task with title and description
- ✅ Mark a task as complete (click the button)
- ✅ Edit a task (currently requires recreating - edit feature in roadmap)
- ✅ Delete a task (click the trash icon)
- ✅ Logout and login again (your tasks persist!)

### Real-Time Collaboration
- ✅ Open two users simultaneously
- ✅ Create a task in one window → see it appear in the other
- ✅ Toggle completion in one → see update in the other
- ✅ Delete in one → see removal in the other

### Authentication
- ✅ Try logging in with wrong password (should fail)
- ✅ Logout and see tasks disappear
- ✅ Login again and see tasks return
- ✅ Refresh page while logged in (should stay logged in)

---

## 🎯 Project Structure Overview

```
symbiotic-task-manager/
│
├── README.md              # Project overview
├── GETTING_STARTED.md     # This file
├── PROGRESS.md            # What's been built
├── ROADMAP.md             # Future features
├── HANDOFF.md             # Developer guide
├── DEPLOYMENT.md          # How to deploy
│
├── backend/               # NestJS API
│   ├── src/
│   │   ├── auth/         # Login/register
│   │   ├── tasks/        # Task CRUD
│   │   ├── users/        # User management
│   │   └── yjs/          # Real-time sync
│   └── package.json
│
└── frontend/              # React app
    ├── src/
    │   ├── components/   # UI components
    │   ├── api/          # Backend API calls
    │   ├── hooks/        # useYjs (real-time)
    │   └── context/      # Auth state
    └── package.json
```

---

## 🔧 Common Issues & Solutions

### Backend won't start

**Error**: `Port 3000 already in use`

**Solution**:
```bash
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>

# Or use a different port
PORT=3001 npm run start:dev
```

---

### Frontend can't connect to backend

**Symptom**: Login fails with network error

**Check**:
1. Is backend running on port 3000?
   ```bash
   curl http://localhost:3000
   # Should respond (not error)
   ```

2. Check frontend API URL:
   ```typescript
   // frontend/src/api/client.ts
   const API_BASE_URL = 'http://localhost:3000'; // Should be this
   ```

---

### Real-time sync not working

**Symptom**: Tasks don't appear in other windows

**Check**:
1. Are both users logged in to different accounts?
2. Is backend console showing WebSocket connections?
   ```
   🔗 Client connected: abc123
   ```

3. Open browser console (F12) and check for WebSocket errors

---

### Database errors

**Symptom**: Backend crashes on startup

**Solution**:
```bash
# Delete the database and start fresh
cd backend
rm symbiotic-tasks.db

# Restart backend
npm run start:dev
```

---

## 🎓 Understanding the Tech

### What is a CRDT?

**CRDT** = Conflict-free Replicated Data Type

- **Problem**: When multiple users edit the same data, who wins?
- **Old Solution**: "Last write wins" (someone's changes get lost)
- **CRDT Solution**: All changes merge automatically, no conflicts!

**How Yjs Works**:
1. User A creates a task → Yjs creates an "operation"
2. User B creates a task → Yjs creates another "operation"
3. Operations sync via WebSocket
4. Yjs merges them conflict-free
5. Both users see both tasks! ✨

### Tech Stack Explained

| Technology | What It Does |
|-----------|-------------|
| **React** | Builds the user interface |
| **Vite** | Fast build tool and dev server |
| **NestJS** | Backend API framework (like Express, but organized) |
| **TypeScript** | JavaScript with types (fewer bugs!) |
| **Yjs** | CRDT library for real-time sync |
| **Socket.IO** | WebSocket library for real-time communication |
| **TypeORM** | Database ORM (talks to SQLite for us) |
| **SQLite** | Lightweight database (just a file) |
| **JWT** | Secure authentication tokens |

---

## 📚 Next Steps

### Learn More
1. **Read PROGRESS.md** to see exactly what was built
2. **Read ROADMAP.md** to see future features
3. **Read HANDOFF.md** if you want to contribute

### Add Your Own Features
Want to build something new? Check out:
- **ROADMAP.md** for ideas (Neo4j graphs, ML, etc.)
- **HANDOFF.md** for development guide

### Deploy It
Ready to show the world? See **DEPLOYMENT.md**

---

## 🆘 Getting Help

### Documentation
- [NestJS Docs](https://docs.nestjs.com/)
- [React Docs](https://react.dev/)
- [Yjs Guide](https://docs.yjs.dev/)

### Debugging Tips
1. **Always check browser console** (F12)
2. **Check backend terminal** for errors
3. **Use `console.log`** liberally to debug
4. **Read error messages carefully** - they're helpful!

---

## 🎉 You're All Set!

You now have a fully functional real-time collaborative task manager running locally.

**What you've learned:**
- ✅ Real-time collaboration with CRDTs
- ✅ WebSocket communication
- ✅ JWT authentication
- ✅ Fullstack TypeScript development

**Next challenges:**
- Deploy to production (DEPLOYMENT.md)
- Add Neo4j graph visualization (ROADMAP.md)
- Build an ML feature (ROADMAP.md)

---

Happy coding! 🚀

**Last Updated**: January 20, 2026
