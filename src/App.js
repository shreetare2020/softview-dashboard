import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedFirm, setSelectedFirm] = useState('Select Firm');

  // Digital Clock Logic
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. LOGIN PAGE VIEW
  if (!isLoggedIn) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-header">
            <h1>Banking Dashboard</h1>
            <p>Softview Technologies Control Panel</p>
          </div>
          <div className="login-body">
            <div className="input-group">
              <label>Email Address</label>
              <input type="email" placeholder="admin@softview.com" />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input type="password" placeholder="••••••••" />
            </div>
            <button className="main-login-btn" onClick={() => setIsLoggedIn(true)}>
              Secure Login
            </button>
          </div>
          <div className="login-footer">
            Developed by <strong>Softview Technologies</strong><br/>
            📞 7972084304
          </div>
        </div>
      </div>
    );
  }

  // 2. DASHBOARD VIEW (After Login)
  return (
    <div className="dashboard-wrapper">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="brand-logo">SOFTVIEW</div>
          <div className="firm-selector">
            <select onChange={(e) => setSelectedFirm(e.target.value)}>
              <option>Rathi Jaju & Associates</option>
              <option>Firm 2</option>
              <option>Firm 3</option>
            </select>
          </div>
        </div>

        <nav className="side-nav">
          <div className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>📊 Dashboard</div>
          <div className={`nav-link ${activeTab === 'firm' ? 'active' : ''}`} onClick={() => setActiveTab('firm')}>🏢 Firm Master</div>
          <div className={`nav-link ${activeTab === 'bank' ? 'active' : ''}`} onClick={() => setActiveTab('bank')}>🏦 Bank Master</div>
          <div className={`nav-link ${activeTab === 'user' ? 'active' : ''}`} onClick={() => setActiveTab('user')}>👥 User Master</div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <span className="user-name">👤 Shreekant Rathi</span>
            <span className="user-role">Admin</span>
          </div>
          <div className="live-clock">
            {currentTime.toLocaleDateString()}<br/>
            <strong>{currentTime.toLocaleTimeString()}</strong>
          </div>
          <button className="logout-trigger" onClick={() => setIsLoggedIn(false)}>Sign Out</button>
        </div>
      </aside>

      <main className="main-stage">
        <header className="top-bar">
          <h2>{selectedFirm}</h2>
          <div className="firm-code-tag">Code: RJA-001</div>
        </header>
        <div className="stage-content">
          {activeTab === 'dashboard' && <div className="welcome-msg">Welcome to your Banking Overview!</div>}
          {/* Add other modules logic here */}
        </div>
      </main>
    </div>
  );
}

export default App;