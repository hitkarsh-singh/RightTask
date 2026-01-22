# 🧪 Production Deployment Testing Checklist

This checklist will guide you through testing the complete deployment of RightTask (Phase 1-3, 5) to production, including Neo4j graph features.

**Estimated time:** 45-60 minutes
**Prerequisites:** GitHub account, credit card for Railway/Netlify (free tier, no charges)

---

## ✅ Pre-Deployment Checklist

### 1. Local Testing (5 minutes)

- [ ] **Start backend locally:**
  ```bash
  cd backend
  npm run start:dev
  ```
  - [ ] Check logs for "✓ Connected to Neo4j" (if Neo4j configured)
  - [ ] Verify server starts on port 3000
  - [ ] Should see "Nest application successfully started"

- [ ] **Start frontend locally:**
  ```bash
  cd frontend
  npm run dev
  ```
  - [ ] Opens on http://localhost:5173
  - [ ] No console errors in browser

- [ ] **Test locally end-to-end:**
  - [ ] Register new user
  - [ ] Create 3 tasks
  - [ ] Add dependencies (Task 2 depends on Task 1)
  - [ ] Graph visualization appears
  - [ ] Try to create circular dependency (should fail)
  - [ ] Delete a task (should update graph)

- [ ] **Stop both servers** (Ctrl+C)

### 2. Code Compilation (5 minutes)

- [ ] **Build backend:**
  ```bash
  cd backend
  npm run build
  ```
  - [ ] Should see "Successfully compiled"
  - [ ] Check `dist/` folder exists

- [ ] **Build frontend:**
  ```bash
  cd frontend
  npm run build
  ```
  - [ ] Should see "✓ built in XXXms"
  - [ ] Check `dist/` folder exists
  - [ ] Should see `dist/index.html` and `dist/assets/`

---

## 🔧 Step 1: Neo4j Aura Setup (10 minutes)

### Create Neo4j Instance

- [ ] Go to https://console.neo4j.io/
- [ ] Sign up / Log in
- [ ] Click "New Instance"
- [ ] Select "AuraDB Free"
- [ ] Name: `righttask-prod`
- [ ] Region: Choose closest to you
- [ ] Click "Create Instance"

### Save Credentials

