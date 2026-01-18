# Room Booking System - Deployment Guide

## Quick Deployment to Render.com (Recommended)

### Prerequisites
- GitHub account
- Render.com account (free tier available)

### Step 1: Prepare Your Code for GitHub

1. **Initialize Git repository** (if not already done):
   ```bash
   cd "c:\Users\andit\OneDrive\Documents\Claude code\n8n"
   git init
   git add .
   git commit -m "Initial commit - Room Booking System"
   ```

2. **Create a new GitHub repository**:
   - Go to https://github.com/new
   - Name it: `room-booking-system`
   - Make it **Private** (recommended for internal tools)
   - Don't initialize with README (you already have one)
   - Click "Create repository"

3. **Push your code to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/room-booking-system.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy to Render.com

1. **Sign up/Login to Render**:
   - Go to https://render.com
   - Sign up with your GitHub account

2. **Create a New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `room-booking-system`
   - Configure the service:

   **Basic Settings:**
   - Name: `room-booking-system`
   - Region: Choose closest to you
   - Branch: `main`
   - Root Directory: (leave empty)

   **Build Settings:**
   - Build Command: `npm install && cd backend && npm install && cd ../frontend && npm install && npm run build`
   - Start Command: `npm start`

   **Environment:**
   - Node Version: `18` or higher

   **Instance Type:**
   - Free (for testing)
   - OR Starter ($7/month for better performance)

3. **Add Environment Variables**:
   Click "Advanced" → "Add Environment Variable":

   - `NODE_ENV` = `production`
   - `JWT_SECRET` = (generate a random string like: `roombooking2024secret!@#`)
   - `PORT` = `5000`

4. **Deploy**:
   - Click "Create Web Service"
   - Wait 5-10 minutes for deployment
   - Your app will be live at: `https://room-booking-system-XXXX.onrender.com`

### Step 3: Initial Setup

1. **Create Admin User**:
   Once deployed, the database will be empty. You'll need to create an admin user.

   Option A - Use the API directly:
   ```bash
   curl -X POST https://your-app.onrender.com/api/users \
     -H "Content-Type: application/json" \
     -d '{
       "username": "admin",
       "password": "YourSecurePassword123!",
       "full_name": "Administrator",
       "email": "admin@yourdomain.com",
       "role": "admin"
     }'
   ```

   Option B - Add a temporary route to create admin (then remove it):
   See instructions below in "Creating First Admin User"

2. **Set Rota Cycle Start**:
   - Login with your admin account
   - Go to Admin → Rota Configuration
   - Set the cycle start date

3. **Add Rooms and Users**:
   - Use the Admin page to add rooms
   - Add user accounts for your team

---

## Alternative: Deploy to Railway.app

### Quick Railway Deployment

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Initialize and Deploy**:
   ```bash
   cd "c:\Users\andit\OneDrive\Documents\Claude code\n8n"
   railway init
   railway up
   ```

4. **Add Environment Variables**:
   ```bash
   railway variables set NODE_ENV=production
   railway variables set JWT_SECRET=your-random-secret-here
   ```

5. **Get Your URL**:
   ```bash
   railway open
   ```

---

## Creating First Admin User

Since the app requires authentication, you need to create the first admin user. Here are two methods:

### Method 1: Temporary Admin Creation Route (Recommended)

1. Add this temporary route to `backend/server.js` (after the routes section):

```javascript
// TEMPORARY: Remove after creating admin user
app.post('/api/create-first-admin', async (req, res) => {
    const db = require('./config/database');
    const bcrypt = require('bcryptjs');

    try {
        // Check if any admin exists
        const existingAdmin = await db.get('SELECT * FROM users WHERE role = ?', ['admin']);

        if (existingAdmin) {
            return res.status(400).json({ error: 'Admin user already exists' });
        }

        const password_hash = await bcrypt.hash('Admin123!', 10);

        await db.run(`
            INSERT INTO users (username, password_hash, full_name, email, role)
            VALUES (?, ?, ?, ?, ?)
        `, ['admin', password_hash, 'System Administrator', 'admin@example.com', 'admin']);

        res.json({
            message: 'Admin user created successfully',
            username: 'admin',
            password: 'Admin123! (CHANGE THIS IMMEDIATELY)'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

2. Deploy this change

3. Visit: `https://your-app.onrender.com/api/create-first-admin` in your browser

4. Login with `admin` / `Admin123!`

