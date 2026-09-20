import React, { useEffect, useState } from 'react';
import { useAppContext } from './AppContext';

function Settings() {

    const {
        displayName,
        setDisplayName,
        theme,
        setTheme
    } = useAppContext();

    const [formData, setFormData] = useState({
        displayName: '',
        theme: 'light',
        password: ''
    });

    const [loading, setLoading] = useState(true);


    useEffect(() => {

        fetch('http://localhost:5000/api/profile')
            .then(res => {
                if (!res.ok) {
                    throw new Error('Không thể lấy thông tin profile');
                }

                return res.json();
            })
            .then(data => {

                // Đưa dữ liệu API vào Form
                setFormData({
                    displayName: data.displayName || '',
                    theme: data.theme || 'light',
                    password: ''
                });

                // Đưa dữ liệu vào AppContext
                setDisplayName(data.displayName || '');
                setTheme(data.theme || 'light');

            })
            .catch(error => {

                console.error(error);

                alert('Không thể tải thông tin cài đặt');

            })
            .finally(() => {

                setLoading(false);

            });

    }, [setDisplayName, setTheme]);



    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

    };



    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            const response = await fetch(
                'http://localhost:5000/api/profile',
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify({
                        displayName: formData.displayName,
                        theme: formData.theme,
                        password: formData.password
                    })
                }
            );

            if (!response.ok) {
                throw new Error('Cập nhật thất bại');
            }

            const data = await response.json();

            setDisplayName(
                data.displayName ?? formData.displayName
            );

            setTheme(
                data.theme ?? formData.theme
            );

            setFormData(prev => ({
                ...prev,
                password: ''
            }));

            // Thông báo
            alert('Lưu thành công');

        } catch (error) {

            console.error(error);

            alert('Lưu thất bại');

        }
    };


    if (loading) {
        return <p>Đang tải thông tin...</p>;
    }



    return (
        <div className="settings">

            <h2>Cài đặt hệ thống</h2>

            <form onSubmit={handleSubmit}>

                <div className="setting-item">

                    <label>
                        Tên hiển thị
                    </label>

                    <input
                        type="text"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleChange}
                        placeholder="Nhập tên hiển thị"
                    />

                </div>


                <div className="setting-item">

                    <label>
                        Giao diện
                    </label>

                    <div className="theme-options">

                        <label>
                            <input
                                type="radio"
                                name="theme"
                                value="light"
                                checked={
                                    formData.theme === 'light'
                                }
                                onChange={handleChange}
                            />

                            Sáng
                        </label>


                        <label>
                            <input
                                type="radio"
                                name="theme"
                                value="dark"
                                checked={
                                    formData.theme === 'dark'
                                }
                                onChange={handleChange}
                            />

                            Tối
                        </label>

                    </div>

                </div>


                <div className="setting-item">

                    <label>
                        Mật khẩu vùng kín
                    </label>

                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Nhập mật khẩu mới"
                    />

                </div>


                <button
                    type="submit"
                    className="save-btn"
                >
                    Lưu thay đổi
                </button>

            </form>

        </div>
    );
}

export default Settings;