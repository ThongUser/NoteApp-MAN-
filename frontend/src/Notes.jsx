import React, { useState, useEffect } from 'react';

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
  const [viewingNote, setViewingNote] = useState(null);

  // --- STATE DÀNH CHO TOOLBAR & CHUYỂN TRANG ---
  const [searchTerm, setSearchTerm] = useState('');      // Ô input tìm kiếm
  const [dateFilter, setDateFilter] = useState('newest'); // Dropdown ngày tháng (Mới nhất / Cũ nhất)
  const [page, setPage] = useState(1);                     // Trang hiện tại
  const [limit] = useState(6);                            // Số ghi chú mỗi trang
  const [totalPages, setTotalPages] = useState(1);         // Tổng số trang

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

  // HÀM FETCH DỮ LIỆU: Ghép State vào URL
  const fetchNotes = async () => {
    setLoading(true);
    const fileSlug = CATEGORY_FILE_MAP[selectedFilter] || 'hoc-tap';

    // Xây dựng URL chứa Query Parameters từ State
    const queryParams = new URLSearchParams({
      search: searchTerm.trim(),
      date: dateFilter,
      page: page.toString(),
      limit: limit.toString(),
    }).toString();

    const url = `http://localhost:5000/api/notes/${fileSlug}?${queryParams}`;

    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        
        // Nếu Backend trả về object dạng { notes: [...], totalPages: 3 }
        if (data && Array.isArray(data.notes)) {
          setNotes(data.notes);
          setTotalPages(data.totalPages || 1);
        } 
        // Nếu Backend chỉ trả về mảng đơn thuần (fallback xử lý phân trang & tìm kiếm ở client)
        else if (Array.isArray(data)) {
          let filtered = [...data];

          // Lọc theo tìm kiếm
          if (searchTerm.trim()) {
            filtered = filtered.filter(
              (n) =>
                n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                n.content?.toLowerCase().includes(searchTerm.toLowerCase())
            );
          }

          // Sắp xếp theo ngày
          filtered.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateFilter === 'newest' ? dateB - dateA : dateA - dateB;
          });

          // Phân trang client
          const total = Math.ceil(filtered.length / limit) || 1;
          setTotalPages(total);

          const startIndex = (page - 1) * limit;
          const paginatedNotes = filtered.slice(startIndex, startIndex + limit);
          setNotes(paginatedNotes);
        } else {
          setNotes([]);
          setTotalPages(1);
        }
      } else {
        setNotes([]);
      }
    } catch (err) {
      console.error('Lỗi khi tải ghi chú từ URL:', url, err);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  // Tự động gọi fetchNotes mỗi khi thay đổi danh mục, ô tìm kiếm, dropdown ngày, hoặc chuyển trang
  useEffect(() => {
    fetchNotes();
  }, [selectedFilter, searchTerm, dateFilter, page]);

  // Reset về trang 1 mỗi khi thay đổi từ khóa tìm kiếm hoặc sắp xếp
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleDateFilterChange = (e) => {
    setDateFilter(e.target.value);
    setPage(1);
  };

  // Xử lý Thêm mới hoặc Cập nhật ghi chú
  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;

    const fileSlug = CATEGORY_FILE_MAP[category] || 'hoc-tap';

    if (editingId) {
      try {
        await fetch(`http://localhost:5000/api/notes/${fileSlug}/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            content: content.trim(),
            category: category,
          }),
        });
        resetForm();
        fetchNotes();
        window.dispatchEvent(new Event('notesChanged'));
      } catch (err) {
        console.error('Lỗi khi sửa ghi chú:', err);
      }
    } else {
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

        resetForm();
        if (category === selectedFilter) {
          fetchNotes();
        } else {
          setSelectedFilter(category);
          setPage(1);
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
        fetchNotes();
        window.dispatchEvent(new Event('notesChanged'));
      }
    } catch (err) {
      console.error('Lỗi khi xóa ghi chú:', err);
    }
  };

  const handleStartEdit = (note) => {
    setEditingId(note.id);
    setTitle(note.title || '');
    setContent(note.content || '');
    setCategory(note.category || selectedFilter);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* 1. DANH MỤC GHI CHÚ */}
      <div style={{
        backgroundColor: isDark ? '#1e293b' : '#FAF9F6',
        padding: '20px',
        borderRadius: '16px',
        border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
        marginBottom: '16px',
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
                  setPage(1);
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

      {/* 2. TOOLBAR: Ô INPUT TÌM KIẾM & DROPDOWN NGÀY THÁNG */}
      <div style={{
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        padding: '16px',
        borderRadius: '12px',
        border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
        marginBottom: '20px',
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {/* Ô Input Tìm Kiếm */}
        <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', position: 'relative' }}>
          <input
            type="text"
            placeholder="🔍 Tìm kiếm ghi chú theo tiêu đề, nội dung..."
            value={searchTerm}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
              backgroundColor: isDark ? '#0f172a' : '#f8fafc',
              color: isDark ? '#ffffff' : '#000000',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        {/* Dropdown Lọc / Sắp xếp ngày tháng */}
        <select
          value={dateFilter}
          onChange={handleDateFilterChange}
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
            backgroundColor: isDark ? '#0f172a' : '#f8fafc',
            color: isDark ? '#ffffff' : '#000000',
            fontSize: '14px',
            fontWeight: '500',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="newest">📅 Mới nhất trước</option>
          <option value="oldest">📅 Cũ nhất trước</option>
        </select>
      </div>

      {/* 3. FORM NHẬP / SỬA GHI CHÚ */}
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

      {/* 4. DANH SÁCH GHI CHÚ */}
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
          Không tìm thấy ghi chú nào phù hợp.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '16px'
        }}>
          {notes.map((note) => (
            <div
              key={note.id || Math.random()}
              style={{
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                borderRadius: '16px',
                padding: '20px',
                border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}
            >
              <div>
                <div style={{
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: '700',
                    color: isDark ? '#f8fafc' : '#1e293b',
                    paddingRight: '10px'
                  }}>
                    {note.title || 'Chưa có tiêu đề'}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <button
                      onClick={() => setViewingNote(note)}
                      title="Xem chi tiết"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#94a3b8' : '#475569' }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    </button>

                    <button
                      onClick={() => handleStartEdit(note)}
                      title="Sửa ghi chú"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#94a3b8' : '#475569' }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                      </svg>
                    </button>

                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      title="Xóa ghi chú"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>

                <p style={{
                  margin: '0 0 16px 0',
                  fontSize: '15px',
                  color: isDark ? '#cbd5e1' : '#475569',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap'
                }}>
                  {note.content}
                </p>
              </div>

              <div style={{ fontSize: '13px', color: isDark ? '#64748b' : '#94a3b8', fontWeight: '500' }}>
                {formatDate(note.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. COMPONENT CHUYỂN TRANG (PAGINATION) */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justify: 'center',
          alignItems: 'center',
          gap: '8px',
          marginTop: '28px',
          marginBottom: '20px'
        }}>
          {/* Nút Trang Trước */}
          <button
            disabled={page === 1}
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
              backgroundColor: page === 1 ? (isDark ? '#334155' : '#e2e8f0') : (isDark ? '#1e293b' : '#ffffff'),
              color: page === 1 ? '#94a3b8' : (isDark ? '#ffffff' : '#000000'),
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              fontWeight: '600'
            }}
          >
            &laquo; Trước
          </button>

          {/* Nút Các Trang */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: page === p ? '#f59e0b' : (isDark ? '#334155' : '#e2e8f0'),
                color: page === p ? '#ffffff' : (isDark ? '#ffffff' : '#000000'),
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {p}
            </button>
          ))}

          {/* Nút Trang Sau */}
          <button
            disabled={page === totalPages}
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
              backgroundColor: page === totalPages ? (isDark ? '#334155' : '#e2e8f0') : (isDark ? '#1e293b' : '#ffffff'),
              color: page === totalPages ? '#94a3b8' : (isDark ? '#ffffff' : '#000000'),
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              fontWeight: '600'
            }}
          >
            Sau &raquo;
          </button>
        </div>
      )}

      {/* POPUP XEM CHI TIẾT */}
      {viewingNote && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            padding: '24px', borderRadius: '16px', maxWidth: '500px', width: '100%',
            color: isDark ? '#f8fafc' : '#0f172a',
            border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ marginTop: 0, fontSize: '20px' }}>{viewingNote.title}</h3>
            <p style={{ whiteSpace: 'pre-wrap', color: isDark ? '#cbd5e1' : '#475569', lineHeight: '1.6' }}>
              {viewingNote.content}
            </p>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '16px' }}>
              Thời gian: {formatDate(viewingNote.createdAt)}
            </div>
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                onClick={() => setViewingNote(null)}
                style={{
                  padding: '8px 20px', backgroundColor: '#f59e0b', color: '#fff',
                  border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer'
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