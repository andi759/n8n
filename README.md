# Room Booking Service

A web-based room booking system for outpatient departments with support for recurring bookings and five-week rotor scheduling.

## Features

- **One-time Bookings**: Create individual room reservations
- **Recurring Bookings**: Support for:
  - Weekly patterns (e.g., every Monday and Wednesday)
  - Monthly patterns (e.g., 2nd Tuesday of each month)
  - Five-week rotor patterns (e.g., Wednesday on weeks 1, 3, and 5)
- **Room Management**: Manage multiple rooms and their availability
- **Staff Authentication**: Secure login for staff members
- **Clean, Simple UI**: Intuitive interface built with Material-UI
- **Conflict Detection**: Prevent double-booking with automatic conflict checking

## Technology Stack

- **Frontend**: React.js with Material-UI
- **Backend**: Node.js with Express.js
- **Database**: SQLite
- **Authentication**: JWT-based authentication

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup

1. Install dependencies for both backend and frontend:
```bash
npm run install-all
```

2. Set up environment variables:
Create a `.env` file in the `backend` directory:
```
PORT=5000
JWT_SECRET=your_secure_jwt_secret_here
DB_PATH=./database/bookings.db
ROTOR_CYCLE_START=2026-01-01
```

3. Initialize the database:
```bash
cd backend
npm run init-db
```

4. Start the development servers:
```bash
# From the root directory
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- Frontend development server on http://localhost:3000

## Usage

### First Time Setup

1. Access the application at http://localhost:3000
2. Log in with default credentials (will be created during database initialization)
3. Set up the rotor cycle start date in Settings
4. Add rooms to the system
5. Start creating bookings!

### Creating Bookings

**One-time Booking:**
1. Click "New Booking"
2. Select "One-time booking"
3. Choose room, date, and time
4. Fill in purpose/procedure details
5. Submit

**Recurring Booking:**
1. Click "New Booking"
2. Select "Recurring booking"
3. Choose recurrence pattern (Weekly, Monthly, or Five-Week Rotor)
4. Configure the pattern details
5. Click "Preview" to see all instances
6. Confirm and create

### Five-Week Rotor

The five-week rotor system allows doctors to schedule recurring appointments based on a rotating five-week cycle. For example:
- Week 1: Consultation room every Monday
- Week 3: Procedure room every Wednesday
- Week 5: Examination room every Friday

The system automatically calculates which week of the rotor cycle it is and generates bookings accordingly.

## Project Structure

```
room-booking-service/
├── backend/
│   ├── config/          # Database and app configuration
│   ├── controllers/     # Route controllers
│   ├── database/        # Database schema and initialization
│   ├── middleware/      # Authentication and validation
│   ├── routes/          # API routes
│   ├── services/        # Business logic (recurrence engine, rotor calculator)
│   └── server.js        # Main server file
├── frontend/
│   ├── public/          # Static files
│   └── src/
│       ├── components/  # React components
│       ├── context/     # React context (auth)
│       ├── services/    # API communication
│       ├── utils/       # Helper functions
│       └── App.js       # Main React component
└── package.json
```

## API Documentation

See [API.md](./API.md) for detailed API documentation (to be created).

## Testing

Run tests:
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Deployment

### Local Network Deployment

1. Build the frontend:
```bash
npm run build
```

2. Configure the backend to serve the frontend build
3. Run the backend server on the desired machine
4. Access from other machines using the server's IP address

### Cloud Deployment

Instructions for deploying to cloud platforms will be added based on your deployment choice.

## License

ISC

## Support

For issues and questions, please contact your system administrator.
