import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box } from '@mui/material';
import { useSelector } from 'react-redux';
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

// Layout component that conditionally renders sidebar and header
const Layout = ({ children }) => {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  
  // Don't show sidebar and header on login and register pages
  const isAuthPage = location.pathname === '/' || location.pathname === '/register';
  
  if (isAuthPage) {
    return <>{children}</>;
  }
  
  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {user && (
        <Box sx={{ flexShrink: 0, height: '100vh', position: 'sticky', top: 0 }}>
          <Sidebar />
        </Box>
      )}
      <Box 
        sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
          backgroundColor: '#f9f9f9',
          boxShadow: 'inset 5px 0 5px -5px rgba(0,0,0,0.1)'
        }}
      >
        {user && <Header />}
        <Box 
          sx={{ 
            flexGrow: 1, 
            p: 3, 
            pt: 10, // Add padding top to create space below header
            overflow: 'auto',
            backgroundColor: '#f9f9f9'
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Layout>
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
        </Layout>
        <ToastContainer />
      </Router>
    </ThemeProvider>
  );
}

export default App;