import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
} from '@mui/material';
import {
  Timeline,
  Person,
  CalendarToday,
  LocalHospital,
} from '@mui/icons-material';

function Dashboard() {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState({
    appointments: [],
    totalAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };

        // Fetch appointments
        const appointmentsRes = await axios.get('/api/appointments', config);
        const appointments = appointmentsRes.data;

        // Calculate statistics
        const now = new Date();
        const upcoming = appointments.filter(
          (apt) => new Date(apt.appointmentDate) > now && apt.status === 'scheduled'
        );
        const completed = appointments.filter((apt) => apt.status === 'completed');

        setStats({
          appointments: appointments.slice(0, 5), // Latest 5 appointments
          totalAppointments: appointments.length,
          upcomingAppointments: upcoming.length,
          completedAppointments: completed.length,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, [user]);

  const renderPatientDashboard = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <CalendarToday /> Upcoming Appointments
            </Typography>
            <Typography variant="h4">{stats.upcomingAppointments}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Timeline /> Total Visits
            </Typography>
            <Typography variant="h4">{stats.totalAppointments}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Recent Appointments
          </Typography>
          <List>
            {stats.appointments.map((appointment) => (
              <ListItem key={appointment._id}>
                <ListItemText
                  primary={`Dr. ${appointment.doctor.name}`}
                  secondary={new Date(appointment.appointmentDate).toLocaleDateString()}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderDoctorDashboard = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={12}>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mb: 3 }}
          onClick={() => window.location.href = '/doctor-schedule'}
          startIcon={<CalendarToday />}
        >
          Manage Availability
        </Button>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <CalendarToday /> Today's Appointments
            </Typography>
            <Typography variant="h4">
              {stats.appointments.filter(
                (apt) =>
                  new Date(apt.appointmentDate).toDateString() === new Date().toDateString()
              ).length}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Person /> Total Patients
            </Typography>
            <Typography variant="h4">
              {new Set(stats.appointments.map((apt) => apt.patient._id)).size}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <LocalHospital /> Completed Appointments
            </Typography>
            <Typography variant="h4">{stats.completedAppointments}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Upcoming Appointments
          </Typography>
          <List>
            {stats.appointments
              .filter((apt) => apt.status === 'scheduled')
              .map((appointment) => (
                <ListItem key={appointment._id}>
                  <ListItemText
                    primary={`Patient: ${appointment.patient.name}`}
                    secondary={`${new Date(
                      appointment.appointmentDate
                    ).toLocaleDateString()} - ${appointment.timeSlot}`}
                  />
                </ListItem>
              ))}
          </List>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderAdminDashboard = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Total Appointments
            </Typography>
            <Typography variant="h4">{stats.totalAppointments}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Upcoming Appointments
            </Typography>
            <Typography variant="h4">{stats.upcomingAppointments}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          <List>
            {stats.appointments.map((appointment) => (
              <ListItem key={appointment._id}>
                <ListItemText
                  primary={`Dr. ${appointment.doctor.name} - ${appointment.patient.name}`}
                  secondary={`${new Date(
                    appointment.appointmentDate
                  ).toLocaleDateString()} - ${appointment.status}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Grid>
    </Grid>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome, {user.name}
      </Typography>
      <Box sx={{ mt: 3 }}>
        {user.role === 'patient' && renderPatientDashboard()}
        {user.role === 'doctor' && renderDoctorDashboard()}
        {user.role === 'admin' && renderAdminDashboard()}
      </Box>
    </Container>
  );
}

export default Dashboard;