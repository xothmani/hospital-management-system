import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, reset } from '../features/auth/authSlice';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Badge,
} from '@mui/material';
import {
  AccountCircle,
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
  Message as MessageIcon,
} from '@mui/icons-material';

function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.messages);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const onLogout = () => {
    dispatch(logout());
    dispatch(reset());
    navigate('/');
    handleClose();
  };

  const onProfile = () => {
    navigate('/profile');
    handleClose();
  };

  // Get first letter of user name for avatar
  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <AppBar position="static" sx={{ mb: 4 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Hospital Management System
        </Typography>
        {user ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Button color="inherit" onClick={() => navigate('/dashboard')}>
                Dashboard
              </Button>
              <Button color="inherit" onClick={() => navigate('/appointments')}>
                Appointments
              </Button>
              {user.role === 'doctor' && (
                <Button color="inherit" onClick={() => navigate('/doctor-schedule')}>
                  Manage Availability
                </Button>
              )}
              {(user.role === 'doctor' || user.role === 'admin') && (
                <Button color="inherit" onClick={() => navigate('/medical-records')}>
                  Medical Records
                </Button>
              )}
              {(user.role === 'doctor' || user.role === 'patient') && (
                <Button
                  color="inherit"
                  onClick={() => navigate('/messages')}
                  startIcon={
                    <Badge badgeContent={unreadCount} color="error">
                      <MessageIcon />
                    </Badge>
                  }
                >
                  Messages
                </Button>
              )}
              
              {/* Profile Menu */}
              <IconButton
                size="large"
                onClick={handleMenu}
                color="inherit"
                sx={{ ml: 2 }}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                  {getInitials(user.name)}
                </Avatar>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="subtitle1">{user.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Typography>
                </Box>
                <Divider />
                <MenuItem onClick={onProfile}>
                  <PersonIcon sx={{ mr: 2 }} />
                  My Profile
                </MenuItem>
                <MenuItem onClick={onLogout}>
                  <LogoutIcon sx={{ mr: 2 }} />
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          </>
        ) : (
          <Box>
            <Button color="inherit" onClick={() => navigate('/')}>
              Login
            </Button>
            <Button color="inherit" onClick={() => navigate('/register')}>
              Register
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Header;  // ✅ Ensure this line is present
  