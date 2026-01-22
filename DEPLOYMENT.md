# 🚀 Deployment Guide

This guide covers deploying the Symbiotic Task Manager to free-tier cloud services.

---

## 📋 Deployment Overview

| Component | Platform | Free Tier | Deploy Time |
|-----------|----------|-----------|-------------|
| Frontend | Netlify | 100 GB bandwidth/month | 5 min |
| Backend | Railway/Render | 500 hours/month | 10 min |
| Database | Turso (SQLite edge) | 9 GB storage | 5 min |

---

## 🌐 Frontend Deployment (Netlify)

### Prerequisites
- GitHub account
- Netlify account (sign up at https://netlify.com)

### Steps

1. **Push to GitHub**:
   ```bash
   cd ~/Downloads/symbiotic-task-manager
   git init
   git add .
   git commit -m "Initial commit - Phase 1-3"

   # Create repo on GitHub, then:
   git remote add origin https://github.com/YOUR_USERNAME/symbiotic-task-manager.git
   git push -u origin main
   ```

2. **Deploy to Netlify**:
   - Go to https://app.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub
   - Select your `symbiotic-task-manager` repository
   - Configure build settings:
     - **Base directory**: `frontend`
     - **Build command**: `npm run build`
     - **Publish directory**: `frontend/dist`
   - Click "Deploy site"

3. **Configure Environment Variables**:
   - In Netlify dashboard, go to "Site settings" → "Environment variables"
   - Add: `VITE_API_URL=https://your-backend-url.com`

4. **Update Frontend API Client**:
   ```typescript
   // frontend/src/api/client.ts
   const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
   ```

5. **Redeploy** (Netlify auto-deploys on git push)

**Your frontend is now live!** 🎉

---

## 🖥️ Backend Deployment (Railway)

### Prerequisites
- Railway account (sign up at https://railway.app)

### Steps

1. **Install Railway CLI** (optional):
   ```bash
   brew install railway
   railway login
   ```

2. **Deploy via Dashboard**:
   - Go to https://railway.app/dashboard
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Select `backend` as the root directory
   - Railway auto-detects Dockerfile

3. **Configure Environment Variables**:
   - In Railway project settings, add:
     ```
     JWT_SECRET=<generate-random-string>
     PORT=3000
     NODE_ENV=production
     ```

4. **Generate Domain**:
   - In Railway, go to "Settings" → "Networking"
   - Click "Generate Domain"
   - Copy the URL (e.g., `https://your-app.up.railway.app`)

5. **Update CORS in Backend**:
   ```typescript
   // backend/src/main.ts
   app.enableCors({
     origin: [
       'http://localhost:5173',
       'https://your-netlify-site.netlify.app'
     ],
     credentials: true,
   });
   ```

6. **Redeploy**:
   ```bash
   git add .
   git commit -m "Update CORS for production"
   git push
   ```

**Your backend is now live!** 🎉

---

## 💾 Database Migration (SQLite → Turso)

For production, migrate from local SQLite to Turso (distributed edge SQLite).

### Steps

1. **Sign up for Turso**:
   - Go to https://turso.tech
   - Sign up with GitHub

2. **Install Turso CLI**:
   ```bash
   brew install tursodatabase/tap/turso
   turso auth login
   ```

3. **Create Database**:
   ```bash
   turso db create symbiotic-tasks
   turso db show symbiotic-tasks
   ```

4. **Get Connection URL**:
   ```bash
   turso db show symbiotic-tasks --url
   # Copy the URL
   ```

5. **Update Backend TypeORM Config**:
   ```typescript
   // backend/src/app.module.ts
   TypeOrmModule.forRoot({
     type: 'better-sqlite3',
     database: process.env.TURSO_DATABASE_URL || 'symbiotic-tasks.db',
     entities: [__dirname + '/**/*.entity{.ts,.js}'],
     synchronize: process.env.NODE_ENV !== 'production',
     logging: false,
   }),
   ```

6. **Add to Railway Env Vars**:
   ```
   TURSO_DATABASE_URL=<your-turso-url>
   ```

---

## 🔧 Alternative Deployment Options

### Backend: Render (Alternative to Railway)

1. **Sign up**: https://render.com
2. **Create Web Service**:
   - Connect GitHub repo
   - Root directory: `backend`
   - Build command: `npm install && npm run build`
   - Start command: `npm run start:prod`
3. **Add Environment Variables** (same as Railway)
4. **Deploy**

### Backend: Fly.io (Future: Elixir/Phoenix)

1. **Install flyctl**:
   ```bash
   brew install flyctl
   fly auth login
   ```

2. **Launch App**:
   ```bash
   cd backend
   fly launch
   ```

3. **Configure** fly.toml, deploy:
   ```bash
   fly deploy
   ```

---

## 🌍 Full Deployment Checklist

### Pre-Deployment
- [ ] Remove all `console.log` statements
- [ ] Change JWT_SECRET to production value
- [ ] Test all features locally
- [ ] Run `npm run build` successfully on both frontend and backend
- [ ] Update CORS origins to production URLs

### Deploy Backend
- [ ] Sign up for Railway/Render
- [ ] Connect GitHub repository
- [ ] Configure environment variables
- [ ] Deploy and verify health endpoint
- [ ] Note down backend URL

### Deploy Frontend
- [ ] Update `VITE_API_URL` to backend URL
- [ ] Deploy to Netlify
- [ ] Verify frontend loads
- [ ] Test authentication flow
- [ ] Test real-time collaboration

### Post-Deployment
- [ ] Update README.md with live URLs
- [ ] Test all features in production
- [ ] Set up monitoring (optional: Sentry, LogRocket)
- [ ] Configure custom domain (optional)

---

## 🔒 Security Checklist for Production

### Environment Variables
- [ ] Never commit `.env` files
- [ ] Use strong JWT_SECRET (32+ characters, random)
- [ ] Use HTTPS in production (Netlify/Railway provide this)

### Backend Security
- [ ] Add rate limiting:
   ```bash
   npm install @nestjs/throttler
   ```
- [ ] Implement CSRF protection
- [ ] Add Helmet.js for security headers:
   ```bash
   npm install helmet
   ```

### Database Security
- [ ] Disable TypeORM `synchronize` in production
- [ ] Use migrations for schema changes
- [ ] Backup database regularly

---

## 📊 Monitoring & Analytics

### Free Monitoring Tools

1. **Uptime Monitoring**: UptimeRobot (https://uptimerobot.com)
   - Monitor backend and frontend uptime
   - Alert via email/SMS on downtime

2. **Error Tracking**: Sentry (https://sentry.io)
   - Free tier: 5,000 errors/month
   - Track frontend and backend errors

3. **Analytics**: Plausible/Umami (self-hosted or free tier)
   - Privacy-friendly analytics
   - Track user engagement

---

## 🚨 Troubleshooting

### Frontend Not Connecting to Backend

**Symptom**: CORS errors in browser console

**Fix**:
1. Verify backend CORS config includes frontend URL
2. Ensure backend is deployed and running
3. Check `VITE_API_URL` environment variable

### WebSocket Not Connecting

**Symptom**: Real-time sync not working

**Fix**:
1. Verify WebSocket URL in `useYjs.ts`:
   ```typescript
   const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
     transports: ['websocket'],
   });
   ```
2. Ensure Railway/Render supports WebSocket (they do)
3. Check firewall rules

### Database Connection Failed

**Symptom**: Backend crashes on startup

**Fix**:
1. Verify Turso URL is correct
2. Check database permissions
3. Ensure `better-sqlite3` is installed

---

## 💰 Cost Estimates (Free Tier Limits)

| Service | Free Tier | Paid Tier Starts At |
|---------|-----------|---------------------|
| Netlify | 100 GB bandwidth | $19/month |
| Railway | 500 hours/month | $5/month (usage-based) |
| Turso | 9 GB storage, 1 billion rows | $29/month |
| Neo4j Aura | 50K nodes, 175K relationships | $65/month |

**Estimated Monthly Cost** (if staying on free tier): **$0** 🎉

---

## 🎯 Next Steps After Deployment

1. **Share Your Work**:
   - Add to portfolio
   - Post on LinkedIn, Twitter
   - Demo in job interviews

2. **Monitor Performance**:
   - Set up Sentry for error tracking
   - Monitor uptime with UptimeRobot
   - Check Netlify/Railway dashboards

3. **Iterate**:
   - Collect user feedback
   - Build next features from ROADMAP.md
   - Keep deploying updates via git push!

---

**Last Updated**: January 20, 2026
**Deployment Status**: Configuration ready, awaiting deployment 🚀
