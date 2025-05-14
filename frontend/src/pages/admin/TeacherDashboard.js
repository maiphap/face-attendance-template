// src/pages/admin/TeacherDashboard.js
import React, { useState, useEffect } from 'react';
import { Card, Table, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

function TeacherDashboard() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await api.get('/students');
        console.log('Students response:', response.data);
        setStudents(response.data);
        setFilteredStudents(response.data);
      } catch (err) {
        console.error('Fetch students error:', err.response);
        setError(err.response?.data?.error || 'Tải danh sách sinh viên thất bại.');
      }
    };
    fetchStudents();
  }, []);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = students.filter(
      (student) =>
        student.student_id.toLowerCase().includes(term) ||
        student.name.toLowerCase().includes(term)
    );
    setFilteredStudents(filtered);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  return (
    <Card className="card position-relative mx-auto" style={{ maxWidth: '800px', marginTop: '50px' }}>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="text-center">Danh Sách Sinh Viên</h3>
          <Button variant="danger" onClick={handleLogout}>
            Đăng Xuất
          </Button>
        </div>
        <Button variant="primary" onClick={() => navigate('/history')} className="mb-3 ms-2">
          Xem Lịch Sử Điểm Danh
        </Button>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form.Group className="mb-3">
          <Form.Label>Tìm kiếm sinh viên</Form.Label>
          <Form.Control
            type="text"
            placeholder="Tìm theo mã số hoặc tên"
            value={searchTerm}
            onChange={handleSearch}
          />
        </Form.Group>
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Mã Số</th>
              <th>Tên</th>
              <th>Lớp</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <tr key={student.student_id}>
                  <td>{student.student_id}</td>
                  <td>{student.name}</td>
                  <td>{student.class_id}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center">
                  Không có sinh viên nào
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}

export default TeacherDashboard;