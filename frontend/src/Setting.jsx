import React, { useState, useEffect } from "react";
function Settings() {
  const [profile, setProfile] = useState({
    displayName: "",
    theme: "light",
    password: "",
  });
  useEffect(() => {
    fetch("http://localhost:5000/api/profile")
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        document.body.style.backgroundColor =
          data.theme === "dark" ? "#333" : "#fff";
        document.body.style.color = data.theme === "dark" ? "#fff" : "#000";
      });
  }, []);
  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };
  const handleSave = () => {
    fetch("http://localhost:5000/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    })
      .then((res) => res.json())
      .then((data) => {
        alert("Lưu thành công!");
        document.body.style.backgroundColor =
          profile.theme === "dark" ? "#333" : "#fff";
        document.body.style.color = profile.theme === "dark" ? "#fff" : "#000";
      });
  };
  return (
    <div style={{ padding: "20px" }}>
      <h2>Cài đặt hệ thống</h2>
      <div>
        <label>Tên hiển thị: </label>
        <input
          name="displayName"
          value={profile.displayName}
          onChange={handleChange}
        />
      </div>
      <div style={{ marginTop: "10px" }}>
        <label>Giao diện: </label>
        <select name="theme" value={profile.theme} onChange={handleChange}>
          <option value="light">Sáng</option>
          <option value="dark">Tối</option>
        </select>
      </div>
      <div style={{ marginTop: "10px" }}>
        <label>Mật khẩu vùng kín: </label>
        <input
          type="password"
          name="password"
          value={profile.password}
          onChange={handleChange}
        />
      </div>
      <button onClick={handleSave} style={{ marginTop: "20px" }}>
        Lưu thay đổi
      </button>
    </div>
  );
}
export default Settings;
F;
