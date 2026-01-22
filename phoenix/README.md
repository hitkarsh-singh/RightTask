# RightTask Phoenix WebSocket Server

This is the Phoenix/Elixir WebSocket server for the Symbiotic Task Manager, handling real-time collaboration at scale.

## Overview

The Phoenix server provides:
- **Real-time sync** via Yjs CRDT (Conflict-free Replicated Data Type)
- **Room-based collaboration** with automatic cleanup
- **Massive scalability** (10,000+ concurrent WebSocket connections)
- **Phoenix Presence** for user tracking
- **Process isolation** with OTP GenServers

## Architecture

```
React Frontend ──HTTP──> NestJS (port 3000) ──> SQLite + Neo4j
              └──WS───> Phoenix (port 4000)
```

Phoenix handles only WebSocket connections. REST API remains in NestJS.

## Quick Start

### Install Dependencies

```bash
mix deps.get
```

### Start Server

```bash
# Development mode with auto-reload
mix phx.server

# Or run inside IEx (Elixir REPL)
iex -S mix phx.server
```

Server will start on: `http://localhost:4000`

WebSocket endpoint: `ws://localhost:4000/socket`

## Project Structure

```
lib/
├── right_task/
│   ├── application.ex           # OTP app supervisor tree
│   └── yjs/
│       ├── room_server.ex       # GenServer managing Y.Doc state per room
│       └── room_supervisor.ex   # DynamicSupervisor for rooms
│
└── right_task_web/
    ├── channels/
    │   ├── user_socket.ex       # WebSocket configuration
    │   └── yjs_channel.ex       # Channel handling messages
    ├── endpoint.ex              # HTTP/WebSocket endpoint
    ├── presence.ex              # Phoenix Presence
    └── router.ex                # HTTP routes

config/
├── dev.exs                      # Development config (port 4000)
├── prod.exs                     # Production config
└── runtime.exs                  # Runtime config (secrets)
```

## How It Works

### Room Management

Each collaboration room runs in its own GenServer process:

1. **Client connects** → `YjsChannel.join/3` is called
2. **Room lookup** → Check if GenServer exists for room ID
3. **Create if needed** → `RoomSupervisor` starts new `RoomServer`
4. **Track connection** → Add client PID to room's connection set
5. **Send state** → Return current Y.Doc state to client
6. **Monitor process** → Automatically cleanup on disconnect

### Message Flow

```
Client Update → Channel → RoomServer → Broadcast → All Other Clients
                               ↓
                        Store in Y.Doc state
```

### Automatic Cleanup

Rooms shut down 1 minute after last user disconnects:

```elixir
# lib/right_task/yjs/room_server.ex
def handle_info(:shutdown_if_empty, state) do
  if MapSet.size(state.connections) == 0 do
    Logger.info("🧹 Shutting down empty room: #{state.room_id}")
    {:stop, :normal, state}
  else
    {:noreply, state}
  end
end
```

## WebSocket Protocol

### Connect

```javascript
const socket = new Socket("ws://localhost:4000/socket");
socket.connect();
```

### Join Room

```javascript
const channel = socket.channel("room:task-list-1", {});
channel.join()
  .receive("ok", ({ state }) => {
    // Apply initial Y.Doc state
    Y.applyUpdate(doc, new Uint8Array(state));
  });
```

### Send Update

```javascript
channel.push("update", { data: updateBinary });
```

### Receive Update

```javascript
channel.on("update", ({ data }) => {
  Y.applyUpdate(doc, new Uint8Array(data));
});
```

## Configuration

### Development

`config/dev.exs`:
```elixir
config :right_task, RightTaskWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4000],
  check_origin: false
```

### Production

`config/prod.exs`:
```elixir
config :right_task, RightTaskWeb.Endpoint,
  url: [host: "righttask-phoenix.fly.dev", port: 443, scheme: "https"],
  check_origin: ["https://righttask.netlify.app"]
```

## Testing

### Manual Testing

1. Start Phoenix: `mix phx.server`
2. Start NestJS: `cd ../backend && npm run start:dev`
3. Start React: `cd ../frontend && npm run dev`
4. Open `http://localhost:5173` in two browser tabs
5. Create/edit tasks and verify real-time sync

### WebSocket Testing

Using `wscat`:

```bash
npm install -g wscat
wscat -c ws://localhost:4000/socket/websocket
```

## Deployment

See [PHOENIX_DEPLOYMENT.md](../PHOENIX_DEPLOYMENT.md) for Fly.io deployment guide.

Quick deploy:

```bash
# Install Fly CLI
brew install flyctl

# Login
flyctl auth login

# Deploy
flyctl launch
flyctl deploy
```

## Monitoring

### Logs

```bash
# Development
mix phx.server
# Watch console for emoji indicators:
# 🏠 Created room
# 👥 User joined room
# 👋 Connection left room
# 🧹 Shutting down empty room
```

```bash
# Production (Fly.io)
flyctl logs -a righttask-phoenix
```

### Observer (Development)

```bash
iex -S mix phx.server

# In IEx:
:observer.start()
```

This opens a GUI showing:
- All running processes (GenServers)
- Memory usage
- Message queues
- System metrics

## Performance

### Benchmarking

Use Artillery for load testing:

```bash
npm install -g artillery

# Create benchmark.yml (see PHOENIX_SETUP.md)
artillery run benchmark.yml
```

### Expected Capacity

- **Concurrent connections**: 10,000+ (vs ~1,000 with Node.js/Socket.IO)
- **Memory per room**: ~1-2 MB
- **Message latency**: <50ms local, <200ms cross-continent
- **Binary updates**: ~10x smaller than JSON

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 4000
lsof -i :4000

# Kill it
kill -9 <PID>
```

### Dependencies Won't Compile

```bash
mix deps.clean --all
mix deps.get
mix compile
```

### WebSocket Connection Refused

Check CORS origins in `lib/right_task_web/endpoint.ex`:

```elixir
socket "/socket", RightTaskWeb.UserSocket,
  websocket: [
    check_origin: [
      "http://localhost:5173",
      "https://righttask.netlify.app"
    ]
  ]
```

## Learn More

### Phoenix & Elixir

* [Phoenix Framework](https://www.phoenixframework.org/)
* [Phoenix Channels Guide](https://hexdocs.pm/phoenix/channels.html)
* [Phoenix Presence](https://hexdocs.pm/phoenix/presence.html)
* [Elixir School](https://elixirschool.com/)

### OTP & GenServer

* [GenServer Guide](https://hexdocs.pm/elixir/GenServer.html)
* [OTP Guide](https://hexdocs.pm/elixir/Supervisor.html)
* [Learn You Some Erlang](https://learnyousomeerlang.com/)

### Yjs

* [Yjs Documentation](https://docs.yjs.dev/)
* [CRDT Concepts](https://crdt.tech/)

## Documentation

- [Setup & Testing Guide](../PHOENIX_SETUP.md) - Local development
- [Deployment Guide](../PHOENIX_DEPLOYMENT.md) - Fly.io production deployment
- [Migration Plan](../PHASE4_PHOENIX_MIGRATION.md) - Full migration strategy

## Support

For issues:
1. Check logs: `mix phx.server` or `flyctl logs`
2. Verify configuration in `config/dev.exs`
3. Test WebSocket connection manually
4. Check Phoenix Forum: https://elixirforum.com/c/phoenix-forum/15
