import React, { useState, useEffect } from 'react';
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
  IconButton,
  Avatar,
  Tooltip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  Timeline,
  Person,
  CalendarToday,
  LocalHospital,
  MedicalServices,
  Assignment,
  Refresh,
  TrendingUp,
  AccessTime,
  BarChart as BarChartIcon,
  Description,
  NoteAdd,
} from '@mui/icons-material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

function Dashboard() {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    appointments: [],
    totalAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    medicalRecords: [],
    totalPatients: 0,
    appointmentsByMonth: [],
    appointmentsByStatus: [],
    recentMedicalRecords: [],
    patientsByDoctor: [],
  });

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  const refreshData = () => {
    setLoading(true);
    fetchDashboardData();
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

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

      // Fetch medical records
      const medicalRecordsRes = await axios.get('/api/medical-records', config);
      const medicalRecords = medicalRecordsRes.data;

      // Fetch patients (for admin and doctors)
      let patients = [];
      if (user.role === 'admin' || user.role === 'doctor') {
        const patientsRes = await axios.get('/api/users?role=patient', config);
        patients = patientsRes.data;
      }

      // Calculate statistics
      const now = new Date();
      const upcoming = appointments.filter(
        (apt) => new Date(apt.appointmentDate) > now && apt.status === 'scheduled'
      );
      const completed = appointments.filter((apt) => apt.status === 'completed');
      const cancelled = appointments.filter((apt) => apt.status === 'cancelled');

      // Create data for appointments by month chart
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return {
          month: date.toLocaleString('default', { month: 'short' }),
          year: date.getFullYear(),
          date: date,
        };
      }).reverse();

      const appointmentsByMonth = last6Months.map((monthData) => {
        const monthStart = new Date(monthData.date);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        
        const monthEnd = new Date(monthData.date);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0);
        monthEnd.setHours(23, 59, 59, 999);
        
        const monthAppointments = appointments.filter((apt) => {
          const aptDate = new Date(apt.appointmentDate);
          return aptDate >= monthStart && aptDate <= monthEnd;
        });
        
        return {
          name: `${monthData.month}`,
          total: monthAppointments.length,
          completed: monthAppointments.filter(apt => apt.status === 'completed').length,
          scheduled: monthAppointments.filter(apt => apt.status === 'scheduled').length,
        };
      });

      // Create data for appointments by status chart
      const appointmentsByStatus = [
        { name: 'Scheduled', value: upcoming.length, color: '#0088FE' },
        { name: 'Completed', value: completed.length, color: '#00C49F' },
        { name: 'Cancelled', value: cancelled.length, color: '#FF8042' },
      ];

      // Get recent medical records
      const recentMedicalRecords = medicalRecords
        .sort((a, b) => new Date(b.createdAt || b.updatedAt || b.visitDate) - new Date(a.createdAt || a.updatedAt || a.visitDate))
        .slice(0, 5);

      // Calculate patients by doctor (for admin)
      let patientsByDoctor = [];
      if (user.role === 'admin' && patients.length > 0) {
        // Group patients by doctor
        const doctorPatientMap = {};
        patients.forEach(patient => {
          if (patient.doctor) {
            const doctorId = patient.doctor._id || patient.doctor;
            doctorPatientMap[doctorId] = (doctorPatientMap[doctorId] || 0) + 1;
          }
        });
        
        // Convert to chart data
        patientsByDoctor = Object.entries(doctorPatientMap).map(([doctorId, count], index) => {
          const doctor = patients.find(p => p.doctor && (p.doctor._id === doctorId || p.doctor === doctorId))?.doctor;
          return {
            name: doctor?.name || `Doctor ${index + 1}`,
            patients: count,
            color: COLORS[index % COLORS.length]
          };
        });
      }

      // Calculate unique patients
      const uniquePatients = new Set(appointments.filter(apt => apt.patient && apt.patient._id).map((apt) => apt.patient._id)).size;

      setStats({
        appointments: appointments.slice(0, 5), // Latest 5 appointments
        totalAppointments: appointments.length,
        upcomingAppointments: upcoming.length,
        completedAppointments: completed.length,
        medicalRecords,
        totalPatients: uniquePatients,
        appointmentsByMonth,
        appointmentsByStatus,
        recentMedicalRecords,
        patientsByDoctor,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const renderPatientDashboard = () => (
    <Grid container spacing={3}>
      {/* Header with refresh button */}
      <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" component="h1" gutterBottom>
          Patient Dashboard
        </Typography>
        <Tooltip title="Refresh Data">
          <IconButton onClick={refreshData} color="primary">
            <Refresh />
          </IconButton>
        </Tooltip>
      </Grid>
      
      {/* Stats Cards */}
      <Grid item xs={12} md={4}>
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f5f9ff', boxShadow: 3 }}>
          <CardContent sx={{ flexGrow: 1 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <Avatar sx={{ bgcolor: '#0088FE', mr: 2 }}>
                <CalendarToday />
              </Avatar>
              <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                Upcoming Appointments
              </Typography>
            </Box>
            <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: '#0088FE' }}>
              {stats.upcomingAppointments}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f7fff5', boxShadow: 3 }}>
          <CardContent sx={{ flexGrow: 1 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <Avatar sx={{ bgcolor: '#00C49F', mr: 2 }}>
                <Timeline />
              </Avatar>
              <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                Total Visits
              </Typography>
            </Box>
            <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: '#00C49F' }}>
              {stats.totalAppointments}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#fff9f5', boxShadow: 3 }}>
          <CardContent sx={{ flexGrow: 1 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <Avatar sx={{ bgcolor: '#FFBB28', mr: 2 }}>
                <MedicalServices />
              </Avatar>
              <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                Medical Records
              </Typography>
            </Box>
            <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: '#FFBB28' }}>
              {stats.medicalRecords.filter(record => record.patient?._id === user._id).length}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Appointment Status Chart */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, height: '100%', boxShadow: 3 }}>
          <Typography variant="h6" gutterBottom>
            <BarChartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Appointment Status
          </Typography>
          <Box sx={{ height: 300, mt: 2 }}>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <CircularProgress />
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.appointmentsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {stats.appointmentsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => [`${value} appointments`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Box>
        </Paper>
      </Grid>
      
      {/* Recent Appointments */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, height: '100%', boxShadow: 3 }}>
          <Typography variant="h6" gutterBottom>
            <AccessTime sx={{ mr: 1, verticalAlign: 'middle' }} />
            Recent Appointments
          </Typography>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="80%">
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {stats.appointments.length > 0 ? (
                stats.appointments.map((appointment) => (
                  <React.Fragment key={appointment._id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" fontWeight="medium">
                            Dr. {appointment.doctor?.name || 'Unknown'}
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" color="text.primary">
                              {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.timeSlot}
                            </Typography>
                            <Typography variant="body2">
                              Status: <span style={{ color: appointment.status === 'scheduled' ? '#0088FE' : appointment.status === 'completed' ? '#00C49F' : '#FF8042' }}>
                                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                              </span>
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="No recent appointments" />
                </ListItem>
              )}
            </List>
          )}
          <Box mt={2} display="flex" justifyContent="center">
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={() => window.location.href = '/appointments'}
            >
              View All Appointments
            </Button>
          </Box>
        </Paper>
      </Grid>
      
      {/* Medical Records Section */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3, boxShadow: 3 }}>
          <Typography variant="h6" gutterBottom>
            <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
            Dossiers Médicaux Électroniques
          </Typography>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100px">
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Doctor</TableCell>
                    <TableCell>Diagnosis</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.recentMedicalRecords.length > 0 ? (
                    stats.recentMedicalRecords
                      .filter(record => record.patient?._id === user._id)
                      .map((record) => (
                        <TableRow key={record._id}>
                          <TableCell>{new Date(record.visitDate).toLocaleDateString()}</TableCell>
                          <TableCell>{record.doctor?.name || 'Unknown Doctor'}</TableCell>
                          <TableCell>{record.diagnosis}</TableCell>
                          <TableCell>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              onClick={() => window.location.href = `/medical-records/${record._id}`}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">No medical records found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <Box mt={2} display="flex" justifyContent="center">
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={() => window.location.href = '/medical-records'}
            >
              View All Medical Records
            </Button>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderDoctorDashboard = () => {
    // Calculate today's appointments
    const todaysAppointments = stats.appointments.filter(
      (apt) => new Date(apt.appointmentDate).toDateString() === new Date().toDateString()
    );
    
    // Calculate unique patients
    const uniquePatients = new Set(stats.appointments.filter(apt => apt.patient && apt.patient._id).map((apt) => apt.patient._id)).size;
    
    return (
      <Grid container spacing={3}>
        {/* Header with refresh button */}
        <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1" gutterBottom>
            Doctor Dashboard
          </Typography>
          <Box>
            <Button
              variant="contained"
              color="primary"
              sx={{ mr: 2 }}
              onClick={() => window.location.href = '/doctor-schedule'}
              startIcon={<CalendarToday />}
            >
              Manage Availability
            </Button>
            <Tooltip title="Refresh Data">
              <IconButton onClick={refreshData} color="primary">
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Grid>
        
        {/* Stats Cards */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f5f9ff', boxShadow: 3 }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: '#0088FE', mr: 2 }}>
                  <CalendarToday />
                </Avatar>
                <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                  Today's Appointments
                </Typography>
              </Box>
              <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: '#0088FE' }}>
                {todaysAppointments.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f7fff5', boxShadow: 3 }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: '#00C49F', mr: 2 }}>
                  <Person />
                </Avatar>
                <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                  Total Patients
                </Typography>
              </Box>
              <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: '#00C49F' }}>
                {uniquePatients}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#fff9f5', boxShadow: 3 }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: '#FFBB28', mr: 2 }}>
                  <LocalHospital />
                </Avatar>
                <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                  Completed Appointments
                </Typography>
              </Box>
              <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: '#FFBB28' }}>
                {stats.completedAppointments}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Appointments by Month Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%', boxShadow: 3 }}>
            <Typography variant="h6" gutterBottom>
              <BarChartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Appointments by Month
            </Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <CircularProgress />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.appointmentsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="scheduled" name="Scheduled" fill="#0088FE" />
                    <Bar dataKey="completed" name="Completed" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Grid>
        
        {/* Upcoming Appointments */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', boxShadow: 3 }}>
            <Typography variant="h6" gutterBottom>
              <AccessTime sx={{ mr: 1, verticalAlign: 'middle' }} />
              Upcoming Appointments
            </Typography>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="80%">
                <CircularProgress />
              </Box>
            ) : (
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {stats.appointments
                  .filter((apt) => apt.status === 'scheduled')
                  .map((appointment) => (
                    <React.Fragment key={appointment._id}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" fontWeight="medium">
                              {appointment.patient?.name || 'Unknown Patient'}
                            </Typography>
                          }
                          secondary={
                            <>
                              <Typography variant="body2" color="text.primary">
                                {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.timeSlot}
                              </Typography>
                              <Typography variant="body2">
                                Reason: {appointment.reason?.substring(0, 30)}{appointment.reason?.length > 30 ? '...' : ''}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                {stats.appointments.filter(apt => apt.status === 'scheduled').length === 0 && (
                  <ListItem>
                    <ListItemText primary="No upcoming appointments" />
                  </ListItem>
                )}
              </List>
            )}
            <Box mt={2} display="flex" justifyContent="center">
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={() => window.location.href = '/appointments'}
              >
                View All Appointments
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const renderAdminDashboard = () => {
    // Calculate unique patients
    const uniquePatients = new Set(stats.appointments.filter(apt => apt.patient && apt.patient._id).map((apt) => apt.patient._id)).size;
    
    return (
      <Grid container spacing={3}>
        {/* Header with refresh button */}
        <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1" gutterBottom>
            Admin Dashboard
          </Typography>
          <Tooltip title="Refresh Data">
            <IconButton onClick={refreshData} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Grid>
        
        {/* Stats Cards */}
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f5f9ff', boxShadow: 3 }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: '#0088FE', mr: 2 }}>
                  <CalendarToday />
                </Avatar>
                <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                  Total Appointments
                </Typography>
              </Box>
              <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: '#0088FE' }}>
                {stats.totalAppointments}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f7fff5', boxShadow: 3 }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: '#00C49F', mr: 2 }}>
                  <Person />
                </Avatar>
                <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                  Total Patients
                </Typography>
              </Box>
              <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: '#00C49F' }}>
                {uniquePatients}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#fff9f5', boxShadow: 3 }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: '#FFBB28', mr: 2 }}>
                  <LocalHospital />
                </Avatar>
                <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                  Upcoming Appointments
                </Typography>
              </Box>
              <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: '#FFBB28' }}>
                {stats.upcomingAppointments}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5ff', boxShadow: 3 }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: '#8884d8', mr: 2 }}>
                  <MedicalServices />
                </Avatar>
                <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                  Medical Records
                </Typography>
              </Box>
              <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: '#8884d8' }}>
                {stats.medicalRecords.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Appointments by Month Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%', boxShadow: 3 }}>
            <Typography variant="h6" gutterBottom>
              <BarChartIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Appointments by Month
            </Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <CircularProgress />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.appointmentsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="scheduled" name="Scheduled" fill="#0088FE" />
                    <Bar dataKey="completed" name="Completed" fill="#00C49F" />
                    <Bar dataKey="total" name="Total" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Grid>
        
        {/* Patients by Doctor Chart */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', boxShadow: 3 }}>
            <Typography variant="h6" gutterBottom>
              <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
              Patients by Doctor
            </Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                  <CircularProgress />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {stats.patientsByDoctor.length > 0 ? (
                    <BarChart data={stats.patientsByDoctor} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <RechartsTooltip />
                      <Bar dataKey="patients" name="Patients" fill="#00C49F" />
                    </BarChart>
                  ) : (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                      <Typography>No patient distribution data available</Typography>
                    </Box>
                  )}
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Grid>
        
        {/* Recent Appointments */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, boxShadow: 3 }}>
            <Typography variant="h6" gutterBottom>
              <AccessTime sx={{ mr: 1, verticalAlign: 'middle' }} />
              Recent Appointments
            </Typography>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100px">
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: 300 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Patient</TableCell>
                      <TableCell>Doctor</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.appointments.length > 0 ? (
                      stats.appointments.map((appointment) => (
                        <TableRow key={appointment._id}>
                          <TableCell>
                            {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.timeSlot}
                          </TableCell>
                          <TableCell>{appointment.patient?.name || 'Unknown'}</TableCell>
                          <TableCell>{appointment.doctor?.name || 'Unknown'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                              color={appointment.status === 'scheduled' ? 'primary' : 
                                    appointment.status === 'completed' ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center">No appointments found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            <Box mt={2} display="flex" justifyContent="center">
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={() => window.location.href = '/appointments'}
              >
                Manage All Appointments
              </Button>
            </Box>
          </Paper>
        </Grid>
        

      </Grid>
    );
  };

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