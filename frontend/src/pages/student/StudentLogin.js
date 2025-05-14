import React, { useState } from 'react';
import { Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../../auth/AuthHandler';

function StudentLogin() {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await loginUser('/student/login', { student_id: studentId, password });
      navigate('/attendance');
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <Card className="card position-relative mx-auto" style={{ maxWidth: '400px', marginTop: '50px' }}>
      <Card.Body>
        <h3 className="text-center mb-4">Đăng Nhập Sinh Viên</h3>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formStudentId">
            <Form.Label>Mã Số Sinh Viên</Form.Label>
            <Form.Control
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
              placeholder="Nhập mã số sinh viên"
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
                <Link to="/register" className="text-primary">
                  Đăng ký ngay
                </Link>
              </p>
            </Col>
          </Row>
        </Form>
      </Card.Body>
    </Card>
  );
}

export default StudentLogin;