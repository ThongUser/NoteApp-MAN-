import { useState, useEffect } from 'react';

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
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewingNote, setViewingNote] = useState(null); // Quản lý popup xem chi tiết (khi nhấn icon Mắt)

  const isDark = theme === 'dark';
  const categories = ['Học tập', 'Công việc', 'Cá nhân'];

  // Format thời gian dạng: 09:15:00 21/9/2026
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
  };

  // Tải ghi chú theo danh mục
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
      console.error('Lỗi khi tải ghi chú:', err);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      fetchNotesByCategory(selectedFilter);
    }, 0);
    return () => window.clearTimeout(initialLoad);
  }, [selectedFilter]);

  // Xử lý Thêm mới hoặc Cập nhật (Sửa)
  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;

    const noteCategory = editingId ? category : selectedFilter;
    const fileSlug = CATEGORY_FILE_MAP[noteCategory] || 'hoc-tap';

    if (editingId) {
      try {
        const response = await fetch(`http://localhost:5000/api/notes/${fileSlug}/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            content: content.trim(),
            category: noteCategory,
          }),
        });
        if (!response.ok) throw new Error('Không thể cập nhật ghi chú.');
        resetForm();
        fetchNotesByCategory(selectedFilter);
        window.dispatchEvent(new Event('notesChanged'));
      } catch (err) {
        console.error('Lỗi khi sửa ghi chú:', err);
      }
    } else {
      const newNote = {
        title: title.trim(),
        content: content.trim(),
        category: noteCategory,
        createdAt: new Date().toISOString(),
      };

      try {
        const response = await fetch(`http://localhost:5000/api/notes/${fileSlug}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newNote),
        });
        if (!response.ok) throw new Error('Không thể tạo ghi chú.');

        resetForm();
        if (noteCategory === selectedFilter) {
          fetchNotesByCategory(selectedFilter);
        } else {
          setSelectedFilter(category);
        }
        window.dispatchEvent(new Event('notesChanged'));
      } catch (err) {
        console.error('Lỗi khi tạo ghi chú:', err);
      }
    }
  };

  // Xử lý XÓA ghi chú
  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa ghi chú này?')) return;

    const fileSlug = CATEGORY_FILE_MAP[selectedFilter] || 'hoc-tap';

    try {
      const res = await fetch(`http://localhost:5000/api/notes/${fileSlug}/${noteId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchNotesByCategory(selectedFilter);
        window.dispatchEvent(new Event('notesChanged'));
      }
    } catch (err) {
      console.error('Lỗi khi xóa ghi chú:', err);
    }
  };

  // Bắt đầu SỬA ghi chú (Đưa dữ liệu lên Form)
  const handleStartEdit = (note) => {
    setEditingId(note.id);
    setTitle(note.title || '');
    setContent(note.content || '');
    setCategory(note.category || selectedFilter);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Hủy bỏ chế độ Sửa
  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
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
                onClick={() => {
                  setSelectedFilter(cat);
                  resetForm();
                }}
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

      {/* FORM NHẬP / SỬA GHI CHÚ */}
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
        <div style={{ display: 'flex', gap: '10px', minWidth: 0 }}>
          <input
            type="text"
            placeholder="Tiêu đề ghi chú..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              flex: 1,
              minWidth: 0,
              width: '100%',
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

          {/* <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={editingId !== null}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
              backgroundColor: isDark ? '#0f172a' : '#f8fafc',
              color: isDark ? '#ffffff' : '#000000',
              fontSize: '14px',
              fontWeight: '600',
              outline: 'none',
              cursor: editingId ? 'not-allowed' : 'pointer'
            }}
          >
            <option value="Học tập">Học tập</option>
            <option value="Công việc">Công việc</option>
            <option value="Cá nhân">Cá nhân</option>
          </select> */}
        </div>

        <textarea
          placeholder="Nội dung ghi chú..."
          rows="3"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '100%',
            minWidth: 0,
            boxSizing: 'border-box',
            display: 'block',
            maxHeight: '240px',
            padding: '10px 12px',
            borderRadius: '8px',
            border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
            backgroundColor: isDark ? '#0f172a' : '#f8fafc',
            color: isDark ? '#ffffff' : '#000000',
            fontSize: '14px',
            resize: 'vertical',
            overflowY: 'auto',
            overflowWrap: 'anywhere',
            outline: 'none'
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              style={{
                padding: '8px 16px',
                backgroundColor: '#64748b',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Hủy
            </button>
          )}

          <button
            type="submit"
            style={{
              padding: '8px 20px',
              backgroundColor: editingId ? '#f59e0b' : '#0284c7',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {editingId ? 'Cập nhật' : 'Tạo mới'}
          </button>
        </div>
      </form>

      {/* DANH SÁCH GHI CHÚ (DẠNG THẺ NHƯ HÌNH) */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#f59e0b' }}>
          Đang tải ghi chú...
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
          Chưa có ghi chú nào trong danh mục <strong>"{selectedFilter}"</strong>.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '16px'
        }}>
          {notes.map((note, index) => (
            <div
              key={note.id || `${note.title}-${index}`}
              style={{
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                borderRadius: '16px',
                padding: '20px',
                border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                minWidth: 0
              }}
            >
              <div>
                {/* HÀNG TIÊU ĐỀ + ICON XEM / SỬA / XÓA NẰM CÙNG HÀNG BÊN PHẢI */}
                <div style={{
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  gap: '10px',
                  marginBottom: '12px'
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: '700',
                    color: isDark ? '#f8fafc' : '#1e293b',
                    paddingRight: '10px',
                    flex: 1,
                    minWidth: 0,
                    overflowWrap: 'anywhere'
                  }}>
                    {note.title || 'Chưa có tiêu đề'}
                  </h3>

                  {/* CỤM ICON (XEM 👁️ / SỬA ✏️ / XÓA 🗑️) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, marginLeft: 'auto' }}>
                    {/* Icon Mắt (Xem) */}
                    <button
                      onClick={() => setViewingNote(note)}
                      title="Xem chi tiết"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        color: isDark ? '#94a3b8' : '#475569',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </button>

                    {/* Icon Cây bút (Sửa) */}
                    <button
                      onClick={() => handleStartEdit(note)}
                      title="Sửa ghi chú"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        color: isDark ? '#94a3b8' : '#475569',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                      </svg>
                    </button>

                    {/* Icon Thùng rác (Xóa) */}
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      title="Xóa ghi chú"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        color: '#ef4444',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* NỘI DUNG GHI CHÚ */}
                <p style={{
                  margin: '0 0 16px 0',
                  fontSize: '15px',
                  color: isDark ? '#cbd5e1' : '#475569',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'anywhere'
                }}>
                  {note.content}
                </p>
              </div>

              {/* HÀNG DƯỚI CÙNG: THỜI GIAN HIỂN THỊ (DẠNG 09:15:00 21/9/2026) */}
              <div style={{
                fontSize: '13px',
                color: isDark ? '#64748b' : '#94a3b8',
                fontWeight: '500'
              }}>
                {formatDate(note.createdAt)}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* POPUP XEM CHI TIẾT KHI BẤM ICON MẮT 👁️ */}
      {viewingNote && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            padding: '24px',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            color: isDark ? '#f8fafc' : '#0f172a',
            border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ marginTop: 0, fontSize: '20px', overflowWrap: 'anywhere' }}>{viewingNote.title}</h3>
            <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', color: isDark ? '#cbd5e1' : '#475569', lineHeight: '1.6' }}>
              {viewingNote.content}
            </p>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '16px' }}>
              Thời gian: {formatDate(viewingNote.createdAt)}
            </div>
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                onClick={() => setViewingNote(null)}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#f59e0b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}