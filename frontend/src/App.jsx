import React, { useState, useEffect } from 'react';
import Notes from './Notes';
import PrivateNotes from './PrivateNotes';
import Settings from './Settings';

function App() {
  const [activeTab, setActiveTab] = useState('regular');
  
  // State lưu tên hiển thị của người dùng
  const [displayName, setDisplayName] = useState(() => {
    const savedProfile = localStorage.getItem('user_profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        return parsed.name || 'Bạn';
      } catch (e) {
        return 'Bạn';
      }
    }
    return 'Bạn';
  });

  // Tự động đồng bộ tên khi có thay đổi từ Cài đặt
  useEffect(() => {
    const fetchProfile = () => {
      fetch('http://localhost:5000/api/profile')
        .then(res => res.json())
        .then(data => {
          if (data && data.name) setDisplayName(data.name);
        })
        .catch(() => {
          const savedProfile = localStorage.getItem('user_profile');
          if (savedProfile) {
            try {
              const parsed = JSON.parse(savedProfile);
              if (parsed.name) setDisplayName(parsed.name);
            } catch (e) {}
          }
        });
    };

    fetchProfile();

    const handleStorageChange = () => fetchProfile();
    window.addEventListener('profileUpdated', handleStorageChange);
    
    return () => window.removeEventListener('profileUpdated', handleStorageChange);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* --- THANH MENU BÊN TRÁI --- */}
      <div style={{
        width: '220px',
        backgroundColor: '#e0f2fe',
        padding: '20px',
        borderRight: '1px solid #bae6fd'
      }}>
        
        {/* 🌟 1. DÒNG XIN CHÀO NẰM PHÍA TRÊN MENU 🌟 */}
        <div style={{
          marginBottom: '16px',
          fontSize: '14px',
          color: '#1e293b',
          backgroundColor: '#ffffff',
          padding: '10px 12px',
          borderRadius: '8px',
          border: '1px solid #bae6fd',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span>👋</span>
          <span>Xin chào, <strong style={{ color: '#0284c7' }}>{displayName}</strong>!</span>
        </div>

        {/* 2. TIÊU ĐỀ MENU NẰM DƯỚI DÒNG XIN CHÀO */}
        <h2 style={{ margin: '0 0 16px 0', color: '#0369a1', fontSize: '20px', fontWeight: '700' }}>
          Menu
        </h2>

        {/* CÁC NÚT BẤM CHUYỂN TRANG */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button 
            onClick={() => setActiveTab('regular')}
            style={{
              padding: '10px 16px',
              backgroundColor: activeTab === 'regular' ? '#0284c7' : '#ffffff',
              color: activeTab === 'regular' ? '#ffffff' : '#0f172a',
              border: '1px solid #cbd5e1',
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
              backgroundColor: activeTab === 'private' ? '#0284c7' : '#ffffff',
              color: activeTab === 'private' ? '#ffffff' : '#0f172a',
              border: '1px solid #cbd5e1',
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
              backgroundColor: activeTab === 'settings' ? '#0284c7' : '#ffffff',
              color: activeTab === 'settings' ? '#ffffff' : '#0f172a',
              border: '1px solid #cbd5e1',
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

      {/* --- NỘI DUNG CHÍNH BÊN PHẢI --- */}
      <div style={{ flex: 1, padding: '24px', backgroundColor: '#f8fafc' }}>
        {activeTab === 'regular' && <Notes />}
        {activeTab === 'private' && <PrivateNotes />}
        {activeTab === 'settings' && <Settings />}
      </div>

    </div>
  );
}

export default App;