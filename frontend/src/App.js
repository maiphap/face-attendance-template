import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register'; 
import Attendance from './pages/student/Attendance';
import History from './pages/History';
import TeacherDashboard from './pages/admin/TeacherDashboard';
import AdminLogin from './pages/admin/AdminLogin';
import TeacherRegister from './pages/admin/TeacherRegister'; // Import TeacherRegister
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/teacher-register" element={<TeacherRegister />} /> {/* Thêm route mới */}
        <Route path="/attendance" element={<ProtectedRoute element={<Attendance />} roles={['student']} />} />
        <Route path="/history" element={<ProtectedRoute element={<History />} roles={['student', 'teacher']} />} />
        <Route path="/teacher-dashboard" element={<ProtectedRoute element={<TeacherDashboard />} roles={['teacher']} />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;