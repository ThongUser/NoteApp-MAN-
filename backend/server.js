const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors()); // Cho phép FE gọi API
app.use(express.json()); // Đọc dữ liệu JSON từ FE gửi lên

const profilePath = path.join(__dirname, 'data', 'profile.json');

// Hàm bổ trợ: Đọc file JSON an toàn (chống crash khi file rỗng/lỗi cú pháp)
const safeReadJSON = (filePath, defaultData = []) => {
  try {
    if (!fs.existsSync(filePath)) return defaultData;
    const content = fs.readFileSync(filePath, 'utf8').trim();
    if (!content) return defaultData;
    return JSON.parse(content);
  } catch (error) {
    return defaultData;
  }
};

// ==========================================
// 1. MODULE: PROFILE & CÀI ĐẶT (Sprint 1)
// ==========================================

// API 1: Đọc thông tin Profile
app.get('/api/profile', (req, res) => {
  try {
    const profile = safeReadJSON(profilePath, {});
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: "Lỗi đọc file" });
  }
});

// API 2: Cập nhật Profile
app.put('/api/profile', (req, res) => {
  try {
    const newProfile = req.body;
    fs.writeFileSync(profilePath, JSON.stringify(newProfile, null, 2), 'utf8');
    res.json({ success: true, message: "Đã cập nhật Profile" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi ghi file" });
  }
});

// ==========================================
// 2. MODULE: GHI CHÚ THÔNG THƯỜNG (Sprint 2)
// ==========================================
const notesDir = path.join(__dirname, 'data', 'notes');

// Khởi tạo thư mục tự động nếu chưa tồn tại
if (!fs.existsSync(notesDir)) {
  fs.mkdirSync(notesDir, { recursive: true });
}

const getFilePath = (topic) => path.join(notesDir, `${topic}.json`);

// Lấy danh sách ghi chú (GET)
app.get('/api/notes/:topic', (req, res) => {
  const filePath = getFilePath(req.params.topic);
  try {
    const notes = safeReadJSON(filePath, []);
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: "Lỗi đọc danh sách ghi chú" });
  }
});

// Thêm mới ghi chú (POST)
app.post('/api/notes/:topic', (req, res) => {
  const filePath = getFilePath(req.params.topic);
  try {
    let notes = safeReadJSON(filePath, []);
    const newNote = {
      id: Date.now().toString(),
      title: req.body.title || "Không tiêu đề",
      content: req.body.content || "",
      category: req.body.category || req.params.topic,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    notes.push(newNote);
    fs.writeFileSync(filePath, JSON.stringify(notes, null, 2), 'utf8');
    res.json({ success: true, note: newNote });
  } catch (error) {
    res.status(500).json({ message: "Lỗi thêm ghi chú" });
  }
});

// Sửa ghi chú (PUT)
app.put('/api/notes/:topic/:id', (req, res) => {
  const filePath = getFilePath(req.params.topic);
  try {
    let notes = safeReadJSON(filePath, []);
    const index = notes.findIndex(n => n.id === req.params.id);
    if (index !== -1) {
      notes[index].title = req.body.title;
      notes[index].content = req.body.content;
      notes[index].category = req.body.category || req.params.topic;
      notes[index].updatedAt = new Date().toISOString();
      fs.writeFileSync(filePath, JSON.stringify(notes, null, 2), 'utf8');
      return res.json({ success: true, message: "Đã sửa thành công" });
    }
    res.status(404).json({ message: "Không tìm thấy ghi chú" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật ghi chú" });
  }
});

// Xóa ghi chú (DELETE)
app.delete('/api/notes/:topic/:id', (req, res) => {
  const filePath = getFilePath(req.params.topic);
  try {
    let notes = safeReadJSON(filePath, []);
    const newNotes = notes.filter(n => n.id !== req.params.id);
    fs.writeFileSync(filePath, JSON.stringify(newNotes, null, 2), 'utf8');
    res.json({ success: true, message: "Đã xóa thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa ghi chú" });
  }
});

// ==========================================
// 3. MODULE: GHI CHÚ RIÊNG TƯ (Sprint 3)
// ==========================================
const privateNotesFile = path.join(__dirname, 'data', 'private.json');

// Khởi tạo file private.json nếu chưa tồn tại
if (!fs.existsSync(privateNotesFile)) {
  fs.writeFileSync(privateNotesFile, '[]', 'utf8');
}

// API Xác thực mật khẩu
app.post('/api/private/auth', (req, res) => {
  try {
    const profile = safeReadJSON(profilePath, {});
    if (profile.password === req.body.password) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Sai mật khẩu!" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống xác thực" });
  }
});

// API Lấy danh sách Ghi chú riêng tư
app.get('/api/private/notes', (req, res) => {
  try {
    const notes = safeReadJSON(privateNotesFile, []);
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: "Lỗi đọc ghi chú riêng tư" });
  }
});

app.get('/api/private-notes', (req, res) => {
  try {
    const notes = safeReadJSON(privateNotesFile, []);
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: "Lỗi đọc ghi chú riêng tư" });
  }
});

// API Thêm Ghi chú riêng tư
app.post('/api/private/notes', (req, res) => {
  try {
    let notes = safeReadJSON(privateNotesFile, []);
    const newNote = {
      id: Date.now().toString(),
      title: req.body.title || "Lưu bút mật",
      content: req.body.content || "",
      category: req.body.category || "Học tập",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    notes.push(newNote);
    fs.writeFileSync(privateNotesFile, JSON.stringify(notes, null, 2), 'utf8');
    res.json({ success: true, note: newNote });
  } catch (error) {
    res.status(500).json({ message: "Lỗi thêm ghi chú kín" });
  }
});

// API Sửa ghi chú riêng tư
app.put('/api/private/notes/:id', (req, res) => {
  try {
    const notes = safeReadJSON(privateNotesFile, []);
    const index = notes.findIndex((note) => String(note.id) === String(req.params.id));

    if (index === -1) {
      return res.status(404).json({ message: "Không tìm thấy ghi chú riêng tư" });
    }

    notes[index] = {
      ...notes[index],
      title: req.body.title || "Lưu bút mật",
      content: req.body.content || "",
      category: req.body.category || notes[index].category || "Học tập",
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(privateNotesFile, JSON.stringify(notes, null, 2), 'utf8');
    res.json({ success: true, note: notes[index] });
  } catch (error) {
    res.status(500).json({ message: "Lỗi sửa ghi chú kín" });
  }
});

// API Xóa ghi chú riêng tư
app.delete('/api/private/notes/:id', (req, res) => {
  try {
    const notes = safeReadJSON(privateNotesFile, []);
    const nextNotes = notes.filter((note) => String(note.id) !== String(req.params.id));

    if (nextNotes.length === notes.length) {
      return res.status(404).json({ message: "Không tìm thấy ghi chú riêng tư" });
    }

    fs.writeFileSync(privateNotesFile, JSON.stringify(nextNotes, null, 2), 'utf8');
    res.json({ success: true, message: "Đã xóa ghi chú kín" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa ghi chú kín" });
  }
});

// Lắng nghe cổng kết nối
const PORT = 5000;
app.listen(PORT, () => console.log(`Backend chạy tại http://localhost:${PORT}`));