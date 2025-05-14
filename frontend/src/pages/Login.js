// src/pages/Login.js
import React, { useState } from 'react';
import { Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

function Login() {
  const [role, setRole] = useState(null);
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!role) {
      setError('Vui lòng chọn vai trò (giáo viên hoặc sinh viên).');
      return;
    }

    let url = role === 'student' ? '/student/login' : '/admin/login';
    console.log(`Sending request to: ${url}`);
    try {
      const response = await api.post(url, { student_id: studentId, password });
      console.log('Login response:', response.data);
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('userRole', response.data.role);

      if ((role === 'student' && response.data.role !== 'student') || 
          (role === 'teacher' && response.data.role !== 'teacher')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('userRole');
        setError('Vai trò không khớp với tài khoản. Vui lòng chọn vai trò đúng.');
        return;
      }

      setError('');
      navigate(role === 'student' ? '/attendance' : '/teacher-dashboard');
    } catch (err) {
      console.error('Login error:', err.response);
      if (err.response?.data?.error === 'Không tìm thấy người dùng' && role === 'teacher') {
        setError('Tài khoản giáo viên không tồn tại. Vui lòng đăng ký tài khoản mới.');
      } else {
        setError(err.response?.data?.error || 'Đăng nhập thất bại.');
      }
    }
  };

  return (
    <Card className="card position-relative mx-auto" style={{ maxWidth: '400px', marginTop: '50px' }}>
      <Card.Body>
        <h3 className="text-center mb-4">Đăng Nhập</h3>
        {error && <Alert variant="danger">{error}</Alert>}
        
        {!role ? (
          <>
            <h5 className="text-center mb-3">Chọn vai trò của bạn</h5>
            <Row className="justify-content-center mb-3">
              <Col xs="auto">
                <Button variant="primary" onClick={() => handleRoleSelect('student')} className="me-2">
                  Sinh Viên
                </Button>
                <Button variant="primary" onClick={() => handleRoleSelect('teacher')}>
                  Giáo Viên
                </Button>
              </Col>
            </Row>
          </>
        ) : (
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formStudentId">
              <Form.Label>Mã Số {role === 'student' ? 'Sinh Viên' : 'Giáo Viên'}</Form.Label>
              <Form.Control
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                placeholder={`Nhập mã số ${role === 'student' ? 'sinh viên' : 'giáo viên'}`}
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
            <Row className="justify-content-center">
              <Col xs="auto">
                <p className="text-center">
                  Chưa có tài khoản?{' '}
                  <Link to={`/register?role=${role}`} className="text-primary">
                    Đăng ký ngay
                  </Link>
                </p>
              </Col>
            </Row>
          </Form>
        )}
      </Card.Body>
    </Card>
  );
}

export default Login;