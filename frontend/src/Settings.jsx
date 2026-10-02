import { useState, useEffect } from 'react';

function Settings({ currentTheme }) {
  const [name, setName] = useState('binh');
  const [selectedTheme, setSelectedTheme] = useState('light');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isPasswordAuthenticated, setIsPasswordAuthenticated] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/profile');
        if (!res.ok) throw new Error('Profile not found');
        const profile = await res.json();
        const nextName = profile.displayName || profile.name || 'Bạn';
        setName(nextName);
        setSelectedTheme(profile.theme || 'light');
        localStorage.setItem('user_profile', JSON.stringify({
          displayName: nextName,
          theme: profile.theme || 'light'
        }));
      } catch {
        const savedProfile = localStorage.getItem('user_profile');
        if (savedProfile) {
          try {
            const parsed = JSON.parse(savedProfile);
            if (parsed.displayName || parsed.name) setName(parsed.displayName || parsed.name);
            if (parsed.theme) setSelectedTheme(parsed.theme);
          } catch {
            // Ignore malformed local profile data and keep defaults.
          }
        }
      }
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    if (isPasswordAuthenticated && !password.trim()) {
      setSaveMessage('Mật khẩu không được để trống.');
      return;
    }

    const profileData = {
      displayName: name,
      theme: selectedTheme
    };

    if (isPasswordAuthenticated) profileData.password = password;

    try {
      const response = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(isPasswordAuthenticated ? { 'x-private-password': currentPassword } : {})
        },
        body: JSON.stringify(profileData)
      });
      if (!response.ok) throw new Error('Không thể lưu thông tin.');
      localStorage.setItem('user_profile', JSON.stringify(profileData));
      if (isPasswordAuthenticated) setCurrentPassword(password);
      setSaveMessage('Đã lưu thông tin!');
    } catch (error) {
      setSaveMessage(error.message || 'Không thể lưu thông tin.');
      return;
    }

    window.dispatchEvent(new CustomEvent('profileUpdated', { detail: profileData }));
  };

  const handlePasswordUnlock = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/private/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });
      if (!response.ok) throw new Error('Mật khẩu không đúng.');
      setCurrentPassword(passwordInput);
      setPassword(passwordInput);
      setPasswordInput('');
      setPasswordError('');
      setIsPasswordAuthenticated(true);
    } catch (error) {
      setPasswordError(error.message || 'Không thể xác thực mật khẩu.');
    }
  };

  // Dùng currentTheme từ App để giữ màu sắc khung Settings không bị lệch màu trước khi lưu
  const isDark = currentTheme === 'dark';

  return (
    <div className="settings-panel" style={{
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

      {/* Mật khẩu riêng tư */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600' }}>Mật khẩu riêng tư:</label>
        {!isPasswordAuthenticated ? (
          <form onSubmit={handlePasswordUnlock}>
            <div className="settings-password-entry" style={{ display: 'flex', gap: '8px' }}>
              <input
                type="password"
                placeholder="Nhập mật khẩu hiện tại"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
                  backgroundColor: isDark ? '#334155' : '#ffffff',
                  color: isDark ? '#ffffff' : '#000000',
                  flex: 1,
                  minWidth: 0
                }}
              />
              <button type="submit" style={{ padding: '8px 12px', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
                Xác thực
              </button>
            </div>
            {passwordError && <div style={{ color: '#dc2626', fontSize: '13px', marginTop: '6px' }}>{passwordError}</div>}
          </form>
        ) : (
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
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
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
          Lưu thông tin
        </button>
        {saveMessage && (
          <span style={{ color: '#16a34a', fontSize: '14px', fontWeight: '600' }}>
            {saveMessage}
          </span>
        )}
      </div>
    </div>
  );
}

export default Settings;