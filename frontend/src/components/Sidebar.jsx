import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
} from '@mui/icons-material';

const Sidebar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.messages);

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Appointments', icon: <CalendarIcon />, path: '/appointments' },
    { text: 'Medical Records', icon: <MedicalIcon />, path: '/medical-records' },
    { text: 'Patients', icon: <PeopleIcon />, path: '/patients' },
    { text: 'Messages', icon: <MessageIcon />, path: '/messages', badge: unreadCount },
    { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
  ];

  const handleLogout = () => {
    dispatch(logout());
    dispatch(reset());
    navigate('/');
  };

  return (
    <Box
      sx={{
        width: 240,
        height: '100vh',
        backgroundColor: '#f5f5f5',
        borderRight: 'none',
      }}
    >
      <Box
        sx={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#004d40',
          color: 'white',
        }}
      >
        <Typography variant="h6" component="div">
          Hospital Management
        </Typography>
      </Box>
      <Divider />
      <List sx={{ flex: 1 }}>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => navigate(item.path)}
            sx={{
              '&.Mui-selected': {
                backgroundColor: '#e0f7fa',
                '&:hover': {
                  backgroundColor: '#b2ebf2',
                },
              },
              pl: 1,
            }}
          >
            <ListItemIcon>
              {item.badge ? (
                <Badge badgeContent={item.badge} color="error">
                  {item.icon}
                </Badge>
              ) : (
                item.icon
              )}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      <Divider />
    </Box>
  );
};

export default Sidebar;