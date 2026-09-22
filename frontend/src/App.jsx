import React, { useState, useEffect } from 'react';
import Notes from './Notes';
import PrivateNotes from './PrivateNotes';
import Settings from './Settings';

function App() {
  const [activeTab, setActiveTab] = useState('regular');
  const [displayName, setDisplayName] = useState('Bạn');
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Lấy cài đặt ban đầu
    const savedProfile = localStorage.getItem('user_profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        if (parsed.name) setDisplayName(parsed.name);
        if (parsed.theme) setTheme(parsed.theme);
      } catch (e) {}
    }

    fetch('http://localhost:5000/api/profile')
      .then(res => res.json())
      .then(data => {
        if (data) {
          if (data.name) setDisplayName(data.name);
          if (data.theme) setTheme(data.theme);
        }
      })
      .catch(() => {});

    // Lắng nghe sự kiện cập nhật giao diện sau khi bấm nút Lưu thay đổi
    const handleProfileUpdate = (event) => {
      if (event.detail) {
        if (event.detail.name) setDisplayName(event.detail.name);
        if (event.detail.theme) setTheme(event.detail.theme);
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, []);

  const isDark = theme === 'dark';

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: 'sans-serif',
      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
      color: isDark ? '#f8fafc' : '#0f172a',
      transition: 'all 0.3s ease'
    }}>
      
      {/* MENU BÊN TRÁI */}
      <div style={{
        width: '220px',
        backgroundColor: isDark ? '#1e293b' : '#e0f2fe',
        padding: '20px',
        borderRight: isDark ? '1px solid #334155' : '1px solid #bae6fd'
      }}>
        <div style={{
          marginBottom: '16px',
          fontSize: '14px',
          color: isDark ? '#f8fafc' : '#1e293b',
          backgroundColor: isDark ? '#334155' : '#ffffff',
          padding: '10px 12px',
          borderRadius: '8px',
          border: isDark ? '1px solid #475569' : '1px solid #bae6fd',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span>👋</span>
          <span>Xin chào, <strong style={{ color: isDark ? '#38bdf8' : '#0284c7' }}>{displayName}</strong>!</span>
        </div>

        <h2 style={{ margin: '0 0 16px 0', color: isDark ? '#38bdf8' : '#0369a1', fontSize: '20px', fontWeight: '700' }}>
          Menu
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button 
            onClick={() => setActiveTab('regular')}
            style={{
              padding: '10px 16px',
              backgroundColor: activeTab === 'regular' ? '#0284c7' : (isDark ? '#334155' : '#ffffff'),
              color: activeTab === 'regular' ? '#ffffff' : (isDark ? '#f8fafc' : '#0f172a'),
              border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
              borderRadius: '8px',
              textAlign: 'left',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Notes thường
          </button>

          <button 
            onClick={() => setActiveTab('private')}
            style={{
              padding: '10px 16px',
              backgroundColor: activeTab === 'private' ? '#0284c7' : (isDark ? '#334155' : '#ffffff'),
              color: activeTab === 'private' ? '#ffffff' : (isDark ? '#f8fafc' : '#0f172a'),
              border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
              borderRadius: '8px',
              textAlign: 'left',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Notes riêng tư
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            style={{
              padding: '10px 16px',
              backgroundColor: activeTab === 'settings' ? '#0284c7' : (isDark ? '#334155' : '#ffffff'),
              color: activeTab === 'settings' ? '#ffffff' : (isDark ? '#f8fafc' : '#0f172a'),
              border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
              borderRadius: '8px',
              textAlign: 'left',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Cài đặt
          </button>
        </div>
      </div>

      {/* NỘI DUNG CHÍNH */}
      <div style={{ flex: 1, padding: '24px', backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
        {activeTab === 'regular' && <Notes theme={theme} />}
        {activeTab === 'private' && <PrivateNotes theme={theme} />}
        {/* Truyền theme hiện tại sang Settings */}
        {activeTab === 'settings' && <Settings currentTheme={theme} />}
      </div>

    </div>
  );
}

export default App;