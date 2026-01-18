# Frontend Development Guide - Room Booking Service

This guide provides complete code templates for all frontend components. Each file is ready to use with minimal customization needed.

## Table of Contents
1. [Project Entry Points](#project-entry-points)
2. [Authentication & Context](#authentication--context)
3. [API Services](#api-services)
4. [Core Components](#core-components)
5. [Booking Components](#booking-components)
6. [Recurring Booking Components](#recurring-booking-components)
7. [Utility Functions](#utility-functions)
8. [Styling](#styling)

---

## Project Entry Points

### 1. `src/index.js`
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import App from './App';
import { AuthProvider } from './context/AuthContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </LocalizationProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

### 2. `src/App.js`
```javascript
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';

import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Navigation from './components/Navigation';
import BookingForm from './components/BookingForm';
import RecurringBookingForm from './components/RecurringBookingForm';
import BookingList from './components/BookingList';
import RoomManagement from './components/RoomManagement';
import Settings from './components/Settings';

// Clean, simple theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontSize: 14,
    button: {
      textTransform: 'none',
      fontSize: '1rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function App() {
  const { user } = useAuth();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {user && <Navigation />}
        <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/new-booking"
              element={
                <ProtectedRoute>
                  <BookingForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/new-recurring"
              element={
                <ProtectedRoute>
                  <RecurringBookingForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <ProtectedRoute>
                  <BookingList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rooms"
              element={
                <ProtectedRoute>
                  <RoomManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
```

---

## Authentication & Context

### 3. `src/context/AuthContext.js`
```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi, logout as logoutApi } from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await loginApi(username, password);
      const { token: newToken, user: newUser } = response;

      setToken(newToken);
      setUser(newUser);

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  const value = {
    user,
    token,
    login,
    logout,
    loading,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

---

## API Services

### 4. `src/services/api.js`
```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 5. `src/services/authService.js`
```javascript
import api from './api';

export const login = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};
```

### 6. `src/services/bookingService.js`
```javascript
import api from './api';

export const getAllBookings = async (params = {}) => {
  const response = await api.get('/bookings', { params });
  return response.data;
};

export const getBooking = async (id) => {
  const response = await api.get(`/bookings/${id}`);
  return response.data;
};

export const createBooking = async (bookingData) => {
  const response = await api.post('/bookings', bookingData);
  return response.data;
};

export const updateBooking = async (id, bookingData) => {
  const response = await api.put(`/bookings/${id}`, bookingData);
  return response.data;
};

export const deleteBooking = async (id) => {
  const response = await api.delete(`/bookings/${id}`);
  return response.data;
};

export const checkAvailability = async (roomId, startDate, endDate) => {
  const response = await api.get('/bookings/availability', {
    params: { room_id: roomId, start_date: startDate, end_date: endDate }
  });
  return response.data;
};
```

### 7. `src/services/seriesService.js`
```javascript
import api from './api';

export const getAllSeries = async (params = {}) => {
  const response = await api.get('/booking-series', { params });
  return response.data;
};

export const getSeries = async (id) => {
  const response = await api.get(`/booking-series/${id}`);
  return response.data;
};

export const previewSeries = async (seriesData) => {
  const response = await api.post('/booking-series/preview', seriesData);
  return response.data;
};

export const createSeries = async (seriesData) => {
  const response = await api.post('/booking-series', seriesData);
  return response.data;
};

export const updateSeries = async (id, seriesData) => {
  const response = await api.put(`/booking-series/${id}`, seriesData);
  return response.data;
};

export const deleteSeries = async (id) => {
  const response = await api.delete(`/booking-series/${id}`);
  return response.data;
};
```

### 8. `src/services/rotorService.js`
```javascript
import api from './api';

export const getCurrentWeek = async () => {
  const response = await api.get('/rotor/current-week');
  return response.data;
};

export const getWeekForDate = async (date) => {
  const response = await api.get(`/rotor/week-for-date/${date}`);
  return response.data;
};

export const setCycleStart = async (startDate) => {
  const response = await api.post('/rotor/set-cycle-start', { start_date: startDate });
  return response.data;
};
```

### 9. `src/services/roomService.js`
```javascript
import api from './api';

export const getAllRooms = async (params = {}) => {
  const response = await api.get('/rooms', { params });
  return response.data;
};

export const getRoom = async (id) => {
  const response = await api.get(`/rooms/${id}`);
  return response.data;
};

export const getRoomTypes = async () => {
  const response = await api.get('/rooms/types');
  return response.data;
};

export const createRoom = async (roomData) => {
  const response = await api.post('/rooms', roomData);
  return response.data;
};

export const updateRoom = async (id, roomData) => {
  const response = await api.put(`/rooms/${id}`, roomData);
  return response.data;
};
```

---

## Utility Functions

### 10. `src/utils/rotorHelper.js`
```javascript
/**
 * Calculate rotor week number for a given date (client-side version)
 */
export function calculateRotorWeek(date, cycleStartDate) {
  const targetDate = new Date(date);
  const startDate = new Date(cycleStartDate);

  targetDate.setHours(0, 0, 0, 0);
  startDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate - startDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const weeksSinceStart = Math.floor(diffDays / 7);
  const rotorWeek = (weeksSinceStart % 5) + 1;

  return rotorWeek;
}

/**
 * Get human-readable rotor week description
 */
export function getRotorWeekDescription(week) {
  return `Week ${week} of 5`;
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format time as HH:MM
 */
export function formatTime(date) {
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Get day name from day number (0=Sunday, 1=Monday, etc.)
 */
export function getDayName(dayNumber) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayNumber];
}

/**
 * Get short day name
 */
export function getShortDayName(dayNumber) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[dayNumber];
}
```

### 11. `src/utils/recurrenceHelper.js`
```javascript
/**
 * Generate human-readable recurrence description
 */
export function getRecurrenceDescription(recurrenceType, pattern) {
  if (!pattern) return 'No recurrence';

  switch (recurrenceType) {
    case 'weekly':
      return getWeeklyDescription(pattern.weekly);
    case 'monthly':
      return getMonthlyDescription(pattern.monthly);
    case 'five_week_rotor':
      return getRotorDescription(pattern.five_week_rotor);
    default:
      return 'Custom recurrence';
  }
}

function getWeeklyDescription(weekly) {
  if (!weekly) return '';

  const { interval, days } = weekly;
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const selectedDays = days.map(d => dayNames[d]).join(', ');

  if (interval === 1) {
    return `Every week on ${selectedDays}`;
  } else {
    return `Every ${interval} weeks on ${selectedDays}`;
  }
}

function getMonthlyDescription(monthly) {
  if (!monthly) return '';

  const { type, day, weekday, week_number } = monthly;

  if (type === 'day_of_month') {
    return `Day ${day} of each month`;
  } else if (type === 'weekday_of_month') {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const ordinals = ['', 'first', 'second', 'third', 'fourth', 'fifth'];
    return `${ordinals[week_number]} ${dayNames[weekday]} of each month`;
  }

  return 'Monthly';
}

function getRotorDescription(rotor) {
  if (!rotor) return '';

  const { weeks, day_of_week } = rotor;
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weeksStr = weeks.join(', ');

  return `${dayNames[day_of_week]} on rotor weeks ${weeksStr}`;
}

/**
 * Validate recurrence pattern
 */
export function validateRecurrencePattern(recurrenceType, pattern) {
  if (!pattern) return false;

  switch (recurrenceType) {
    case 'weekly':
      return pattern.weekly && pattern.weekly.days && pattern.weekly.days.length > 0;
    case 'monthly':
      return pattern.monthly && pattern.monthly.type;
    case 'five_week_rotor':
      return pattern.five_week_rotor &&
             pattern.five_week_rotor.weeks &&
             pattern.five_week_rotor.weeks.length > 0 &&
             pattern.five_week_rotor.day_of_week !== undefined;
    default:
      return false;
  }
}
```

---

## Core Components

### 12. `src/components/Login.js`
```javascript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Room Booking Service
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Sign in to manage room bookings
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Username"
              fullWidth
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="caption" display="block" gutterBottom>
              Default credentials:
            </Typography>
            <Typography variant="caption" display="block">
              Admin: admin / admin123
            </Typography>
            <Typography variant="caption" display="block">
              Staff: staff / staff123
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default Login;
```

### 13. `src/components/Navigation.js`
```javascript
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  AccountCircle,
  CalendarToday,
  EventRepeat,
  ViewList,
  MeetingRoom,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { getCurrentWeek } from '../services/rotorService';

function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [rotorWeek, setRotorWeek] = useState(null);

  useEffect(() => {
    loadRotorWeek();
  }, []);

  const loadRotorWeek = async () => {
    try {
      const data = await getCurrentWeek();
      setRotorWeek(data);
    } catch (error) {
      console.error('Failed to load rotor week:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: <CalendarToday /> },
    { label: 'New Booking', path: '/new-booking', icon: <CalendarToday /> },
    { label: 'New Recurring', path: '/new-recurring', icon: <EventRepeat /> },
    { label: 'View Bookings', path: '/bookings', icon: <ViewList /> },
    { label: 'Rooms', path: '/rooms', icon: <MeetingRoom /> },
  ];

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 4 }}>
          Room Booking
        </Typography>

        <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              startIcon={item.icon}
              onClick={() => navigate(item.path)}
              sx={{
                bgcolor: location.pathname === item.path ? 'rgba(255,255,255,0.15)' : 'transparent',
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        {rotorWeek && (
          <Chip
            label={`Rotor ${rotorWeek.description}`}
            color="secondary"
            sx={{ mr: 2 }}
          />
        )}

        <IconButton color="inherit" onClick={handleMenuClick}>
          <AccountCircle />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem disabled>
            <Typography variant="body2">
              {user?.full_name} ({user?.role})
            </Typography>
          </MenuItem>
          {user?.role === 'admin' && (
            <MenuItem
              onClick={() => {
                navigate('/settings');
                handleMenuClose();
              }}
            >
              <SettingsIcon sx={{ mr: 1 }} fontSize="small" />
              Settings
            </MenuItem>
          )}
          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

export default Navigation;
```

---

*Continued in next part...*
