import React, { useState, useEffect } from 'react';

export default function Stats({ theme }) {
  const [notes, setNotes] = useState([]);
  const [timeMode, setTimeMode] = useState('day'); // 'day' | 'month' | 'year'

  const isDark = theme === 'dark';

  // 1. Tải dữ liệu ghi chú từ LocalStorage
  const updateStats = () => {
    try {
      const localData = localStorage.getItem('notes');
      if (localData) {
        const parsed = JSON.parse(localData);
        if (Array.isArray(parsed)) {
          setNotes(parsed);
          return;
        }
      }
    } catch (e) {
      console.error('Lỗi khi đọc dữ liệu:', e);
    }
    setNotes([]);
  };

  useEffect(() => {
    updateStats();

    // Lắng nghe sự kiện cập nhật real-time
    window.addEventListener('notesChanged', updateStats);
    window.addEventListener('storage', updateStats);

    return () => {
      window.removeEventListener('notesChanged', updateStats);
      window.removeEventListener('storage', updateStats);
    };
  }, []);

  // 2. Gom nhóm dữ liệu theo Ngày / Tháng / Năm
  const getGroupedData = () => {
    if (!notes || notes.length === 0) return [];

    const sorted = [...notes].sort(
      (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
    );

    const map = {};

    sorted.forEach((note) => {
      if (!note.createdAt) return;
      const d = new Date(note.createdAt);
      if (isNaN(d.getTime())) return;

      let label = '';
      if (timeMode === 'day') {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        label = `${day}/${month}`;
      } else if (timeMode === 'month') {
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        label = `Thg ${month}/${year}`;
      } else if (timeMode === 'year') {
        label = `${d.getFullYear()}`;
      }

      map[label] = (map[label] || 0) + 1;
    });

    return Object.keys(map).map((label) => ({
      label,
      count: map[label],
    }));
  };

  const chartData = getGroupedData();

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* KHỐI TIÊU ĐỀ, NÚT LỌC VÀ TỔNG SỐ LƯỢNG */}
      <div style={{
        backgroundColor: isDark ? '#1e293b' : '#FAF9F6',
        padding: '20px',
        borderRadius: '16px',
        border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
        marginBottom: '20px',
      }}>
        <h2 style={{
          margin: '0 0 16px 0',
          fontSize: '22px',
          fontWeight: '700',
          color: isDark ? '#f8fafc' : '#785b12'
        }}>
          Thống kê ghi chú
        </h2>

        {/* Hàng chứa Nút lọc (bên trái) và Badge tổng số lượng (bên phải ngoài cùng) */}
        <div style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          width: '100%',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Nút lọc ngày / tháng / năm */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { key: 'day', label: 'Theo ngày' },
              { key: 'month', label: 'Theo tháng' },
              { key: 'year', label: 'Theo năm' },
            ].map((item) => {
              const isActive = timeMode === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setTimeMode(item.key)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '14px',
                    border: isActive ? 'none' : (isDark ? '1px solid #475569' : '1px solid #e2e8f0'),
                    backgroundColor: isActive
                      ? '#f59e0b'
                      : (isDark ? '#334155' : '#ffffff'),
                    color: isActive
                      ? '#ffffff'
                      : (isDark ? '#cbd5e1' : '#475569'),
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 2px 6px rgba(245, 158, 11, 0.3)' : 'none'
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Badge tổng số ghi chú nằm sát lề bên phải ngoài cùng */}
          <div style={{
            backgroundColor: isDark ? '#334155' : '#ffffff',
            padding: '6px 16px',
            borderRadius: '20px',
            border: isDark ? '1px solid #475569' : '1px solid #e2e8f0',
            fontSize: '14px',
            fontWeight: '600',
            color: isDark ? '#f8fafc' : '#475569',
            boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}>
            <span>Tổng số ghi chú:</span>
            <span style={{ fontSize: '16px', fontWeight: '800', color: '#f59e0b' }}>
              {notes.length}
            </span>
          </div>
        </div>
      </div>

      {/* KHUNG BIỂU ĐỒ ĐƯỜNG */}
      <div style={{
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        padding: '20px',
        borderRadius: '16px',
        border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        <h3 style={{
          margin: '0 0 20px 0',
          fontSize: '16px',
          fontWeight: '700',
          color: isDark ? '#f8fafc' : '#785b12'
        }}>
          Biểu đồ đường
        </h3>

        {chartData.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: isDark ? '#94a3b8' : '#64748b'
          }}>
            Chưa có dữ liệu ghi chú để vẽ biểu đồ.
          </div>
        ) : (
          <SVGLineChart data={chartData} isDark={isDark} />
        )}
      </div>

    </div>
  );
}

// COMPONENT VẼ BIỂU ĐỒ ĐƯỜNG SVG
function SVGLineChart({ data, isDark }) {
  const width = 600;
  const height = 240;
  const paddingLeft = 40;
  const paddingBottom = 40;
  const paddingTop = 20;
  const paddingRight = 20;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(4, ...data.map((d) => d.count));
  const yTicks = [0, 1, 2, 3, Math.max(4, maxVal)];

  const points = data.map((d, i) => {
    const x =
      data.length === 1
        ? paddingLeft + chartWidth / 2
        : paddingLeft + (i / (data.length - 1)) * chartWidth;
    const y = height - paddingBottom - (d.count / maxVal) * chartHeight;
    return { x, y, label: d.label, count: d.count };
  });

  const pathD = points.reduce(
    (acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
    ''
  );

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        {/* Lưới ngang */}
        {yTicks.map((tick) => {
          const y = height - paddingBottom - (tick / maxVal) * chartHeight;
          return (
            <g key={tick}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke={isDark ? '#334155' : '#e2e8f0'}
                strokeDasharray="3 3"
              />
              <text
                x={paddingLeft - 10}
                y={y + 4}
                fill={isDark ? '#94a3b8' : '#64748b'}
                fontSize="12"
                textAnchor="end"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Trục X & Y */}
        <line
          x1={paddingLeft}
          y1={height - paddingBottom}
          x2={width - paddingRight}
          y2={height - paddingBottom}
          stroke={isDark ? '#475569' : '#94a3b8'}
        />
        <line
          x1={paddingLeft}
          y1={paddingTop}
          x2={paddingLeft}
          y2={height - paddingBottom}
          stroke={isDark ? '#475569' : '#94a3b8'}
        />

        {/* Đường nối */}
        {points.length > 1 && (
          <path
            d={pathD}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
          />
        )}

        {/* Các điểm tròn */}
        {points.map((pt, index) => (
          <g key={index}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r="5"
              fill="#ffffff"
              stroke="#f59e0b"
              strokeWidth="2.5"
            />
            <text
              x={pt.x}
              y={height - paddingBottom + 20}
              fill={isDark ? '#cbd5e1' : '#64748b'}
              fontSize="11"
              textAnchor="middle"
            >
              {pt.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}