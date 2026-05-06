import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedFirm, setSelectedFirm] = useState('Select Firm');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="main-layout">
      {/* 1. LEFT SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">SOFTVIEW</div>
        <nav className="nav-menu">
          <div className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>📊 Dashboard</div>
          <div className={`nav-link ${activeTab === 'firm' ? 'active' : ''}`} onClick={() => setActiveTab('firm')}>🏢 Firm Master</div>
          <div className={`nav-link ${activeTab === 'bank' ? 'active' : ''}`} onClick={() => setActiveTab('bank')}>🏦 Bank Master</div>
          <div className={`nav-link ${activeTab === 'user' ? 'active' : ''}`} onClick={() => setActiveTab('user')}>👥 User Master</div>
        </nav>
        <div className="sidebar-footer">
          <button className="btn-logout">Sign Out</button>
        </div>
      </aside>

      {/* 2. RIGHT SIDE CONTENT AREA */}
      <div className="content-container">
        {/* TOP HEADER */}
        <header className="top-header">
          <div className="header-left">
            <select className="firm-dropdown" onChange={(e) => setSelectedFirm(e.target.value)}>
              <option>Select Firm 🔽</option>
              <option>Rathi Jaju & Associates</option>
              <option>Softview Technologies</option>
            </select>
          </div>

          <div className="header-right">
            <div className="profile-info">
              <span className="user-title">👤 Shreekant Rathi</span>
              <span className="user-badge">Admin</span>
            </div>
            <div className="clock-info">
              <div className="date-str">{currentTime.toLocaleDateString()}</div>
              <div className="time-str">{currentTime.toLocaleTimeString()}</div>
            </div>
          </div>
        </header>

        {/* MAIN DISPLAY STAGE */}
        <main className="stage">
          <div className="firm-banner">
            <h1>{selectedFirm}</h1>
            <p>Code: {selectedFirm !== 'Select Firm' ? 'RJA-001' : '--'}</p>
          </div>
          <div className="dashboard-grid">
             {/* Yahan aapke bank accounts ka expansion logic aayega */}
             <div className="placeholder-card">Welcome to your Professional Banking Dashboard!</div>
          </div>
        </main>
        
        <footer className="main-footer">
          Developed by <strong>Softview Technologies</strong> | 7972084304
        </footer>
      </div>
    </div>
  );
}

export default App;