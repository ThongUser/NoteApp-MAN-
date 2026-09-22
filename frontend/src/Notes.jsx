import React, { useState, useEffect } from 'react';

export default function Notes({ theme }) {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Học tập'); // Danh mục khi tạo mới
  const [selectedFilter, setSelectedFilter] = useState('Học tập'); // Bộ lọc mặc định
  const [editingId, setEditingId] = useState(null);

  const isDark = theme === 'dark';
  // Chỉ còn 3 danh mục: Học tập, Công việc, Cá nhân
  const categories = ['Học tập', 'Công việc', 'Cá nhân'];

  // 1. Tải danh sách ghi chú
  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    let loadedNotes = [];
    
    try {
      const res = await fetch('http://localhost:5000/api/notes');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) loadedNotes = data;
      }
    } catch {}

    if (loadedNotes.length === 0) {
      try {
        const local = localStorage.getItem('notes');
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed)) loadedNotes = parsed;
        }
      } catch {}
    }

    setNotes(loadedNotes);
  };

  // 2. Thêm hoặc Sửa ghi chú
  const handleSaveNote = (e) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;

    let updatedNotes = [];

    if (editingId) {
      updatedNotes = notes.map((n) =>
        n.id === editingId ? { ...n, title, content, category } : n
      );
      setEditingId(null);
    } else {
      const newNote = {
        id: Date.now(),
        title: title.trim(),
        content: content.trim(),
        category: category,
        createdAt: new Date().toISOString(),
      };
      updatedNotes = [newNote, ...notes];
    }

    setNotes(updatedNotes);
    localStorage.setItem('notes', JSON.stringify(updatedNotes));

    setTitle('');
    setContent('');

    // Bắn sự kiện cập nhật số lượng cho trang Thống kê
    window.dispatchEvent(new Event('notesChanged'));
  };

  // 3. Xóa ghi chú
  const handleDelete = (id) => {
    const updatedNotes = notes.filter((n) => n.id !== id);
    setNotes(updatedNotes);
    localStorage.setItem('notes', JSON.stringify(updatedNotes));

    window.dispatchEvent(new Event('notesChanged'));
  };

  // 4. Sửa ghi chú
  const handleStartEdit = (note) => {
    setEditingId(note.id);
    setTitle(note.title || '');
    setContent(note.content || '');
    setCategory(note.category || 'Học tập');
  };

  // Định dạng ngày giờ
  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
  };

  // Lọc ghi chú chính xác theo danh mục được chọn
  const filteredNotes = notes.filter(
    (n) => (n.category || 'Học tập') === selectedFilter
  );

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* KHỐI DANH SÁCH GHI CHÚ & BỘ LỌC DANH MỤC */}
      <div style={{
        backgroundColor: isDark ? '#1e293b' : '#FAF9F6',
        padding: '20px',
        borderRadius: '16px',
        border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
      }}>
        <h2 style={{
          margin: '0 0 16px 0',
          fontSize: '22px',
          fontWeight: '700',
          color: isDark ? '#f8fafc' : '#0f172a'
        }}>
          Danh sách ghi chú
        </h2>

        {/* Nút lọc danh mục (Chỉ gồm Học tập, Công việc, Cá nhân) */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {categories.map((cat) => {
            const isActive = selectedFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedFilter(cat)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '10px',
                  fontWeight: '600',
                  fontSize: '14px',
                  border: isActive ? 'none' : (isDark ? '1px solid #475569' : '1px solid #e2e8f0'),
                  backgroundColor: isActive
                    ? '#f59e0b'
                    : (isDark ? '#334155' : '#ffffff'),
                  color: isActive
                    ? '#ffffff'
                    : (isDark ? '#cbd5e1' : '#475569'),
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 2px 6px rgba(245, 158, 11, 0.3)' : 'none'
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* KHUNG TẠO THÊM / SỬA GHI CHÚ */}
      <form onSubmit={handleSaveNote} style={{
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        padding: '16px',
        borderRadius: '12px',
        border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Tiêu đề ghi chú..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: '8px',
              border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
              backgroundColor: isDark ? '#0f172a' : '#f8fafc',
              color: isDark ? '#ffffff' : '#000000',
              fontSize: '15px',
              fontWeight: '600',
              outline: 'none'
            }}
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
              backgroundColor: isDark ? '#0f172a' : '#f8fafc',
              color: isDark ? '#ffffff' : '#000000',
              fontSize: '14px',
              fontWeight: '600',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="Học tập">Học tập</option>
            <option value="Công việc">Công việc</option>
            <option value="Cá nhân">Cá nhân</option>
          </select>
        </div>

        <textarea
          placeholder="Nội dung ghi chú..."
          rows="3"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            padding: '10px 12px',
            borderRadius: '8px',
            border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
            backgroundColor: isDark ? '#0f172a' : '#f8fafc',
            color: isDark ? '#ffffff' : '#000000',
            fontSize: '14px',
            resize: 'vertical',
            outline: 'none'
          }}
        />

        <button
          type="submit"
          style={{
            alignSelf: 'flex-end',
            padding: '8px 20px',
            backgroundColor: '#0284c7',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          {editingId ? 'Cập nhật' : 'Tạo mới'}
        </button>
      </form>

      {/* HIỂN THỊ DANH SÁCH THẺ GHI CHÚ LỌC THEO DANH MỤC */}
      {filteredNotes.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: isDark ? '#94a3b8' : '#64748b',
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderRadius: '12px',
          border: isDark ? '1px solid #334155' : '1px solid #e2e8f0'
        }}>
          Chưa có ghi chú nào thuộc danh mục <strong>"{selectedFilter}"</strong>.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          {filteredNotes.map((note) => (
            <div
              key={note.id || Math.random()}
              style={{
                backgroundColor: isDark ? '#0f172a' : '#FAF9F6',
                padding: '6px',
                borderRadius: '16px',
                border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
              }}
            >
              <div
                style={{
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  borderRadius: '12px',
                  padding: '16px',
                  border: isDark ? '1px solid #334155' : '1px solid #f1f5f9',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  height: '100%',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: '700',
                    color: isDark ? '#f8fafc' : '#0f172a'
                  }}>
                    {note.title || 'Chưa có tiêu đề'}
                  </h3>
                  
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      onClick={() => handleStartEdit(note)}
                      title="Chỉnh sửa"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '15px',
                        opacity: 0.8,
                        padding: '2px'
                      }}
                    >
                      ✏️
                    </button>

                    <button
                      onClick={() => handleDelete(note.id)}
                      title="Xóa"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '15px',
                        opacity: 0.8,
                        padding: '2px'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <p style={{
                  margin: '4px 0 12px 0',
                  fontSize: '14px',
                  color: isDark ? '#cbd5e1' : '#475569',
                  lineHeight: '1.4'
                }}>
                  {note.content}
                </p>

                <div style={{
                  marginTop: 'auto',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: isDark ? '#64748b' : '#94a3b8'
                }}>
                  <span>{formatTime(note.createdAt)}</span>
                  <span style={{
                    backgroundColor: isDark ? '#334155' : '#f1f5f9',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: isDark ? '#38bdf8' : '#0284c7'
                  }}>
                    {note.category || 'Học tập'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}