- [ ] **CRITICAL:** Download the `.txt` file with credentials
- [ ] Copy these values (you'll need them later):
  ```
  NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
  NEO4J_USERNAME=neo4j
  NEO4J_PASSWORD=<your-password>
  ```

### Verify Connection

- [ ] Click "Query" button in Aura console
- [ ] Should open Neo4j Browser
- [ ] Run test query:
  ```cypher
  RETURN "Connected!" as status
  ```
- [ ] Should see result: "Connected!"

---

## 📦 Step 2: GitHub Setup (5 minutes)

### Push to GitHub

- [ ] Create new repository on GitHub:
  - Name: `symbiotic-task-manager` (or your choice)
  - Visibility: Public or Private
  - Don't initialize with README (we have one)

- [ ] Push code:
  ```bash
  cd ~/Downloads/symbiotic-task-manager

  # Initialize git (if not already done)
  git init
  git add .
  git commit -m "Add Phase 1-3, 5: Neo4j graph features"

  # Add remote and push
  git remote add origin https://github.com/YOUR_USERNAME/symbiotic-task-manager.git
  git branch -M main
  git push -u origin main
  ```

- [ ] Verify on GitHub:
  - [ ] All files pushed
  - [ ] README.md displays correctly
  - [ ] backend/ and frontend/ folders visible

---

## 🚂 Step 3: Railway Backend Deployment (15 minutes)

### Create Railway Project

- [ ] Go to https://railway.app/
- [ ] Sign up / Log in with GitHub
- [ ] Click "New Project"
- [ ] Select "Deploy from GitHub repo"
- [ ] Choose `symbiotic-task-manager` repository
- [ ] Railway will auto-detect and start building

### Configure Service

- [ ] Wait for initial deployment to complete (~2-3 minutes)
- [ ] Click on the service
- [ ] Go to "Settings" tab

### Set Root Directory

- [ ] In Settings, scroll to "Service Settings"
- [ ] Set "Root Directory": `backend`
- [ ] Click "Update"
- [ ] Service will redeploy

### Add Environment Variables

- [ ] Go to "Variables" tab
- [ ] Click "New Variable" for each:

  **Required Variables:**
  ```
  JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-abc123xyz789
  NODE_ENV=production
  PORT=3000
  ```

  **Neo4j Variables (for graph features):**
  ```
  NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
  NEO4J_USERNAME=neo4j
  NEO4J_PASSWORD=<paste-your-neo4j-password>
  ```

- [ ] Click "Add" after each variable
- [ ] Service will automatically redeploy

### Generate Public Domain

- [ ] Go to "Settings" tab
- [ ] Scroll to "Networking"
- [ ] Click "Generate Domain"
- [ ] Copy the URL (e.g., `https://symbiotic-task-manager-production.up.railway.app`)
- [ ] Save this URL - you'll need it for frontend

### Test Backend Deployment

- [ ] Open the Railway URL in browser
- [ ] Should see: "Cannot GET /" (this is normal - it's an API)
- [ ] Test API endpoint:
  ```
  https://your-app.up.railway.app/health
  ```
  - If no health endpoint, try: `/tasks` (should get 401 Unauthorized - correct!)

- [ ] Check Railway logs:
  - [ ] Go to "Deployments" tab
  - [ ] Click latest deployment
  - [ ] Check logs for:
    - [ ] "✓ Connected to Neo4j" (if Neo4j configured)
    - [ ] "Nest application successfully started"
    - [ ] No error messages

**✅ Backend Deployment Complete!**
**Your API URL:** `https://_____.up.railway.app`

---

## 🌐 Step 4: Netlify Frontend Deployment (10 minutes)

### Deploy to Netlify

- [ ] Go to https://app.netlify.com/
- [ ] Sign up / Log in with GitHub
- [ ] Click "Add new site" → "Import an existing project"
- [ ] Choose "Deploy with GitHub"
- [ ] Select `symbiotic-task-manager` repository
- [ ] Configure build settings:
  ```
  Base directory: frontend
  Build command: npm run build
  Publish directory: frontend/dist
  ```
- [ ] Click "Deploy site"

### Wait for Initial Deploy

- [ ] Wait ~2-3 minutes for build to complete
- [ ] Should see "Site is live" with a random URL like:
  ```
  https://rainbow-unicorn-abc123.netlify.app
  ```

### Add Environment Variables

- [ ] Go to "Site configuration" → "Environment variables"
- [ ] Click "Add a variable"
- [ ] Add:
  ```
  Key: VITE_API_URL
  Value: https://your-railway-url.up.railway.app
  ```
  (**Use your actual Railway URL from Step 3**)
- [ ] Click "Create variable"

### Trigger Rebuild

- [ ] Go to "Deploys" tab
- [ ] Click "Trigger deploy" → "Clear cache and deploy site"
- [ ] Wait for rebuild (~2 minutes)

### Customize Domain (Optional)

- [ ] Go to "Domain management"
- [ ] Click "Options" → "Edit site name"
- [ ] Change to something memorable: `righttask-yourname`
- [ ] New URL: `https://righttask-yourname.netlify.app`

**✅ Frontend Deployment Complete!**
**Your App URL:** `https://_____.netlify.app`

---

## 🔒 Step 5: Configure CORS (5 minutes)

Your backend needs to accept requests from your Netlify domain.

### Update Backend CORS

- [ ] Edit `backend/src/main.ts` locally:
  ```typescript
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'https://your-netlify-site.netlify.app'  // Add your actual Netlify URL
    ],
    credentials: true,
  });
  ```

- [ ] Commit and push:
  ```bash
  git add backend/src/main.ts
  git commit -m "Add production CORS for Netlify"
  git push
  ```

- [ ] Railway will auto-deploy the update (~2 minutes)

---

## 🧪 Step 6: End-to-End Production Testing (15 minutes)

### Test 1: Basic Functionality

- [ ] Open your Netlify URL
- [ ] Should see the RightTask app
- [ ] **Register new user:**
  - [ ] Click "Register"
  - [ ] Enter email, username, password
  - [ ] Should redirect to app after registration
- [ ] **Create tasks:**
  - [ ] Create task: "Design mockups"
  - [ ] Create task: "Implement frontend"
  - [ ] Create task: "Write tests"
  - [ ] All 3 tasks appear in the list

### Test 2: Real-time Collaboration (Yjs)

- [ ] Keep current browser window open
- [ ] Open **incognito/private window**
- [ ] Go to same Netlify URL
- [ ] Login with same credentials
- [ ] In **regular window**: Create a new task
- [ ] In **incognito window**: Should see the task appear in real-time
- [ ] ✅ Real-time sync works!

### Test 3: Graph Visualization (Neo4j)

- [ ] In the app, scroll to "📊 Task Dependencies" section
- [ ] Should see a graph visualization area

**If you see the graph canvas:**
  - [ ] Create dependency: "Implement frontend" depends on "Design mockups"
  - [ ] Graph should show 2 nodes with an arrow connecting them
  - [ ] Drag a node - should move smoothly
  - [ ] Hover over node - tooltip appears
  - [ ] Nodes are colored (blue for active, green if completed)

**If graph shows "No tasks to visualize":**
  - [ ] This is normal if tasks exist but no dependencies yet
  - [ ] Add a dependency and check again

**If graph shows "Failed to load task graph":**
  - [ ] Check Railway logs for Neo4j connection errors
  - [ ] Verify Neo4j environment variables are set correctly
  - [ ] Verify Neo4j Aura instance is running (not paused)

### Test 4: Dependency Features

- [ ] **Add dependency:**
  - [ ] In "Write tests" task card, scroll to "Dependencies" section
  - [ ] Select "Implement frontend" from dropdown
  - [ ] Click "Add"
  - [ ] Should appear in dependency list
  - [ ] Graph should update to show connection

- [ ] **Test cycle detection:**
  - [ ] Try to make "Design mockups" depend on "Write tests"
  - [ ] Should see error: "⚠️ This would create a circular dependency"
  - [ ] Dependency should NOT be added

- [ ] **Remove dependency:**
  - [ ] Click the "×" button on a dependency
  - [ ] Should be removed
  - [ ] Graph should update

- [ ] **Delete task with dependencies:**
  - [ ] Delete a task that has dependencies
  - [ ] Graph should update (connections removed)

### Test 5: Task Completion & Graph Colors

- [ ] Mark "Design mockups" as complete
- [ ] In graph, that node should turn **green**
- [ ] Other nodes should remain **blue**

### Test 6: Database Persistence

- [ ] Close browser completely
- [ ] Reopen Netlify URL
- [ ] Login again
- [ ] All tasks should still be there
- [ ] All dependencies should still exist
- [ ] Graph should show same structure

---

## 📊 Step 7: Verify Neo4j Data (5 minutes)

### Check Neo4j Database

- [ ] Go to https://console.neo4j.io/
- [ ] Click on your instance
- [ ] Click "Query" to open Neo4j Browser
- [ ] Run this query:
  ```cypher
  MATCH (t:Task)
  RETURN t
  LIMIT 25
  ```
- [ ] Should see your tasks as nodes
- [ ] Run this query:
  ```cypher
  MATCH (t1:Task)-[r:DEPENDS_ON]->(t2:Task)
  RETURN t1, r, t2
  ```
- [ ] Should see dependency relationships

---

## 🐛 Step 8: Check for Issues

### Monitor Railway Logs

- [ ] Go to Railway dashboard
- [ ] Click on your service
- [ ] Go to "Deployments" → Latest deployment
- [ ] Look for errors:
  - [ ] No "Failed to connect to Neo4j" errors
  - [ ] No CORS errors
  - [ ] No database connection errors

### Check Browser Console

- [ ] Open DevTools (F12) on Netlify site
- [ ] Go to Console tab
- [ ] Look for errors:
  - [ ] No CORS errors
  - [ ] No 401/403 errors (except before login)
  - [ ] No "Failed to fetch" errors

### Check Network Tab

- [ ] In DevTools, go to Network tab
- [ ] Create a task
- [ ] Should see successful requests:
  - [ ] POST to `/tasks` → 201 Created
  - [ ] GET to `/graph/user` → 200 OK
- [ ] Check if responses contain data

---

## ✅ Success Criteria

Your deployment is successful if:

- [x] ✅ Frontend loads at Netlify URL
- [x] ✅ User registration works
- [x] ✅ User login works
- [x] ✅ Tasks can be created
- [x] ✅ Tasks persist after refresh
- [x] ✅ Real-time sync works between tabs/windows
- [x] ✅ Graph visualization appears (if Neo4j configured)
- [x] ✅ Dependencies can be added
- [x] ✅ Cycle detection works
- [x] ✅ Graph updates in real-time
- [x] ✅ No errors in Railway logs
- [x] ✅ No errors in browser console
- [x] ✅ Data appears in Neo4j Browser

---

## 🚨 Common Issues & Solutions

### Issue: "Failed to load task graph"

**Solution:**
1. Check Railway logs for Neo4j connection errors
2. Verify Neo4j Aura instance is not paused (go to console.neo4j.io)
3. Double-check NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD in Railway
4. Make sure URI starts with `neo4j+s://` (with the 's')

### Issue: CORS errors in browser console

**Solution:**
1. Verify you added Netlify URL to CORS origins in `backend/src/main.ts`
2. Make sure you pushed changes and Railway redeployed
3. Check Railway logs for the new deployment

### Issue: Graph shows "No tasks to visualize" but tasks exist

**Solution:**
This is normal! It means:
- Tasks exist in SQLite
- But no dependencies have been added yet
- Add a dependency to see the graph

### Issue: Real-time sync not working

**Solution:**
1. Check Railway logs for WebSocket errors
2. Make sure both tabs are logged in as same user
3. Try creating a task in one tab, wait 2-3 seconds

### Issue: Railway deployment fails

**Solution:**
1. Check Railway build logs for errors
2. Verify `backend/package.json` has all dependencies
3. Make sure root directory is set to `backend`
4. Check that `npm run build` works locally

### Issue: Netlify build fails

**Solution:**
1. Check Netlify deploy logs
2. Verify base directory is `frontend`
3. Verify publish directory is `frontend/dist`
4. Make sure `npm run build` works locally in frontend

---

## 📝 Post-Deployment Notes

### Save These URLs

**Production URLs:**
- Frontend: `https://_____.netlify.app`
- Backend API: `https://_____.up.railway.app`
- Neo4j Console: `https://console.neo4j.io/`

### Credentials to Save Securely

- Railway account
- Netlify account
- Neo4j Aura username & password
- JWT_SECRET (save in password manager)

### Share Your App

Once everything works:
- Share the Netlify URL with others
- Each user needs to register their own account
- All users will see the graph visualization of their own tasks

---

## 🎉 Congratulations!

If you've completed this checklist, you have successfully deployed:
- ✅ React frontend to Netlify
- ✅ NestJS backend to Railway
- ✅ Neo4j graph database to Aura
- ✅ Real-time WebSocket sync
- ✅ Interactive D3.js graph visualization

**Your RightTask app is now live in production!** 🚀

---

**Questions or issues?** Open an issue on GitHub or refer to:
- `docs/NEO4J_SETUP.md` for Neo4j help
- `DEPLOYMENT.md` for general deployment guide
- Railway/Netlify documentation
