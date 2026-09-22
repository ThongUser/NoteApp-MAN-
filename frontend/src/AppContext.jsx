import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
    const [displayName, setDisplayName] = useState('Người dùng');
    const [theme, setTheme] = useState('light');
    const [notes, setNotes] = useState(() => {
        const saved = localStorage.getItem('app_notes');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('app_notes', JSON.stringify(notes));
    }, [notes]);

    // 2. Hàm thêm Note/Tab mới (Tự động đính kèm createdAt)
    const addNote = (noteData) => {
        const newNote = {
            id: Date.now(),
            title: noteData?.title || 'Tab mới',
            content: noteData?.content || '',
            createdAt: new Date().toISOString(), // Mốc thời gian bắt buộc để thống kê
        };
        setNotes((prevNotes) => [...prevNotes, newNote]);
    };

    return (
        <AppContext.Provider
            value={{
                displayName,
                setDisplayName,
                theme,
                setTheme,
                notes,     // Thêm danh sách notes
                setNotes,  // Thêm hàm setNotes
                addNote
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    return useContext(AppContext);
}