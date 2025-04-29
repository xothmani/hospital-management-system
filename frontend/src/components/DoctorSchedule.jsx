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
  MenuItem,
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

  const handleUpdateHours = async () => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };
      const workingHours = workingHoursForm
        .filter(day => day.isWorking)
        .map(({ day, startTime, endTime }) => ({
          day,
          startTime,
          endTime
        }));

      await axios.put(
        `/api/doctor-schedules/hours/${doctorId}`,
        { workingHours },
        config
      );
      setOpenHoursDialog(false);
      fetchSchedule();
    } catch (error) {
      console.error('Error updating hours:', error);
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Grid container spacing={3}>
        {/* Workload Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Workload
              </Typography>
              {workload && (
                <Box>
                  <LinearProgress
                    variant="determinate"
                    value={workload.workloadPercentage}
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="body2">
                    {workload.totalAppointments} / {workload.maxPatientsPerDay} Patients
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Working Hours Card */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Working Hours</Typography>
                {user.role === 'doctor' && (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => setOpenHoursDialog(true)}
                  >
                    Update Hours
                  </Button>
                )}
              </Box>
              <List>
                {schedule?.workingHours?.map((hours) => (
                  <ListItem key={hours.day}>
                    <ListItemText
                      primary={hours.day}
                      secondary={`${hours.startTime} - ${hours.endTime}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Leave Requests Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Leave Requests</Typography>
                {user.role === 'doctor' && (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => setOpenLeaveDialog(true)}
                  >
                    Request Leave
                  </Button>
                )}
              </Box>
              <List>
                {schedule?.leaves?.map((leave) => (
                  <ListItem key={leave._id}>
                    <ListItemText
                      primary={`${new Date(leave.startDate).toLocaleDateString()} - ${new Date(
                        leave.endDate
                      ).toLocaleDateString()}`}
                      secondary={`Reason: ${leave.reason} | Status: ${leave.status}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Leave Request Dialog */}
      <Dialog open={openLeaveDialog} onClose={() => setOpenLeaveDialog(false)}>
        <DialogTitle>Request Leave</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              type="date"
              label="Start Date"
              value={leaveForm.startDate}
              onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
              fullWidth
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type="date"
              label="End Date"
              value={leaveForm.endDate}
              onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
              fullWidth
              sx={{ mb: 2 }}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Reason"
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
              multiline
              rows={4}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLeaveDialog(false)}>Cancel</Button>
          <Button onClick={handleLeaveRequest} variant="contained">
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Working Hours Dialog */}
      <Dialog
        open={openHoursDialog}
        onClose={() => setOpenHoursDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Update Working Hours</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {workingHoursForm.map((daySchedule, index) => (
              <Box key={daySchedule.day} sx={{ mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={3}>
                    <Typography>{daySchedule.day}</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      select
                      fullWidth
                      label="Start Time"
                      value={daySchedule.startTime}
                      onChange={(e) => {
                        const newHours = [...workingHoursForm];
                        newHours[index] = { ...daySchedule, startTime: e.target.value };
                        setWorkingHoursForm(newHours);
                      }}
                    >
                      {[
                        '09:00', '10:00', '11:00', '12:00',
                        '13:00', '14:00', '15:00', '16:00'
                      ].map((time) => (
                        <MenuItem key={time} value={time}>{time}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      select
                      fullWidth
                      label="End Time"
                      value={daySchedule.endTime}
                      onChange={(e) => {
                        const newHours = [...workingHoursForm];
                        newHours[index] = { ...daySchedule, endTime: e.target.value };
                        setWorkingHoursForm(newHours);
                      }}
                    >
                      {[
                        '10:00', '11:00', '12:00', '13:00',
                        '14:00', '15:00', '16:00', '17:00'
                      ].map((time) => (
                        <MenuItem key={time} value={time}>{time}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={3}>
                    <Button
                      variant={daySchedule.isWorking ? "contained" : "outlined"}
                      color={daySchedule.isWorking ? "primary" : "error"}
                      onClick={() => {
                        const newHours = [...workingHoursForm];
                        newHours[index] = { ...daySchedule, isWorking: !daySchedule.isWorking };
                        setWorkingHoursForm(newHours);
                      }}
                      fullWidth
                    >
                      {daySchedule.isWorking ? "Working" : "Off Day"}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHoursDialog(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateHours}
            variant="contained"
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DoctorSchedule;