5. **IMPORTANT**: Change the password immediately via the user management page

6. Remove this route from the code and redeploy

### Method 2: Database Script (If you have SSH access)

Run this script on the server:

```javascript
// create-admin.js
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./backend/database/bookings.db');

async function createAdmin() {
    const password_hash = await bcrypt.hash('Admin123!', 10);

    db.run(`
        INSERT INTO users (username, password_hash, full_name, email, role)
        VALUES (?, ?, ?, ?, ?)
    `, ['admin', password_hash, 'Administrator', 'admin@example.com', 'admin'], (err) => {
        if (err) {
            console.error('Error:', err);
        } else {
            console.log('Admin user created successfully!');
            console.log('Username: admin');
            console.log('Password: Admin123!');
            console.log('CHANGE THIS PASSWORD IMMEDIATELY!');
        }
        db.close();
    });
}

createAdmin();
```

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | `development` | Set to `production` for deployment |
| `PORT` | No | `5000` | Server port (Render sets this automatically) |
| `JWT_SECRET` | Yes | - | Secret key for JWT tokens (use long random string) |

---

## Custom Domain Setup (Optional)

### On Render:
1. Go to your service → Settings → Custom Domain
2. Add your domain (e.g., `booking.yourdomain.com`)
3. Add the provided CNAME record to your DNS provider
4. Render provides free SSL certificates

---

## Monitoring and Logs

### Render Dashboard:
- View deployment logs
- Monitor app health
- See resource usage

### Health Check:
Your app includes a health check endpoint:
- `https://your-app.onrender.com/health`

---

## Updating Your Deployment

### When you make changes:

1. **Commit and push to GitHub**:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```

2. **Render auto-deploys** (if you enabled auto-deploy)
   - OR manually click "Deploy latest commit" in Render dashboard

---

## Troubleshooting

### App won't start:
- Check logs in Render dashboard
- Verify all environment variables are set
- Ensure build command completed successfully

### Can't login:
- Make sure admin user was created
- Check database was initialized properly
- Verify JWT_SECRET is set

### Database issues:
- SQLite database persists in Render's disk
- On free tier, disk may be cleared if app is inactive for 90 days
- Consider upgrading to paid tier for persistent storage

### Frontend not loading:
- Verify build command ran successfully
- Check that `NODE_ENV=production` is set
- Ensure frontend build folder exists

---

## Security Recommendations

1. **Change Default Admin Password** immediately after first login

2. **Use Strong JWT Secret**: Generate with:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

3. **Enable 2FA** if Render supports it for your account

4. **Keep Dependencies Updated**:
   ```bash
   npm audit
   npm audit fix
   ```

5. **Use HTTPS** (Render provides this automatically)

6. **Restrict Access**: If only for internal use:
   - Keep GitHub repo private
   - Use Render's IP allowlist feature (paid plans)
   - OR add basic auth middleware

---

## Backup Strategy

### Database Backup:

On Render, you can manually backup by:

1. SSH into your service (paid plans)
2. Download the SQLite database file
3. Store it securely

For automated backups, consider:
- Upgrading to paid Render plan with persistent disk
- Migrating to PostgreSQL (Render offers free tier)
- Setting up a scheduled backup script

---

## Cost Estimates

### Render.com Pricing:
- **Free Tier**: Good for testing
  - Spins down after 15 min of inactivity
  - Spins up when accessed (30-60 second delay)

- **Starter ($7/month)**: Recommended for production
  - Always running
  - No spin-down
  - 512MB RAM
  - Persistent disk

### Railway.app Pricing:
- **Free Tier**: $5 credit/month
  - Good for light usage

- **Paid**: Pay as you go
  - ~$5-10/month for small apps

---

## Next Steps After Deployment

1. ✅ Create admin user
2. ✅ Change default password
3. ✅ Set rota cycle start date
4. ✅ Add rooms to the system
5. ✅ Create user accounts for staff
6. ✅ Create test bookings
7. ✅ Train users on the system
8. ✅ Set up regular backups

---

## Getting Help

If you encounter issues:
1. Check Render/Railway logs
2. Review error messages
3. Check GitHub Issues for similar problems
4. Reach out to support

---

## Local Testing Before Deploy

Test the production build locally:

```bash
# Build frontend
cd frontend
npm run build

# Set environment
set NODE_ENV=production

# Start backend
cd ../backend
npm start
```

Visit `http://localhost:5000` to test
