// src/pages/student/StudentRegister.js
import React, { useState, useRef } from 'react';
import { Form, Button, Alert, Image } from 'react-bootstrap';
import Webcam from 'react-webcam';
import axios from 'axios';

function StudentRegister() {
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [classId, setClassId] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const webcamRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const captureImage = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      fetch(imageSrc)
        .then((res) => res.blob())
        .then((blob) => {
          setImage(blob);
          setImagePreview(imageSrc);
          setShowWebcam(false);
        });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!studentId || !name || !classId || !image) {
      setError('Vui lòng điền đầy đủ thông tin (Mã sinh viên, Tên, Lớp, và ảnh)');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('student_id', studentId);
    formData.append('name', name);
    formData.append('class_id', classId);
    formData.append('image', image, 'student.jpg');

    try {
      const res = await axios.post('http://localhost:5000/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi đăng ký sinh viên');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-center mb-3">Đăng Ký Sinh Viên</h3>
      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Mã sinh viên</Form.Label>
          <Form.Control value={studentId} onChange={(e) => setStudentId(e.target.value)} required />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Tên</Form.Label>
          <Form.Control value={name} onChange={(e) => setName(e.target.value)} required />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Lớp</Form.Label>
          <Form.Control value={classId} onChange={(e) => setClassId(e.target.value)} required />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Chọn ảnh</Form.Label>
          <Form.Control type="file" accept="image/*" onChange={handleFileChange} />
        </Form.Group>
        {imagePreview && <Image src={imagePreview} className="mb-3" fluid />}
        <Button className="mb-3 w-100" onClick={() => setShowWebcam(!showWebcam)} variant="secondary">
          {showWebcam ? 'Tắt Webcam' : 'Sử dụng Webcam'}
        </Button>
        {showWebcam && (
          <>
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width="100%"
              videoConstraints={{ facingMode: 'user' }}
            />
            <Button variant="primary" onClick={captureImage} className="my-2 w-100">
              Chụp ảnh
            </Button>
          </>
        )}
        <Button type="submit" disabled={loading} variant="success" className="w-100">
          {loading ? 'Đang xử lý...' : 'Đăng Ký'}
        </Button>
      </Form>
    </div>
  );
}

export default StudentRegister;