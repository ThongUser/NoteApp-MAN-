import React, { useState, useEffect } from "react";
function Notes() {
  const [topic, setTopic] = useState("hoc-tap");
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState({
    id: null,
    title: "",
    content: "",
  });
  const fetchNotes = () => {
    fetch(`http://localhost:5000/api/notes/${topic}`)
      .then((res) => res.json())
      .then((data) => setNotes(data));
  };
  useEffect(() => {
    fetchNotes();
  }, [topic]);
  const handleSave = () => {
    const method = formData.id ? "PUT" : "POST";
    const url = formData.id
      ? `http://localhost:5000/api/notes/${topic}/${formData.id}`
      : `http://localhost:5000/api/notes/${topic}`;

    fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formData.title,
        content: formData.content,
      }),
    })
      .then((res) => res.json())
      .then(() => {
        fetchNotes();
        setFormData({ id: null, title: "", content: "" });
      });
  };
  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc muốn xóa ghi chú này?")) {
      fetch(`http://localhost:5000/api/notes/${topic}/${id}`, {
        method: "DELETE",
      }).then(() => fetchNotes());
    }
  };
  const handleEdit = (note) =>
    setFormData({ id: note.id, title: note.title, content: note.content });
  return (
    <div style={{ padding: "20px" }}>
      <h2>Ghi chú Công khai</h2>
      <div style={{ marginBottom: "20px" }}>
        <strong>Chủ đề: </strong>
        <select value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option value="hoc-tap">Học tập</option>
          <option value="cong-viec">Công việc</option>
          <option value="ca-nhan">Cá nhân</option>
        </select>
      </div>
      <div
        style={{
          border: "1px solid #ccc",
          padding: "10px",
          marginBottom: "20px",
        }}
      >
        <h3>{formData.id ? "Sửa ghi chú" : "Thêm ghi chú mới"}</h3>
        <input
          placeholder="Tiêu đề"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          style={{ display: "block", width: "100%", marginBottom: "10px" }}
        />

        <textarea
          placeholder="Nội dung"
          value={formData.content}
          onChange={(e) =>
            setFormData({ ...formData, content: e.target.value })
          }
          style={{
            display: "block",
            width: "100%",
            height: "80px",
            marginBottom: "10px",
          }}
        />
        <button onClick={handleSave}>
          {formData.id ? "Cập nhật" : "Thêm mới"}
        </button>
        {formData.id && (
          <button
            onClick={() => setFormData({ id: null, title: "", content: "" })}
            style={{ marginLeft: "10px" }}
          >
            Hủy
          </button>
        )}
      </div>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}
      >
        {notes.length === 0 && <p>Chưa có ghi chú nào.</p>}
        {notes.map((note) => (
          <div
            key={note.id}
            style={{
              border: "1px solid #007bff",
              padding: "15px",
              borderRadius: "5px",
            }}
          >
            <h4 style={{ margin: "0 0 10px 0" }}>{note.title}</h4>
            <p style={{ whiteSpace: "pre-wrap" }}>{note.content}</p>
            <div style={{ marginTop: "10px" }}>
              <button
                onClick={() => handleEdit(note)}
                style={{ marginRight: "10px" }}
              >
                Sửa
              </button>
              <button
                onClick={() => handleDelete(note.id)}
                style={{ color: "red" }}
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default Notes;
