import React, { useState, useEffect } from 'react';

function Settings() {
  const [profile, setProfile] = useState({ displayName: '', theme: 'light', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5000/api/profile')
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        document.body.style.backgroundColor = data.theme === 'dark' ? '#333' : '#fff';
        document.body.style.color = data.theme === 'dark' ? '#fff' : '#000';
      });
  }, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    fetch('http://localhost:5000/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    })
      .then(res => res.json())
      .then(() => {
        alert("Lưu thành công!");
        document.body.style.backgroundColor = profile.theme === 'dark' ? '#333' : '#fff';
        document.body.style.color = profile.theme === 'dark' ? '#fff' : '#000';
      });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Cài đặt hệ thống</h2>
      
      <div>
        <label>Tên hiển thị: </label>
        <input name="displayName" value={profile.displayName} onChange={handleChange} />
      </div>

      <div style={{ marginTop: '10px' }}>
        <label>Giao diện: </label>
        <select name="theme" value={profile.theme} onChange={handleChange}>
          <option value="light">Sáng</option>
          <option value="dark">Tối</option>
        </select>
      </div>

      {/* --- MẬT KHẨU VÙNG KÍN (NÚT CON MẮT NẰM TRONG KHUNG CHỮ NHẬT) --- */}
      <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center' }}>
        <label style={{ marginRight: '6px' }}>Mật khẩu vùng kín: </label>
        
        {/* Khung chữ nhật bao ngoài đóng vai trò làm viền cho input */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          border: '1px solid #767676',
          backgroundColor: '#ffffff',
          boxSizing: 'border-box'
        }}>
          {/* Ô nhập không viền */}
          <input 
            type={showPassword ? 'text' : 'password'} 
            name="password" 
            value={profile.password} 
            onChange={handleChange}
            style={{
              border: 'none',
              outline: 'none',
              padding: '3px 6px',
              fontSize: '14px',
              backgroundColor: 'transparent'
            }} 
          />

          {/* Nút bấm chứa icon con mắt (đã bỏ góc bo tròn) */}
          <button 
            type="button" 
            onClick={() => setShowPassword(!showPassword)}
            style={{
              border: 'none',
              borderLeft: '1px solid #e5e5e5', // Đường gạch nhẹ ngăn cách (nếu muốn)
              backgroundColor: '#dedede',
              padding: '4px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none'
            }}
          >
            {/* Icon Con Mắt (SVG) */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
              {/* Vạch gạch chéo khi ẩn mật khẩu */}
              {!showPassword && (
                <line x1="1" y1="1" x2="23" y2="23" stroke="#000" strokeWidth="2" />
              )}
            </svg>
          </button>
        </div>
      </div>

      <button onClick={handleSave} style={{ marginTop: '20px' }}>Lưu thay đổi</button>
    </div>
  );
}

export default Settings;