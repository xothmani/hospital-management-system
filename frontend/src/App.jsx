import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import MedicalRecords from './pages/MedicalRecords';
import Profile from './pages/Profile';
import DoctorSchedule from './components/DoctorSchedule';
import Messages from './pages/Messages';
import Patients from './pages/Patients';

const theme = createTheme({
  palette: {
    primary: {
      main: '#004d40',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <div className="app-container">
          <div className="sidebar-container">
            <Sidebar />
          </div>
          <div className="main-content">
            <Header />
            <div className="content-wrapper">
              <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<PrivateRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                </Route>
                <Route path="/appointments" element={<PrivateRoute />}>
                  <Route path="/appointments" element={<Appointments />} />
                </Route>
                <Route path="/medical-records" element={<PrivateRoute />}>
                  <Route path="/medical-records" element={<MedicalRecords />} />
                </Route>
                <Route path="/patients" element={<PrivateRoute />}>
                  <Route path="/patients" element={<Patients />} />
                </Route>
                <Route path="/profile" element={<PrivateRoute />}>
                  <Route path="/profile" element={<Profile />} />
                </Route>
                <Route path="/doctor-schedule" element={<PrivateRoute />}>
                  <Route path="/doctor-schedule" element={<DoctorSchedule />} />
                </Route>
                <Route path="/messages" element={<PrivateRoute />}>
                  <Route path="/messages" element={<Messages />} />
                </Route>
              </Routes>
            </div>
          </div>
        </div>
      </Router>
      <ToastContainer />
    </ThemeProvider>
  );
}

export default App;