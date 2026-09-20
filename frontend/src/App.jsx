import React from 'react';
import {
    BrowserRouter,
    Routes,
    Route,
    Link
} from 'react-router-dom';

import { AppProvider, useAppContext } from './AppContext';

import Settings from './Settings';
import Notes from './Notes';
import PrivateNotes from './PrivateNotes';

import './App.css';

function Layout() {

    const {
        displayName,
        theme
    } = useAppContext();

    return (
        <div className={`app ${theme}`}>

            {/* Sidebar */}
            <aside className="sidebar">

                <h2>My Notes</h2>

                <nav>
                    <Link to="/">
                        🏠 Ghi chú
                    </Link>

                    <Link to="/settings">
                        ⚙️ Cài đặt
                    </Link>

                    <Link to="/private">
                        🔒 Vùng kín
                    </Link>
                </nav>

                {/* Tên người dùng */}
                <div className="user">
                    👤 {displayName}
                </div>

            </aside>

            {/* Content */}
            <main className="content">

                <Routes>

                    <Route
                        path="/"
                        element={<Notes />}
                    />

                    <Route
                        path="/settings"
                        element={<Settings />}
                    />

                    <Route
                        path="/private"
                        element={<PrivateNotes />}
                    />

                </Routes>

            </main>

        </div>
    );
}

function App() {

    return (
        <AppProvider>

            <BrowserRouter>

                <Layout />

            </BrowserRouter>

        </AppProvider>
    );
}

export default App;