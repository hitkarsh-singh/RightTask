# Complete Deployment Guide - All Phases

This guide deploys the entire Symbiotic Task Manager including:
- ✅ **Phase 1-3**: React + NestJS + SQLite (MVP)
- ✅ **Phase 4**: Phoenix WebSocket Server
- ✅ **Phase 5**: Neo4j Graph Database

## Current Infrastructure (Already Setup)

| Service | Platform | Status | URL |
|---------|----------|--------|-----|
| Frontend | Netlify | ✅ Deployed | https://righttask.netlify.app |
| Backend API | Railway | ✅ Deployed | https://righttask-production.up.railway.app |
| Neo4j | Neo4j Aura | ✅ Connected | (credentials in Railway) |
| Phoenix | **Not deployed** | ❌ Pending | Will deploy to Fly.io |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│           Browser (righttask.netlify.app)       │
└────────────┬─────────────────┬──────────────────┘
             │                 │
      HTTP   │                 │ WebSocket
             ▼                 ▼
   ┌──────────────┐   ┌──────────────────┐
   │   NestJS     │   │  Phoenix (NEW!)  │
   │  (Railway)   │   │   (Fly.io)       │
   └──────┬───────┘   └──────────────────┘
          │
          ├──> SQLite (Railway volume)
          └──> Neo4j Aura
```

---

## Phase 4: Deploy Phoenix to Fly.io

### Prerequisites
- ✅ Phoenix app compiles locally
- ✅ Phoenix WebSocket working locally
- [ ] Fly.io account created
- [ ] Fly CLI installed

### Step 1: Install Fly CLI (if not already)

```bash
brew install flyctl
flyctl auth login
```

### Step 2: Initialize Fly App

```bash
cd phoenix
flyctl launch --no-deploy
```

**Prompts:**
- App name: `righttask-phoenix` (or your choice)
- Region: `iad` (US East - same as Railway for low latency)
- PostgreSQL: **No**
- Deploy now: **No**

This creates `fly.toml` configuration.

### Step 3: Generate and Set Secrets

```bash
# Generate secret key
mix phx.gen.secret

# Set environment variables
flyctl secrets set SECRET_KEY_BASE="<paste-generated-secret>"
flyctl secrets set PHX_HOST="righttask-phoenix.fly.dev"
flyctl secrets set PHX_SERVER=true
```

### Step 4: Configure fly.toml

Edit `phoenix/fly.toml`:

```toml
app = "righttask-phoenix"
primary_region = "iad"

[build]

[env]
  PHX_HOST = "righttask-phoenix.fly.dev"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

  [http_service.concurrency]
    type = "connections"
    hard_limit = 1000
    soft_limit = 1000

[[vm]]
  memory = '1gb'
  cpu_kind = 'shared'
  cpus = 1
```

### Step 5: Deploy Phoenix

```bash
flyctl deploy
```

**Expected output:**
```
==> Building image
...
==> Pushing image to fly
...
==> Deploying
 ✔ Instance started
 ✔ Health checks passing
```

### Step 6: Verify Phoenix Deployment

```bash
# Check status
flyctl status

# View logs
flyctl logs

# Test WebSocket endpoint
curl https://righttask-phoenix.fly.dev
```

Your Phoenix server is now live at:
- **HTTP**: `https://righttask-phoenix.fly.dev`
- **WebSocket**: `wss://righttask-phoenix.fly.dev/socket`

---

## Update Frontend to Use Phoenix

### Option 1: Update Netlify Environment Variables

Go to Netlify Dashboard → Your Site → Site Settings → Environment Variables:

**Add/Update:**
```
VITE_PHOENIX_URL=wss://righttask-phoenix.fly.dev/socket
VITE_API_URL=https://righttask-production.up.railway.app
```

**Redeploy:**
- Go to Deploys tab
- Click "Trigger deploy" → "Deploy site"

### Option 2: Update via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Link to your site
netlify link

# Set environment variables
netlify env:set VITE_PHOENIX_URL wss://righttask-phoenix.fly.dev/socket
netlify env:set VITE_API_URL https://righttask-production.up.railway.app

