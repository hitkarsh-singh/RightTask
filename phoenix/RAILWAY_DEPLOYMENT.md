# Deploy Phoenix to Railway

## Prerequisites
- ✅ Railway account (you already have this)
- ✅ Phoenix app with Dockerfile (created)
- ✅ Git repository initialized

## Step 1: Initialize Git Repository (if not already)

```bash
cd /Users/hitkarsh/Downloads/symbiotic-task-manager/phoenix

# Initialize git if needed
git init
git add .
git commit -m "Initial Phoenix WebSocket server"
```

## Step 2: Deploy to Railway

### Option A: Via Railway Dashboard (Recommended)

1. Go to https://railway.app/dashboard
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"** or **"Empty Project"**

**If using GitHub:**
- Connect your GitHub account
- Select the repository
- Select the `phoenix` directory
- Railway will auto-detect the Dockerfile

**If using Empty Project:**
- Create new project
- Click **"Deploy from GitHub"** or use Railway CLI (see Option B)

### Option B: Via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to new project
railway init

# Deploy
railway up
```

## Step 3: Configure Environment Variables

In Railway Dashboard → Your Phoenix Project → Variables tab:

Add these environment variables:

```
SECRET_KEY_BASE=eT4WHnCd4mf1aP/VD2KmOBltfaGfZJzonuis+ELjJvCd7TJgsNwJ8l/p3Y01Mo31
PHX_HOST=righttask-phoenix.up.railway.app
PORT=8080
```

**Note:** Replace `righttask-phoenix.up.railway.app` with your actual Railway domain once deployed.

## Step 4: Generate Domain

1. In Railway Dashboard → Your Phoenix Project
2. Click **"Settings"** tab
3. Under **"Networking"** → Click **"Generate Domain"**
4. Copy the generated domain (e.g., `righttask-phoenix.up.railway.app`)
5. Update the `PHX_HOST` environment variable with this domain

## Step 5: Verify Deployment

Once deployed, check:

```bash
# Check if Phoenix is running
curl https://YOUR-DOMAIN.up.railway.app

# Check logs
railway logs
```

You should see:
```
[info] Running RightTaskWeb.Endpoint with Bandit
```

## Step 6: Test WebSocket Connection

```bash
# Install wscat if not already
npm install -g wscat

# Test WebSocket
wscat -c wss://YOUR-DOMAIN.up.railway.app/socket/websocket
```

## Troubleshooting

### Build Fails

Check Railway logs for errors:
```bash
railway logs --build
```

### App Crashes

Check runtime logs:
```bash
railway logs
```

### Port Issues

Ensure `PORT=8080` is set in Railway environment variables (Railway provides this automatically, but make sure it's not overridden).

### CORS Issues

If frontend can't connect, verify CORS origins in `lib/right_task_web/endpoint.ex`:
```elixir
check_origin: [
  "https://righttask.netlify.app",
  "http://localhost:5173"
]
```

## Next Steps

After Phoenix is deployed:

1. Update Netlify environment variables:
   ```
   VITE_PHOENIX_URL=wss://YOUR-DOMAIN.up.railway.app/socket
   ```

2. Redeploy frontend to Netlify

3. Test production WebSocket connection

## Railway Pricing

- **Hobby Plan**: $5/month (you're already using this for NestJS)
- Phoenix will share the same billing
- Estimated usage: ~$2-3/month additional for Phoenix
- **Total**: ~$7-8/month for both services

## Monitoring

View metrics in Railway Dashboard:
- CPU usage
- Memory usage
- Network traffic
- Logs in real-time

---

**Generated Secret Key:** `eT4WHnCd4mf1aP/VD2KmOBltfaGfZJzonuis+ELjJvCd7TJgsNwJ8l/p3Y01Mo31`

Save this securely!
