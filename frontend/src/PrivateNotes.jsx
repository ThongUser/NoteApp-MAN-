import React, { useState, useEffect } from 'react';

function PrivateNotes() {
  // State lưu danh sách ghi chú
  const [notes, setNotes] = useState([
    { id: 1, title: 'binh', content: 'ăâê' },
    { id: 2, title: 'Lưu bút mật', content: '' }
  ]);

  // State lưu thông tin nhập trên Form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  // State lưu ID của ghi chú đang được chọn để Sửa (nếu null là đang ở chế độ Thêm mới)
  const [editingId, setEditingId] = useState(null);

  // Lấy danh sách ghi chú từ Server Backend (nếu có)
  useEffect(() => {
    fetch('http://localhost:5000/api/private-notes')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setNotes(data);
      })
      .catch(err => console.log("Dùng dữ liệu local"));
  }, []);

  // Xử lý Lưu (Thêm mới hoặc Cập nhật)
  const handleSave = () => {
    if (!title.trim()) {
      alert("Vui lòng nhập tiêu đề!");
      return;
    }

    if (editingId) {
      // 1. Nếu đang SỬA
      const updatedNotes = notes.map(note => 
        note.id === editingId ? { ...note, title, content } : note
      );
      setNotes(updatedNotes);

      // Gọi API cập nhật Backend (nếu có)
      fetch(`http://localhost:5000/api/private-notes/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
      }).catch(err => console.log(err));

      setEditingId(null);
    } else {
      // 2. Nếu đang THÊM MỚI
      const newNote = { id: Date.now(), title, content };
      setNotes([...notes, newNote]);

      // Gọi API thêm mới Backend (nếu có)
      fetch('http://localhost:5000/api/private-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNote)
      }).catch(err => console.log(err));
    }

    // Reset lại ô nhập
    setTitle('');
    setContent('');
  };

  // Xử lý XÓA ghi chú
  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa ghi chú này?")) {
      setNotes(notes.filter(note => note.id !== id));

      // Gọi API xóa ở Backend (nếu có)
      fetch(`http://localhost:5000/api/private-notes/${id}`, {
        method: 'DELETE'
      }).catch(err => console.log(err));
    }
  };

  // Kích hoạt chế độ SỬA khi nhấn nút "Sửa"
  const handleEditClick = (note) => {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content || '');
  };

  // Hủy chế độ sửa
  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
  };

  return (
    <div style={{
      backgroundColor: '#f8fafc',
      padding: '24px',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      minHeight: '100%'
    }}>
      <h2 style={{ margin: '0 0 20px 0', color: '#4c1d95', fontSize: '22px', fontWeight: '700' }}>
        🔒 Khu vực Ghi chú Riêng tư
      </h2>

      {/* --- FORM NHẬP GHI CHÚ --- */}
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

      {/* --- DANH SÁCH THẺ GHI CHÚ ĐỘNG --- */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
        gap: '16px' 
      }}>
        {notes.map((note) => (
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

            {/* Nút Sửa & Xóa động */}
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
        ))}
      </div>

    </div>
  );
}

export default PrivateNotes;