import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Settings from './Settings';
import Notes from './Notes';
import PrivateNotes from './PrivateNotes';

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar Navigation */}
        <div style={{ width: '200px', backgroundColor: '#f0f0f0', padding: '20px' }}>
          <h3>Menu</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '10px' }}>
              <Link to="/">Notes thường</Link>
            </li>
            <li style={{ marginBottom: '10px' }}>   
              <Link to="/private">Notes riêng tư</Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <Link to="/settings">Cài đặt</Link>
            </li>
          </ul>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, padding: '20px' }}>
          <Routes>
            <Route path="/" element={<Notes />} />
            <Route path="/private" element={<PrivateNotes />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;