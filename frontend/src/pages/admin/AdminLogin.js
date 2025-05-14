// src/pages/admin/AdminLogin.js
import React, { useState } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../../auth/AuthHandler';

function AdminLogin() {
  const [teacherId, setTeacherId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await loginUser('/admin/login', { student_id: teacherId, password }); // Sử dụng student_id vì backend dùng chung trường này
      navigate('/teacher-dashboard');
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <Card className="card position-relative mx-auto" style={{ maxWidth: '400px', marginTop: '50px' }}>
      <Card.Body>
        <h3 className="text-center mb-4">Đăng Nhập Giáo Viên</h3>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formTeacherId">
            <Form.Label>Mã Số Giáo Viên</Form.Label>
            <Form.Control
              type="text"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              required
              placeholder="Nhập mã số giáo viên"
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="formPassword">
            <Form.Label>Mật Khẩu</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Nhập mật khẩu"
            />
          </Form.Group>
          <Button variant="primary" type="submit" className="w-100 mb-3">
            Đăng Nhập
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}

export default AdminLogin;