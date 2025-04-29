import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from './components/Header';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import MedicalRecords from './pages/MedicalRecords';
import Profile from './pages/Profile';
import DoctorSchedule from './components/DoctorSchedule';
import Messages from './pages/Messages';

function App() {
  return (
    <>
      <Router>
        <div className="container">
          <Header />
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
      </Router>
      <ToastContainer />
    </>
  );
}

export default App;