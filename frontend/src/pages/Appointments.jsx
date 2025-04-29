import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
  Badge,
  Box,
  Divider,
} from '@mui/material';
import { Add as AddIcon, Message as MessageIcon, Send as SendIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';

function Appointments() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openPatientModal, setOpenPatientModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [formData, setFormData] = useState({
    doctor: '',
    appointmentDate: '',
    timeSlot: '',
    reason: '',
  });
  const [doctorSchedule, setDoctorSchedule] = useState(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30'
  ];

  useEffect(() => {
    fetchAppointments();
    if (user.role === 'patient') {
      fetchDoctors();
    }
    if (user.role === 'doctor') {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (formData.doctor && formData.appointmentDate) {
      updateAvailableTimeSlots();
    }
  }, [formData.doctor, formData.appointmentDate, doctorSchedule]);

  const fetchAppointments = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const response = await axios.get('/api/appointments', config);
      setAppointments(response.data);
    } catch (error) {
      toast.error('Error fetching appointments');
    }
  };

  const fetchDoctors = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const response = await axios.get('/api/users?role=doctor', config);
      setDoctors(response.data);
    } catch (error) {
      toast.error('Error fetching doctors');
    }
  };

  const fetchDoctorSchedule = async (doctorId) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const response = await axios.get(`/api/doctor-schedules/${doctorId}`, config);
      setDoctorSchedule(response.data);
    } catch (error) {
      toast.error('Error fetching doctor schedule');
    }
  };

  const updateAvailableTimeSlots = () => {
    if (!doctorSchedule || !formData.appointmentDate) return;

    const selectedDate = new Date(formData.appointmentDate);
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Find working hours for the selected day
    const workingHours = doctorSchedule.workingHours.find(h => h.day === dayOfWeek);
    if (!workingHours) {
      setAvailableTimeSlots([]);
      return;
    }

    // Convert working hours and slots to minutes for comparison
    const convertTimeToMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const startMinutes = convertTimeToMinutes(workingHours.startTime);
    const endMinutes = convertTimeToMinutes(workingHours.endTime);

    // Filter time slots based on working hours
    const slotsInWorkingHours = timeSlots.filter(slot => {
      const slotMinutes = convertTimeToMinutes(slot);
      return slotMinutes >= startMinutes && slotMinutes <= endMinutes;
    });

    // Filter out slots that already have appointments
    const bookedSlots = appointments
      .filter(apt => 
        apt.doctor._id === formData.doctor && 
        new Date(apt.appointmentDate).toDateString() === selectedDate.toDateString() &&
        apt.status !== 'cancelled'
      )
      .map(apt => apt.timeSlot);

    const availableSlots = slotsInWorkingHours.filter(slot => !bookedSlots.includes(slot));
    setAvailableTimeSlots(availableSlots);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      await axios.post('/api/appointments', formData, config);
      toast.success('Appointment created successfully');
      setOpenDialog(false);
      fetchAppointments();
      setFormData({
        doctor: '',
        appointmentDate: '',
        timeSlot: '',
        reason: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error creating appointment');
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      await axios.put(
        `/api/appointments/${appointmentId}`,
        { status: newStatus },
        config
      );
      toast.success('Appointment status updated');
      fetchAppointments();
    } catch (error) {
      toast.error('Error updating appointment status');
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const response = await axios.get('/api/messages/unread/count', config);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handlePatientClick = (patient) => {
    setSelectedPatient(patient);
    setOpenPatientModal(true);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      await axios.post(
        '/api/messages',
        {
          receiverId: selectedPatient._id,
          content: newMessage,
        },
        config
      );
      toast.success('Message sent successfully');
      setNewMessage('');
    } catch (error) {
      toast.error('Error sending message');
    }
  };

  const handleDelete = async (appointmentId) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };
        await axios.delete(`/api/appointments/${appointmentId}`, config);
        toast.success('Appointment deleted');
        fetchAppointments();
      } catch (error) {
        toast.error('Error deleting appointment');
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4">Appointments</Typography>
          <Box display="flex" alignItems="center" gap={2}>
            {user.role === 'doctor' && (
              <IconButton color="primary" onClick={() => navigate('/messages')}>
                <Badge badgeContent={unreadCount} color="error">
                  <MessageIcon />
                </Badge>
              </IconButton>
            )}
            {user.role === 'patient' && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenDialog(true)}
              >
                New Appointment
              </Button>
            )}
          </Box>
        </Grid>
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Doctor</TableCell>
                  <TableCell>Patient</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {appointments.map((appointment) => (
                  <TableRow key={appointment._id}>
                    <TableCell>
                      {new Date(appointment.appointmentDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(`2000-01-01T${appointment.timeSlot}`).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true
                      })}
                    </TableCell>
                    <TableCell>{appointment.doctor.name}</TableCell>
                    <TableCell>
                      {user.role === 'doctor' ? (
                        <Button
                          onClick={() => handlePatientClick(appointment.patient)}
                          color="primary"
                        >
                          {appointment.patient.name}
                        </Button>
                      ) : (
                        appointment.patient.name
                      )}
                    </TableCell>
                    <TableCell>{appointment.status}</TableCell>
                    <TableCell>
                      {user.role === 'doctor' && (
                        <>
                          <Button
                            size="small"
                            onClick={() =>
                              handleStatusChange(appointment._id, 'completed')
                            }
                            disabled={appointment.status === 'completed'}
                          >
                            Complete
                          </Button>
                          <Button
                            size="small"
                            onClick={() =>
                              handleStatusChange(appointment._id, 'cancelled')
                            }
                            disabled={appointment.status === 'cancelled'}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      {(user.role === 'patient' ||
                        user.role === 'admin') && (
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleDelete(appointment._id)}
                        >
                          Delete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>New Appointment</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Doctor</InputLabel>
            <Select
              value={formData.doctor}
              onChange={(e) => {
                const doctorId = e.target.value;
                setFormData({ ...formData, doctor: doctorId, timeSlot: '' });
                fetchDoctorSchedule(doctorId);
              }}
            >
              {doctors.map((doctor) => (
                <MenuItem key={doctor._id} value={doctor._id}>
                  Dr. {doctor.name} - {doctor.specialization}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            type="date"
            label="Appointment Date"
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 2 }}
            value={formData.appointmentDate}
            onChange={(e) => {
              setFormData({ ...formData, appointmentDate: e.target.value, timeSlot: '' });
            }}
            inputProps={{
              min: new Date().toISOString().split('T')[0]
            }}
          />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Time Slot</InputLabel>
            <Select
              value={formData.timeSlot}
              onChange={(e) =>
                setFormData({ ...formData, timeSlot: e.target.value })
              }
              disabled={availableTimeSlots.length === 0}
            >
              {availableTimeSlots.map((slot) => {
                const time = new Date(`2000-01-01T${slot}`);
                const formattedTime = time.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: 'numeric',
                  hour12: true
                });
                return (
                  <MenuItem key={slot} value={slot}>
                    {formattedTime}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for Visit"
            sx={{ mt: 2 }}
            value={formData.reason}
            onChange={(e) =>
              setFormData({ ...formData, reason: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Create Appointment
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openPatientModal} onClose={() => setOpenPatientModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Patient Information</DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedPatient.name}
              </Typography>
              <Typography color="textSecondary" gutterBottom>
                Contact: {selectedPatient.contactNumber}
              </Typography>
              <Typography color="textSecondary" gutterBottom>
                Email: {selectedPatient.email}
              </Typography>
              <Typography color="textSecondary" gutterBottom>
                Address: {selectedPatient.address}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Send Message
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                />
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <SendIcon />
                </IconButton>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPatientModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Appointments;