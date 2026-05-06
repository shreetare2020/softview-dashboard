import React, { useState } from 'react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="dashboard-container">
      {/* Sidebar UI */}
      <div className="sidebar">
        <h2>Softview</h2>
        <ul>
          <li onClick={() => setActiveTab('dashboard')}>📊 Dashboard</li>
          <li onClick={() => setActiveTab('firm')}>🏦 Firm Master</li>
          <li onClick={() => setActiveTab('bank')}>🏦 Bank Master</li>
          <li onClick={() => setActiveTab('user')}>👤 User Master</li>
        </ul>
        <button className="logout-btn">Logout</button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {activeTab === 'dashboard' && <h1>Welcome to Banking System ✅</h1>}
        {activeTab === 'firm' && <div><h2>Firm Master - Rathi Jaju & Associates</h2><p>Data loading...</p><button>Export Excel</button></div>}
        {activeTab === 'bank' && <div><h2>Bank Master</h2><p>Managing Bank Entries...</p></div>}
        {activeTab === 'user' && <div><h2>User Master</h2><p>Admin & Viewer Roles</p></div>}
      </div>
    </div>
  );
}

export default App;