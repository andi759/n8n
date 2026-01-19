import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import RoomManagement from './admin/RoomManagement';
import UserManagement from './admin/UserManagement';
import SpecialtyManagement from './admin/SpecialtyManagement';
import RotaConfiguration from './admin/RotorConfiguration';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} role="tabpanel">
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function AdminPage() {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 3, mt: 2 }}>
        <Typography variant="h4" gutterBottom>
          Administration
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage rooms, users, and system configuration
        </Typography>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Room Management" />
          <Tab label="User Management" />
          <Tab label="Specialties" />
          <Tab label="Rota Configuration" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <RoomManagement />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <UserManagement />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <SpecialtyManagement />
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <RotaConfiguration />
        </TabPanel>
      </Paper>
    </Container>
  );
}

export default AdminPage;
