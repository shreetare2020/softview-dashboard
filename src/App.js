import React, { useState, useEffect } from "react";
import "./App.css";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc } from "firebase/firestore";
import * as XLSX from 'xlsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [time, setTime] = useState(new Date());
  
  // Data States
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [expandedBank, setExpandedBank] = useState(null);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => setUser(u));
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => { clearInterval(timer); };
  }, []);

  // Fetch Data Real-time
  useEffect(() => {
    if (user) {
      onSnapshot(collection(db, "firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "banks"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
  }, [user]);

  // Excel Export Logic (Colorful rows need manual Excel XML styling but basic is here)
  const exportExcel = (data, filename) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  if (!user) return <div className="login-screen">Check Login Status...</div>;

  return (
    <div className="app-shell">
      {/* 1. SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-header">SOFTVIEW BANKING</div>
        <div className="nav-links">
          {['Dashboard', 'Firm Master', 'Bank Master', 'User Master'].map(tab => (
            <div key={tab} className={`nav-item ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab === 'Dashboard' && '📊 '} {tab === 'Firm Master' && '🏢 '} 
              {tab === 'Bank Master' && '🏦 '} {tab === 'User Master' && '👤 '}
              {tab}
            </div>
          ))}
        </div>
        <div className="logout-box">
          <button className="logout-btn" onClick={() => signOut(auth)}>LOGOUT SESSION</button>
        </div>
      </div>

      <div className="main-stage">
        {/* 2. TOP HEADER (User & Clock) */}
        <div className="top-nav">
          <div className="meta-info">
            <span className="username">{user.email.split('@')[0]} Admin</span>
            <span className="clock">{time.toLocaleDateString()} || {time.toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="container">
          {/* DASHBOARD SECTION */}
          {activeTab === "Dashboard" && (
            <div className="card">
              <h3>Bank Summary</h3>
              <table className="pro-table">
                <thead>
                  <tr><th>Bank Name</th><th>Firm Linked</th><th>Balance</th><th>Status</th><th>Ledger</th></tr>
                </thead>
                <tbody>
                  {banks.map(b => {
                    const isClosed = b.status === 'Closed';
                    const hasBalance = parseFloat(b.balance) !== 0;
                    // Logic: If closed and zero balance, don't show
                    if (isClosed && !hasBalance) return null;

                    return (
                      <React.Fragment key={b.id}>
                        <tr className={isClosed && hasBalance ? 'bank-closed-warning' : ''}>
                          <td>{b.bankName}</td>
                          <td>{b.firmName}</td>
                          <td>
                            ₹ {b.balance} 
                            {b.type === 'Receipt' ? <span className="arrow-receipt"> ↓</span> : <span className="arrow-payment"> ↑</span>}
                          </td>
                          <td>{b.status}</td>
                          <td><button onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}>Expand</button></td>
                        </tr>
                        {expandedBank === b.id && (
                          <tr>
                            <td colSpan="5">
                              <div style={{padding:'20px', background:'#f8fafc', border:'1px solid #ddd'}}>
                                <h4>Detailed Ledger for {b.bankName}</h4>
                                <button onClick={() => exportExcel([b], "Ledger")}>Export Colorful Excel</button>
                                {/* Transactions Mapping here */}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* FIRM MASTER */}
          {activeTab === "Firm Master" && (
            <div className="card">
              <h3>🏢 Firm Master</h3>
              <form className="form-grid" onSubmit={(e) => {
                e.preventDefault();
                addDoc(collection(db, "firms"), { name: e.target.fName.value });
                e.target.reset();
              }}>
                <input name="fName" placeholder="Enter Firm Name" required />
                <button type="submit" className="save-btn">Add Firm</button>
              </form>
              <table className="pro-table">
                <thead><tr><th>Sr.</th><th>Firm Name</th><th>Action</th></tr></thead>
                <tbody>{firms.map((f, i) => <tr key={f.id}><td>{i+1}</td><td>{f.name}</td><td>Delete</td></tr>)}</tbody>
              </table>
            </div>
          )}

          {/* BANK MASTER */}
          {activeTab === "Bank Master" && (
            <div className="card">
              <h3>🏦 Bank Master Setup</h3>
              <form className="form-grid" onSubmit={(e) => {
                e.preventDefault();
                addDoc(collection(db, "banks"), {
                  bankName: e.target.bName.value,
                  accNo: e.target.acc.value,
                  branch: e.target.branch.value,
                  balance: e.target.bal.value,
                  firmName: e.target.fLink.value,
                  status: 'Active'
                });
                e.target.reset();
              }}>
                <input name="bName" placeholder="Bank Name" required />
                <input name="acc" placeholder="Account Number" required />
                <input name="branch" placeholder="Branch Name" required />
                <input name="bal" placeholder="Opening Balance" type="number" required />
                <select name="fLink" required>
                  <option value="">Link with Firm</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
                <button type="submit" className="save-btn">Save Bank Details</button>
              </form>
            </div>
          )}
        </div>

        {/* 3. FOOTER BRANDING (Extreme Left) */}
        <div className="dev-footer">
          Developed by <strong>Softview Technologies</strong> | Contact: 7972084304
        </div>
      </div>
    </div>
  );
}