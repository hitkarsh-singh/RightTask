# 🗺️ Feature Roadmap

This roadmap outlines the future evolution of the Symbiotic Task Manager from the current MVP to the full vision of a CRDT-based, ML-powered, graph-visualized collaboration hub.

---

## ✅ Phase 1-3: MVP Foundation (COMPLETED)

- [x] Basic task manager (CRUD)
- [x] CRDT-based real-time collaboration (Yjs)
- [x] JWT authentication
- [x] NestJS backend + React frontend
- [x] SQLite database
- [x] WebSocket synchronization
- [x] Modern UI with responsive design

---

## 🚀 Phase 4: Elixir/Phoenix Integration

**Goal**: Add Elixir/Phoenix as a dedicated real-time service for massive WebSocket scalability.

### Architecture Changes
```
┌─────────────┐         ┌──────────────┐         ┌─────────────────┐
│   React     │────────▶│    NestJS    │────────▶│     SQLite      │
│  Frontend   │         │  (REST API)  │         │   (Persistent)  │
└─────────────┘         └──────────────┘         └─────────────────┘
       │
       │ WebSocket
       ▼
┌─────────────────────┐
│ Elixir/Phoenix      │ ← Handles millions of concurrent connections
│ (WebSocket Pub/Sub) │
└─────────────────────┘
```

