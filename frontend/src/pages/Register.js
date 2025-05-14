// src/pages/Register.js
import React from 'react';
import { Card } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import TeacherRegister from './admin/TeacherRegister';
import StudentRegister from './student/StudentRegister'; // Import form đăng ký sinh viên

function Register() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const role = queryParams.get('role') || 'student'; // Mặc định là sinh viên nếu không có role

  return (
    <Card className="card position-relative mx-auto" style={{ maxWidth: '600px', marginTop: '50px' }}>
      <Card.Body>
        {role === 'student' ? <StudentRegister /> : <TeacherRegister />}
      </Card.Body>
    </Card>
  );
}

export default Register;