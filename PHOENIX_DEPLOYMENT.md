# Phoenix WebSocket - Fly.io Deployment Guide

## Overview

This guide covers deploying the Phoenix WebSocket server to Fly.io for production use.

## Prerequisites

- Fly.io account (sign up at https://fly.io/app/sign-up)
- Fly CLI installed (`brew install flyctl`)
- Phoenix app compiling successfully locally
- Git repository initialized

## Deployment Steps

### 1. Install and Authenticate Fly CLI

```bash
# Install Fly CLI (macOS)
brew install flyctl

# Login to Fly.io
flyctl auth login
```

### 2. Initialize Fly App

Navigate to your Phoenix directory:

```bash
cd phoenix
```

Launch the Fly app (this creates the app but doesn't deploy yet):

```bash
flyctl launch
```

When prompted:
- **App name**: `righttask-phoenix` (or your preferred name)
- **Region**: Select closest to your users (e.g., `iad` for US East)
- **PostgreSQL database**: `No` (we don't need a database)
- **Deploy now**: `No` (we need to configure first)

This creates a `fly.toml` configuration file.

### 3. Generate Secret Key

Generate a secret key for Phoenix:

```bash
mix phx.gen.secret
```

Copy the output (it will be a long string like `xvafzY4y01jYuzLm3ecJqo008dVnU3CN4f9St4WhkYyKKm+abC01N4hPZQqB4P1C`)

### 4. Set Environment Variables

Set the secret key as an environment variable in Fly:

```bash
flyctl secrets set SECRET_KEY_BASE="<paste-your-generated-secret-here>"
```

Set the Phoenix host:

```bash
flyctl secrets set PHX_HOST="righttask-phoenix.fly.dev"
```

Enable the Phoenix server:

```bash
flyctl secrets set PHX_SERVER=true
```

### 5. Review fly.toml Configuration

Your `fly.toml` should look similar to this:

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

Key settings:
- `internal_port = 8080` - matches the PORT in our runtime.exs
- `force_https = true` - required for secure WebSockets (wss://)
- `min_machines_running = 0` - allows scaling to zero when idle (optional)

### 6. Deploy to Fly.io

Deploy your Phoenix app:

```bash
flyctl deploy
```

This will:
1. Build a Docker image
2. Push to Fly.io registry
3. Deploy the app
4. Start the Phoenix server

### 7. Verify Deployment

Check the status:

```bash
flyctl status
```

Expected output:
```
ID              STATE   HEALTH CHECKS           RESTARTS
xxxxxxxxxx      started passing                 0
```

View logs:

```bash
flyctl logs
```

You should see Phoenix starting:
```
[info] Running RightTaskWeb.Endpoint with Bandit
```

### 8. Test WebSocket Connection

Your Phoenix server should now be accessible at:
- HTTP: `https://righttask-phoenix.fly.dev`
- WebSocket: `wss://righttask-phoenix.fly.dev/socket`

Test the WebSocket connection using browser DevTools or wscat:

```bash
npm install -g wscat
wscat -c wss://righttask-phoenix.fly.dev/socket/websocket
```

### 9. Update Frontend Environment Variables

#### For Netlify Production:

1. Go to Netlify Dashboard → Your Site → Site Settings → Environment Variables
2. Update or add:

```
VITE_PHOENIX_URL=wss://righttask-phoenix.fly.dev/socket
VITE_API_URL=https://righttask-production.up.railway.app
```

3. Trigger a redeploy:
   - Go to Deploys tab
   - Click "Trigger deploy" → "Deploy site"

#### For Local Development:

Update `frontend/.env`:

```env
VITE_PHOENIX_URL=ws://localhost:4000/socket
VITE_API_URL=http://localhost:3000
```

Keep local development pointing to localhost.

### 10. Verify End-to-End

1. Visit your production site: `https://righttask.netlify.app`
2. Open browser DevTools Console
3. Look for: `🔗 Joined Phoenix room: task-list-1`
4. Open another browser tab
5. Create/edit tasks and verify real-time sync

## Common Issues

### Build Failures

If the build fails:

```bash
# Check build logs
flyctl logs

# Try rebuilding locally first
cd phoenix
mix deps.get
mix compile
```

### Connection Refused

If WebSocket connections fail:

1. Check the app is running:
   ```bash
   flyctl status
   ```

2. Verify CORS origins in `phoenix/lib/right_task_web/endpoint.ex`:
   ```elixir
   check_origin: [
     "https://righttask.netlify.app",
     "http://localhost:5173"
   ]
   ```

3. Ensure `force_https = true` in `fly.toml`

### Memory Issues

If the app runs out of memory:

```bash
# Scale up memory
flyctl scale memory 2048
```

Our default is 1GB which should handle 10,000+ connections.

### SSL Certificate Issues

Fly.io automatically provisions SSL certificates. If you see SSL errors:

```bash
# Check certificate status
flyctl certs show righttask-phoenix.fly.dev
```

## Monitoring

### View Logs

```bash
# Tail logs in real-time
flyctl logs

# Filter by app instance
flyctl logs -a righttask-phoenix
```

### Check Metrics

```bash
# View app metrics
flyctl status
flyctl dashboard
```

### Monitor Connections

In Phoenix logs, look for:
- `👥 User joined room` - new connections
- `👋 Connection left room` - disconnections
- `🧹 Shutting down empty room` - room cleanup

## Scaling

### Horizontal Scaling (More Machines)

```bash
# Scale to 2 machines
flyctl scale count 2

# Scale to specific regions
flyctl scale count 2 --region iad,lhr
```

### Vertical Scaling (More Resources)

```bash
# Increase memory
flyctl scale memory 2048

# Increase CPU
flyctl scale vm shared-cpu-2x
```

For 10,000+ concurrent connections, 1GB memory should suffice.

## Cost Estimation

Fly.io pricing (as of 2025):

- **Free tier**: 3 shared-cpu-1x VMs with 256MB RAM each
- **Shared CPU 1x (1GB RAM)**: ~$0.0000008/sec (~$2.07/month)
- **Bandwidth**: First 100GB free, then $0.02/GB

For this app:
- **Development**: Free (use free tier)
- **Production**: ~$2-5/month (1 machine, 1GB RAM)

## Updating the App

To deploy updates:

```bash
cd phoenix

# Make your changes...

# Deploy
flyctl deploy
```

Fly.io will:
1. Build new image
2. Health check new instances
3. Zero-downtime rolling deployment

## Rollback

If deployment fails or has issues:

```bash
# List releases
flyctl releases

# Rollback to previous version
flyctl releases rollback
```

## Custom Domains (Optional)

To use a custom domain:

```bash
# Add custom domain
flyctl certs create yourdomain.com

# Add DNS record (provided by Fly)
# A record: @ -> fly.io IP
# CNAME: www -> righttask-phoenix.fly.dev
```

Update `PHX_HOST`:
```bash
flyctl secrets set PHX_HOST="yourdomain.com"
```

## Benchmarking

After deployment, benchmark the production server:

```bash
# Install Artillery
npm install -g artillery

# Create benchmark config (see PHOENIX_SETUP.md)
# Run against production
artillery run benchmark.yml --target wss://righttask-phoenix.fly.dev/socket
```

Compare metrics:
- Concurrent connections
- Message latency (p95, p99)
- Memory usage
- CPU usage

## Security Checklist

- [x] Force HTTPS/WSS in production
- [x] CORS origins restricted to known domains
- [x] SECRET_KEY_BASE not committed to version control
- [x] Environment variables set via Fly secrets
- [x] No sensitive data in logs

## Monitoring & Alerts (Advanced)

For production monitoring, consider:

1. **Fly.io Metrics**: Built-in dashboard at `flyctl dashboard`
2. **Custom Logging**: Use structured logging with Logger
3. **External Monitoring**: Services like AppSignal, Scout APM
4. **Health Checks**: Add a health check endpoint if needed

## Troubleshooting Commands

```bash
# SSH into running machine
flyctl ssh console

# View environment variables
flyctl ssh console -C "env | grep PHX"

# Restart the app
flyctl apps restart

# View current configuration
flyctl config show

# Check platform status
flyctl platform status
```

## Next Steps

After successful deployment:

1. ✅ Verify WebSocket connections work from production frontend
2. ✅ Test multi-user collaboration
3. ✅ Run benchmark tests
4. ✅ Monitor logs for errors
5. ✅ Set up alerts (optional)
6. ✅ Update documentation

## Resources

- [Fly.io Documentation](https://fly.io/docs/)
- [Phoenix on Fly.io Guide](https://fly.io/docs/elixir/getting-started/)
- [Phoenix Deployment Guide](https://hexdocs.pm/phoenix/deployment.html)
- [Fly.io Phoenix Template](https://github.com/fly-apps/hello_elixir)

## Support

For deployment issues:
- Fly.io Community: https://community.fly.io/
- Fly.io Status: https://status.flyio.net/
- Phoenix Forum: https://elixirforum.com/c/phoenix-forum/15
