import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('admin'); // admin or viewer
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedFirm, setSelectedFirm] = useState('All Firms');
  const [expandedBank, setExpandedBank] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time Clock logic
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>Banking Dashboard</h1>
          <input type="email" placeholder="Email Address" />
          <input type="password" placeholder="Password" />
          <button className="login-btn" onClick={() => setIsLoggedIn(true)}>Login</button>
          <div className="footer-credits">
            Developed by <strong>Softview Technologies</strong><br />
            📞 7972084304
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Sidebar Section */}
      <div className="sidebar">
        <div className="sidebar-header">
          <select onChange={(e) => setSelectedFirm(e.target.value)} className="firm-dropdown">
            <option>Select Firm 🔽</option>
            <option>Rathi Jaju & Associates</option>
            <option>Softview Tech</option>
          </select>
        </div>
        <nav>
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>📊 Dashboard</div>
          <div className={`nav-item ${activeTab === 'firm' ? 'active' : ''}`} onClick={() => setActiveTab('firm')}>🏢 Firm Master</div>
          <div className={`nav-item ${activeTab === 'bank' ? 'active' : ''}`} onClick={() => setActiveTab('bank')}>🏦 Bank Master</div>
          <div className={`nav-item ${activeTab === 'user' ? 'active' : ''}`} onClick={() => setActiveTab('user')}>👥 User Master</div>
        </nav>
        
        {/* Preview Section */}
        <div className="sidebar-previews">
           <div className="preview-card">Firms: 4</div>
           <div className="preview-card">Banks: 32</div>
           <div className="preview-card">Users: 5</div>
        </div>

        <div className="sidebar-bottom">
          <div className="user-info">👤 Shreekant Rathi</div>
          <div className="clock-section">
            {currentTime.toLocaleDateString()}<br/>
            {currentTime.toLocaleTimeString()}
          </div>
          <button className="signout-btn" onClick={() => setIsLoggedIn(false)}>Sign Out</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-viewport">
        <header className="main-header">
          <h2>{activeTab.toUpperCase()} - {selectedFirm}</h2>
          <div className="header-right">Role: <span className="role-tag">{userRole}</span></div>
        </header>

        <div className="content-area">
          {activeTab === 'dashboard' && (
            <div className="bank-list">
              {[1, 2, 3].map((bank) => (
                <div key={bank} className="bank-row-container">
                  <div className="bank-summary-row" onClick={() => setExpandedBank(expandedBank === bank ? null : bank)}>
                    <span>Bank Account #{bank}009823</span>
                    <span>Current Balance: ₹4,50,000</span>
                    <span>{expandedBank === bank ? '🔼' : '🔽'}</span>
                  </div>
                  
                  {expandedBank === bank && (
                    <div className="ledger-expanded">
                      <div className="export-btns">
                        <button className="btn-excel">Export Excel 📊</button>
                        <button className="btn-pdf">Export PDF 📄</button>
                      </div>
                      <table className="ledger-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Particulars</th>
                            <th>Receipt (DR)</th>
                            <th>Payment (CR)</th>
                            <th>Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>05-05-2026</td>
                            <td>Client Fees</td>
                            <td className="txt-green">₹50,000 ↓</td>
                            <td>-</td>
                            <td>₹5,00,000</td>
                          </tr>
                          <tr>
                            <td>06-05-2026</td>
                            <td>Office Rent</td>
                            <td>-</td>
                            <td className="txt-red">₹20,000 ↑</td>
                            <td>₹4,80,000</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {activeTab !== 'dashboard' && <div className="placeholder-view">Manage {activeTab} Features Here</div>}
        </div>
        <footer className="firm-footer-code">Firm Code: RJA-2026</footer>
      </div>
    </div>
  );
}

export default App;