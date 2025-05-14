import api from '../utils/api';

export const loginUser = async (url, credentials) => {
  try {
    const response = await api.post(url, credentials);
    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('userRole', response.data.role);
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.error || 'Lỗi đăng nhập');
  }
};

export const logoutUser = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('userRole');
  localStorage.removeItem('studentId');  // Xóa student_id khi đăng xuất
};