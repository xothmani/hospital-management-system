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
  Badge,
  InputBase,
  alpha,
} from '@mui/material';
import {
  AccountCircle,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Message as MessageIcon,
  ExitToApp as LogoutIcon,
} from '@mui/icons-material';

function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.messages);
  const [anchorEl, setAnchorEl] = useState(null);
  const [search, setSearch] = useState('');

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

  const handleSearch = (e) => {
    setSearch(e.target.value);
    // Implement search functionality here
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        backgroundColor: '#004d40',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        left: 240,
        width: 'calc(100% - 240px)',
      }}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              color: 'white',
              fontWeight: 'bold',
              ml: 2,
            }}
          >
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            
          >
            
          </Box>

          <IconButton color="inherit" onClick={() => navigate('/messages')}>
            <Badge badgeContent={unreadCount} color="error">
              <MessageIcon />
            </Badge>
          </IconButton>

          <IconButton color="inherit" onClick={() => navigate('/notifications')}>
            <Badge badgeContent={4} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <IconButton
            onClick={handleMenu}
            color="inherit"
            sx={{ ml: 1 }}
          >
            <Avatar
              alt={user?.name}
              src={user?.avatar}
              sx={{ width: 32, height: 32 }}
            />
          </IconButton>
        </Box>
      </Toolbar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        sx={{ mt: 1 }}
      >
        <MenuItem onClick={onProfile}>
          <AccountCircle sx={{ mr: 1 }} />
          Profile
        </MenuItem>
        <MenuItem onClick={onLogout}>
          <LogoutIcon sx={{ mr: 1 }} />
          Logout
        </MenuItem>
      </Menu>
    </AppBar>
  );
}

export default Header;