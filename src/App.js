import React, { useState, useEffect } from 'react';
import './App.css';
// Firebase imports ko apne config ke hisaab se sahi rakhein
import { auth, db } from "./firebase"; 
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [selectedFirm, setSelectedFirm] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (user) {
      onSnapshot(collection(db, "firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "banks"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "users"), s => setUsersList(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
  }, [user]);

  if (!user) return <div className="login-trigger">Please Login...</div>;

  return (
    <div className="app-shell">
      <div className="sidebar">
        <h2 className="brand">BANKING PRO</h2>
        {['Dashboard', 'Firm Master', 'Bank Master', 'User Master'].map(tab => (
          <div key={tab} className={`nav-item ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </div>
        ))}
        <div className="dev-footer">Developed by: <br/><strong>SOFTVIEW TECHNOLOGIES</strong></div>
      </div>

      <div className="main-content">
        <header className="top-bar">
          <span>Welcome, <strong>{user.email}</strong></span>
          <button className="logout-btn" onClick={() => signOut(auth)}>LOGOUT</button>
        </header>

        <div className="stage">
          {activeTab === "Dashboard" ? (
            <>
              <div className="filter-card">
                <label>SELECT FIRM:</label>
                <select value={selectedFirm} onChange={(e) => setSelectedFirm(e.target.value)}>
                  <option value="">-- Choose Firm --</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>

              <div className="table-wrapper">
                <table className="pro-table">
                  <thead>
                    <tr><th>Bank Name</th><th>Account No</th><th>Balance</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {banks.filter(b => b.firmName === selectedFirm || !selectedFirm).map(bank => (
                      <React.Fragment key={bank.id}>
                        <tr>
                          <td>{bank.bankName}</td>
                          <td className="text-bold">{bank.accNo}</td>
                          <td className="amt-green">₹ {bank.balance}</td>
                          <td>
                            <button className={`btn-ledger ${expandedId === bank.id ? 'active' : ''}`} onClick={() => setExpandedId(expandedId === bank.id ? null : bank.id)}>
                              {expandedId === bank.id ? 'Close' : 'Ledger'}
                            </button>
                          </td>
                        </tr>
                        {expandedId === bank.id && (
                          <tr className="ledger-row-expanded">
                            <td colSpan="4">
                              <div className="ledger-box fade-in">
                                <div className="ledger-controls">
                                  <span><strong>IFSC:</strong> {bank.ifsc || 'N/A'}</span>
                                  <div className="export-btns">
                                    <button className="exp-btn pdf">PDF</button>
                                    <button className="exp-btn excel">EXCEL</button>
                                  </div>
                                </div>
                                <table className="inner-ledger-table">
                                  <thead>
                                    <tr><th>Date</th><th>Particulars</th><th>Dr</th><th>Cr</th></tr>
                                  </thead>
                                  <tbody>
                                    <tr><td colSpan="4" className="text-center">No transactions found.</td></tr>
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : activeTab === "User Master" ? (
            <div className="card-premium">
               <h3>User Management</h3>
               <table className="pro-table">
                  <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
                  <tbody>
                    {usersList.map(u => <tr key={u.id}><td>{u.uName}</td><td>{u.uEmail}</td><td>{u.role}</td></tr>)}
                  </tbody>
               </table>
            </div>
          ) : (
            <div className="card-premium">Masters Loading...</div>
          )}
        </div>
      </div>
    </div>
  );
}