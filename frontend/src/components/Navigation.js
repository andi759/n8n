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
  Settings,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { getCurrentWeek } from '../services/rotorService';

function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [rotaWeek, setRotaWeek] = useState(null);

  useEffect(() => {
    loadRotaWeek();
  }, []);

  const loadRotaWeek = async () => {
    try {
      const data = await getCurrentWeek();
      setRotaWeek(data);
    } catch (error) {
      console.error('Failed to load rota week:', error);
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
    { label: 'Admin', path: '/admin', icon: <Settings /> },
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

        {rotaWeek && (
          <Chip
            label={`Rota ${rotaWeek.description}`}
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
          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

export default Navigation;
