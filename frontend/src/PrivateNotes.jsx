import { useState, useEffect, useRef } from 'react';

function PrivateNotes({ theme }) {
  const [notes, setNotes] = useState([]);

  // Quản lý trạng thái khóa mật khẩu
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authenticatedPassword, setAuthenticatedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Quản lý Form thêm/sửa & Tìm kiếm
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Học tập');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('newest');
  const [editingId, setEditingId] = useState(null);
  const [viewingNote, setViewingNote] = useState(null);
  const [deletingNote, setDeletingNote] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimer = useRef(null);

  // --- STATE PHÂN TRANG ---
  const [page, setPage] = useState(1);
  const limit = 6; // Tối đa 6 ghi chú / trang

  const categories = ['Học tập', 'Công việc', 'Cá nhân'];
  const isDark = theme === 'dark';

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds} ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  // Tải ghi chú riêng tư từ backend sau khi xác thực
  useEffect(() => {
    if (!isAuthenticated) return;

    // Tạo query parameters từ các state
    const queryParams = new URLSearchParams({
      category: selectedFilter,
      search: searchTerm.trim(),
      page: page.toString(),
      limit: limit.toString(),
    }).toString();

    // Ghép vào URL fetch
    const url = `http://localhost:5000/api/private/notes?${queryParams}`;

    fetch(url, { headers: { 'x-private-password': authenticatedPassword } })
      .then((response) => {
        if (!response.ok) throw new Error('Không thể tải ghi chú riêng tư');
        return response.json();
      })
      .then((data) => {
        const noteList = Array.isArray(data) ? data : (data?.data || []);
        setNotes(noteList);
      })
      .catch((error) => setErrorMsg(error.message));
  }, [isAuthenticated, authenticatedPassword, selectedFilter, searchTerm, page, limit]);

  // Xử lý kiểm tra mật khẩu
  const handleUnlock = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/private/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });

      if (!response.ok) throw new Error('Mật khẩu không đúng! Vui lòng thử lại.');
      setIsAuthenticated(true);
      setAuthenticatedPassword(passwordInput);
      setErrorMsg('');
      setPasswordInput('');
    } catch (error) {
      setErrorMsg(error.message || 'Không thể xác thực.');
    }
  };

  // Xử lý Lưu (Thêm mới hoặc Cập nhật)
  const handleSave = async () => {
    if (!title.trim()) {
      alert("Vui lòng nhập tiêu đề!");
      return;
    }

    try {
      const endpoint = editingId
        ? `http://localhost:5000/api/private/notes/${editingId}`
        : 'http://localhost:5000/api/private/notes';
      const response = await fetch(endpoint, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-private-password': authenticatedPassword
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category: selectedFilter
        })
      });

      if (!response.ok) throw new Error('Không thể lưu ghi chú riêng tư.');

      const result = await response.json();
      setNotes((currentNotes) => editingId
        ? currentNotes.map((note) => note.id === editingId ? result.note : note)
        : [...currentNotes, result.note]);
      handleCancelEdit();
      window.dispatchEvent(new Event('notesChanged'));
    } catch (error) {
      setErrorMsg(error.message);
    }
  };

  // Xử lý XÓA vĩnh viễn
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/private/notes/${id}`, {
        method: 'DELETE',
        headers: { 'x-private-password': authenticatedPassword }
      });
      if (!response.ok) throw new Error('Không thể xóa ghi chú riêng tư.');
      setNotes((currentNotes) => currentNotes.filter((note) => note.id !== id));
      setToastMessage('Đã xóa ghi chú riêng tư thành công');
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => {
        setToastMessage('');
        toastTimer.current = null;
      }, 3000);
      setDeletingNote(null);
      window.dispatchEvent(new Event('notesChanged'));
    } catch (error) {
      setErrorMsg(error.message);
    }
  };

  // Bấm Sửa
  const handleEditClick = (note) => {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content || '');
    setSelectedFilter(note.category || 'Học tập');
  };

  // Hủy Sửa
  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
  };

  // LỌC GHI CHÚ BẰNG DANH MỤC VÀ TỪ KHÓA TÌM KIẾM (Dự phòng phía Client)
  const visibleNotes = notes.filter((note) => {
    const matchesCategory = (note.category || 'Học tập') === selectedFilter;
    const keyword = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !keyword ||
      note.title?.toLowerCase().includes(keyword) ||
      note.content?.toLowerCase().includes(keyword);

    return matchesCategory && matchesSearch;
  });

  const sortedNotes = [...visibleNotes].sort((noteA, noteB) => {
    const dateA = new Date(noteA.createdAt || 0);
    const dateB = new Date(noteB.createdAt || 0);
    return dateFilter === 'newest' ? dateB - dateA : dateA - dateB;
  });

  // TÍNH TOÁN PHÂN TRANG CHO PRIVATE NOTES
  const totalPages = Math.ceil(sortedNotes.length / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedNotes = sortedNotes.slice(startIndex, startIndex + limit);

  // --- 🔒 MÀN HÌNH MẬT KHẨU ---
  if (!isAuthenticated) {
    return (
      <div className="private-lock-panel" style={{
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        color: isDark ? '#f8fafc' : '#0f172a',
        padding: '40px 20px',
        borderRadius: '16px',
        border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
        maxWidth: '400px',
        margin: '20px auto',
        textAlign: 'center'
      }}>
        <h3 style={{ color: isDark ? '#f8fafc' : '#0f172a', marginBottom: '8px', fontSize: '20px' }}>
          🔒 Khu vực Bảo mật
        </h3>
        <p style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '14px', marginBottom: '20px' }}>
          Vui lòng nhập mật khẩu để xem ghi chú riêng tư.
        </p>

        <form onSubmit={handleUnlock}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            borderRadius: '8px',
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
                flex: 1,
                minWidth: 0,
                backgroundColor: 'transparent',
                color: isDark ? '#ffffff' : '#0f172a'
              }}
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              style={{
                border: 'none',
                backgroundColor: isDark ? '#334155' : '#f1f5f9',
                padding: '8px 12px',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#f8fafc' : '#000'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
                {!showPassword && <line x1="1" y1="1" x2="23" y2="23" stroke={isDark ? '#f8fafc' : '#000'} strokeWidth="2" />}
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
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '10px',
              borderRadius: '8px',
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

  // --- 🔓 MÀN HÌNH GHI CHÚ RIÊNG TƯ ---
  return (
    <div className="page-container" style={{ maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="responsive-toast"
          style={{
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
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="private-notes-toolbar" style={{
        backgroundColor: isDark ? '#1e293b' : '#FAF9F6',
        padding: '20px',
        borderRadius: '16px',
        border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
        marginBottom: '16px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, color: isDark ? '#f8fafc' : '#0f172a', fontSize: '22px', fontWeight: '700' }}>
            🔒 Ghi chú riêng tư
          </h2>
        <button 
          onClick={() => {
            setIsAuthenticated(false);
            setAuthenticatedPassword('');
            setNotes([]);
            handleCancelEdit();
          }}
          style={{
            backgroundColor: isDark ? '#334155' : '#ffffff',
            border: isDark ? '1px solid #475569' : '1px solid #e2e8f0',
            padding: '8px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            color: isDark ? '#cbd5e1' : '#475569'
          }}
        >
          🔒 Khóa lại
        </button>
        </div>
        <h3 style={{ margin: '0 0 12px 0', color: isDark ? '#f8fafc' : '#0f172a', fontSize: '16px' }}>
          Danh sách ghi chú
        </h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {categories.map((categoryName) => {
            const isActive = selectedFilter === categoryName;
            return (
              <button
                key={categoryName}
                type="button"
                onClick={() => {
                  setSelectedFilter(categoryName);
                  setPage(1);
                  handleCancelEdit();
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
                {categoryName}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. KHUNG TÌM KIẾM RIÊNG TƯ */}
      <div className="notes-form" style={{
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
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
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
              onClick={() => {
                setSearchTerm('');
                setPage(1);
              }}
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
          onChange={(event) => {
            setDateFilter(event.target.value);
            setPage(1);
          }}
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

      {/* 3. FORM NHẬP GHI CHÚ */}
      <div style={{
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <h3 style={{ margin: 0, color: isDark ? '#f8fafc' : '#1e293b', fontSize: '16px', fontWeight: '700' }}>
          {editingId ? 'Cập nhật ghi chú' : 'Thêm ghi chú mới'}
        </h3>
        <input 
          type="text"
          placeholder="Tiêu đề ghi chú..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
            backgroundColor: isDark ? '#0f172a' : '#f8fafc',
            color: isDark ? '#ffffff' : '#000000',
            borderRadius: '8px',
            outline: 'none',
            fontSize: '15px',
            fontWeight: '600',
            boxSizing: 'border-box'
          }}
        />

        <textarea 
          placeholder="Nội dung ghi chú..."
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
            backgroundColor: isDark ? '#0f172a' : '#f8fafc',
            color: isDark ? '#ffffff' : '#000000',
            borderRadius: '8px',
            outline: 'none',
            fontSize: '14px',
            boxSizing: 'border-box',
            resize: 'vertical',
            overflowWrap: 'anywhere'
          }}
        />

        <div className="note-form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button 
            onClick={handleSave}
            style={{
              backgroundColor: editingId ? '#f59e0b' : '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '8px 20px',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {editingId ? 'Cập nhật' : 'Tạo mới'}
          </button>

          {editingId && (
            <button 
              onClick={handleCancelEdit}
              style={{
                backgroundColor: '#64748b',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
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

      {/* 4. DANH SÁCH THẺ GHI CHÚ */}
      {paginatedNotes.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: isDark ? '#94a3b8' : '#64748b',
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderRadius: '12px',
          border: isDark ? '1px solid #334155' : '1px solid #e2e8f0'
        }}>
          {searchTerm
            ? `Không tìm thấy ghi chú nào chứa từ khóa "${searchTerm}"`
            : `Chưa có ghi chú nào trong danh mục "${selectedFilter}".`}
        </div>
      ) : (
        <div className="note-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '16px'
        }}>
          {paginatedNotes.map((note) => (
            <div key={note.id || note._id} style={{
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minWidth: 0
            }}>
              <div>
                <div style={{
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '12px'
                }}>
                  <h3 style={{
                    margin: 0,
                    color: isDark ? '#f8fafc' : '#1e293b',
                    fontSize: '17px',
                    fontWeight: '700',
                    minWidth: 0,
                    overflowWrap: 'anywhere'
                  }}>
                    {note.title || 'Chưa có tiêu đề'}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
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
                      onClick={() => handleEditClick(note)}
                      title="Sửa ghi chú"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: isDark ? '#94a3b8' : '#475569' }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingNote(note)}
                      title="Xóa ghi chú"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#ef4444' }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p style={{ margin: '0 0 16px 0', color: isDark ? '#cbd5e1' : '#475569', fontSize: '14px', lineHeight: '1.5', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3, overflow: 'hidden', overflowWrap: 'anywhere' }}>
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
        <div className="note-pagination" style={{
          display: 'flex',
          justifyContent: 'center',
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
        <div className="responsive-overlay" style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div className="responsive-dialog" style={{
            backgroundColor: isDark ? '#1e293b' : '#ffffff', padding: '24px', borderRadius: '16px', maxWidth: '500px', width: '100%',
            maxHeight: '90vh', overflowY: 'auto', color: isDark ? '#f8fafc' : '#0f172a', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ marginTop: 0, fontSize: '20px', overflowWrap: 'anywhere' }}>
              {viewingNote.title || 'Chưa có tiêu đề'}
            </h3>
            <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', color: isDark ? '#cbd5e1' : '#475569', lineHeight: '1.6' }}>
              {viewingNote.content}
            </p>
            <div style={{ fontSize: '13px', color: isDark ? '#94a3b8' : '#94a3b8', marginTop: '16px' }}>
              Thời gian: {formatDate(viewingNote.createdAt)}
            </div>
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setViewingNote(null)}
                style={{
                  padding: '8px 20px', backgroundColor: '#f59e0b', color: '#ffffff',
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
        <div className="responsive-overlay" style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: '20px'
        }}>
          <div className="responsive-dialog" style={{
            backgroundColor: isDark ? '#1e293b' : '#ffffff', padding: '24px', borderRadius: '16px', maxWidth: '420px', width: '100%',
            color: isDark ? '#f8fafc' : '#0f172a', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
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
                  padding: '9px 18px', backgroundColor: isDark ? '#334155' : '#e2e8f0', color: isDark ? '#cbd5e1' : '#475569',
                  border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingNote.id || deletingNote._id)}
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

    </div>
  );
}

export default PrivateNotes;