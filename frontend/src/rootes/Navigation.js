// src/routes/Navigation.js
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';

function Navigation({ role, setRole, onLogout }) {
  const navigate = useNavigate();

  return (
    <Navbar bg="primary" variant="dark" expand="lg" className="navbar">
      <Container>
        <Navbar.Brand as={Link} to="/">
          <img
            src="/logo.png"
            alt="Logo"
            height="30"
            className="d-inline-block align-top me-2"
          />
          Hệ Thống Điểm Danh
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            {role === 'student' && localStorage.getItem('access_token') && (
              <>
                <Nav.Link as={Link} to="/attendance" className="nav-link">
                  Điểm Danh
                </Nav.Link>
                <Nav.Link as={Link} to="/history" className="nav-link">
                  Lịch Sử Điểm Danh
                </Nav.Link>
                <Nav.Link as="button" onClick={onLogout} className="nav-link">
                  Đăng Xuất
                </Nav.Link>
              </>
            )}
            {role === 'student' && !localStorage.getItem('access_token') && (
              <Nav.Link as={Link} to="/login" className="nav-link">
                Đăng Nhập Sinh Viên
              </Nav.Link>
            )}
            {role === 'teacher' && localStorage.getItem('access_token') && (
              <>
                <Nav.Link as={Link} to="/attendance" className="nav-link">
                  Điểm Danh Cho Sinh Viên
                </Nav.Link>
                <Nav.Link as={Link} to="/teacher-register" className="nav-link">
                  Đăng Ký Giáo Viên
                </Nav.Link>
                <Nav.Link as={Link} to="/teacher-dashboard" className="nav-link">
                  Quản Lý
                </Nav.Link>
                <Nav.Link as={Link} to="/history" className="nav-link">
                  Lịch Sử Tất Cả
                </Nav.Link>
                <Nav.Link as={Link} to="/report" className="nav-link">
                  Báo Cáo Điểm Danh
                </Nav.Link>
                <Nav.Link as="button" onClick={onLogout} className="nav-link">
                  Đăng Xuất
                </Nav.Link>
              </>
            )}
            {role === 'teacher' && !localStorage.getItem('access_token') && (
              <Nav.Link as={Link} to="/admin/login" className="nav-link">
                Đăng Nhập Admin Panel
              </Nav.Link>
            )}
            {!localStorage.getItem('access_token') && (
              <Nav.Link as={Link} to="/register" className="nav-link">
                Đăng Ký
              </Nav.Link>
            )}
            <NavDropdown title="Chuyển Vai Trò" id="role-dropdown">
              <NavDropdown.Item onClick={() => setRole('student')}>
                Sinh Viên
              </NavDropdown.Item>
              <NavDropdown.Item onClick={() => setRole('teacher')}>
                Giáo Viên
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Navigation;