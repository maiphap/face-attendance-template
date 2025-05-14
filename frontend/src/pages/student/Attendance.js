import React, { useState, useRef } from 'react';
import { Card, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import api from '../../utils/api';

function Attendance() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [attendanceInfo, setAttendanceInfo] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const webcamRef = useRef(null);
  const navigate = useNavigate();

  const videoConstraints = {
    width: 320,
    height: 240,
    facingMode: 'user',
  };

  const capture = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setError('Không thể chụp ảnh. Vui lòng kiểm tra webcam và thử lại.');
      return;
    }

    setCapturedImage(imageSrc);
    setIsLoading(true);
    try {
      const response = await fetch(imageSrc);
      if (!response.ok) {
        throw new Error('Không thể chuyển đổi ảnh từ webcam.');
      }
      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Ảnh chụp bị rỗng.');
      }

      const formData = new FormData();
      formData.append('image', blob, 'captured-image.jpg');

      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
      }

      const res = await api.post('/attendance', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });

      setMessage(res.data.message);
      setAttendanceInfo({
        student_id: res.data.student_id,
        name: res.data.student_name,
        class_id: res.data.class_id,
        timestamp: res.data.timestamp,
        status: res.data.status,
      });
      setError('');
      setIsCameraOpen(false);
      setTimeout(() => {
        setMessage('');
        setAttendanceInfo(null);
        setCapturedImage(null);
      }, 5000);
    } catch (err) {
      console.error('Attendance error:', err.response || err.message);
      setError(err.response?.data?.error || err.message || 'Điểm danh thất bại. Vui lòng thử lại.');
      setMessage('');
      setCapturedImage(null);
      setIsCameraOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  return (
    <Card className="card position-relative mx-auto" style={{ maxWidth: '400px', marginTop: '50px' }}>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="text-center">Điểm Danh</h3>
          <Button variant="danger" onClick={handleLogout}>Đăng Xuất</Button>
        </div>
        <Button variant="primary" onClick={() => navigate('/history')} className="mb-3">
          Xem Lịch Sử Điểm Danh
        </Button>
        {message && (
          <Alert variant="success">
            {message}
            {attendanceInfo && capturedImage && (
              <div>
                <div className="text-center mb-3">
                  <img src={capturedImage} alt="Captured" style={{ width: '100%', maxWidth: '320px', height: 'auto' }} />
                </div>
                <p>Mã Số: {attendanceInfo.student_id}</p>
                <p>Tên: {attendanceInfo.name || 'Không xác định'}</p>
                <p>Lớp: {attendanceInfo.class_id || 'Không xác định'}</p>
                <p>Thời Gian: {attendanceInfo.timestamp}</p>
                <p>Trạng Thái: {attendanceInfo.status}</p>
              </div>
            )}
          </Alert>
        )}
        {error && <Alert variant="danger">{error}</Alert>}
        <div className="text-center">
          {isCameraOpen ? (
            <>
              <Webcam
                audio={false}
                height={240}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width={320}
                videoConstraints={videoConstraints}
                className="mb-3"
              />
              <Button
                variant="primary"
                onClick={capture}
                className="me-2"
                disabled={isLoading}
              >
                {isLoading ? <Spinner as="span" animation="border" size="sm" /> : 'Chụp Ảnh'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setIsCameraOpen(false)}
                disabled={isLoading}
              >
                Hủy
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              onClick={() => setIsCameraOpen(true)}
              disabled={isLoading}
            >
              Mở Camera
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}

export default Attendance;