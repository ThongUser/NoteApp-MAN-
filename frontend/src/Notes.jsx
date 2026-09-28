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

  // --- STATE TOOLBAR & PHÂN TRANG ---
  const [searchTerm, setSearchTerm] = useState('');      // Từ khóa tìm kiếm
  const [dateFilter, setDateFilter] = useState('newest'); // Sắp xếp theo ngày
  const [page, setPage] = useState(1);                     // Trang hiện tại
  const [limit] = useState(8);                             // Tối đa 8 ghi chú / trang
  const [totalPages, setTotalPages] = useState(1);         // Tổng số trang

  const isDark = theme === 'dark';
  const categories = ['Học tập', 'Công việc', 'Cá nhân'];

  // Định dạng ngày tháng
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

  // HÀM FETCH DỮ LIỆU TỪ API
  const fetchNotes = async () => {
    setLoading(true);
    const fileSlug = CATEGORY_FILE_MAP[selectedFilter] || 'hoc-tap';

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

        // 👉 XỬ LÝ THEO YÊU CẦU CỦA BẠN: Lấy mảng dữ liệu từ data hoặc data.data
        const noteList = Array.isArray(data) ? data : data?.data;
        const rawNotes = Array.isArray(noteList) ? noteList : [];

        // 1. Lọc theo từ khóa tìm kiếm
        let filtered = rawNotes;
        if (searchTerm.trim()) {
          filtered = filtered.filter(
            (n) =>
              n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              n.content?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        // 2. Sắp xếp theo ngày
        filtered = [...filtered].sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateFilter === 'newest' ? dateB - dateA : dateA - dateB;
        });

        // 3. Phân trang: Tối đa 8 ghi chú / trang
        const total = Math.ceil(filtered.length / limit) || 1;
        setTotalPages(total);

        const startIndex = (page - 1) * limit;
        const paginatedNotes = filtered.slice(startIndex, startIndex + limit);

        // Lưu danh sách ghi chú của trang hiện tại
        setNotes(paginatedNotes);

      } else {
        setNotes([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Lỗi khi tải ghi chú:', err);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [selectedFilter, searchTerm, dateFilter, page]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleDateFilterChange = (e) => {
    setDateFilter(e.target.value);
    setPage(1);
  };

  // Thêm / Sửa ghi chú
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

  // Xóa ghi chú
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
    <div style={{ maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
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
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. TOOLBAR TÌM KIẾM & LỌC NGÀY */}
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
        <input
          type="text"
          placeholder="🔍 Tìm kiếm ghi chú theo tiêu đề, nội dung..."
          value={searchTerm}
          onChange={handleSearchChange}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '10px 14px',
            borderRadius: '8px',
            border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
            backgroundColor: isDark ? '#0f172a' : '#f8fafc',
            color: isDark ? '#ffffff' : '#000000',
            fontSize: '14px',
            outline: 'none'
          }}
        />

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

      {/* 3. FORM TẠO / SỬA GHI CHÚ */}
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

      {/* 4. DANH SÁCH GHI CHÚ (TỐI ĐA 8 CARDS/TRANG) */}
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
          Không có ghi chú nào.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
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
                    fontSize: '17px',
                    fontWeight: '700',
                    color: isDark ? '#f8fafc' : '#1e293b',
                    paddingRight: '8px'
                  }}>
                    {note.title || 'Chưa có tiêu đề'}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button
                      onClick={() => setViewingNote(note)}
                      title="Xem chi tiết"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#94a3b8' : '#475569' }}
                    >
                      👁️
                    </button>

                    <button
                      onClick={() => handleStartEdit(note)}
                      title="Sửa"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#94a3b8' : '#475569' }}
                    >
                      ✏️
                    </button>

                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      title="Xóa"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <p style={{
                  margin: '0 0 16px 0',
                  fontSize: '14px',
                  color: isDark ? '#cbd5e1' : '#475569',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap'
                }}>
                  {note.content}
                </p>
              </div>

              <div style={{ fontSize: '12px', color: isDark ? '#64748b' : '#94a3b8', fontWeight: '500' }}>
                {formatDate(note.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. NÚT CHUYỂN TRANG */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justify: 'center',
          alignItems: 'center',
          gap: '8px',
          marginTop: '28px',
          marginBottom: '20px'
        }}>
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

      {/* MODAL XEM CHI TIẾT */}
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