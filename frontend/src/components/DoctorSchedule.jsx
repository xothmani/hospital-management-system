import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  LinearProgress,
} from '@mui/material';

const DoctorSchedule = ({ doctorId: propDoctorId }) => {
  const { user } = useSelector((state) => state.auth);
  const doctorId = propDoctorId || user._id;
  const [schedule, setSchedule] = useState(null);
  const [workload, setWorkload] = useState(null);
  const [openLeaveDialog, setOpenLeaveDialog] = useState(false);
  const [openHoursDialog, setOpenHoursDialog] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    startDate: null,
    endDate: null,
    reason: ''
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const [workingHoursForm, setWorkingHoursForm] = useState([]);

  useEffect(() => {
    fetchSchedule();
    fetchWorkload();
  }, [doctorId]);

  useEffect(() => {
    if (schedule?.workingHours) {
      const initialWorkingHours = days.map(day => {
        const existingDay = schedule.workingHours.find(h => h.day === day);
        if (existingDay) {
          return {
            day,
            startTime: existingDay.startTime,
            endTime: existingDay.endTime,
            isWorking: true
          };
        }
        return {
          day,
          startTime: '09:00',
          endTime: '17:00',
          isWorking: false
        };
      });
      setWorkingHoursForm(initialWorkingHours);
    }
  }, [schedule]);

  const fetchSchedule = async () => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };
      const response = await axios.get(`/api/doctor-schedules/${doctorId}`, config);
      setSchedule(response.data);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    }
  };

  const fetchWorkload = async () => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };
      const response = await axios.get(`/api/doctor-schedule/workload/${doctorId}`, config);
      setWorkload(response.data);
    } catch (error) {
      console.error('Error fetching workload:', error);
    }
  };

  const handleLeaveRequest = async () => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };
      await axios.post(
        `/api/doctor-schedule/leave/${doctorId}`,
        leaveForm,
        config
      );
      setOpenLeaveDialog(false);
      fetchSchedule();
    } catch (error) {
      console.error('Error requesting leave:', error);
    }
  };

  const handleWorkingHoursUpdate = async () => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };
      await axios.put(
        `/api/doctor-schedules/${doctorId}/working-hours`,
        workingHoursForm,
        config
      );
      setOpenHoursDialog(false);
      fetchSchedule();
    } catch (error) {
      console.error('Error updating working hours:', error);
    }
  };

  if (!schedule) return <LinearProgress />;

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Weekly Schedule
              </Typography>
              <List>
                {workingHoursForm.map((day) => (
                  <ListItem key={day.day}>
                    <ListItemText
                      primary={day.day}
                      secondary={day.isWorking 
                        ? `${day.startTime} - ${day.endTime}` 
                        : 'Not Working'}
                    />
                  </ListItem>
                ))}
              </List>
              <Button
                variant="contained"
                onClick={() => setOpenHoursDialog(true)}
                sx={{ mt: 2 }}
              >
                Edit Working Hours
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Workload Overview
              </Typography>
              {workload && (
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Total Appointments"
                      secondary={workload.totalAppointments}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Upcoming Appointments"
                      secondary={workload.upcomingAppointments}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Average Daily Load"
                      secondary={`${workload.averageDailyLoad} patients`}
                    />
                  </ListItem>
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={openLeaveDialog} onClose={() => setOpenLeaveDialog(false)}>
        <DialogTitle>Request Leave</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Start Date"
            type="date"
            value={leaveForm.startDate}
            onChange={(e) => 
              setLeaveForm({ ...leaveForm, startDate: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="End Date"
            type="date"
            value={leaveForm.endDate}
            onChange={(e) => 
              setLeaveForm({ ...leaveForm, endDate: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            label="Reason"
            multiline
            rows={4}
            value={leaveForm.reason}
            onChange={(e) => 
              setLeaveForm({ ...leaveForm, reason: e.target.value })}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLeaveDialog(false)}>Cancel</Button>
          <Button onClick={handleLeaveRequest} variant="contained">
            Request Leave
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openHoursDialog} onClose={() => setOpenHoursDialog(false)}>
        <DialogTitle>Edit Working Hours</DialogTitle>
        <DialogContent>
          {workingHoursForm.map((day) => (
            <Box key={day.day} sx={{ mb: 2 }}>
              <Typography variant="subtitle1">{day.day}</Typography>
              <TextField
                fullWidth
                label="Start Time"
                type="time"
                value={day.startTime}
                onChange={(e) => {
                  setWorkingHoursForm(prev => 
                    prev.map(d => 
                      d.day === day.day 
                        ? { ...d, startTime: e.target.value }
                        : d
                    )
                  );
                }}
                sx={{ mt: 1 }}
              />
              <TextField
                fullWidth
                label="End Time"
                type="time"
                value={day.endTime}
                onChange={(e) => {
                  setWorkingHoursForm(prev => 
                    prev.map(d => 
                      d.day === day.day 
                        ? { ...d, endTime: e.target.value }
                        : d
                    )
                  );
                }}
                sx={{ mt: 1 }}
              />
              <Switch
                checked={day.isWorking}
                onChange={(e) => {
                  setWorkingHoursForm(prev => 
                    prev.map(d => 
                      d.day === day.day 
                        ? { ...d, isWorking: e.target.checked }
                        : d
                    )
                  );
                }}
                sx={{ mt: 2 }}
              />
              <Typography variant="body2" sx={{ ml: 2 }}>
                {day.isWorking ? 'Working' : 'Not Working'}
              </Typography>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHoursDialog(false)}>Cancel</Button>
          <Button onClick={handleWorkingHoursUpdate} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DoctorSchedule;