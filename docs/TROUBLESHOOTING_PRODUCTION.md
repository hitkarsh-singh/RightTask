# 🔧 Production Troubleshooting Guide

## Issue: "Cannot Add Tasks in Production"

Follow these steps in order to diagnose and fix the issue.

---

## Step 1: Check Browser Console (2 minutes)

**Open Developer Tools:**

1. **Open your Netlify site** in Chrome/Firefox
2. **Press F12** (or right-click → Inspect)
3. **Go to Console tab**

**Look for errors:**

### ❌ If you see: `VITE_API_URL is not defined` or requests to `http://localhost:3000`
**Problem:** Environment variable not set in Netlify

**Solution:** Go to Step 2 ↓

### ❌ If you see: `Access to XMLHttpRequest blocked by CORS policy`
**Problem:** CORS not configured for your Netlify domain

**Solution:** Go to Step 4 ↓

### ❌ If you see: `Network Error` or `Failed to fetch`
**Problem:** Backend not reachable

**Solution:** Go to Step 3 ↓

### ❌ If you see: `401 Unauthorized`
**Problem:** JWT token issue (but you should be able to register at least)

**Solution:** Try registering a new account

---

## Step 2: Set VITE_API_URL in Netlify (5 minutes)

**This is the most common issue!**

### Get Your Railway Backend URL

1. **Go to Railway:** https://railway.app/dashboard
2. **Click your backend service**
3. **Go to Settings → Networking**
4. **Copy the domain** (e.g., `symbiotic-task-manager-production.up.railway.app`)
5. **Your API URL is:** `https://YOUR-DOMAIN.up.railway.app`

### Set Environment Variable in Netlify

1. **Go to Netlify:** https://app.netlify.com/
2. **Click your site**
3. **Go to:** Site configuration → Environment variables
4. **Click "Add a variable"**
5. **Add:**
   ```
   Key:   VITE_API_URL
   Value: https://your-railway-domain.up.railway.app
   ```
   ⚠️ **Important:**
   - Use `https://` (not `http://`)
   - No trailing slash at the end
   - Example: `https://symbiotic-task-manager-production.up.railway.app`

6. **Click "Create variable"**

### Rebuild Netlify

1. **Go to Deploys tab**
2. **Click "Trigger deploy" → "Clear cache and deploy site"**
3. **Wait 2-3 minutes** for build to complete

### Test Again

1. **Refresh your Netlify site** (Ctrl+F5 / Cmd+Shift+R)
2. **Open Console (F12)**
3. **Try to register/create a task**
4. **Check Network tab** - requests should go to your Railway URL

---

## Step 3: Verify Backend is Running (3 minutes)

### Check Railway Deployment

1. **Go to Railway:** https://railway.app/dashboard
2. **Click your backend service**
3. **Check status:** Should say "Active" or "Running"

**If status is "Failed" or "Stopped":**
- Click "Deployments" tab
- Click latest deployment
- Check build/runtime logs for errors

### Test Backend API Directly

**Open your Railway URL in a new tab:**
```
https://your-railway-domain.up.railway.app
```

**Expected result:** Should see one of these:
- `Cannot GET /` (✅ This is fine! API is running)
- `{"statusCode":404,"message":"Cannot GET /"}` (✅ Also fine!)

**Bad result:**
- Connection timeout
- "This site can't be reached"
- Nothing loads

**If bad result:** Your backend isn't running. Go to Step 5 ↓

### Test Specific Endpoint

Try this URL:
```
https://your-railway-domain.up.railway.app/auth/login
```

**Expected:**
```json
{"statusCode":400,"message":"email must be an email","error":"Bad Request"}
```
✅ This means the API is working!

---

## Step 4: Fix CORS Configuration (10 minutes)

If you see CORS errors, your backend needs to allow your Netlify domain.

### Check Current CORS Settings

<function_calls>
<invoke name="Read">
<parameter name="file_path">/Users/hitkarsh/Downloads/symbiotic-task-manager/backend/src/main.ts