# Trigger rebuild
netlify deploy --prod
```

---

## Configure Neo4j in Production

### Railway (Backend) Environment Variables

Your Neo4j Aura credentials should already be set in Railway. Verify:

```
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=<your-password>
```

If not set, add them in Railway:
1. Go to Railway Dashboard → Your NestJS Project
2. Click "Variables" tab
3. Add the three Neo4j variables
4. Railway will auto-redeploy

---

## Local Development Setup

### Backend .env (for local testing)

Create `backend/.env`:

```env
# Application
PORT=3000

# JWT
JWT_SECRET=your-local-secret-key

# Neo4j (use your Aura credentials)
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=<your-password>
```

### Frontend .env (for local testing)

Create `frontend/.env`:

```env
# Phoenix WebSocket (local)
VITE_PHOENIX_URL=ws://localhost:4000/socket

# NestJS API (local)
VITE_API_URL=http://localhost:3000
```

---

## Testing Checklist

### Local Testing (Before Deployment)

- [ ] Phoenix server starts: `cd phoenix && mix phx.server`
- [ ] NestJS starts: `cd backend && npm run start:dev`
- [ ] React starts: `cd frontend && npm run dev`
- [ ] Open http://localhost:5173 in two tabs
- [ ] Create task in Tab 1, appears in Tab 2 instantly
- [ ] Neo4j features work (graph visualization)
- [ ] No console errors

### Production Testing (After Deployment)

- [ ] Visit https://righttask.netlify.app
- [ ] Open DevTools Console
- [ ] Look for: `🔗 Joined Phoenix room: main-room`
- [ ] Create account / login
- [ ] Create tasks
- [ ] Open second tab, verify real-time sync
- [ ] Test graph visualization (Neo4j)
- [ ] Check Network tab: WebSocket connection to `wss://righttask-phoenix.fly.dev`

---

## Monitoring & Debugging

### Phoenix (Fly.io)

```bash
# View logs
flyctl logs -a righttask-phoenix

# SSH into container
flyctl ssh console -a righttask-phoenix

# Check metrics
flyctl dashboard -a righttask-phoenix

# Scale if needed
flyctl scale memory 2048 -a righttask-phoenix
```

### NestJS (Railway)

```bash
# View logs in Railway Dashboard
# Or use Railway CLI
railway logs
```

### Frontend (Netlify)

```bash
# View deploy logs in Netlify Dashboard
# Or use Netlify CLI
netlify logs
```

---

## Rollback Strategies

### Rollback Phoenix WebSocket

If Phoenix has issues, revert to NestJS WebSocket:

**Option 1: Frontend-only rollback (fastest)**
```bash
# Update Netlify env var
netlify env:set VITE_PHOENIX_URL ""

# Or in TaskList.tsx:
import { useYjs } from '../hooks/useYjs';
```

**Option 2: Keep Phoenix running**
- No need to destroy Phoenix app
- Just switch frontend back to NestJS

### Rollback NestJS Deployment

```bash
# In Railway Dashboard
# Deployments tab → Find previous version → "Redeploy"
```

### Rollback Frontend

```bash
# In Netlify Dashboard
# Deploys tab → Find previous deploy → "Publish deploy"
```

---

## Cost Breakdown

### Current Monthly Costs (All Free Tiers)

| Service | Plan | Cost | Notes |
|---------|------|------|-------|
| Netlify | Free | $0 | 100GB bandwidth, 300 build mins |
| Railway | Hobby | $5/month | 512MB RAM, 1GB disk |
| Neo4j Aura | Free | $0 | Limited storage, perfect for demo |
| **Phoenix (Fly.io)** | **Free** | **$0** | **3 shared VMs** |

**Total: ~$5/month** (Railway only)

### Scaling Costs (If Needed)

