import React, { useState, useEffect } from 'react';

function PrivateNotes() {

    const [isUnlocked, setIsUnlocked] = useState(false);

    const [password, setPassword] = useState('');

    const [notes, setNotes] = useState([]);

    const [formData, setFormData] = useState({
        id: null,
        title: '',
        content: ''
    });


    const handleUnlock = () => {

        fetch('http://localhost:5000/api/private/auth', {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                password: password
            })
        })
            .then(res => res.json())
            .then(data => {

                if (data.success) {

                    setIsUnlocked(true);
                    setPassword('');

                    fetchNotes();

                } else {

                    alert('Sai mật khẩu!');

                    setPassword('');
                }
            })
            .catch(error => {
                console.error(error);
                alert('Lỗi kết nối Backend');
            });
    };


    const fetchNotes = () => {

        fetch('http://localhost:5000/api/private/notes')
            .then(res => res.json())
            .then(data => setNotes(data))
            .catch(error => console.error(error));
    };


    const handleSave = () => {

        const method = formData.id ? 'PUT' : 'POST';

        const url = formData.id
            ? `http://localhost:5000/api/private/notes/${formData.id}`
            : 'http://localhost:5000/api/private/notes';

        fetch(url, {

            method: method,

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                title: formData.title,
                content: formData.content
            })

        })
            .then(res => res.json())
            .then(() => {

                fetchNotes();

                setFormData({
                    id: null,
                    title: '',
                    content: ''
                });

            });
    };


    const handleDelete = (id) => {

        if (window.confirm('Bạn có chắc muốn xóa?')) {

            fetch(
                `http://localhost:5000/api/private/notes/${id}`,
                {
                    method: 'DELETE'
                }
            )
                .then(() => fetchNotes());
        }
    };


    const handleEdit = (note) => {

        setFormData({
            id: note.id,
            title: note.title,
            content: note.content
        });
    };


    if (!isUnlocked) {

        return (
            <div
                style={{
                    maxWidth: '400px',
                    margin: '100px auto',
                    textAlign: 'center'
                }}
            >

                <h2>🔒 Vùng kín</h2>

                <p>
                    Nhập mật khẩu để mở khóa
                </p>

                <input
                    type="password"
                    value={password}
                    onChange={e =>
                        setPassword(e.target.value)
                    }
                    placeholder="Mật khẩu"
                />

                <button
                    onClick={handleUnlock}
                    style={{ marginLeft: '10px' }}
                >
                    Mở khóa
                </button>

            </div>
        );
    }

    // =========================
    // MÀN HÌNH ĐÃ MỞ KHÓA
    // =========================

    return (
        <div>

            <h2>🔓 Ghi chú riêng tư</h2>

            {/* Form */}
            <div
                style={{
                    border: '1px solid #ccc',
                    padding: '15px',
                    marginBottom: '20px'
                }}
            >

                <h3>
                    {formData.id
                        ? 'Sửa ghi chú'
                        : 'Thêm ghi chú riêng tư'}
                </h3>

                <input
                    placeholder="Tiêu đề"
                    value={formData.title}
                    onChange={e =>
                        setFormData({
                            ...formData,
                            title: e.target.value
                        })
                    }
                    style={{
                        display: 'block',
                        width: '100%',
                        marginBottom: '10px'
                    }}
                />

                <textarea
                    placeholder="Nội dung"
                    value={formData.content}
                    onChange={e =>
                        setFormData({
                            ...formData,
                            content: e.target.value
                        })
                    }
                    style={{
                        display: 'block',
                        width: '100%',
                        height: '80px',
                        marginBottom: '10px'
                    }}
                />

                <button onClick={handleSave}>
                    {formData.id
                        ? 'Cập nhật'
                        : 'Thêm mới'}
                </button>

                {formData.id && (
                    <button
                        onClick={() =>
                            setFormData({
                                id: null,
                                title: '',
                                content: ''
                            })
                        }
                        style={{ marginLeft: '10px' }}
                    >
                        Hủy
                    </button>
                )}

            </div>

            {/* Danh sách */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '15px'
                }}
            >

                {notes.length === 0 && (
                    <p>Chưa có ghi chú riêng tư.</p>
                )}

                {notes.map(note => (

                    <div
                        key={note.id}
                        style={{
                            border: '1px solid #dc3545',
                            padding: '15px',
                            borderRadius: '5px'
                        }}
                    >

                        <h4>{note.title}</h4>

                        <p style={{ whiteSpace: 'pre-wrap' }}>
                            {note.content}
                        </p>

                        <button
                            onClick={() => handleEdit(note)}
                            style={{ marginRight: '10px' }}
                        >
                            Sửa
                        </button>

                        <button
                            onClick={() => handleDelete(note.id)}
                            style={{ color: 'red' }}
                        >
                            Xóa
                        </button>

                    </div>

                ))}

            </div>

        </div>
    );
}

export default PrivateNotes;