# Room Booking Service - Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Initialize the Database

```bash
cd backend
npm run init-db
```

This will create:
- SQLite database at `backend/database/bookings.db`
- Default admin user: `admin` / `admin123`
- Default staff user: `staff` / `staff123`
- Sample rooms and room types
- Rotor cycle with start date from `.env` file

### 3. Start the Application

#### Option A: Start Both Servers Together (Recommended)
```bash
# From the root directory
npm run dev
```

This starts:
- Backend API on http://localhost:5000
- Frontend on http://localhost:3000

#### Option B: Start Servers Separately
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

### 4. Access the Application

Open your browser to http://localhost:3000

Login with:
- Username: `admin`
- Password: `admin123`

## Project Structure

```
room-booking-service/
├── backend/                    # Node.js/Express backend
│   ├── config/                 # Database configuration
│   ├── controllers/            # Route controllers
│   ├── database/              # Database schema and initialization
│   │   ├── schema.sql         # Database schema
│   │   ├── init.js            # Database initialization script
│   │   └── bookings.db        # SQLite database (created after init)
│   ├── middleware/            # Authentication middleware
│   ├── routes/                # API routes
│   ├── services/              # Business logic
│   │   ├── recurrenceEngine.js  # Recurring booking logic
│   │   └── rotorCalculator.js   # Five-week rotor calculations
│   ├── .env                   # Environment variables
│   ├── package.json
│   └── server.js              # Main server file
│
├── frontend/                   # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/        # React components (to be created)
│   │   ├── context/           # React context (to be created)
│   │   ├── services/          # API services (to be created)
│   │   ├── utils/             # Utility functions (to be created)
│   │   ├── App.js             # Main app component (to be created)
│   │   └── index.js           # Entry point (to be created)
│   └── package.json
│
├── .gitignore
├── package.json               # Root package.json with scripts
└── README.md
```

## Backend API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Bookings (One-time)
- `GET /api/bookings` - List all bookings
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking
- `GET /api/bookings/availability` - Check availability

### Booking Series (Recurring)
- `GET /api/booking-series` - List all series
- `GET /api/booking-series/:id` - Get series details
- `POST /api/booking-series/preview` - Preview instances
- `POST /api/booking-series` - Create series
- `PUT /api/booking-series/:id` - Update series
- `DELETE /api/booking-series/:id` - Cancel series

### Rotor Management
- `GET /api/rotor/current-week` - Get current rotor week
- `GET /api/rotor/week-for-date/:date` - Get week for date
- `POST /api/rotor/set-cycle-start` - Set cycle start (admin only)

### Rooms
- `GET /api/rooms` - List all rooms
- `GET /api/rooms/types` - Get room types
- `GET /api/rooms/:id` - Get room details
- `POST /api/rooms` - Create room (admin only)
- `PUT /api/rooms/:id` - Update room (admin only)

## Testing the Backend API

You can test the API using curl or Postman:

### 1. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Save the returned token.

### 2. Get Current Rotor Week
```bash
curl http://localhost:5000/api/rotor/current-week \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Get Rooms
```bash
curl http://localhost:5000/api/rooms \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Create a One-Time Booking
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "room_id": 1,
    "booking_date": "2026-01-20",
    "start_time": "09:00",
    "end_time": "10:00",
    "duration_minutes": 60,
    "purpose": "Consultation",
    "procedure_type": "General Checkup"
  }'
```

### 5. Preview a Recurring Booking
```bash
curl -X POST http://localhost:5000/api/booking-series/preview \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "room_id": 1,
    "start_time": "14:00",
    "end_time": "15:00",
    "duration_minutes": 60,
    "purpose": "Weekly Consultation",
    "recurrence_type": "weekly",
    "recurrence_pattern": {
      "weekly": {
        "interval": 1,
        "days": [1, 3]
      }
    },
    "series_start_date": "2026-01-20",
    "series_end_date": "2026-03-31"
  }'
```

## Frontend Development

The frontend needs to be developed with the following key components:

### Core Files Needed:
1. `src/index.js` - React entry point
2. `src/App.js` - Main app with routing
3. `src/context/AuthContext.js` - Authentication state
4. `src/services/api.js` - Axios configuration
5. `src/components/Login.js` - Login form
6. `src/components/Dashboard.js` - Main dashboard
7. `src/components/BookingForm.js` - One-time booking form
8. `src/components/RecurringBookingForm.js` - Recurring booking form
9. `src/components/RecurrencePattern.js` - Recurrence pattern builder
10. `src/components/BookingList.js` - Booking list/table
11. `src/components/Navigation.js` - App navigation

### Frontend Implementation Steps:

1. Create the React app entry point and routing
2. Implement authentication context and login
3. Build the dashboard with rotor week indicator
4. Create booking forms (one-time and recurring)
5. Implement the recurrence pattern builder
6. Add booking list and calendar views
7. Style with Material-UI for clean, simple design

## Configuration

### Environment Variables

Backend `.env` file:
```
PORT=5000
JWT_SECRET=your_secure_secret_here
DB_PATH=./database/bookings.db
ROTOR_CYCLE_START=2026-01-17
NODE_ENV=development
```

### Rotor Cycle

The rotor cycle start date determines how the 5-week rotation is calculated. Set it to a Monday for best results.

To change the rotor cycle start date:
1. Update `ROTOR_CYCLE_START` in backend `.env`
2. Or use the API endpoint `/api/rotor/set-cycle-start` (admin only)

## Troubleshooting

### Database Issues
```bash
# Reset the database
cd backend
rm database/bookings.db
npm run init-db
```

### Port Already in Use
```bash
# Backend (port 5000)
lsof -ti:5000 | xargs kill -9  # Mac/Linux
netstat -ano | findstr :5000   # Windows

# Frontend (port 3000)
lsof -ti:3000 | xargs kill -9  # Mac/Linux
netstat -ano | findstr :3000   # Windows
```

### CORS Issues
Ensure the backend has CORS enabled (already configured in server.js)

## Next Steps

1. **Complete Frontend Development**: The backend is fully functional. Focus on building the React frontend components.

2. **Test Recurring Bookings**: Use the API to create and test various recurring patterns:
   - Weekly (every Monday and Wednesday)
   - Monthly (2nd Tuesday of each month)
   - Five-week rotor (Wednesday on weeks 1, 3, 5)

3. **Customize for Your Needs**:
   - Add more room types
   - Customize booking fields
   - Add email notifications
   - Implement reporting features

4. **Deploy**: Once tested, deploy to your preferred platform (local server, cloud, etc.)

## Support

For issues or questions:
- Check the logs in the backend terminal
- Review the API responses
- Ensure database is initialized
- Verify authentication tokens are being sent correctly

Happy booking!
