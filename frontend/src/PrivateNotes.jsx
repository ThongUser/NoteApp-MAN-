import React, { useState } from 'react';

function PrivateNotes() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState({ id: null, title: '', content: '' });

  const handleLogin = () => {
    fetch('http://localhost:5000/api/private/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: passwordInput })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setIsUnlocked(true);
          fetchPrivateNotes();
        } else {
          alert("Sai mật khẩu, vui lòng thử lại!");
          setPasswordInput('');
        }
      });
  };

  const fetchPrivateNotes = () => {
    fetch('http://localhost:5000/api/private/notes')
      .then(res => res.json())
      .then(data => setNotes(data));
  };

  const handleSave = () => {
    const method = formData.id ? 'PUT' : 'POST';
    const url = formData.id
      ? `http://localhost:5000/api/private/notes/${formData.id}`
      : 'http://localhost:5000/api/private/notes';

    fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: formData.title, content: formData.content })
    }).then(() => {
      fetchPrivateNotes();
      setFormData({ id: null, title: '', content: '' });
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc muốn xóa ghi chú này?')) {
      fetch(`http://localhost:5000/api/private/notes/${id}`, { method: 'DELETE' })
        .then(() => fetchPrivateNotes());
    }
  };

  const handleEdit = (note) => setFormData({ id: note.id, title: note.title, content: note.content });

  if (!isUnlocked) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <h2>Khu vực Bảo mật</h2>
        <p>Vui lòng nhập mật khẩu để truy cập</p>
        <input
          type="password"
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
          placeholder="Nhập mật khẩu..."
        />
        <button onClick={handleLogin} style={{ marginLeft: '10px' }}>Mở khóa</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#ffebee' }}>
      <h2 style={{ color: 'red' }}>Khu vực Ghi chú Riêng tư</h2>
      <div style={{ border: '1px solid red', padding: '10px', marginBottom: '20px' }}>
        <input
          placeholder="Tiêu đề bí mật"
          value={formData.title}
          onChange={e => setFormData({ ...formData, title: e.target.value })}
          style={{ display: 'block', width: '100%', marginBottom: '10px' }}
        />
        <textarea
          placeholder="Nội dung bí mật"
          value={formData.content}
          onChange={e => setFormData({ ...formData, content: e.target.value })}
          style={{ display: 'block', width: '100%', height: '80px', marginBottom: '10px' }}
        />
        <button onClick={handleSave} style={{ backgroundColor: 'red', color: 'white' }}>
          {formData.id ? 'Cập nhật' : 'Lưu bí mật'}
        </button>
        {formData.id && (
          <button onClick={() => setFormData({ id: null, title: '', content: '' })} style={{ marginLeft: '10px' }}>
            Hủy
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        {notes.map(note => (
          <div key={note.id} style={{ border: '1px solid red', padding: '15px' }}>
            <h4>{note.title}</h4>
            <p>{note.content}</p>
            <div style={{ marginTop: '10px' }}>
              <button onClick={() => handleEdit(note)} style={{ marginRight: '10px' }}>Sửa</button>
              <button onClick={() => handleDelete(note.id)} style={{ color: 'red' }}>Xóa</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PrivateNotes;