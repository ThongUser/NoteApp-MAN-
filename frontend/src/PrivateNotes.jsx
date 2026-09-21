import React, { useState, useEffect } from 'react';

function PrivateNotes() {
  // 1. Quản lý danh sách ghi chú (Đọc từ localStorage để không bị mất khi quay lại)
  const [notes, setNotes] = useState(() => {
    const savedNotes = localStorage.getItem('private_notes');
    if (savedNotes) {
      return JSON.parse(savedNotes);
    }
    return [
      { id: 1, title: 'binh', content: 'ăâê' },
      { id: 2, title: 'Lưu bút mật', content: '' }
    ];
  });

  // 2. Quản lý trạng thái khóa mật khẩu
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [correctPassword, setCorrectPassword] = useState('123456'); // Mật khẩu mặc định
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 3. Quản lý Form thêm/sửa
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState(null);

  // Lấy mật khẩu chuẩn từ trang Settings (Backend API) khi vào trang
  useEffect(() => {
    fetch('http://localhost:5000/api/profile')
      .then(res => res.json())
      .then(data => {
        if (data && data.password) {
          setCorrectPassword(data.password);
        }
      })
      .catch(() => console.log("Không thể kết nối Server, dùng mật khẩu mặc định"));
  }, []);

  // Lưu danh sách ghi chú vào localStorage mỗi khi có thay đổi (Thêm/Sửa/Xóa)
  useEffect(() => {
    localStorage.setItem('private_notes', JSON.stringify(notes));
  }, [notes]);

  // Xử lý kiểm tra mật khẩu
  const handleUnlock = (e) => {
    e.preventDefault();
    if (passwordInput === correctPassword) {
      setIsAuthenticated(true);
      setErrorMsg('');
      setPasswordInput('');
    } else {
      setErrorMsg('Mật khẩu không đúng! Vui lòng thử lại.');
    }
  };

  // Xử lý Lưu (Thêm mới hoặc Cập nhật)
  const handleSave = () => {
    if (!title.trim()) {
      alert("Vui lòng nhập tiêu đề!");
      return;
    }

    if (editingId) {
      setNotes(notes.map(note => 
        note.id === editingId ? { ...note, title, content } : note
      ));
      setEditingId(null);
    } else {
      const newNote = { id: Date.now(), title, content };
      setNotes([...notes, newNote]);
    }

    setTitle('');
    setContent('');
  };

  // Xử lý XÓA vĩnh viễn
  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa ghi chú này?")) {
      const updatedNotes = notes.filter(note => note.id !== id);
      setNotes(updatedNotes);
      localStorage.setItem('private_notes', JSON.stringify(updatedNotes));
    }
  };

  // Bấm Sửa
  const handleEditClick = (note) => {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content || '');
  };

  // Hủy Sửa
  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
  };

  // --- 🔒 MÀN HÌNH BẮT NHẬP MẬT KHẨU KHI CHƯA XÁC THỰC ---
  if (!isAuthenticated) {
    return (
      <div style={{
        backgroundColor: '#f8fafc',
        padding: '40px 20px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        maxWidth: '400px',
        margin: '20px auto',
        textAlign: 'center'
      }}>
        <h3 style={{ color: '#4c1d95', marginBottom: '8px', fontSize: '20px' }}>
          🔒 Khu vực Bảo mật
        </h3>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
          Vui lòng nhập mật khẩu vùng kín để xem nội dung.
        </p>

        <form onSubmit={handleUnlock}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            border: '1px solid #cbd5e1',
            backgroundColor: '#ffffff',
            borderRadius: '6px',
            overflow: 'hidden',
            marginBottom: '12px',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <input 
              type={showPassword ? 'text' : 'password'}
              placeholder="Nhập mật khẩu..."
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                padding: '10px 12px',
                fontSize: '14px',
                flex: 1
              }}
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              style={{
                border: 'none',
                backgroundColor: '#f1f5f9',
                padding: '8px 12px',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
                {!showPassword && <line x1="1" y1="1" x2="23" y2="23" stroke="#000" strokeWidth="2" />}
              </svg>
            </button>
          </div>

          {errorMsg && (
            <div style={{ color: '#dc2626', fontSize: '13px', marginBottom: '12px' }}>
              {errorMsg}
            </div>
          )}

          <button 
            type="submit"
            style={{
              width: '100%',
              backgroundColor: '#6d28d9',
              color: '#ffffff',
              border: 'none',
              padding: '10px',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Mở khóa
          </button>
        </form>
      </div>
    );
  }

  // --- 🔓 NỘI DUNG GHI CHÚ BẢO MẬT KHI ĐÃ MỞ KHÓA ---
  return (
    <div style={{
      backgroundColor: '#f8fafc',
      padding: '24px',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      minHeight: '100%'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#4c1d95', fontSize: '22px', fontWeight: '700' }}>
          🔒 Khu vực Ghi chú Riêng tư
        </h2>
        
        {/* Nút Khóa nhanh */}
        <button 
          onClick={() => setIsAuthenticated(false)}
          style={{
            backgroundColor: '#f1f5f9',
            border: '1px solid #cbd5e1',
            padding: '6px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            color: '#475569'
          }}
        >
          🔒 Khóa lại
        </button>
      </div>

      {/* Form nhập ghi chú */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '10px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '16px' }}>
          {editingId ? '✏️ Cập nhật ghi chú' : '➕ Thêm ghi chú mới'}
        </h4>
        
        <input 
          placeholder="Tiêu đề bí mật"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            marginBottom: '10px',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            outline: 'none',
            fontSize: '14px',
            boxSizing: 'border-box'
          }}
        />

        <textarea 
          placeholder="Nội dung bí mật"
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            marginBottom: '12px',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            outline: 'none',
            fontSize: '14px',
            boxSizing: 'border-box',
            resize: 'vertical'
          }}
        />

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={handleSave}
            style={{
              backgroundColor: '#6d28d9',
              color: '#ffffff',
              border: 'none',
              padding: '9px 18px',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {editingId ? 'Cập nhật' : 'Lưu bí mật'}
          </button>

          {editingId && (
            <button 
              onClick={handleCancelEdit}
              style={{
                backgroundColor: '#e2e8f0',
                color: '#475569',
                border: 'none',
                padding: '9px 18px',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Hủy
            </button>
          )}
        </div>
      </div>

      {/* Danh sách thẻ ghi chú */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
        gap: '16px' 
      }}>
        {notes.length === 0 ? (
          <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa có ghi chú bí mật nào.</div>
        ) : (
          notes.map((note) => (
            <div key={note.id} style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '16px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '16px', fontWeight: '600' }}>
                  {note.title}
                </h3>
                <p style={{ margin: '0 0 16px 0', color: '#334155', fontSize: '14px', lineHeight: '1.5', minHeight: '20px' }}>
                  {note.content}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => handleEditClick(note)}
                  style={{
                    padding: '6px 14px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    color: '#334155',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '13px'
                  }}
                >
                  Sửa
                </button>
                <button 
                  onClick={() => handleDelete(note.id)}
                  style={{
                    padding: '6px 14px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fca5a5',
                    borderRadius: '6px',
                    color: '#dc2626',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '13px'
                  }}
                >
                  Xóa
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}

export default PrivateNotes;