import React, { useState, useEffect } from 'react';
import { Card, Table, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

function History() {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
        }

        const response = await api.get('/attendance-history', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          params: { date: selectedDate },
        });
        console.log('History response:', response.data);

        const history = response.data.history || [];
        setRecords(history);

        if (selectedDate) {
          const filtered = history.filter(record =>
            record.timestamp.startsWith(selectedDate)
          );
          setFilteredRecords(filtered);
        } else {
          setFilteredRecords(history);
        }
        setError('');
      } catch (err) {
        console.error('Fetch history error:', err.response || err.message);
        setError(err.response?.data?.error || 'Tải lịch sử điểm danh thất bại.');
        setRecords([]);
        setFilteredRecords([]);
      }
    };
    fetchHistory();
  }, [selectedDate]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleUpdateStatus = async (record, newStatus) => {
    if (userRole !== 'teacher') {
      setError('Chỉ giáo viên mới có thể chỉnh sửa trạng thái điểm danh.');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await api.post('/update-attendance-status', {
        student_id: record.student_id,
        timestamp: record.timestamp,
        status: newStatus,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      console.log('Update status response:', response.data);

      const updatedRecords = records.map((r) =>
        r.student_id === record.student_id && r.timestamp === record.timestamp
          ? { ...r, status: newStatus }
          : r
      );
      setRecords(updatedRecords);

      const updatedFilteredRecords = filteredRecords.map((r) =>
        r.student_id === record.student_id && r.timestamp === record.timestamp
          ? { ...r, status: newStatus }
          : r
      );
      setFilteredRecords(updatedFilteredRecords);
      setError('');
    } catch (err) {
      console.error('Update status error:', err.response || err.message);
      setError(err.response?.data?.error || 'Cập nhật trạng thái thất bại.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const handleBack = () => {
    if (userRole === 'teacher') {
      navigate('/teacher-dashboard'); // Điều hướng đến danh sách sinh viên cho giáo viên
    } else {
      navigate('/attendance'); // Điều hướng đến trang điểm danh cho sinh viên
    }
  };

  return (
    <Card className="card position-relative mx-auto" style={{ maxWidth: '800px', marginTop: '50px' }}>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="text-center">Lịch Sử Điểm Danh</h3>
          <Button variant="danger" onClick={handleLogout}>
            Đăng Xuất
          </Button>
        </div>
        <Form.Group className="mb-3">
          <Form.Label>Chọn ngày</Form.Label>
          <Form.Control
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            max={new Date().toISOString().split('T')[0]}
          />
        </Form.Group>
        {error && <Alert variant="danger">{error}</Alert>}
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Mã Số</th>
              <th>Tên</th>
              <th>Lớp</th>
              <th>Thời Gian</th>
              <th>Trạng Thái</th>
              {userRole === 'teacher' && <th>Thao Tác</th>}
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <tr key={`${record.student_id}-${record.timestamp}`}>
                  <td>{record.student_id}</td>
                  <td>{record.name || 'Không xác định'}</td>
                  <td>{record.class_id || 'Không xác định'}</td>
                  <td>{record.timestamp}</td>
                  <td>{record.status}</td>
                  {userRole === 'teacher' && (
                    <td>
                      {record.status === 'Có mặt' ? (
                        <Button
                          variant="warning"
                          size="sm"
                          onClick={() => handleUpdateStatus(record, 'Vắng mặt')}
                        >
                          Vắng mặt
                        </Button>
                      ) : (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleUpdateStatus(record, 'Có mặt')}
                        >
                          Có mặt
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={userRole === 'teacher' ? '6' : '5'} className="text-center">
                  Không có lịch sử điểm danh
                </td>
              </tr>
            )}
          </tbody>
        </Table>
        <div className="text-center mt-3">
          <Button variant="primary" onClick={handleBack}>
            {userRole === 'teacher' ? 'Quay Lại Danh Sách Sinh Viên' : 'Quay Lại Trang Điểm Danh'}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}

export default History;