import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
  Box,
  Paper,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Chip,
  Grid,
  FormHelperText
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';

// Setup the localizer for react-big-calendar
const localizer = momentLocalizer(moment);

// Custom event component to display appointments
const AppointmentEvent = ({ event }) => {
  const bgColor = 
    event.status === 'completed' ? '#4caf50' : 
    event.status === 'cancelled' ? '#f44336' : '#2196f3';
  
  return (
    <div style={{ 
      height: '100%', 
      backgroundColor: bgColor,
      color: 'white',
      padding: '2px 5px',
      borderRadius: '4px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }}>
      <strong>{event.title}</strong>
      <div>{event.resource.timeSlot}</div>
    </div>
  );
};

const AppointmentCalendar = () => {
  const { user } = useSelector((state) => state.auth);

  // Return different views based on user role
  if (user.role === 'patient') {
    return <PatientAppointmentView />;
  }

  return <DoctorAppointmentView />;
};

const DoctorAppointmentView = () => {
  const { user } = useSelector((state) => state.auth);
  const [appointments, setAppointments] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [formData, setFormData] = useState({
    doctor: '',
    patient: '',
    appointmentDate: '',
    timeSlot: '',
    reason: '',
  });
  const [updateFormData, setUpdateFormData] = useState({
    status: '',
    notes: '',
  });
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [doctorSchedule, setDoctorSchedule] = useState(null);
  const [view, setView] = useState('week');

  // Define time slots for the day (30-minute intervals)
  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00'
  ];

  useEffect(() => {
    fetchAppointments();
    if (user.role === 'patient') {
      fetchDoctors();
    } else if (user.role === 'doctor') {
      fetchPatients();
      // For doctors, set the selected doctor to themselves
      setSelectedDoctor(user._id);
      console.log('Doctor ID set to:', user._id);
    } else if (user.role === 'admin') {
      fetchDoctors();
      fetchPatients();
    }
  }, [user]);

  useEffect(() => {
    if (appointments.length > 0) {
      convertAppointmentsToEvents();
    }
  }, [appointments]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const response = await axios.get('/api/appointments', config);
      console.log('Fetched appointments:', response.data);
      setAppointments(response.data);
    } catch (error) {
      toast.error('Error fetching appointments');
      console.error(error);
    } finally {
      setLoading(false);
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

  const fetchPatients = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const response = await axios.get('/api/patients', config);
      console.log('Fetched patients:', response.data);
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Error fetching patients');
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
      console.error('Error fetching doctor schedule:', error);
      // If no schedule exists, create a default one with hours from 8:00 to 17:00
      setDoctorSchedule({
        workingHours: [
          { day: 'Monday', startTime: '08:00', endTime: '17:00' },
          { day: 'Tuesday', startTime: '08:00', endTime: '17:00' },
          { day: 'Wednesday', startTime: '08:00', endTime: '17:00' },
          { day: 'Thursday', startTime: '08:00', endTime: '17:00' },
          { day: 'Friday', startTime: '08:00', endTime: '17:00' }
        ]
      });
    }
  };

  const convertAppointmentsToEvents = () => {
    const events = appointments.map(appointment => {
      console.log('Appointment:', appointment);
      const startDate = new Date(appointment.appointmentDate);
      const [hours, minutes] = appointment.timeSlot.split(':').map(Number);
      startDate.setHours(hours, minutes, 0);
      
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + 30); // 30-minute appointments
      
      // Make sure we're accessing the patient name correctly
      const patientName = appointment.patient?.name || 'Unknown Patient';
      console.log('Patient name:', patientName);
      
      return {
        id: appointment._id,
        title: patientName, // Show patient name in title
        start: startDate,
        end: endDate,
        patient: patientName,
        doctor: appointment.doctor._id,
        status: appointment.status,
        reason: appointment.reason,
        allDay: false,
        resource: appointment
      };
    });
    
    console.log('Converted events:', events);
    setCalendarEvents(events);
  };

  const handleSelectSlot = ({ start }) => {
    // Only allow selecting future dates
    if (start < new Date()) {
      toast.error("Cannot book appointments in the past");
      return;
    }

    // We're skipping availability checks as requested
    // Just check if there's already an appointment at this exact time
    const existingAppointment = calendarEvents.find(event => {
      const eventDate = new Date(event.start);
      return (
        eventDate.getDate() === start.getDate() &&
        eventDate.getMonth() === start.getMonth() &&
        eventDate.getFullYear() === start.getFullYear() &&
        eventDate.getHours() === start.getHours() &&
        eventDate.getMinutes() === start.getMinutes() &&
        event.doctor === selectedDoctor &&
        event.status !== 'cancelled'
      );
    });

    if (existingAppointment) {
      toast.error("There is already an appointment at this time");
      return;
    }

    const selectedDate = new Date(start);
    const hours = selectedDate.getHours().toString().padStart(2, '0');
    const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
    const timeSlot = `${hours}:${minutes}`;

    setSelectedDate(selectedDate);
    setSelectedSlot(timeSlot);
    
    // Pre-fill form data - important to set patient to empty for doctors
    setFormData({
      doctor: selectedDoctor,
      patient: '', // Always start with empty patient selection to force choosing
      appointmentDate: selectedDate.toISOString().split('T')[0],
      timeSlot,
      reason: '',
    });
    
    setOpenDialog(true);
  };

  // We're not using this function anymore as requested, but keeping it for future reference
  const isDoctorAvailable = (date) => {
    // Always return true to allow booking without availability checks
    return true;
  };

  const handleSelectEvent = (event) => {
    // Show appointment details and allow updating status
    console.log('Selected appointment:', event.resource);
    setSelectedAppointment(event.resource);
    setUpdateFormData({
      status: event.resource.status,
      notes: event.resource.notes || ''
    });
    setOpenUpdateDialog(true);
  };

  const handleCreateAppointment = async () => {
    try {
      
      // Validate patient selection for doctors
      const appointmentData = { ...formData };
      console.log('Doctor ID:', appointmentData.doctor);
      console.log('Patient ID:', appointmentData.patient);
      
      // Set patient ID if current user is a patient
      if (user.role === 'patient') {
        appointmentData.patient = user._id;
      }
      
      // Set doctor ID if current user is a doctor
      if (user.role === 'doctor') {
        appointmentData.doctor = user._id;
      }

      console.log('Creating appointment with data:', appointmentData);

      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      
      await axios.post('/api/appointments', appointmentData, config);
      toast.success('Appointment created successfully');
      setOpenDialog(false);
      fetchAppointments();
    } catch (error) {
      console.error('Error creating appointment:', error.response?.data || error);
      toast.error(error.response?.data?.message || 'Error creating appointment');
    }
  };

  const handleUpdateAppointment = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      
      await axios.put(`/api/appointments/${selectedAppointment._id}`, updateFormData, config);
      toast.success('Appointment updated successfully');
      setOpenUpdateDialog(false);
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating appointment');
    }
  };

  const handleDoctorChange = (e) => {
    const doctorId = e.target.value;
    setSelectedDoctor(doctorId);
    setFormData({
      ...formData,
      doctor: doctorId
    });
  };

  return (
    <Box sx={{ height: 'calc(100vh - 200px)', p: 2 }}>
      <Paper elevation={3} sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">Appointment Calendar</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {(user.role === 'patient' || user.role === 'admin') && (
            <FormControl variant="outlined" sx={{ minWidth: 200 }}>
              <InputLabel>Select Doctor</InputLabel>
              <Select
                value={selectedDoctor}
                onChange={handleDoctorChange}
                label="Select Doctor"
              >
                {doctors.map((doctor) => (
                  <MenuItem key={doctor._id} value={doctor._id}>
                    {doctor.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              label="Scheduled" 
              sx={{ backgroundColor: '#2196f3', color: 'white' }} 
            />
            <Chip 
              label="Completed" 
              sx={{ backgroundColor: '#4caf50', color: 'white' }} 
            />
            <Chip 
              label="Cancelled" 
              sx={{ backgroundColor: '#f44336', color: 'white' }} 
            />
          </Box>
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      ) : (
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          views={['month', 'week', 'day', 'agenda']}
          defaultView={view}
          onView={(newView) => setView(newView)}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          step={30}
          timeslots={1}
          min={new Date(0, 0, 0, 8, 0)} // Start day at 8:00
          max={new Date(0, 0, 0, 17, 0)} // End day at 17:00
          components={{
            event: AppointmentEvent
          }}
          eventPropGetter={(event) => {
            let backgroundColor = '#2196f3'; // default blue for scheduled
            if (event.status === 'completed') {
              backgroundColor = '#4caf50'; // green for completed
            } else if (event.status === 'cancelled') {
              backgroundColor = '#f44336'; // red for cancelled
            }
            return { style: { backgroundColor } };
          }}
          dayPropGetter={(date) => {
            // Highlight weekends
            const day = date.getDay();
            if (day === 0 || day === 6) {
              return {
                style: {
                  backgroundColor: '#f5f5f5',
                }
              };
            }
          }}
        />
      )}

      {/* Dialog for creating a new appointment */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Book Appointment</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {(user.role === 'admin' || user.role === 'doctor') && (
              <FormControl fullWidth>
                <InputLabel>Patient</InputLabel>
                <Select
                  value={formData.patient}
                  onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
                  label="Patient"
                  required
                  error={user.role === 'doctor' && !formData.patient}
                  helperText={user.role === 'doctor' && !formData.patient ? 'Patient selection is required' : ''}
                >
                  <MenuItem value="" disabled>
                    <em>Select a patient</em>
                  </MenuItem>
                  {patients.map((patient) => (
                    <MenuItem key={patient._id} value={patient._id}>
                      {patient.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              label="Date"
              type="date"
              value={formData.appointmentDate}
              onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              disabled
            />

            <TextField
              label="Time"
              value={formData.timeSlot}
              InputLabelProps={{ shrink: true }}
              fullWidth
              disabled
            />

            <TextField
              label="Reason for Appointment"
              multiline
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              fullWidth
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateAppointment} 
            variant="contained" 
            color="primary"
            disabled={!formData.reason || (user.role === 'doctor' && !formData.patient)}
          >
            Book Appointment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for updating an existing appointment */}
      <Dialog open={openUpdateDialog} onClose={() => setOpenUpdateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Appointment</DialogTitle>
        <DialogContent>
          {selectedAppointment && (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle1">
                <strong>Date:</strong> {new Date(selectedAppointment.appointmentDate).toLocaleDateString()}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Time:</strong> {selectedAppointment.timeSlot}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Patient:</strong> {selectedAppointment.patient?.name || 'Unknown Patient'}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Doctor:</strong> {selectedAppointment.doctor?.name || 'Unknown Doctor'}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Reason:</strong> {selectedAppointment.reason}
              </Typography>
              
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={updateFormData.status}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Notes"
                multiline
                rows={3}
                value={updateFormData.notes}
                onChange={(e) => setUpdateFormData({ ...updateFormData, notes: e.target.value })}
                fullWidth
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUpdateDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleUpdateAppointment} 
            variant="contained" 
            color="primary"
          >
            Update Appointment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const PatientAppointmentView = () => {
  const { user } = useSelector((state) => state.auth);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [openBookingDialog, setOpenBookingDialog] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [formData, setFormData] = useState({
    doctor: '',
    appointmentDate: '',
    timeSlot: '',
    reason: ''
  });
  const [formErrors, setFormErrors] = useState({
    doctor: false,
    appointmentDate: false,
    timeSlot: false,
    reason: false
  });

  // Time slots for booking
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, []);

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

  const handleBookAppointment = async () => {
    try {
      // Validate all required fields
      if (!formData.doctor || !formData.appointmentDate || !formData.timeSlot || !formData.reason) {
        toast.error('Please fill in all required fields');
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
      };

      // First get the patient ID for the current user
      const patientResponse = await axios.get(`/api/patients/user/${user._id}`, config);
      const patientId = patientResponse.data._id;
      console.log('Patient ID:', patientId);
      // Create appointment data with patient ID instead of user ID
      const appointmentData = {
        doctor: formData.doctor,
        patient: patientId,
        appointmentDate: formData.appointmentDate,
        timeSlot: formData.timeSlot,
        reason: formData.reason,
        status: 'scheduled'
      };

      console.log('Sending appointment data:', appointmentData);

      const response = await axios.post('/api/appointments', appointmentData, config);
      
      if (response.data) {
        toast.success('Appointment booked successfully');
        setOpenBookingDialog(false);
        await fetchAppointments();
        resetForm();
      }
    } catch (error) {
      console.error('Booking error:', error.response?.data || error);
      toast.error(
        error.response?.data?.message || 
        'Error booking appointment. Please try again.'
      );
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      await axios.put(`/api/appointments/${appointmentId}`, { status: 'cancelled' }, config);
      toast.success('Appointment cancelled successfully');
      fetchAppointments();
    } catch (error) {
      toast.error('Error cancelling appointment');
    }
  };

  const resetForm = () => {
    setFormData({
      doctor: '',
      appointmentDate: '',
      timeSlot: '',
      reason: ''
    });
    setSelectedDoctor(null);
  };

  // Add validation before submitting
  const validateForm = () => {
    const errors = {
      doctor: !formData.doctor,
      appointmentDate: !formData.appointmentDate,
      timeSlot: !formData.timeSlot,
      reason: !formData.reason || formData.reason.trim().length === 0
    };
    
    setFormErrors(errors);
    return !Object.values(errors).some(error => error);
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Header with Book Appointment Button */}
      <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">My Appointments</Typography>
          <Button 
            variant="contained" 
            onClick={() => setOpenBookingDialog(true)}
            startIcon={<AddIcon />}
          >
            Book New Appointment
          </Button>
        </Box>
      </Paper>

      {/* List of Current Appointments */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Upcoming Appointments</Typography>
        {appointments.length === 0 ? (
          <Typography color="textSecondary">No appointments scheduled</Typography>
        ) : (
          appointments.map((appointment) => (
            <Paper 
              key={appointment._id} 
              elevation={1} 
              sx={{ mb: 2, p: 2, borderLeft: 6, 
                borderColor: 
                  appointment.status === 'scheduled' ? 'primary.main' :
                  appointment.status === 'completed' ? 'success.main' :
                  'error.main'
              }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>Doctor:</strong> Dr. {appointment.doctor.name}</Typography>
                  <Typography><strong>Specialization:</strong> {appointment.doctor.specialization}</Typography>
                  <Typography><strong>Date:</strong> {new Date(appointment.appointmentDate).toLocaleDateString()}</Typography>
                  <Typography><strong>Time:</strong> {appointment.timeSlot}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography><strong>Status:</strong> {appointment.status}</Typography>
                  <Typography><strong>Reason:</strong> {appointment.reason}</Typography>
                  {appointment.status === 'scheduled' && (
                    <Button 
                      color="error" 
                      variant="outlined"
                      onClick={() => handleCancelAppointment(appointment._id)}
                      sx={{ mt: 1 }}
                    >
                      Cancel Appointment
                    </Button>
                  )}
                </Grid>
              </Grid>
            </Paper>
          ))
        )}
      </Paper>

      {/* Booking Dialog */}
      <Dialog 
        open={openBookingDialog} 
        onClose={() => setOpenBookingDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Book New Appointment</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth error={formErrors.doctor}>
              <InputLabel>Select Doctor</InputLabel>
              <Select
                value={formData.doctor}
                onChange={(e) => {
                  setFormData({ ...formData, doctor: e.target.value });
                  setFormErrors({ ...formErrors, doctor: false });
                }}
                label="Select Doctor"
              >
                {doctors.map((doctor) => (
                  <MenuItem key={doctor._id} value={doctor._id}>
                    Dr. {doctor.name} - {doctor.specialization}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.doctor && (
                <FormHelperText>Please select a doctor</FormHelperText>
              )}
            </FormControl>

            <TextField
              label="Appointment Date"
              type="date"
              value={formData.appointmentDate}
              onChange={(e) => {
                setFormData({ ...formData, appointmentDate: e.target.value });
                setFormErrors({ ...formErrors, appointmentDate: false });
              }}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: new Date().toISOString().split('T')[0] }}
              fullWidth
              error={formErrors.appointmentDate}
              helperText={formErrors.appointmentDate ? 'Please select a date' : ''}
            />

            <FormControl fullWidth error={formErrors.timeSlot}>
              <InputLabel>Time Slot</InputLabel>
              <Select
                value={formData.timeSlot}
                onChange={(e) => {
                  setFormData({ ...formData, timeSlot: e.target.value });
                  setFormErrors({ ...formErrors, timeSlot: false });
                }}
                label="Time Slot"
              >
                {timeSlots.map((slot) => (
                  <MenuItem key={slot} value={slot}>
                    {slot}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.timeSlot && (
                <FormHelperText>Please select a time slot</FormHelperText>
              )}
            </FormControl>

            <TextField
              label="Reason for Appointment"
              multiline
              rows={3}
              value={formData.reason}
              onChange={(e) => {
                setFormData({ ...formData, reason: e.target.value });
                setFormErrors({ ...formErrors, reason: false });
              }}
              fullWidth
              error={formErrors.reason}
              helperText={formErrors.reason ? 'Please provide a reason' : ''}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenBookingDialog(false);
            resetForm();
            setFormErrors({
              doctor: false,
              appointmentDate: false,
              timeSlot: false,
              reason: false
            });
          }}>
            Cancel
          </Button>
          <Button 
            onClick={() => {
              if (validateForm()) {
                handleBookAppointment();
              }
            }}
            variant="contained"
            color="primary"
          >
            Book Appointment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppointmentCalendar;
