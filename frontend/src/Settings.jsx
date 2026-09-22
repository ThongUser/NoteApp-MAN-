import React, { useState, useEffect } from 'react';

function Settings({ currentTheme }) {
  const [name, setName] = useState('binh');
  const [selectedTheme, setSelectedTheme] = useState('light');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const savedProfile = localStorage.getItem('user_profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        if (parsed.name) setName(parsed.name);
        if (parsed.theme) setSelectedTheme(parsed.theme);
        if (parsed.password) setPassword(parsed.password);
      } catch (e) {}
    }
  }, []);

  const handleSave = async () => {
    const profileData = { name, theme: selectedTheme, password };
    
    // 1. Lưu vào localStorage
    localStorage.setItem('user_profile', JSON.stringify(profileData));

    // 2. Lưu API Backend
    try {
      await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
    } catch (err) {
      console.log("Không thể kết nối Server:", err);
    }

    // 3. Đổi màu giao diện toàn ứng dụng sau khi đã bấm Lưu thay đổi
    window.dispatchEvent(new CustomEvent('profileUpdated', { detail: profileData }));
    
    alert("Đã lưu thay đổi cài đặt!");
  };

  // Dùng currentTheme từ App để giữ màu sắc khung Settings không bị lệch màu trước khi lưu
  const isDark = currentTheme === 'dark';

  return (
    <div style={{
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      color: isDark ? '#f8fafc' : '#0f172a',
      padding: '24px',
      borderRadius: '12px',
      border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
      maxWidth: '500px',
      transition: 'all 0.3s ease'
    }}>
      <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '22px' }}>⚙️ Cài đặt hệ thống</h2>

      {/* Tên hiển thị */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Tên hiển thị:</label>
        <input 
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
            backgroundColor: isDark ? '#334155' : '#ffffff',
            color: isDark ? '#ffffff' : '#000000',
            width: '100%',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Giao diện */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Giao diện:</label>
        <select 
          value={selectedTheme}
          onChange={(e) => setSelectedTheme(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
            backgroundColor: isDark ? '#334155' : '#ffffff',
            color: isDark ? '#ffffff' : '#000000',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          <option value="light">Sáng</option>
          <option value="dark">Tối</option>
        </select>
      </div>

      {/* Mật khẩu vùng kín */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Mật khẩu vùng kín:</label>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
          borderRadius: '6px',
          overflow: 'hidden',
          backgroundColor: isDark ? '#334155' : '#ffffff'
        }}>
          <input 
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              padding: '8px 12px',
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              color: isDark ? '#ffffff' : '#000000',
              flex: 1
            }}
          />
          <button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              border: 'none',
              backgroundColor: isDark ? '#475569' : '#f1f5f9',
              padding: '8px 12px',
              cursor: 'pointer'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#ffffff' : '#000000'} strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
              {!showPassword && <line x1="1" y1="1" x2="23" y2="23" stroke={isDark ? '#ffffff' : '#000000'} strokeWidth="2" />}
            </svg>
          </button>
        </div>
      </div>

      <button 
        onClick={handleSave}
        style={{
          padding: '10px 20px',
          backgroundColor: '#0284c7',
          color: '#ffffff',
          border: 'none',
          borderRadius: '6px',
          fontWeight: '600',
          cursor: 'pointer'
        }}
      >
        Lưu thay đổi
      </button>
    </div>
  );
}

export default Settings;