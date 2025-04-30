import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton as MuiIconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Email as EmailIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [dialogMode, setDialogMode] = useState('new');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    medicalHistory: '',
  });
  const [searchEmail, setSearchEmail] = useState('');

  const fetchPatients = async () => {
    try {
      console.log('Fetching patients...');
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (!user || !user.token) {
        console.error('No authentication token found');
        return;
      }
      
      const response = await fetch('/api/patients', {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      
      const data = await response.json();
      console.log('Fetched patients:', data);
      setPatients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([]);
    }
  };

  useEffect(() => {
    console.log('Component mounted/updated');
    fetchPatients();
  }, []);

  const handleAdd = () => {
    setDialogMode('new');
    setSelectedPatient(null);
    setFormData({
      name: '',
      age: '',
      gender: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
      address: '',
      medicalHistory: '',
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setOpenDialog(true);
  };

  const handleAddExisting = () => {
    setDialogMode('existing');
    setSearchEmail('');
    setOpenDialog(true);
  };

  const handleEdit = (patient) => {
    setDialogMode('edit');
    setSelectedPatient(patient);
    setFormData({
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email,
      password: '',
      confirmPassword: '',
      address: patient.address,
      medicalHistory: patient.medicalHistory,
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setOpenDialog(true);
  };

  const handleDelete = async (patientId) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (!user || !user.token) {
        console.error('No authentication token found');
        return;
      }
      
      await fetch(`/api/patients/${patientId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      toast.success('Patient deleted successfully');
      fetchPatients();
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast.error('Error deleting patient');
    }
  };

  const validateForm = () => {
    if (dialogMode === 'existing') {
      if (!searchEmail) {
        toast.error('Please enter patient email');
        return false;
      }
      return true;
    }

    // For new patient or edit
    const requiredFields = {
      name: 'Name',
      email: 'Email',
      phone: 'Contact Number',
      address: 'Address',
    };

    if (dialogMode === 'new') {
      requiredFields.password = 'Password';
      requiredFields.confirmPassword = 'Confirm Password';
    }

    // Check all required fields
    for (const [field, label] of Object.entries(requiredFields)) {
      if (!formData[field]) {
        toast.error(`Please enter ${label}`);
        return false;
      }
    }

    // Additional validation for new patient
    if (dialogMode === 'new') {
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters long');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return false;
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!validateForm()) {
        return;
      }

      const user = JSON.parse(localStorage.getItem('user'));
      
      if (!user || !user.token) {
        toast.error('Authentication error. Please login again.');
        return;
      }

      if (dialogMode === 'existing') {
        // Associate existing patient
        const response = await fetch('/api/doctors/associate-patient', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify({ email: searchEmail }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to associate patient');
        }
        
        toast.success('Patient associated successfully');
      } else {
        // Create or update patient
        const url = selectedPatient 
          ? `/api/patients/${selectedPatient._id}`
          : '/api/patients';
        
        const method = selectedPatient ? 'PUT' : 'POST';
        
        // Remove confirmPassword and format data
        const { confirmPassword, ...dataToSend } = formData;

        // Ensure all required fields are included
        const requestData = {
          ...dataToSend,
          phone: dataToSend.phone,
          age: parseInt(dataToSend.age),
          password: dataToSend.password, // Include password for user creation
          gender: dataToSend.gender,
          medicalHistory: dataToSend.medicalHistory || '',
          address: dataToSend.address || ''
        };

        console.log('Sending patient data:', requestData); // Debug log

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify(requestData),
        });

        const data = await response.json();
        console.log('Server response:', data); // Debug log
        
        if (!response.ok) {
          throw new Error(data.message || 'Error saving patient');
        }

        if (dialogMode === 'new') {
          toast.success(
            'Patient account created successfully!\n' +
            'Please provide these login credentials to the patient:\n' +
            `Email: ${formData.email}\n` +
            'They can use this email and the password you set to login to their account.',
            { autoClose: 10000 }
          );
        } else {
          toast.success('Patient updated successfully');
        }
      }
      
      setOpenDialog(false);
      fetchPatients();
    } catch (error) {
      console.error('Error saving patient:', error);
      toast.error(error.message || 'Error saving patient');
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredPatients = Array.isArray(patients) ? patients.filter((patient) =>
    patient.name && patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Patients Management
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            sx={{ mr: 2 }}
          >
            Add New Patient
          </Button>
          <Button
            variant="contained"
            startIcon={<EmailIcon />}
            onClick={handleAddExisting}
          >
            Add Existing Patient
          </Button>
        </Box>
        <TextField
          placeholder="Search patients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: '300px' }}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: 'action.active' }} />,
          }}
        />
      </Box>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Age</TableCell>
                <TableCell>Gender</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPatients
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((patient) => (
                  <TableRow key={patient._id}>
                    <TableCell>{patient.name}</TableCell>
                    <TableCell>{patient.age}</TableCell>
                    <TableCell>{patient.gender}</TableCell>
                    <TableCell>{patient.phone}</TableCell>
                    <TableCell>{patient.email}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEdit(patient)} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(patient._id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 100]}
          component="div"
          count={filteredPatients.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'existing' ? 'Add Existing Patient' : 
           dialogMode === 'edit' ? 'Edit Patient' : 'Add New Patient'}
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
                type="email"
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
                {dialogMode === 'new' && (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <MuiIconButton
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                              >
                                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </MuiIconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Confirm Password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <MuiIconButton
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                edge="end"
                              >
                                {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </MuiIconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </>
                )}
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
              {dialogMode === 'existing' ? 'Add Patient' : 
               dialogMode === 'edit' ? 'Save Changes' : 'Create Patient'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Patients;