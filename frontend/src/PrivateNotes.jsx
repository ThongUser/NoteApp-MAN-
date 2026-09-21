import React, { useState, useEffect } from 'react';
function PrivateNotes() {

    const [isUnlocked, setIsUnlocked] = useState(false); // Cờ khóa màn hình
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
        fetch('http://localhost:5000/api/private/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: formData.title, content: formData.content })
        }).then(() => {
            fetchPrivateNotes();
            setFormData({ id: null, title: '', content: '' });
        });
    };

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
    // 3.2. Nếu đã mở khóa -> Render giao diện Note tương tự Sprint 2
    return (
        <div style={{ padding: '20px', backgroundColor: '#ffebee' }}>
            <h2 style={{ color: 'red' }}>Khu vực Ghi chú Riêng tư </h2>

            {/* Form nhập liệu */}
            <div style={{
                border: '1px solid red', padding: '10px', marginBottom: '20px'
            }}>
                <input
                    placeholder="Tiêu đề bí mật" value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    style={{ display: 'block', width: '100%', marginBottom: '10px' }}
                />
                <textarea
                    placeholder="Nội dung bí mật" value={formData.content}
                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                    style={{
                        display: 'block', width: '100%', height: '80px', marginBottom:
                            '10px'
                    }}
                />
                <button onClick={handleSave} style={{
                    backgroundColor: 'red', color: 'white'
                }}>Lưu bí mật</button>
            </div>
            {/* Danh sách */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                {notes.map(note => (
                    <div key={note.id} style={{ border: '1px solid red', padding: '15px' }}>
                        <h4>{note.title}</h4>
                        <p>{note.content}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
export default PrivateNotes;