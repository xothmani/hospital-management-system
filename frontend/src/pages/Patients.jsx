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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    medicalHistory: '',
  });

  const fetchPatients = async () => {
    try {
      console.log('Fetching patients...');
      // Get user from localStorage
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
      
      // Ensure patients is always an array
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
    console.log('Opening add patient dialog');
    setSelectedPatient(null);
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

  const handleEdit = (patient) => {
    console.log('Editing patient:', patient);
    setSelectedPatient(patient);
    setFormData({
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email,
      address: patient.address,
      medicalHistory: patient.medicalHistory,
    });
    setOpenDialog(true);
  };

  const handleDelete = async (patientId) => {
    try {
      console.log('Deleting patient:', patientId);
      // Get user from localStorage
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
      console.log('Patient deleted successfully');
      fetchPatients();
    } catch (error) {
      console.error('Error deleting patient:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Submitting patient data:', formData);
      
      // Get user from localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (!user || !user.token) {
        console.error('No authentication token found');
        return;
      }
      
      if (selectedPatient) {
        // Update patient
        await fetch(`/api/patients/${selectedPatient._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify(formData),
        });
        console.log('Patient updated successfully');
      } else {
        // Create new patient
        await fetch('/api/patients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify(formData),
        });
        console.log('New patient created successfully');
      }
      setOpenDialog(false);
      fetchPatients();
    } catch (error) {
      console.error('Error saving patient:', error);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Make sure patients is always treated as an array
  const filteredPatients = Array.isArray(patients) ? patients.filter((patient) =>
    patient.name && patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];
  console.log('Filtered patients:', filteredPatients);

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Patients Management
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Add Patient
        </Button>
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

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {selectedPatient ? 'Edit Patient' : 'Add New Patient'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  required
                  fullWidth
                  label="Age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  required
                  fullWidth
                  select
                  label="Gender"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  rows={4}
                  value={formData.medicalHistory}
                  onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Patients;