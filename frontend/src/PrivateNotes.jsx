import { useState, useEffect } from 'react';

function PrivateNotes() {
  const [notes, setNotes] = useState([]);

  // Quản lý trạng thái khóa mật khẩu
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Quản lý Form thêm/sửa & Tìm kiếm
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Học tập');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [viewingNote, setViewingNote] = useState(null);
  const [deletingNote, setDeletingNote] = useState(null);

  // --- STATE PHÂN TRANG ---
  const [page, setPage] = useState(1);
  const limit = 6; // Tối đa 6 ghi chú / trang

  const categories = ['Học tập', 'Công việc', 'Cá nhân'];

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

    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error('Không thể tải ghi chú riêng tư');
        return response.json();
      })
      .then((data) => {
        const noteList = Array.isArray(data) ? data : (data?.data || []);
        setNotes(noteList);
      })
      .catch((error) => setErrorMsg(error.message));
  }, [isAuthenticated, selectedFilter, searchTerm, page, limit]);

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
        headers: { 'Content-Type': 'application/json' },
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
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Không thể xóa ghi chú riêng tư.');
      setNotes((currentNotes) => currentNotes.filter((note) => note.id !== id));
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

  // TÍNH TOÁN PHÂN TRANG CHO PRIVATE NOTES
  const totalPages = Math.ceil(visibleNotes.length / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedNotes = visibleNotes.slice(startIndex, startIndex + limit);

  // --- 🔒 MÀN HÌNH MẬT KHẨU ---
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

  // --- 🔓 MÀN HÌNH GHI CHÚ RIÊNG TƯ ---
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

      {/* 1. DANH MỤC LỌC GHI CHÚ */}
      <div style={{
        backgroundColor: '#faf9f6',
        padding: '20px',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        marginBottom: '16px'
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#0f172a', fontSize: '20px' }}>
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
                  border: isActive ? 'none' : '1px solid #e2e8f0',
                  backgroundColor: isActive ? '#f59e0b' : '#ffffff',
                  color: isActive ? '#ffffff' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 2px 6px rgba(245, 158, 11, 0.3)' : 'none'
                }}
              >
                {categoryName}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. KHUNG TÌM KIẾM RIÊNG TƯ */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '12px 16px',
        borderRadius: '10px',
        border: '1px solid #cbd5e1',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        position: 'relative'
      }}>
        <input
          type="text"
          placeholder="🔍 Tìm kiếm ghi chú bí mật theo tiêu đề, nội dung..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          style={{
            width: '100%',
            padding: '8px 30px 8px 10px',
            border: 'none',
            outline: 'none',
            fontSize: '14px',
            color: '#0f172a',
            backgroundColor: 'transparent'
          }}
        />
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('');
              setPage(1);
            }}
            style={{
              position: 'absolute',
              right: '16px',
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* 3. FORM NHẬP GHI CHÚ */}
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
            resize: 'vertical',
            overflowY: 'auto',
            overflowWrap: 'anywhere'
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

      {/* 4. DANH SÁCH THẺ GHI CHÚ */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
        gap: '16px' 
      }}>
        {paginatedNotes.length === 0 ? (
          <div style={{ color: '#94a3b8', fontStyle: 'italic', padding: '10px 0' }}>
            {searchTerm
              ? `Không tìm thấy ghi chú bí mật nào phù hợp với từ khóa "${searchTerm}".`
              : `Chưa có ghi chú bí mật nào trong danh mục "${selectedFilter}".`}
          </div>
        ) : (
          paginatedNotes.map((note) => (
            <div key={note.id || note._id} style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '16px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between',
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
                    color: '#0f172a',
                    fontSize: '16px',
                    fontWeight: '600',
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
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#475569' }}
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
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#475569' }}
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
                <p style={{ margin: '0 0 16px 0', color: '#334155', fontSize: '14px', lineHeight: '1.5', minHeight: '20px', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3, overflow: 'hidden', overflowWrap: 'anywhere' }}>
                  {note.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

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
              border: '1px solid #cbd5e1',
              backgroundColor: page === 1 ? '#e2e8f0' : '#ffffff',
              color: page === 1 ? '#94a3b8' : '#000000',
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
                backgroundColor: page === p ? '#6d28d9' : '#e2e8f0',
                color: page === p ? '#ffffff' : '#000000',
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
              border: '1px solid #cbd5e1',
              backgroundColor: page === totalPages ? '#e2e8f0' : '#ffffff',
              color: page === totalPages ? '#94a3b8' : '#000000',
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
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', maxWidth: '500px', width: '100%',
            maxHeight: '90vh', overflowY: 'auto', color: '#0f172a', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ marginTop: 0, fontSize: '20px', overflowWrap: 'anywhere' }}>
              {viewingNote.title || 'Chưa có tiêu đề'}
            </h3>
            <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', color: '#475569', lineHeight: '1.6' }}>
              {viewingNote.content}
            </p>
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
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', maxWidth: '420px', width: '100%',
            color: '#0f172a', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '20px' }}>Xác nhận xóa ghi chú</h3>
            <p style={{ margin: '0', color: '#475569', lineHeight: '1.5', overflowWrap: 'anywhere' }}>
              Bạn có chắc chắn muốn xóa “{deletingNote.title || 'Chưa có tiêu đề'}”? Hành động này không thể hoàn tác.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
              <button
                type="button"
                onClick={() => setDeletingNote(null)}
                style={{
                  padding: '9px 18px', backgroundColor: '#e2e8f0', color: '#475569',
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