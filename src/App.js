import React, { useState, useEffect } from "react";
import "./App.css";
import { auth } from "./firebase"; // Ensure firebase config is correct
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    onAuthStateChanged(auth, (u) => setUser(u));
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDateTime = () => {
    const d = time.toLocaleDateString('en-GB'); // DD/MM/YYYY
    const t = time.toLocaleTimeString();
    return `${d} || ${t}`;
  };

  if (!user) return <div className="login-screen">Please login to continue</div>;

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-header">BANKING SYSTEM</div>
        <div className="nav-menu">
          <div className={`nav-item ${activeTab === 'Dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('Dashboard')}>Dashboard</div>
          <div className={`nav-item ${activeTab === 'Firm Master' ? 'active' : ''}`} onClick={() => setActiveTab('Firm Master')}>Firm Master</div>
          <div className={`nav-item ${activeTab === 'Bank Master' ? 'active' : ''}`} onClick={() => setActiveTab('Bank Master')}>Bank Master</div>
          <div className={`nav-item ${activeTab === 'User Master' ? 'active' : ''}`} onClick={() => setActiveTab('User Master')}>User Master</div>
        </div>
        <div className="logout-container">
          <button className="logout-btn" onClick={() => signOut(auth)}>Logout</button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-content">
        <div className="top-header">
          <div className="user-profile">
            <span className="name">{user.email}</span>
            <span className="timer">{formatDateTime()}</span>
          </div>
        </div>

        <div className="page-body">
          {activeTab === "Dashboard" && (
            <div className="card">
              <h2>Bank Summary</h2>
              <table className="pro-table">
                <thead>
                  <tr>
                    <th>Bank Name</th>
                    <th>Account No</th>
                    <th>Balance</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Sample Row */}
                  <tr>
                    <td>HDFC Bank</td>
                    <td>XXXX 1234</td>
                    <td>₹ 50,000 <span className="arrow-down">↓</span></td>
                    <td><button>Expand</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "Bank Master" && (
            <div className="card">
              <h2>Bank Master</h2>
              <div className="form-mock">
                {/* Yaha bank add karne ka form aayega */}
                <p>Add Bank and Link with Firm dropdown here...</p>
              </div>
            </div>
          )}
          
          {/* Add Firm Master and User Master similar to Bank Master */}
        </div>

        <div className="footer-branding">
          Developed by <strong>Softview Technologies</strong> | Contact: 7972084304
        </div>
      </div>
    </div>
  );
}