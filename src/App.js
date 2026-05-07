// Ensure all necessary imports are at the top to avoid Vercel Build Failure
import React, { useState, useEffect } from 'react';
import './App.css';

// ... (Firebase imports and config)

function App() {
  // UI States
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [expandedId, setExpandedId] = useState(null);

  // Data Logic for User Master (Fix for image_de3f3a)
  const renderUserMaster = () => (
    <div className="card-premium">
      <table className="pro-table">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Action</th></tr></thead>
        <tbody>
          {usersList.map(user => (
            <tr key={user.id}>
              <td>{user.uName}</td>
              <td>{user.uEmail}</td>
              <td><span className="badge">{user.role}</span></td>
              <td><button className="btn-action">Edit</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Ledger Expansion Fix (Fix for image_de3b5d and image_de4b59)
  const renderLedger = (bank) => (
    <tr className="no-hover">
      <td colSpan="5">
        <div className="ledger-container">
          <div className="ledger-header">
            <div>
              <strong>Account:</strong> {bank.accNo} | <strong>IFSC:</strong> {bank.ifsc || 'N/A'}
            </div>
            <div>
              <button className="btn-export btn-pdf">Download PDF</button>
              <button className="btn-export btn-excel">Export Excel</button>
            </div>
          </div>
          
          <button className="btn-export btn-add-entry">+ Add New Entry</button>
          
          <table className="inner-table">
            <thead>
              <tr><th>Date</th><th>Particulars</th><th>Debit (Dr)</th><th>Credit (Cr)</th><th>Balance</th></tr>
            </thead>
            <tbody>
              {/* Mapping ledger entries from Firebase */}
              <tr>
                <td>07-05-2026</td>
                <td>Opening Balance</td>
                <td>0.00</td>
                <td>{bank.balance}</td>
                <td>{bank.balance}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="app-container">
      {/* Sidebar and Header ... */}
      
      <main className="main-content">
        {activeTab === "Dashboard" ? (
          <div className="dashboard-view">
            <div className="card-premium">
              <select className="firm-select">
                <option>Select Firm...</option>
                {firms.map(f => <option key={f.id}>{f.name}</option>)}
              </select>
            </div>

            <table className="pro-table">
              <thead><tr><th>Bank Name</th><th>Account No</th><th>Balance</th><th>Action</th></tr></thead>
              <tbody>
                {banks.map(bank => (
                  <React.Fragment key={bank.id}>
                    <tr>
                      <td>{bank.bankName}</td>
                      <td>{bank.accNo}</td>
                      <td className="bal-text">₹ {bank.balance}</td>
                      <td>
                        <button className="btn-action" onClick={() => setExpandedId(expandedId === bank.id ? null : bank.id)}>
                          {expandedId === bank.id ? 'Close' : 'Ledger'}
                        </button>
                      </td>
                    </tr>
                    {expandedId === bank.id && renderLedger(bank)}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === "User Master" ? renderUserMaster() : (
          /* Render Firm/Bank Masters */
          <div>Master Forms Here...</div>
        )}
      </main>
    </div>
  );
}

export default App;