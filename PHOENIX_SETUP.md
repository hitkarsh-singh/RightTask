# Phoenix WebSocket Migration - Setup & Testing Guide

## Overview

This guide covers the Phoenix/Elixir WebSocket implementation for the Symbiotic Task Manager. The Phoenix server handles real-time collaboration via WebSockets while NestJS continues to serve the REST API.

## Architecture

```
React Frontend ──HTTP──> NestJS (port 3000) ──> SQLite + Neo4j
              └──WS───> Phoenix (port 4000)
```

## Prerequisites

- Elixir 1.19+ and Erlang/OTP 28+
- Phoenix 1.8+
- Node.js 18+
- Running NestJS backend (port 3000)

## Installation Verification

Check your Elixir and Phoenix installations:

```bash
elixir --version
# Expected: Elixir 1.19.5 (compiled with Erlang/OTP 28)

mix phx.new --version
# Expected: Phoenix installer v1.8.3
```

## Local Development Setup

### 1. Start Phoenix Server

```bash
cd phoenix
mix phx.server
```

You should see:
```
[info] Running RightTaskWeb.Endpoint with Bandit 1.10.1 at 127.0.0.1:4000 (http)
```

### 2. Start NestJS Backend (Separate Terminal)

```bash
cd backend
npm run start:dev
```

### 3. Start React Frontend (Separate Terminal)

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Testing Real-Time Sync

### Manual Testing

1. Open the app in two browser tabs/windows
2. Create a task in Tab 1
3. Verify the task appears instantly in Tab 2
4. Edit the task in Tab 2
5. Verify changes appear in Tab 1

### WebSocket Connection Testing

Open browser DevTools Console and verify:

```
🔗 Joined Phoenix room: task-list-1
```

If you see connection errors, check:
- Phoenix server is running on port 4000
- CORS is properly configured
- `.env` file has correct `VITE_PHOENIX_URL`

## Project Structure

### Phoenix Backend (`phoenix/`)

```
lib/
├── right_task/
│   ├── application.ex           # OTP application supervisor tree
│   └── yjs/
│       ├── room_server.ex       # GenServer managing Y.Doc state per room
│       └── room_supervisor.ex   # DynamicSupervisor for room processes
│
└── right_task_web/
    ├── channels/
    │   ├── user_socket.ex       # Socket configuration
    │   └── yjs_channel.ex       # Channel handling WebSocket messages
    ├── endpoint.ex              # HTTP/WebSocket endpoint config
    ├── presence.ex              # Phoenix Presence for user tracking
    └── router.ex                # HTTP routes (minimal)

config/
├── config.exs                   # Base config
├── dev.exs                      # Development config (port 4000)
├── prod.exs                     # Production config
└── runtime.exs                  # Runtime config
```

### Frontend Integration (`frontend/`)

```
src/
└── hooks/
    ├── useYjs.ts               # Original Socket.IO hook (legacy)
    └── usePhoenixYjs.ts        # New Phoenix hook
```

## Environment Variables

### Frontend `.env`

```env
VITE_PHOENIX_URL=ws://localhost:4000/socket
VITE_API_URL=http://localhost:3000
```

### Production (Netlify)

```env
VITE_PHOENIX_URL=wss://righttask-phoenix.fly.dev/socket
VITE_API_URL=https://righttask-production.up.railway.app
```

## Migration Steps (When Ready)

To switch from NestJS WebSockets to Phoenix:

### 1. Update Component Import

**Before:**
```typescript
import { useYjs } from '../hooks/useYjs';
```

**After:**
```typescript
import { usePhoenixYjs as useYjs } from '../hooks/usePhoenixYjs';
```

### 2. Redeploy Frontend

The hook API is identical, so no other code changes needed.

## Rollback Strategy

If issues occur, revert the import:

```typescript
import { useYjs } from '../hooks/useYjs';
```

Redeploy frontend. No database changes needed (Y.Doc is ephemeral).

## Key Features Implemented

✅ Real-time collaborative editing via Yjs CRDT
✅ Room-based isolation (each room has its own GenServer)
✅ Automatic room cleanup (1 minute after last connection leaves)
✅ Process monitoring (connections tracked and cleaned up on disconnect)
✅ Phoenix Presence for user tracking
✅ CORS configuration for localhost and production
✅ Binary-efficient Yjs updates over WebSocket

## Important Files Reference

| File | Purpose |
|------|---------|
| `phoenix/lib/right_task/yjs/room_server.ex` | Room state GenServer - manages Y.Doc updates |
| `phoenix/lib/right_task_web/channels/yjs_channel.ex` | WebSocket channel - handles client connections |
| `frontend/src/hooks/usePhoenixYjs.ts` | Frontend Phoenix client hook |
| `phoenix/config/dev.exs` | Local development configuration |

## Troubleshooting

### Phoenix server won't start

```bash
# Check if port 4000 is in use
lsof -i :4000

# Recompile dependencies
cd phoenix
mix deps.clean --all
mix deps.get
mix compile
```

### Frontend can't connect to Phoenix

1. Check Phoenix server is running: `http://localhost:4000`
2. Verify `.env` file exists in `frontend/` with correct URL
3. Check browser console for WebSocket errors
4. Verify CORS origins in `phoenix/lib/right_task_web/endpoint.ex`

### Tasks not syncing

1. Open DevTools Console in both tabs
2. Look for "🔗 Joined Phoenix room" message
3. Check for any error messages
4. Verify both tabs are using the same room ID

## Performance Characteristics

### Expected Capacity

- **Concurrent connections**: 10,000+ (vs ~1,000 with NestJS)
- **Memory per room**: ~1-2 MB
- **Message latency**: <50ms local, <200ms cross-continent

### Scaling Notes

- Each room runs in isolated GenServer (fault tolerance)
- Rooms auto-cleanup after 1 minute of inactivity
- Can distribute across multiple Phoenix nodes using Phoenix.PubSub
- Binary Yjs updates are ~10x smaller than JSON

## Next Steps

### Week 3: Production Deployment (Fly.io)

See the main migration plan for:
- Fly.io deployment steps
- Production configuration
- Benchmarking with Artillery
- Monitoring and logs

### Production Checklist

- [ ] Phoenix deployed to Fly.io
- [ ] Environment variables set in Netlify
- [ ] SSL/TLS working (wss://)
- [ ] CORS origins updated for production domain
- [ ] Benchmark tests completed
- [ ] Monitoring/logging configured

## Resources

- [Phoenix Channels Guide](https://hexdocs.pm/phoenix/channels.html)
- [Phoenix Presence](https://hexdocs.pm/phoenix/presence.html)
- [Yjs Documentation](https://docs.yjs.dev/)
- [Phoenix JavaScript Client](https://hexdocs.pm/phoenix/js/)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Phoenix server logs: `cd phoenix && mix phx.server`
3. Check browser console for client-side errors
4. Verify all three services are running (Phoenix, NestJS, React)
