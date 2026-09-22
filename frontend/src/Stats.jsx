import React, { useState, useMemo } from 'react';
import { useAppContext } from './AppContext'; // Import hook custom từ AppContext

export default function StatsWrapper() {
  // Lấy dữ liệu notes trực tiếp từ Context
  const { notes } = useAppContext();

  // Gọi component vẽ biểu đồ (Component Stats bạn đã viết)
  return <Stats notes={notes} />;
}

// Hàm hỗ trợ gom nhóm và định dạng ngày tháng
const formatDate = (dateString, mode) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Khác';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  if (mode === 'day') return `${day}/${month}/${year}`;
  if (mode === 'month') return `Tháng ${month}/${year}`;
  if (mode === 'year') return `Năm ${year}`;
  return `${day}/${month}/${year}`;
};

export default function Stats({ notes = [] }) {
  const [filterMode, setFilterMode] = useState('day'); // 'day' | 'month' | 'year'

  // Gom nhóm dữ liệu theo lựa chọn Ngày / Tháng / Năm
  const statsData = useMemo(() => {
    const grouped = {};

    notes.forEach((note) => {
      // Nhận trường thời gian tạo (createdAt hoặc date/timestamp)
      const dateVal = note.createdAt || note.date || note.timestamp;
      if (!dateVal) return;

      const key = formatDate(dateVal, filterMode);
      grouped[key] = (grouped[key] || 0) + 1;
    });

    return Object.entries(grouped).map(([label, count]) => ({
      label,
      count,
    }));
  }, [notes, filterMode]);

  // Tìm giá trị số lượng tab cao nhất để tính chiều cao cột
  const maxCount = useMemo(() => {
    const max = Math.max(...statsData.map((d) => d.count), 0);
    return max > 0 ? max : 1;
  }, [statsData]);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📊 Thống Kê Số Lượng Tab Đã Tạo</h2>

      {/* Các thẻ tổng quan */}
      <div style={styles.cardGrid}>
        <div style={styles.card}>
          <span style={styles.cardTitle}>Tổng số Tab</span>
          <span style={styles.cardValue}>{notes.length}</span>
        </div>
        <div style={styles.card}>
          <span style={styles.cardTitle}>Chế độ xem</span>
          <span style={styles.cardValue}>
            {filterMode === 'day' ? 'Theo Ngày' : filterMode === 'month' ? 'Theo Tháng' : 'Theo Năm'}
          </span>
        </div>
        <div style={styles.card}>
          <span style={styles.cardTitle}>Cao nhất trong kỳ</span>
          <span style={styles.cardValue}>{Math.max(...statsData.map((d) => d.count), 0)} Tab</span>
        </div>
      </div>

      {/* Nút bấm chuyển đổi chế độ lọc */}
      <div style={styles.filterGroup}>
        <button
          style={filterMode === 'day' ? styles.activeBtn : styles.btn}
          onClick={() => setFilterMode('day')}
        >
          Theo Ngày
        </button>
        <button
          style={filterMode === 'month' ? styles.activeBtn : styles.btn}
          onClick={() => setFilterMode('month')}
        >
          Theo Tháng
        </button>
        <button
          style={filterMode === 'year' ? styles.activeBtn : styles.btn}
          onClick={() => setFilterMode('year')}
        >
          Theo Năm
        </button>
      </div>

      {/* Biểu đồ cột */}
      {statsData.length === 0 ? (
        <div style={styles.emptyText}>Chưa có dữ liệu tab hoặc ghi chú nào.</div>
      ) : (
        <div style={styles.chartWrapper}>
          <div style={styles.chart}>
            {statsData.map((item, index) => {
              const heightPercent = (item.count / maxCount) * 100;
              return (
                <div key={index} style={styles.barItem}>
                  <span style={styles.barCount}>{item.count}</span>
                  <div style={styles.barTrack}>
                    <div
                      style={{
                        ...styles.barFill,
                        height: `${heightPercent}%`,
                      }}
                    />
                  </div>
                  <span style={styles.barLabel}>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Styling giao diện Dark Mode đồng bộ với VS Code / App hiện tại của bạn
const styles = {
  container: {
    padding: '24px',
    backgroundColor: '#1e1e1e',
    color: '#ffffff',
    borderRadius: '12px',
    maxWidth: '900px',
    margin: '20px auto',
    fontFamily: 'Segoe UI, sans-serif',
  },
  title: {
    marginTop: 0,
    marginBottom: '20px',
    fontSize: '22px',
    color: '#61dafb',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  card: {
    backgroundColor: '#252526',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #333',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  cardTitle: {
    fontSize: '13px',
    color: '#aaa',
  },
  cardValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#fff',
  },
  filterGroup: {
    display: 'flex',
    gap: '10px',
    marginBottom: '24px',
  },
  btn: {
    padding: '8px 16px',
    backgroundColor: '#2d2d2d',
    color: '#ccc',
    border: '1px solid #444',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  activeBtn: {
    padding: '8px 16px',
    backgroundColor: '#007acc',
    color: '#fff',
    border: '1px solid #007acc',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  chartWrapper: {
    backgroundColor: '#252526',
    padding: '24px 16px 12px 16px',
    borderRadius: '8px',
    border: '1px solid #333',
    overflowX: 'auto',
  },
  chart: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '24px',
    height: '240px',
    minWidth: 'min-content',
    paddingTop: '30px',
  },
  barItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
    width: '50px',
    flexShrink: 0,
  },
  barCount: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#007acc',
    marginBottom: '6px',
  },
  barTrack: {
    flex: 1,
    width: '100%',
    backgroundColor: '#333',
    borderRadius: '4px 4px 0 0',
    display: 'flex',
    alignItems: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#007acc',
    transition: 'height 0.3s ease',
    borderRadius: '4px 4px 0 0',
  },
  barLabel: {
    fontSize: '11px',
    color: '#aaa',
    marginTop: '8px',
    whiteSpace: 'nowrap',
  },
  emptyText: {
    textAlign: 'center',
    padding: '40px',
    color: '#888',
  },
};