### Tasks
- [ ] Install Elixir/Phoenix locally
- [ ] Create Phoenix Channels for task rooms
- [ ] Implement presence tracking (who's online)
- [ ] Migrate Yjs WebSocket from NestJS to Phoenix
- [ ] Add Phoenix pub/sub for cross-server scaling
- [ ] Deploy Phoenix to Fly.io free tier
- [ ] Benchmark: NestJS vs Phoenix WebSocket throughput

### Why Elixir/Phoenix?
- **Concurrency**: Built on BEAM VM, handles millions of connections
- **Fault Tolerance**: Supervisor trees for self-healing systems
- **Low Latency**: Microsecond message passing
- **Learning**: Explore functional programming and actor model

---

## ✅ Phase 5: Neo4j Graph Database (COMPLETED)

**Goal**: Add graph database to model task dependencies and visualize task relationships.

**Status**: ✅ MVP Completed (January 2026)

### Graph Schema (Implemented)
```cypher
// Nodes
(User)-[:OWNS]->(Task)
(Task)-[:DEPENDS_ON]->(Task)

// Constraints
CREATE CONSTRAINT task_id FOR (t:Task) REQUIRE t.id IS UNIQUE;
CREATE CONSTRAINT user_id FOR (u:User) REQUIRE u.id IS UNIQUE;
```

### Features Completed
- [x] Install Neo4j Aura (free tier)
- [x] Create graph schema for tasks/users
- [x] Add dependency tracking to Task entity (dependencyIds, dueDate, estimatedHours)
- [x] Implement Neo4j service with connection pooling
- [x] Build GraphSyncService for dual database synchronization
- [x] Add event-driven graph sync (create/update/delete tasks)
- [x] Implement cycle detection algorithm
- [x] Create DependenciesService with validation
- [x] Build REST API for dependency management
- [x] D3.js force-directed graph visualization
- [x] Interactive dependency editor in task cards
- [x] Real-time graph updates
- [x] Color-coded nodes (green=completed, blue=active, purple=selected)
- [x] Interactive features (drag nodes, hover tooltips, click to select)

### Features Deferred to Phase 5.5
- [ ] Task contagion animation with ripple effects
- [ ] Critical path detection (requires estimatedHours usage)
- [ ] BLOCKS relationship (inverse of DEPENDS_ON)
- [ ] Team skill graph (User)-[:HAS_SKILL]->(Skill)
- [ ] Recommendation engine: "Who should work on this task?"
- [ ] Impact analysis dashboard

---

## 🤖 Phase 6: ML-Powered Features

**Goal**: Use machine learning for intelligent task prioritization and scheduling.

### 6.1: Priority Prediction Model

**Backend**: Python FastAPI service
```python
# Features for training
- Task title (NLP embeddings)
- Historical completion time
- User's past task velocity
- Task dependencies
- Time of day created
- User's skill overlap
```

**Tasks**:
- [ ] Collect historical task data (completion times, user behavior)
- [ ] Build FastAPI service for ML predictions
- [ ] Train scikit-learn model for priority scoring
- [ ] Deploy ML service to Railway/Fly.io
- [ ] Add `predictedPriority` field to Task entity
- [ ] Create background job to re-score tasks daily

### 6.2: Focus-Time Scheduler

**Goal**: Analyze user calendar + productivity patterns to auto-schedule deep work blocks.

**Tasks**:
- [ ] Integrate Google Calendar API
- [ ] Track task completion timestamps
- [ ] Identify "focus time" patterns (when user is most productive)
- [ ] Auto-suggest task scheduling in calendar
- [ ] Add "Auto-Schedule My Day" button in UI

### 6.3: Client-Side Inference (TensorFlow.js)

**Goal**: Run lightweight ML models in the browser for instant predictions.

**Tasks**:
- [ ] Convert priority model to TensorFlow.js
- [ ] Implement browser-based inference
- [ ] Add "instant priority suggestions" while typing task title
- [ ] Cache model in browser for offline use

---

## 🎧 Phase 7: Peer-to-Peer Energy Stream

**Goal**: Add WebRTC-based "co-working" audio channel for remote team presence.

### Features
- [ ] Implement WebRTC peer-to-peer audio connections
- [ ] Create "Energy Stream" toggle in UI
- [ ] Add mute/unmute controls
- [ ] Implement spatial audio (users "sit" in virtual room)
- [ ] Add ambient background noise options (café, office, nature)
- [ ] Build presence indicators (who's in the stream)

### Privacy
- [ ] End-to-end encrypted audio
- [ ] Optional "focus mode" (audio-only, no video)
- [ ] Do Not Disturb status

---

## 🎨 Phase 8: Advanced Visualizations

### 8.1: Task Contagion Heatmap
- [ ] Build time-series heatmap showing how task delays spread
- [ ] Add slider to "rewind" and see historical contagion
- [ ] Animate infection spread on graph

### 8.2: Team Energy Dashboard
- [ ] Track active hours per user
- [ ] Visualize team "energy" as a living graph
- [ ] Show collective focus time vs. meeting time
- [ ] Add "team health score"

### 8.3: Skill Matrix
- [ ] Build interactive skill vs. team member matrix
- [ ] Highlight skill gaps in the team
- [ ] Suggest training based on upcoming task requirements

---

## 🌐 Phase 9: Deployment & Scaling

### Free-Tier Deployment Plan

| Service | Platform | Purpose |
|---------|----------|---------|
| Frontend | Netlify | Static hosting with CI/CD |
| NestJS API | Koyeb | RESTful API container |
| Elixir/Phoenix | Fly.io | WebSocket pub/sub |
| ML Service | Railway | Python FastAPI container |
| SQLite → Postgres | Turso | Distributed edge database |
| Neo4j | Neo4j Aura | Hosted graph database |

### Tasks
- [ ] Set up Netlify deployment (frontend)
- [ ] Dockerize NestJS and deploy to Koyeb
- [ ] Deploy Elixir/Phoenix to Fly.io
- [ ] Migrate from SQLite to Turso (edge-replicated)
- [ ] Set up CI/CD pipelines (GitHub Actions)
- [ ] Add environment-specific configs (dev/staging/prod)
- [ ] Implement database migrations (Flyway or TypeORM)

---

## 🔐 Phase 10: Advanced Security & Features

### Security Enhancements
- [ ] Add rate limiting (Redis + NestJS Throttler)
- [ ] Implement CSRF protection
- [ ] Add OAuth2 login (Google, GitHub)
- [ ] Implement row-level security for multi-tenancy
- [ ] Add audit logs for task changes
- [ ] Encrypt sensitive task fields at rest

### Advanced Features
- [ ] Recurring tasks (cron-based)
- [ ] Task templates
- [ ] Bulk operations (multi-select, batch edit)
- [ ] Advanced filtering (by priority, date, tags)
- [ ] Export tasks (CSV, JSON)
- [ ] Import tasks from Trello, Asana, etc.
- [ ] Mobile app (React Native)

---

## 📚 Phase 11: Documentation & Community

### Documentation
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Architecture decision records (ADRs)
- [ ] Video walkthroughs of key features
- [ ] Blog posts explaining CRDT architecture
- [ ] Performance benchmarks (Yjs, Elixir, ML)

### Community
- [ ] Open-source on GitHub
- [ ] Add contribution guidelines
- [ ] Create Discord/Slack community
- [ ] Write tutorials for building similar apps

---

## 🎯 Prioritization Strategy

**Next 3 Features to Build**:
1. **Neo4j Graph Database** (Phase 5)
   - Visual impact is huge for portfolio
   - Demonstrates full-stack + graph DB skills

2. **Elixir/Phoenix** (Phase 4)
   - Shows polyglot architecture
   - Demonstrates understanding of scale

3. **ML Priority Prediction** (Phase 6.1)
   - Adds intelligence to the app
   - Simple to implement with scikit-learn

**Long-term**:
- WebRTC energy stream (novel, attention-grabbing)
- Full deployment to free tiers (makes it shareable)

---

## 💡 Original Vision

> **"The Symbiotic Task Manager"**: A task manager that auto-prioritizes using ML, syncs conflict-free via CRDTs, and visualizes team energy as a living graph.

We've built the **foundation** (Phases 1-3). This roadmap brings the **full vision** to life.

---

## 📊 Complexity Estimates

| Phase | Complexity | Time Estimate | Learning Value |
|-------|-----------|---------------|----------------|
| Phase 4 (Elixir) | High | 2-3 weeks | ⭐⭐⭐⭐⭐ |
| Phase 5 (Neo4j) | Medium | 1-2 weeks | ⭐⭐⭐⭐ |
| Phase 6.1 (ML) | Medium | 1 week | ⭐⭐⭐⭐ |
| Phase 6.2 (Scheduler) | Medium | 1 week | ⭐⭐⭐ |
| Phase 7 (WebRTC) | High | 2 weeks | ⭐⭐⭐⭐⭐ |
| Phase 8 (Viz) | Medium | 1 week | ⭐⭐⭐ |
| Phase 9 (Deploy) | Low | 3-4 days | ⭐⭐⭐ |

---

**Last Updated**: January 20, 2026
**Current Phase**: 1-3 Complete, Ready for Phase 4 🚀
