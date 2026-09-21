import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Notes from './Notes';
import PrivateNotes from './PrivateNotes';
import Settings from './Settings';

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        
        {/* --- SIDEBAR CẢI TIẾN MÀU CHỮ --- */}
        <div style={{ 
          width: '220px', 
          backgroundColor: '#e0f2fe', // Nền xanh biển nhạt
          padding: '24px 16px',
          borderRight: '1px solid #bae6fd',
          boxSizing: 'border-box'
        }}>
          {/* Tiêu đề Menu */}
          <h3 style={{ 
            marginTop: 0, 
            marginBottom: '16px',
            fontSize: '18px',
            fontWeight: '700',
            color: '#0369a1' // Màu xanh đậm sắc nét
          }}>
            Menu
          </h3>

          {/* Danh sách đường link */}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ marginBottom: '8px' }}>
              <Link to="/" style={{ 
                display: 'block',
                padding: '10px 14px',
                color: '#0f172a', // Màu xanh đen đậm cực kỳ rõ chữ
                backgroundColor: '#ffffff', // Nền trắng nhẹ giúp chữ nổi bật hoàn toàn
                borderRadius: '8px',
                textDecoration: 'none', // Bỏ gạch chân
                fontWeight: '600',
                fontSize: '14px',
                border: '1px solid #bae6fd'
              }}>
                Notes thường
              </Link>
            </li>
            <li style={{ marginBottom: '8px' }}>
              <Link to="/private" style={{ 
                display: 'block',
                padding: '10px 14px',
                color: '#0f172a', 
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                textDecoration: 'none', 
                fontWeight: '600',
                fontSize: '14px',
                border: '1px solid #bae6fd'
              }}>
                Notes riêng tư
              </Link>
            </li>
            <li style={{ marginBottom: '8px' }}>
              <Link to="/settings" style={{ 
                display: 'block',
                padding: '10px 14px',
                color: '#0f172a', 
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                textDecoration: 'none', 
                fontWeight: '600',
                fontSize: '14px',
                border: '1px solid #bae6fd'
              }}>
                Cài đặt
              </Link>
            </li>
          </ul>
        </div>

        {/* --- VÙNG HIỂN THỊ NỘI DUNG --- */}
        <div style={{ flex: 1, padding: '20px' }}>
          <Routes>
            <Route path="/" element={<Notes />} />
            <Route path="/private" element={<PrivateNotes />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>

      </div>
    </Router>
  );
}

export default App;