# Anime War — Deployment Guide

## ✅ What's Already Live

| Component | URL | Status |
|-----------|-----|--------|
| Game Client (UI) | https://anime-war-game.web.app | ✅ LIVE |
| Game Server (Socket.IO) | See below | ⚙ Needs setup |

The client is deployed to Firebase Hosting. The game server needs a separate host
because Socket.IO requires persistent connections. Choose one:

---

## 🟢 Option A — Railway (Free, Recommended, No billing card)

1. **Install Git** from https://git-scm.com/download/win, then restart your terminal.

2. **Push to GitHub:**
   ```bash
   cd "d:\New folder\anime-war"
   git init
   git add .
   git commit -m "Initial commit"
   ```
   Go to https://github.com/new → create a repo → follow the push instructions.

3. **Deploy to Railway:**
   - Go to https://railway.app
   - Sign in with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repo
   - Railway auto-detects Node.js and runs `node server/index.js`
   - Copy your Railway URL (e.g., `https://anime-war-production.up.railway.app`)

4. **Update the client's server URL:**
   Edit `client/env.js`:
   ```js
   window.GAME_SERVER_URL = 'https://YOUR-APP.up.railway.app';
   ```
   Then redeploy hosting:
   ```bash
   firebase deploy --only hosting
   ```

---

## 🟡 Option B — Render (Free tier, sleeps after 15 min idle)

1. Push to GitHub (same steps as Option A, step 1-2)

2. Go to https://render.com → "New Web Service" → Connect repo
   - Build Command: `npm install`
   - Start Command: `node server/index.js`

3. Copy the Render URL, update `client/env.js`, redeploy hosting.

---

## 🔵 Option C — Firebase Cloud Functions (Requires Blaze billing plan)

If you upgrade your Firebase project to Blaze:
1. Visit: https://console.firebase.google.com/project/anime-war-game/usage/details
2. Upgrade to Blaze (free quota: 2M invocations/month)
3. Then deploy everything at once:
   ```bash
   cd "d:\New folder\anime-war"
   firebase deploy
   ```
   This deploys both hosting + the Socket.IO Cloud Function.
   No separate server URL needed — it all runs on Firebase.

---

## 🛠 Local Development

```bash
cd "d:\New folder\anime-war"
npm start                    # starts server on localhost:3000
```
Open http://localhost:3000 — the client auto-connects to local server.
Open multiple browser tabs to test multiplayer locally.

---

## 📋 Quick Re-deploy (after changes)

```bash
# After editing client files:
firebase deploy --only hosting

# After editing server files (Railway auto-deploys on git push):
git add . && git commit -m "Update" && git push
```
