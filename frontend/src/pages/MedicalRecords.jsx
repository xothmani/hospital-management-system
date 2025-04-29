import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Box,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';

function MedicalRecords() {
  const { user } = useSelector((state) => state.auth);
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    patient: '',
    diagnosis: '',
    prescription: [{ medicine: '', dosage: '', frequency: '', duration: '' }],
    symptoms: [''],
    testResults: [{ testName: '', testResult: '', testDate: '' }],
    notes: '',
  });

  useEffect(() => {
    fetchMedicalRecords();
    if (user.role === 'doctor' || user.role === 'admin') {
      fetchPatients();
    }
  }, [user]);

  const fetchMedicalRecords = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const response = await axios.get('/api/medical-records', config);
      setRecords(response.data);
    } catch (error) {
      toast.error('Error fetching medical records');
    }
  };

  const fetchPatients = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const response = await axios.get('/api/users?role=patient', config);
      setPatients(response.data);
    } catch (error) {
      toast.error('Error fetching patients');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      if (selectedRecord) {
        await axios.put(
          `/api/medical-records/${selectedRecord._id}`,
          formData,
          config
        );
        toast.success('Medical record updated successfully');
      } else {
        await axios.post('/api/medical-records', formData, config);
        toast.success('Medical record created successfully');
      }

      setOpenDialog(false);
      fetchMedicalRecords();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving medical record');
    }
  };

  const resetForm = () => {
    setFormData({
      patient: '',
      diagnosis: '',
      prescription: [{ medicine: '', dosage: '', frequency: '', duration: '' }],
      symptoms: [''],
      testResults: [{ testName: '', testResult: '', testDate: '' }],
      notes: '',
    });
    setSelectedRecord(null);
  };

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setFormData({
      patient: record.patient._id,
      diagnosis: record.diagnosis,
      prescription: record.prescription,
      symptoms: record.symptoms,
      testResults: record.testResults,
      notes: record.notes,
    });
    setOpenDialog(true);
  };

  const handleView = (record) => {
    setSelectedRecord(record);
    setOpenViewDialog(true);
  };

  const addPrescriptionField = () => {
    setFormData({
      ...formData,
      prescription: [
        ...formData.prescription,
        { medicine: '', dosage: '', frequency: '', duration: '' },
      ],
    });
  };

  const addSymptom = () => {
    setFormData({
      ...formData,
      symptoms: [...formData.symptoms, ''],
    });
  };

  const addTestResult = () => {
    setFormData({
      ...formData,
      testResults: [...formData.testResults, { testName: '', testResult: '', testDate: '' }],
    });
  };

  const filteredRecords = records.filter((record) => {
    const searchString = searchTerm.toLowerCase();
    return (
      record.patient.name.toLowerCase().includes(searchString) ||
      record.diagnosis.toLowerCase().includes(searchString) ||
      record.doctor.name.toLowerCase().includes(searchString)
    );
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4">Medical Records</Typography>
          {user.role === 'doctor' && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                resetForm();
                setOpenDialog(true);
              }}
            >
              New Medical Record
            </Button>
          )}
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by patient name, diagnosis, or doctor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Paper>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Patient</TableCell>
                  <TableCell>Doctor</TableCell>
                  <TableCell>Diagnosis</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell>
                      {new Date(record.visitDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{record.patient.name}</TableCell>
                    <TableCell>{record.doctor.name}</TableCell>
                    <TableCell>{record.diagnosis}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleView(record)}>
                        <VisibilityIcon />
                      </IconButton>
                      {user.role === 'doctor' && record.doctor._id === user.id && (
                        <IconButton onClick={() => handleEdit(record)}>
                          <EditIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => {
          setOpenDialog(false);
          resetForm();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedRecord ? 'Edit Medical Record' : 'New Medical Record'}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Patient</InputLabel>
            <Select
              value={formData.patient}
              onChange={(e) =>
                setFormData({ ...formData, patient: e.target.value })
              }
            >
              {patients.map((patient) => (
                <MenuItem key={patient._id} value={patient._id}>
                  {patient.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Diagnosis"
            sx={{ mt: 2 }}
            value={formData.diagnosis}
            onChange={(e) =>
              setFormData({ ...formData, diagnosis: e.target.value })
            }
          />

          <Typography variant="h6" sx={{ mt: 2 }}>
            Symptoms
          </Typography>
          {formData.symptoms.map((symptom, index) => (
            <TextField
              key={index}
              fullWidth
              sx={{ mt: 1 }}
              value={symptom}
              onChange={(e) => {
                const newSymptoms = [...formData.symptoms];
                newSymptoms[index] = e.target.value;
                setFormData({ ...formData, symptoms: newSymptoms });
              }}
            />
          ))}
          <Button onClick={addSymptom} sx={{ mt: 1 }}>
            Add Symptom
          </Button>

          <Typography variant="h6" sx={{ mt: 2 }}>
            Prescription
          </Typography>
          {formData.prescription.map((med, index) => (
            <Box key={index} sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="Medicine"
                    value={med.medicine}
                    onChange={(e) => {
                      const newPrescription = [...formData.prescription];
                      newPrescription[index].medicine = e.target.value;
                      setFormData({ ...formData, prescription: newPrescription });
                    }}
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="Dosage"
                    value={med.dosage}
                    onChange={(e) => {
                      const newPrescription = [...formData.prescription];
                      newPrescription[index].dosage = e.target.value;
                      setFormData({ ...formData, prescription: newPrescription });
                    }}
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="Frequency"
                    value={med.frequency}
                    onChange={(e) => {
                      const newPrescription = [...formData.prescription];
                      newPrescription[index].frequency = e.target.value;
                      setFormData({ ...formData, prescription: newPrescription });
                    }}
                  />
                </Grid>
                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    label="Duration"
                    value={med.duration}
                    onChange={(e) => {
                      const newPrescription = [...formData.prescription];
                      newPrescription[index].duration = e.target.value;
                      setFormData({ ...formData, prescription: newPrescription });
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          ))}
          <Button onClick={addPrescriptionField} sx={{ mt: 1 }}>
            Add Medicine
          </Button>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes"
            sx={{ mt: 2 }}
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDialog(false);
            resetForm();
          }}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained">
            {selectedRecord ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog
        open={openViewDialog}
        onClose={() => setOpenViewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Medical Record Details</DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <>
              <Typography variant="h6" gutterBottom>
                Patient: {selectedRecord.patient.name}
              </Typography>
              <Typography variant="h6" gutterBottom>
                Doctor: Dr. {selectedRecord.doctor.name}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Date: {new Date(selectedRecord.visitDate).toLocaleDateString()}
              </Typography>

              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Diagnosis</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography>{selectedRecord.diagnosis}</Typography>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Symptoms</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {selectedRecord.symptoms.map((symptom, index) => (
                    <Chip key={index} label={symptom} sx={{ m: 0.5 }} />
                  ))}
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Prescription</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Medicine</TableCell>
                          <TableCell>Dosage</TableCell>
                          <TableCell>Frequency</TableCell>
                          <TableCell>Duration</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedRecord.prescription.map((med, index) => (
                          <TableRow key={index}>
                            <TableCell>{med.medicine}</TableCell>
                            <TableCell>{med.dosage}</TableCell>
                            <TableCell>{med.frequency}</TableCell>
                            <TableCell>{med.duration}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>

              {selectedRecord.notes && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Notes</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography>{selectedRecord.notes}</Typography>
                  </AccordionDetails>
                </Accordion>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default MedicalRecords; 