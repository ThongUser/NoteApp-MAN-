import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

import Settings from './Settings';
import Notes from './Notes';
import PrivateNotes from './PrivateNotes';

import './App.css';

function App() {
    return (
        <BrowserRouter>
            <div className="app">

                {/* Sidebar */}
                <aside className="sidebar">
                    <h2>My Notes</h2>

                    <nav>
                        <Link to="/">Ghi chú</Link>
                        <Link to="/settings">Cài đặt</Link>
                        <Link to="/private">Vùng kín</Link>
                    </nav>
                </aside>

                {/* Nội dung */}
                <main className="content">
                    <Routes>
                        <Route path="/" element={<Notes />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/private" element={<PrivateNotes />} />
                    </Routes>
                </main>

            </div>
        </BrowserRouter>
    );
}

export default App;