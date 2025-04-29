import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Avatar,
  CircularProgress,
} from '@mui/material';
import { toast } from 'react-toastify';
import { updateProfile, reset } from '../features/auth/authSlice';

function Profile() {
  const dispatch = useDispatch();
  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    contactNumber: user?.contactNumber || '',
    address: user?.address || '',
  });

  const { name, email, contactNumber, address } = formData;

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }

    if (isSuccess) {
      toast.success('Profile updated successfully');
    }

    dispatch(reset());
  }, [isError, isSuccess, message, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!name || !contactNumber || !address) {
      toast.error('Please fill in all fields');
      return;
    }

    const userData = {
      name,
      contactNumber,
      address,
    };

    dispatch(updateProfile(userData));
  };

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
          <Avatar
            sx={{
              width: 100,
              height: 100,
              bgcolor: 'primary.main',
              fontSize: '40px',
              mb: 2,
            }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="h4" gutterBottom>
            My Profile
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Role: {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={name}
                onChange={onChange}
                required
                helperText="Enter your full name"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={email}
                disabled
                helperText="Email cannot be changed"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Number"
                name="contactNumber"
                value={contactNumber}
                onChange={onChange}
                required
                helperText="Enter your contact number"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={address}
                onChange={onChange}
                multiline
                rows={3}
                required
                helperText="Enter your full address"
              />
            </Grid>
            {user?.role === 'doctor' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Specialization"
                  value={user.specialization || ''}
                  disabled
                  helperText="Specialization cannot be changed"
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Update Profile'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}

export default Profile; 