| Service | Upgraded Plan | Cost |
|---------|---------------|------|
| Netlify Pro | $19/month | More bandwidth, better support |
| Railway Pro | Variable | Pay per usage (~$10-20/month) |
| Neo4j Aura Pro | $65/month | Production-ready |
| Fly.io | Variable | ~$2/month per 1GB machine |

---

## Performance Expectations

### Phoenix WebSocket

- **Concurrent connections**: 10,000+ (vs ~1,000 with NestJS)
- **Latency**: <50ms local, <200ms global
- **Memory**: ~500 bytes per connection
- **CPU**: Minimal (Erlang BEAM is optimized)

### Benchmarking (Optional)

```bash
# Install Artillery
npm install -g artillery

# Create benchmark.yml
# See PHOENIX_SETUP.md for config

# Test Phoenix
artillery run benchmark.yml --target wss://righttask-phoenix.fly.dev/socket

# Test NestJS (for comparison)
artillery run benchmark.yml --target wss://righttask-production.up.railway.app
```

---

## Troubleshooting

### Phoenix won't deploy to Fly.io

```bash
# Check Dockerfile is generated
ls phoenix/Dockerfile

# If missing, generate it
flyctl launch --no-deploy

# Force rebuild
flyctl deploy --no-cache
```

### Frontend can't connect to Phoenix

1. Check CORS in `phoenix/lib/right_task_web/endpoint.ex`:
   ```elixir
   check_origin: [
     "https://righttask.netlify.app",
     "http://localhost:5173"
   ]
   ```

2. Verify environment variable in Netlify:
   ```
   VITE_PHOENIX_URL=wss://righttask-phoenix.fly.dev/socket
   ```

3. Check browser console for WebSocket errors

### Neo4j not connecting in production

1. Verify Railway environment variables are set
2. Check Neo4j Aura dashboard - instance must be running
3. Check whitelist - Railway IPs should be allowed
4. View NestJS logs in Railway for connection errors

### Frontend build fails on Netlify

```bash
# Common issue: environment variables not set
# Go to Netlify → Site Settings → Environment Variables
# Add all VITE_* variables

# Local test
cd frontend
npm run build
```

---

## Security Checklist

- [ ] **Phoenix**: SECRET_KEY_BASE set via Fly secrets (not in code)
- [ ] **NestJS**: JWT_SECRET set via Railway env vars
- [ ] **Neo4j**: Credentials not in code, Railway env vars only
- [ ] **Frontend**: No secrets in build (all backend calls authenticated)
- [ ] **CORS**: Only allow known origins
- [ ] **HTTPS**: Force HTTPS in production (Netlify, Railway, Fly.io all auto)

---

## CI/CD (Optional Enhancement)

### GitHub Actions for Auto-Deploy

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy All Services

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Netlify
        run: netlify deploy --prod
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_TOKEN }}

  deploy-phoenix:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions@1.3
        with:
          args: "deploy --app righttask-phoenix"
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## Next Steps After Deployment

### Phase 6: ML-Powered Features

- [ ] Build priority prediction model (Python FastAPI)
- [ ] Deploy ML service to Railway/Fly.io
- [ ] Integrate with NestJS backend

### Phase 7: WebRTC Co-working Audio

- [ ] Implement peer-to-peer audio channels
- [ ] Add presence indicators

### Phase 8: Advanced Visualizations

- [ ] Task contagion heatmap
- [ ] Team energy dashboard

See `ROADMAP.md` for full feature roadmap.

---

## Support & Resources

- **Phoenix Deployment**: See `PHOENIX_DEPLOYMENT.md`
- **Local Setup**: See `PHOENIX_SETUP.md`
- **Architecture**: See `HANDOFF.md`
- **Roadmap**: See `ROADMAP.md`

### Community

- [Fly.io Docs](https://fly.io/docs/)
- [Phoenix Forum](https://elixirforum.com/c/phoenix-forum/15)
- [Railway Discord](https://discord.gg/railway)
- [Netlify Community](https://community.netlify.com/)

---

**Last Updated**: January 22, 2026
**Current Status**: Ready for Phoenix deployment
**Estimated Time**: 30-60 minutes for full deployment
