# Fix Render Deployment

The issue is that Render can't find the package.json file. Here's how to fix it:

## Step 1: Push the New Build Script to GitHub

1. Open **GitHub Desktop**
2. You should see `build.sh` listed on the left as a new file
3. At the bottom left:
   - **Summary**: Type `Add build script for Render`
4. Click **"Commit to main"**
5. Click **"Push origin"** (button at the top)

## Step 2: Update Render Settings

1. Go back to Render (https://render.com)
2. Click on your **"room-booking-system"** service (or whatever you named it)
3. Click **"Settings"** on the left sidebar
4. Scroll down to **"Build & Deploy"**
5. Click **Edit** next to **Build Command**
6. Change it to: `bash build.sh`
7. Click **Save Changes**
8. The **Start Command** should still be: `npm start`

## Step 3: Redeploy

1. Click **"Manual Deploy"** at the top
2. Select **"Clear build cache & deploy"**
3. Wait 5-10 minutes for it to build

---

## If That Doesn't Work: Alternative Fix

If the build script doesn't work, try this build command instead:

```
cd backend && npm install && cd ../frontend && npm install && npm run build && cd ..
```

And this start command:

```
cd backend && npm start
```

---

## Still Not Working?

The issue might be with how your code was uploaded to GitHub. Let me check:

1. Go to https://github.com/YOUR_USERNAME/n8n
2. Do you see folders called `backend` and `frontend`?
3. If NOT, the upload didn't work correctly

If you don't see those folders, we need to re-upload your code properly.
