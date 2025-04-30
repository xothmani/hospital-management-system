import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout, reset } from '../features/auth/authSlice';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  IconButton,
  Badge,
  Tooltip,
  Avatar,
  Paper,
  ListSubheader,
  ListItemButton,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  LocalHospital as HospitalIcon,
  Event as CalendarIcon,
  MedicalServices as MedicalIcon,
  Person as PersonIcon,
  Message as MessageIcon,
  ExitToApp as LogoutIcon,
  Menu as MenuIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Assignment as AssignmentIcon,
  Medication as MedicationIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as StaffIcon,
  HealthAndSafety as HealthIcon,
} from '@mui/icons-material';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.messages);

  // Get user's first letter for avatar
  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  // Get role-based color
  const getRoleColor = (role) => {
    switch(role) {
      case 'doctor': return '#4caf50';
      case 'patient': return '#2196f3';
      case 'admin': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  // Common menu items for all roles
  const commonMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Messages', icon: <MessageIcon />, path: '/messages', badge: unreadCount },
    { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
  ];

  // Doctor-specific menu items
  const doctorMenuItems = [
    { category: 'Patient Management', items: [
      { text: 'Patients', icon: <PeopleIcon />, path: '/patients' },
      { text: 'Medical Records', icon: <MedicalIcon />, path: '/medical-records' },
    ]},
    { category: 'Appointments', items: [
      { text: 'My Schedule', icon: <CalendarIcon />, path: '/appointments' },
      { text: 'Prescriptions', icon: <MedicationIcon />, path: '/prescriptions' },
    ]}
  ];

  // Patient-specific menu items
  const patientMenuItems = [
    { category: 'My Health', items: [
      { text: 'My Appointments', icon: <CalendarIcon />, path: '/appointments' },
      { text: 'My Records', icon: <AssignmentIcon />, path: '/medical-records' },
      { text: 'My Prescriptions', icon: <MedicationIcon />, path: '/prescriptions' },
    ]}
  ];

  // Admin-specific menu items
  const adminMenuItems = [
    { category: 'User Management', items: [
      { text: 'Manage Staff', icon: <StaffIcon />, path: '/manage-staff' },
      { text: 'Manage Patients', icon: <PeopleIcon />, path: '/manage-patients' },
      { text: 'Manage Doctors', icon: <HospitalIcon />, path: '/manage-doctors' },
    ]},
    { category: 'System', items: [
      { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    ]}
  ];

  // Check if a path is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    dispatch(logout());
    dispatch(reset());
    navigate('/');
  };

  return (
    <Paper
      elevation={3}
      sx={{
        width: 260,
        height: '100vh',
        backgroundColor: '#fff',
        borderRight: 'none',
        borderRadius: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          height: '70px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#004d40',
          color: 'white',
          px: 2,
        }}
      >
        <HealthIcon sx={{ mr: 1, fontSize: 28 }} />
        <Typography variant="h6" component="div" fontWeight="bold">
          Hospital System
        </Typography>
      </Box>

      {user && (
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee' }}>
          <Avatar 
            sx={{ 
              bgcolor: getRoleColor(user.role),
              width: 42, 
              height: 42,
              mr: 2,
              fontWeight: 'bold'
            }}
          >
            {getInitial(user.name)}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" noWrap>
              {user.name}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                textTransform: 'capitalize',
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.75rem'
              }}
            >
              {user.role || 'User'}
            </Typography>
          </Box>
        </Box>
      )}

      <Box sx={{ flexGrow: 1, overflow: 'auto', pt: 1 }}>
        {/* Common menu items */}
        <List component="nav" dense>
          {commonMenuItems.map((item) => (
            <Tooltip title={item.text} placement="right" key={item.text}>
              <ListItemButton
                selected={isActive(item.path)}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: '0 20px 20px 0',
                  mx: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: '#e0f7fa',
                    '&:hover': {
                      backgroundColor: '#b2ebf2',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="error">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </Tooltip>
          ))}
        </List>

        <Divider sx={{ my: 1.5 }} />

        {/* Role-specific menu items */}
        {user && user.role === 'doctor' && doctorMenuItems.map((section, index) => (
          <List
            key={index}
            component="nav"
            dense
            subheader={
              <ListSubheader component="div" sx={{ bgcolor: 'transparent', lineHeight: '30px' }}>
                {section.category}
              </ListSubheader>
            }
          >
            {section.items.map((item) => (
              <Tooltip title={item.text} placement="right" key={item.text}>
                <ListItemButton
                  selected={isActive(item.path)}
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: '0 20px 20px 0',
                    mx: 1,
                    mb: 0.5,
                    '&.Mui-selected': {
                      backgroundColor: '#e0f7fa',
                      '&:hover': {
                        backgroundColor: '#b2ebf2',
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </Tooltip>
            ))}
          </List>
        ))}

        {user && user.role === 'patient' && patientMenuItems.map((section, index) => (
          <List
            key={index}
            component="nav"
            dense
            subheader={
              <ListSubheader component="div" sx={{ bgcolor: 'transparent', lineHeight: '30px' }}>
                {section.category}
              </ListSubheader>
            }
          >
            {section.items.map((item) => (
              <Tooltip title={item.text} placement="right" key={item.text}>
                <ListItemButton
                  selected={isActive(item.path)}
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: '0 20px 20px 0',
                    mx: 1,
                    mb: 0.5,
                    '&.Mui-selected': {
                      backgroundColor: '#e0f7fa',
                      '&:hover': {
                        backgroundColor: '#b2ebf2',
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </Tooltip>
            ))}
          </List>
        ))}

        {user && user.role === 'admin' && adminMenuItems.map((section, index) => (
          <List
            key={index}
            component="nav"
            dense
            subheader={
              <ListSubheader component="div" sx={{ bgcolor: 'transparent', lineHeight: '30px' }}>
                {section.category}
              </ListSubheader>
            }
          >
            {section.items.map((item) => (
              <Tooltip title={item.text} placement="right" key={item.text}>
                <ListItemButton
                  selected={isActive(item.path)}
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: '0 20px 20px 0',
                    mx: 1,
                    mb: 0.5,
                    '&.Mui-selected': {
                      backgroundColor: '#e0f7fa',
                      '&:hover': {
                        backgroundColor: '#b2ebf2',
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </Tooltip>
            ))}
          </List>
        ))}
      </Box>

      <Divider />
      <List dense>
        <ListItemButton onClick={handleLogout} sx={{ py: 1 }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </List>
    </Paper>
  );
};

export default Sidebar;