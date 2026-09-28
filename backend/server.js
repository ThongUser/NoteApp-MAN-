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
const deletedLogsPath = path.join(__dirname, 'data', 'deleted_logs.json');
const notesPerPage = 10;

// Khởi tạo thư mục tự động nếu chưa tồn tại
if (!fs.existsSync(notesDir)) {
  fs.mkdirSync(notesDir, { recursive: true });
}

if (!fs.existsSync(deletedLogsPath)) {
  fs.writeFileSync(deletedLogsPath, '[]', 'utf8');
}

const getFilePath = (topic) => path.join(notesDir, `${topic}.json`);

const getPaginatedNotes = (notes, query) => {
  const searchValue = query.search === undefined ? '' : query.search;
  const sort = query.sort === undefined ? 'desc' : query.sort;
  const pageValue = query.page === undefined ? '1' : query.page;
  const page = Number(pageValue);

  if (typeof searchValue !== 'string') {
    return { error: 'Tham số search không hợp lệ' };
  }
  if (typeof sort !== 'string' || (sort !== 'asc' && sort !== 'desc')) {
    return { error: 'Tham số sort phải là asc hoặc desc' };
  }
  if (typeof pageValue !== 'string' || !/^[1-9]\d*$/.test(pageValue) || !Number.isSafeInteger(page)) {
    return { error: 'Tham số page phải là số nguyên dương' };
  }

  const search = searchValue.trim().toLocaleLowerCase();
  const filteredNotes = notes
    .filter((note) => {
      if (!search) return true;
      return `${note.title || ''} ${note.content || ''}`
        .toLocaleLowerCase()
        .includes(search);
    })
    .sort((first, second) => {
      const firstDate = Date.parse(first.createdAt || '') || 0;
      const secondDate = Date.parse(second.createdAt || '') || 0;
      return sort === 'asc' ? firstDate - secondDate : secondDate - firstDate;
    });

  const startIndex = (page - 1) * notesPerPage;
  return {
    data: filteredNotes.slice(startIndex, startIndex + notesPerPage),
    currentPage: page,
    totalPages: Math.ceil(filteredNotes.length / notesPerPage)
  };
};

const readAllNotes = () => fs.readdirSync(notesDir)
  .filter((fileName) => fileName.endsWith('.json'))
  .flatMap((fileName) => {
    const topic = path.basename(fileName, '.json');
    const categoryByTopic = {
      'hoc-tap': 'Học tập',
      'cong-viec': 'Công việc',
      'ca-nhan': 'Cá nhân'
    };
    return safeReadJSON(path.join(notesDir, fileName), [])
      .map((note) => ({ ...note, category: note.category || categoryByTopic[topic] || topic }));
  });

// Lấy tất cả ghi chú với tìm kiếm, sắp xếp và phân trang (GET)
app.get('/api/notes', (req, res) => {
  try {
    const result = getPaginatedNotes(readAllNotes(), req.query);
    if (result.error) return res.status(400).json({ message: result.error });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Lỗi đọc danh sách ghi chú" });
  }
});

// Lấy danh sách ghi chú theo danh mục (GET)
app.get('/api/notes/:topic', (req, res) => {
  const filePath = getFilePath(req.params.topic);
  try {
    const notes = safeReadJSON(filePath, []);
    const result = getPaginatedNotes(notes, req.query);
    if (result.error) return res.status(400).json({ message: result.error });
    res.json(result);
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
    const notes = safeReadJSON(filePath, []);
    const noteIndex = notes.findIndex((note) => note.id === req.params.id);
    if (noteIndex === -1) {
      return res.status(404).json({ message: "Không tìm thấy ghi chú" });
    }

    const deletedNote = { ...notes[noteIndex], deletedAt: new Date().toISOString() };
    const deletedLogs = JSON.parse(fs.readFileSync(deletedLogsPath, 'utf8'));
    if (!Array.isArray(deletedLogs)) {
      throw new Error('Tệp deleted_logs.json phải chứa một mảng');
    }
    deletedLogs.push(deletedNote);
    fs.writeFileSync(deletedLogsPath, JSON.stringify(deletedLogs, null, 2), 'utf8');

    const newNotes = notes.filter((_, index) => index !== noteIndex);
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

// Chuyển ghi chú công khai sang danh sách riêng tư
app.post('/api/notes/:topic/:id/move-private', (req, res) => {
  const sourceFile = getFilePath(req.params.topic);
  try {
    const notes = safeReadJSON(sourceFile, []);
    const noteIndex = notes.findIndex((note) => note.id === req.params.id);
    if (noteIndex === -1) {
      return res.status(404).json({ message: "Không tìm thấy ghi chú" });
    }

    const privateNotes = safeReadJSON(privateNotesFile, []);
    const noteToMove = notes[noteIndex];
    if (privateNotes.some((note) => note.id === noteToMove.id)) {
      return res.status(409).json({ message: "Ghi chú đã tồn tại trong danh sách riêng tư" });
    }

    privateNotes.push(noteToMove);
    const remainingNotes = notes.filter((_, index) => index !== noteIndex);
    fs.writeFileSync(privateNotesFile, JSON.stringify(privateNotes, null, 2), 'utf8');
    fs.writeFileSync(sourceFile, JSON.stringify(remainingNotes, null, 2), 'utf8');
    res.json({ success: true, note: noteToMove });
  } catch (error) {
    res.status(500).json({ message: "Lỗi chuyển ghi chú sang riêng tư" });
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

// Cập nhật ghi chú riêng tư
app.put('/api/private/notes/:id', (req, res) => {
  try {
    const notes = safeReadJSON(privateNotesFile, []);
    const note = notes.find((item) => item.id === req.params.id);
    if (!note) {
      return res.status(404).json({ message: "Không tìm thấy ghi chú riêng tư" });
    }

    note.title = req.body.title ?? note.title;
    note.content = req.body.content ?? note.content;
    if (req.body.category !== undefined) note.category = req.body.category;
    note.updatedAt = new Date().toISOString();
    fs.writeFileSync(privateNotesFile, JSON.stringify(notes, null, 2), 'utf8');
    res.json({ success: true, note });
  } catch (error) {
    res.status(500).json({ message: "Lỗi cập nhật ghi chú riêng tư" });
  }
});

// Xóa ghi chú riêng tư
app.delete('/api/private/notes/:id', (req, res) => {
  try {
    const notes = safeReadJSON(privateNotesFile, []);
    const noteIndex = notes.findIndex((note) => note.id === req.params.id);
    if (noteIndex === -1) {
      return res.status(404).json({ message: "Không tìm thấy ghi chú riêng tư" });
    }

    const remainingNotes = notes.filter((_, index) => index !== noteIndex);
    fs.writeFileSync(privateNotesFile, JSON.stringify(remainingNotes, null, 2), 'utf8');
    res.json({ success: true, message: "Đã xóa ghi chú riêng tư" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi xóa ghi chú riêng tư" });
  }
});

// Lắng nghe cổng kết nối
const PORT = 5000;
app.listen(PORT, () => console.log(`Backend chạy tại http://localhost:${PORT}`));