import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tab,
  Tabs,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  IconButton,
} from '@mui/material';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import EventIcon from '@mui/icons-material/Event';
import { useNavigate } from 'react-router-dom';

const Patients = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('new'); // 'new' or 'existing'
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    medicalHistory: '',
  });
  const [searchEmail, setSearchEmail] = useState('');

  useEffect(() => {
    // Redirect if not a doctor
    if (user.role !== 'doctor') {
      navigate('/dashboard');
      return;
    }
    fetchPatients();
  }, [user, navigate]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const response = await axios.get('/api/doctors/patients', config);
      setPatients(response.data);
    } catch (error) {
      toast.error('Error fetching patients');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setDialogMode('new');
    setFormData({
      name: '',
      age: '',
      gender: '',
      phone: '',
      email: '',
      address: '',
      medicalHistory: '',
    });
    setOpenDialog(true);
  };

  const handleAddExisting = () => {
    setDialogMode('existing');
    setSearchEmail('');
    setOpenDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      };

      if (dialogMode === 'existing') {
        // Associate existing patient
        await axios.post('/api/doctors/associate-patient', {
          email: searchEmail,
          doctorId: user._id
        }, config);
        toast.success('Patient associated successfully');
      } else {
        // Create new patient
        const patientData = {
          ...formData,
          doctorId: user._id,
          role: 'patient'
        };
        await axios.post('/api/doctors/create-patient', patientData, config);
        toast.success('Patient created successfully');
      }
      
      setOpenDialog(false);
      fetchPatients();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving patient');
    }
  };

  const handleBookAppointment = (patientId) => {
    navigate(`/appointments/new?patientId=${patientId}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">Patients Management</Typography>
          <Box>
            <Button
              variant="contained"
              startIcon={<PersonSearchIcon />}
              onClick={handleAddExisting}
              sx={{ mr: 2 }}
            >
              Add Existing Patient
            </Button>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={handleAddNew}
            >
              Add New Patient
            </Button>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={2}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', mt: 3 }}>
            <CircularProgress />
          </Box>
        ) : patients.length === 0 ? (
          <Box sx={{ width: '100%', textAlign: 'center', mt: 3 }}>
            <Typography variant="h6" color="textSecondary">
              No patients found. Add your first patient!
            </Typography>
          </Box>
        ) : (
          patients.map((patient) => (
            <Grid item xs={12} md={6} lg={4} key={patient._id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="h6">{patient.name}</Typography>
                      <Typography color="textSecondary">{patient.email}</Typography>
                    </Box>
                    <IconButton 
                      color="primary"
                      onClick={() => handleBookAppointment(patient._id)}
                      title="Book Appointment"
                    >
                      <EventIcon />
                    </IconButton>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Typography><strong>Contact:</strong> {patient.contactNumber}</Typography>
                  <Typography><strong>Gender:</strong> {patient.gender}</Typography>
                  <Typography><strong>Blood Group:</strong> {patient.bloodGroup}</Typography>
                  {patient.medicalHistory && (
                    <Typography><strong>Medical History:</strong> {patient.medicalHistory}</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'existing' ? 'Add Existing Patient' : 'Add New Patient'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {dialogMode === 'existing' ? (
              <TextField
                fullWidth
                label="Patient Email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                margin="normal"
                required
              />
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Gender</InputLabel>
                    <Select
                      value={formData.gender}
                      label="Gender"
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    multiline
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Medical History"
                    multiline
                    rows={3}
                    value={formData.medicalHistory}
                    onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                  />
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {dialogMode === 'existing' ? 'Add Patient' : 'Create Patient'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Patients;
