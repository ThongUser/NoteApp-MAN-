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
  const [selectedFilter, setSelectedFilter] = useState('Học tập');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewingNote, setViewingNote] = useState(null);
  const [deletingNote, setDeletingNote] = useState(null);
  const [movingNote, setMovingNote] = useState(null);

  // --- TÍNH NĂNG 5: STATE LƯU TRẠNG THÁI XÓA & TOAST MESSAGE ---
  const [deletedNote, setDeletedNote] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // --- STATE TOOLBAR & PHÂN TRANG (TỐI ĐA 6 BÀI / TRANG) ---
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('newest');
  const [page, setPage] = useState(1);
  const limit = 6; // Bắt buộc tối đa 6 bài / trang
  const [totalPages, setTotalPages] = useState(1);

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

  // --- TÍNH NĂNG 5: useEffect THEO DÕI TRẠNG THÁI XÓA VÀ HIỂN THỊ TOAST ---
  useEffect(() => {
    if (!deletedNote) return;

    // Hiển thị Toast Message góc màn hình
    setToastMessage('Đã xóa ghi chú thành công');

    // Tự động ẩn Toast Message sau 3 giây
    const timer = setTimeout(() => {
      setToastMessage('');
    }, 3000);

    return () => clearTimeout(timer);
  }, [deletedNote]);

  // FETCH DỮ LIỆU TỪ API & PHÂN TRANG CHUẨN 6 BÀI / TRANG
  const fetchNotes = async () => {
    setLoading(true);
    const fileSlug = CATEGORY_FILE_MAP[selectedFilter] || 'hoc-tap';

    try {
      const res = await fetch(`http://localhost:5000/api/notes/${fileSlug}`);
      if (res.ok) {
        const data = await res.json();
        let rawNotes = Array.isArray(data) ? data : (data?.data || []);

        // 1. Tìm kiếm theo từ khóa
        if (searchTerm.trim()) {
          const keyword = searchTerm.toLowerCase().trim();
          rawNotes = rawNotes.filter(
            (n) =>
              n.title?.toLowerCase().includes(keyword) ||
              n.content?.toLowerCase().includes(keyword)
          );
        }

        // 2. Sắp xếp theo thời gian
        rawNotes = [...rawNotes].sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateFilter === 'newest' ? dateB - dateA : dateA - dateB;
        });

        // 3. Tính tổng số trang (mỗi trang tối đa 6 bài)
        const total = Math.ceil(rawNotes.length / limit) || 1;
        setTotalPages(total);

        // Đảm bảo trang hiện tại hợp lệ
        const validPage = page > total ? total : page;
        if (validPage !== page) {
          setPage(validPage);
        }

        // 4. BẮT BUỘC CẮT ĐÚNG 6 BÀI CHO TRANG HẠN ĐỊNH
        const startIndex = (validPage - 1) * limit;
        const currentPageNotes = rawNotes.slice(startIndex, startIndex + limit);

        setNotes(currentPageNotes);
      } else {
        setNotes([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Lỗi khi tải ghi chú:', err);
      setNotes([]);
      setTotalPages(1);
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

  const handleClearSearch = () => {
    setSearchTerm('');
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

    const fileSlug = CATEGORY_FILE_MAP[selectedFilter] || 'hoc-tap';

    if (editingId) {
      try {
        await fetch(`http://localhost:5000/api/notes/${fileSlug}/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            content: content.trim(),
            category: selectedFilter,
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
        category: selectedFilter,
        createdAt: new Date().toISOString(),
      };

      try {
        await fetch(`http://localhost:5000/api/notes/${fileSlug}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newNote),
        });

        resetForm();
        setPage(1);
        fetchNotes();
        window.dispatchEvent(new Event('notesChanged'));
      } catch (err) {
        console.error('Lỗi khi tạo ghi chú:', err);
      }
    }
  };

  // --- TÍNH NĂNG 5: HÀM XÓA GHI CHÚ VÀ LƯU STATE DELETED NOTE ---
  const handleDeleteNote = async (noteId) => {
    const fileSlug = CATEGORY_FILE_MAP[selectedFilter] || 'hoc-tap';

    try {
      const res = await fetch(`http://localhost:5000/api/notes/${fileSlug}/${noteId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        // Lưu trạng thái ghi chú vừa bị xóa để kích hoạt useEffect
        setDeletedNote(deletingNote || { id: noteId });
        setDeletingNote(null);
        fetchNotes();
        window.dispatchEvent(new Event('notesChanged'));
      }
    } catch (err) {
      console.error('Lỗi khi xóa ghi chú:', err);
    }
  };

  const handleMoveToPrivate = async (note) => {
    const fileSlug = CATEGORY_FILE_MAP[selectedFilter] || 'hoc-tap';
    const noteId = note.id || note._id;

    try {
      const res = await fetch(`http://localhost:5000/api/notes/${fileSlug}/${noteId}/move-private`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Không thể chuyển ghi chú sang riêng tư.');
      }

      fetchNotes();
      window.dispatchEvent(new Event('notesChanged'));
      setMovingNote(null);
    } catch (err) {
      console.error('Lỗi chuyển ghi chú sang riêng tư:', err);
      alert(err.message);
    }
  };

  const handleStartEdit = (note) => {
    setEditingId(note.id || note._id);
    setTitle(note.title || '');
    setContent(note.content || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif', position: 'relative' }}>
      
      {/* --- TÍNH NĂNG 5: TOAST MESSAGE GÓC MÀN HÌNH --- */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: '#10b981',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
          fontSize: '14px',
          fontWeight: '600',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

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
                type="button"
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
        <div style={{ flex: 1, minWidth: '240px', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="🔍 Tìm kiếm ghi chú theo tiêu đề, nội dung..."
            value={searchTerm}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              padding: '10px 36px 10px 14px',
              borderRadius: '8px',
              border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
              backgroundColor: isDark ? '#0f172a' : '#f8fafc',
              color: isDark ? '#ffffff' : '#000000',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              style={{
                position: 'absolute',
                right: '10px',
                background: 'none',
                border: 'none',
                color: isDark ? '#cbd5e1' : '#64748b',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              ✕
            </button>
          )}
        </div>

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
        <input
          type="text"
          placeholder="Tiêu đề ghi chú..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
            backgroundColor: isDark ? '#0f172a' : '#f8fafc',
            color: isDark ? '#ffffff' : '#000000',
            fontSize: '15px',
            fontWeight: '600',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />

        <textarea
          placeholder="Nội dung ghi chú..."
          rows="3"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
            backgroundColor: isDark ? '#0f172a' : '#f8fafc',
            color: isDark ? '#ffffff' : '#000000',
            fontSize: '14px',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box'
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

      {/* 4. DANH SÁCH GHI CHÚ (TỐI ĐA 6 BÀI/TRANG) */}
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
          {searchTerm ? `Không tìm thấy ghi chú nào chứa từ khóa "${searchTerm}"` : 'Không có ghi chú nào.'}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '16px'
        }}>
          {notes.map((note) => (
            <div
              key={note.id || note._id || Math.random()}
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
                <div style={{
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                  gap: '8px'
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '17px',
                    fontWeight: '700',
                    color: isDark ? '#f8fafc' : '#1e293b',
                    overflowWrap: 'anywhere',
                    minWidth: 0
                  }}>
                    {note.title || 'Chưa có tiêu đề'}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, marginLeft: 'auto' }}>
                    <button
                      type="button"
                      onClick={() => setViewingNote(note)}
                      title="Xem chi tiết"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: isDark ? '#94a3b8' : '#475569' }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartEdit(note)}
                      title="Sửa"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: isDark ? '#94a3b8' : '#475569' }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMovingNote(note)}
                      title="Chuyển vào ghi chú riêng tư"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: isDark ? '#94a3b8' : '#475569' }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="10" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingNote(note)}
                      title="Xóa"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#ef4444' }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>

                <p style={{
                  margin: '0 0 16px 0',
                  fontSize: '14px',
                  color: isDark ? '#cbd5e1' : '#475569',
                  lineHeight: '1.5',
                  overflowWrap: 'anywhere',
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: 3,
                  overflow: 'hidden'
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
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          marginTop: '28px',
          marginBottom: '20px'
        }}>
          <button
            type="button"
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
              type="button"
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
            type="button"
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
            <h3 style={{ marginTop: 0, fontSize: '20px', overflowWrap: 'anywhere' }}>
              {viewingNote.title || 'Chưa có tiêu đề'}
            </h3>
            <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', color: isDark ? '#cbd5e1' : '#475569', lineHeight: '1.6' }}>
              {viewingNote.content}
            </p>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '16px' }}>
              Thời gian: {formatDate(viewingNote.createdAt)}
            </div>
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                type="button"
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

      {/* MODAL XÁC NHẬN XÓA */}
      {deletingNote && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1001, padding: '20px'
        }}>
          <div style={{
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            padding: '24px', borderRadius: '16px', maxWidth: '420px', width: '100%',
            color: isDark ? '#f8fafc' : '#0f172a',
            border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '20px' }}>Xác nhận xóa ghi chú</h3>
            <p style={{ margin: '0', color: isDark ? '#cbd5e1' : '#475569', lineHeight: '1.5', overflowWrap: 'anywhere' }}>
              Bạn có chắc chắn muốn xóa “{deletingNote.title || 'Chưa có tiêu đề'}”? Hành động này không thể hoàn tác.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button
                type="button"
                onClick={() => setDeletingNote(null)}
                style={{
                  padding: '9px 18px',
                  backgroundColor: isDark ? '#334155' : '#e2e8f0',
                  color: isDark ? '#f8fafc' : '#475569',
                  border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleDeleteNote(deletingNote.id || deletingNote._id)}
                style={{
                  padding: '9px 18px', backgroundColor: '#dc2626', color: '#ffffff',
                  border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer'
                }}
              >
                Xóa ghi chú
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN CHUYỂN SANG RIÊNG TƯ */}
      {movingNote && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1002, padding: '20px'
        }}>
          <div style={{
            backgroundColor: isDark ? '#1e293b' : '#ffffff',
            padding: '24px', borderRadius: '16px', maxWidth: '420px', width: '100%',
            color: isDark ? '#f8fafc' : '#0f172a',
            border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '20px' }}>Xác nhận chuyển ghi chú</h3>
            <p style={{ margin: 0, color: isDark ? '#cbd5e1' : '#475569', lineHeight: '1.5' }}>
              Ghi chú này sẽ bị xóa khỏi danh sách ghi chú hiện tại. Bạn có chắc chắn muốn chuyển ghi chú này thành ghi chú riêng tư không ? 
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button
                type="button"
                onClick={() => setMovingNote(null)}
                style={{
                  padding: '9px 18px',
                  backgroundColor: isDark ? '#334155' : '#e2e8f0',
                  color: isDark ? '#f8fafc' : '#475569',
                  border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleMoveToPrivate(movingNote)}
                style={{
                  padding: '9px 18px', backgroundColor: '#0284c7', color: '#ffffff',
                  border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer'
                }}
              >
                Chuyển ghi chú
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}