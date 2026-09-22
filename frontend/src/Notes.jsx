import React, { useState, useEffect } from 'react';

// Ánh xạ danh mục sang tên file JSON tương ứng
const CATEGORY_FILE_MAP = {
  'Học tập': 'hoc-tap',
  'Công việc': 'cong-viec',
  'Cá nhân': 'ca-nhan',
};

export default function Notes({ theme }) {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Học tập');
  const [selectedFilter, setSelectedFilter] = useState('Học tập');
  const [loading, setLoading] = useState(false);

  const isDark = theme === 'dark';
  const categories = ['Học tập', 'Công việc', 'Cá nhân'];

  // 1. Tải dữ liệu từ file JSON tương ứng dưới Backend
  const fetchNotesByCategory = async (catName) => {
    setLoading(true);
    const fileSlug = CATEGORY_FILE_MAP[catName] || 'hoc-tap';

    try {
      const res = await fetch(`http://localhost:5000/api/notes/${fileSlug}`);
      if (res.ok) {
        const data = await res.json();
        setNotes(Array.isArray(data) ? data : []);
      } else {
        setNotes([]);
      }
    } catch (err) {
      console.warn(`Lỗi kết nối Backend khi tải file ${fileSlug}.json:`, err);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  // Tự động tải lại khi đổi danh mục
  useEffect(() => {
    fetchNotesByCategory(selectedFilter);
  }, [selectedFilter]);

  // 2. Lưu ghi chú vào đúng file JSON tương ứng
  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;

    const fileSlug = CATEGORY_FILE_MAP[category] || 'hoc-tap';
    const newNote = {
      id: Date.now(),
      title: title.trim(),
      content: content.trim(),
      category: category,
      createdAt: new Date().toISOString(),
    };

    try {
      await fetch(`http://localhost:5000/api/notes/${fileSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNote),
      });

      setTitle('');
      setContent('');

      // Nếu tạo ghi chú thuộc danh mục đang mở thì tải lại danh sách
      if (category === selectedFilter) {
        fetchNotesByCategory(selectedFilter);
      } else {
        setSelectedFilter(category); // Tự chuyển sang tab vừa tạo
      }

      window.dispatchEvent(new Event('notesChanged'));
    } catch (err) {
      console.error('Lỗi khi ghi file:', err);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* NÚT LỌC CÁC DANH MỤC */}
      <div style={{
        backgroundColor: isDark ? '#1e293b' : '#FAF9F6',
        padding: '20px',
        borderRadius: '16px',
        border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
        marginBottom: '20px',
      }}>
        <h2 style={{
          margin: '0 0 16px 0',
          fontSize: '22px',
          fontWeight: '700',
          color: isDark ? '#f8fafc' : '#0f172a'
        }}>
          Danh sách ghi chú
        </h2>

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
                  backgroundColor: isActive ? '#f59e0b' : (isDark ? '#334155' : '#ffffff'),
                  color: isActive ? '#ffffff' : (isDark ? '#cbd5e1' : '#475569'),
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

      {/* FORM NẬP GHI CHÚ */}
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
          Tạo mới
        </button>
      </form>

      {/* DANH SÁCH GHI CHÚ ĐƯỢC TẢI TỪ FILE JSON */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#f59e0b' }}>
          Đang đọc dữ liệu từ file {CATEGORY_FILE_MAP[selectedFilter]}.json...
        </div>
      ) : notes.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: isDark ? '#94a3b8' : '#64748b',
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderRadius: '12px',
          border: isDark ? '1px solid #334155' : '1px solid #e2e8f0'
        }}>
          Chưa có ghi chú nào trong file <strong>"{CATEGORY_FILE_MAP[selectedFilter]}.json"</strong>.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          {notes.map((note) => (
            <div
              key={note.id || Math.random()}
              style={{
                backgroundColor: isDark ? '#0f172a' : '#FAF9F6',
                padding: '6px',
                borderRadius: '16px',
                border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
              }}
            >
              <div style={{
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                borderRadius: '12px',
                padding: '16px',
                border: isDark ? '1px solid #334155' : '1px solid #f1f5f9',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                height: '100%',
                boxSizing: 'border-box'
              }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: '700',
                  color: isDark ? '#f8fafc' : '#0f172a'
                }}>
                  {note.title || 'Chưa có tiêu đề'}
                </h3>

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
                  justify: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: isDark ? '#64748b' : '#94a3b8'
                }}>
                  <span>{note.createdAt ? new Date(note.createdAt).toLocaleDateString('vi-VN') : ''}</span>
                  <span style={{
                    backgroundColor: isDark ? '#334155' : '#f1f5f9',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: isDark ? '#38bdf8' : '#0284c7'
                  }}>
                    {selectedFilter}
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