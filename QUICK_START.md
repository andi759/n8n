# 🚀 Quick Start Guide - Room Booking Service

## In 5 Minutes: Get the Backend Running

```bash
# 1. Install dependencies (2 min)
cd backend
npm install

# 2. Initialize database (30 sec)
npm run init-db

# 3. Start server (instant)
npm run dev
```

✅ Backend is now running on http://localhost:5000

**Test it works:**
```bash
curl http://localhost:5000/health
```

You should see: `{"status":"OK","timestamp":"..."}`

---

## In 60 Minutes: Get Full Application Running

### Step 1: Backend (already done above) ✅

### Step 2: Create Frontend Files (45 min)

**Quick Method - Copy Paste:**

1. **Create folders:**
```bash
cd frontend
mkdir -p src/components src/context src/services src/utils
```

2. **Copy files from guides:**
   - Open `FRONTEND_GUIDE.md`
   - Open `FRONTEND_GUIDE_PART2.md`
   - Open `FRONTEND_GUIDE_PART3.md`

3. **Copy in this order:**

**A. Core (5 files - 10 min):**
- `src/index.js` → from FRONTEND_GUIDE.md #1
- `src/App.js` → from FRONTEND_GUIDE.md #2
- `src/context/AuthContext.js` → from FRONTEND_GUIDE.md #3
- `src/services/api.js` → from FRONTEND_GUIDE.md #4
- `src/services/authService.js` → from FRONTEND_GUIDE.md #5

**B. Services (4 files - 5 min):**
- `src/services/bookingService.js` → from FRONTEND_GUIDE.md #6
- `src/services/seriesService.js` → from FRONTEND_GUIDE.md #7
- `src/services/rotorService.js` → from FRONTEND_GUIDE.md #8
- `src/services/roomService.js` → from FRONTEND_GUIDE.md #9

**C. Utils (2 files - 5 min):**
- `src/utils/rotorHelper.js` → from FRONTEND_GUIDE.md #10
- `src/utils/recurrenceHelper.js` → from FRONTEND_GUIDE.md #11

**D. Basic Components (3 files - 10 min):**
- `src/components/Login.js` → from FRONTEND_GUIDE.md #12
- `src/components/Navigation.js` → from FRONTEND_GUIDE.md #13
- `src/components/Dashboard.js` → from FRONTEND_GUIDE_PART2.md #14

**E. Booking Components (2 files - 10 min):**
- `src/components/BookingForm.js` → from FRONTEND_GUIDE_PART2.md #15
- `src/components/BookingList.js` → from FRONTEND_GUIDE_PART3.md #19

**F. Recurring Booking ⭐ (3 files - 15 min):**
- `src/components/RecurringBookingForm.js` → from FRONTEND_GUIDE_PART2.md #16
- `src/components/RecurrencePattern.js` → from FRONTEND_GUIDE_PART3.md #17
- `src/components/SeriesPreview.js` → from FRONTEND_GUIDE_PART3.md #18

**G. Placeholders (2 files - 2 min):**
- `src/components/RoomManagement.js` → from FRONTEND_GUIDE_PART3.md #20
- `src/components/Settings.js` → from FRONTEND_GUIDE_PART3.md #20

### Step 3: Install & Run (5 min)

```bash
cd frontend
npm install  # Takes 2-3 minutes
npm start    # Opens browser automatically
```

---

## First Login

**URL:** http://localhost:3000

**Credentials:**
- Username: `admin`
- Password: `admin123`

---

## Test the Five-Week Rotor

### 1. Check Current Rotor Week
Look at the top navigation bar → You'll see "Rotor Week X of 5"

### 2. Create a Rotor-Based Recurring Booking

1. Click **"New Recurring"**
2. Fill in basic info:
   - Room: Select any room
   - Time: 9:00 AM - 10:00 AM
3. Recurrence Pattern:
   - Click **"Five-Week Rotor"** tab
   - Select weeks: Click **Week 1**, **Week 3**, **Week 5**
   - Select day: Click **Wednesday**
4. Set dates:
   - Start date: Today
   - End date: 3 months from now
5. Click **"Preview Instances"**
6. Review the generated bookings
7. Click **"Confirm & Create Series"**

### 3. View Your Bookings

1. Click **"View Bookings"**
2. You'll see all the Wednesday bookings on weeks 1, 3, and 5

---

## File Locations

**Already Created:**
```
backend/          ✅ All 18 files complete
package.json      ✅
.gitignore        ✅
README.md         ✅
SETUP_GUIDE.md    ✅
frontend/
  package.json    ✅
  public/
    index.html    ✅
```

**You Need to Create (copy from guides):**
```
frontend/
  src/
    index.js               📝
    App.js                 📝
    context/
      AuthContext.js       📝
    services/
      api.js               📝
      authService.js       📝
      bookingService.js    📝
      seriesService.js     📝
      rotorService.js      📝
      roomService.js       📝
    utils/
      rotorHelper.js       📝
      recurrenceHelper.js  📝
    components/
      Login.js                    📝
      Navigation.js               📝
      Dashboard.js                📝
      BookingForm.js              📝
      BookingList.js              📝
      RecurringBookingForm.js     📝
      RecurrencePattern.js        📝 ⭐ MOST IMPORTANT
      SeriesPreview.js            📝
      RoomManagement.js           📝
      Settings.js                 📝
```

---

## Common Issues

**Port 5000 already in use:**
```bash
# Windows
netstat -ano | findstr :5000
# Kill the process

# Mac/Linux
lsof -ti:5000 | xargs kill -9
```

**Frontend build errors:**
- Make sure you copied ALL files
- Check for syntax errors
- Ensure Material-UI packages are installed

**Can't login:**
- Make sure backend is running
- Check browser console for errors
- Verify database was initialized

---

## Key Endpoints to Test

**Get current rotor week:**
```bash
# Login first to get token
TOKEN="your_token_here"

curl http://localhost:5000/api/rotor/current-week \
  -H "Authorization: Bearer $TOKEN"
```

**Preview a recurring booking:**
```bash
curl -X POST http://localhost:5000/api/booking-series/preview \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "room_id": 1,
    "start_time": "14:00",
    "end_time": "15:00",
    "duration_minutes": 60,
    "recurrence_type": "five_week_rotor",
    "recurrence_pattern": {
      "five_week_rotor": {
        "weeks": [1, 3, 5],
        "day_of_week": 3
      }
    },
    "series_start_date": "2026-01-20",
    "series_end_date": "2026-04-20"
  }'
```

---

## Documentation Map

1. **QUICK_START.md** (this file) → Get started in 5-60 minutes
2. **README.md** → Project overview
3. **SETUP_GUIDE.md** → Detailed setup and API examples
4. **FRONTEND_GUIDE.md** (Parts 1-3) → All frontend code
5. **IMPLEMENTATION_SUMMARY.md** → Complete project status

---

## Next Steps

After you have the basic system running:

1. **Customize the UI** → Change colors, add your logo
2. **Add more rooms** → Use the Rooms page or API
3. **Set rotor start date** → Match your actual rotor cycle
4. **Create test bookings** → Try all three patterns
5. **Deploy** → Move to production server

---

## Support

For detailed information:
- Setup issues → See `SETUP_GUIDE.md`
- Code questions → See comments in files
- Frontend code → See `FRONTEND_GUIDE.md` parts 1-3

---

**You're ready to go! 🎉**

Start with the backend (5 min), then copy the frontend files (45 min), and you'll have a fully functional room booking system with five-week rotor support!
