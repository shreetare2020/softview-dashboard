import React, { useState, useEffect } from "react";
import "./App.css";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc } from "firebase/firestore";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [selectedFirm, setSelectedFirm] = useState("");
  const [expandedBank, setExpandedBank] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => setUser(u));
    if (user) {
      onSnapshot(collection(db, "firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "banks"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "users"), s => setUsersList(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
  }, [user]);

  // Export Logic
  const exportExcel = (b) => {
    const data = [{ Date: '07/05/2026', Particulars: 'Opening Balance', Receipt: b.openingBal, Payment: 0, Balance: b.balance }];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, `${b.bankName}_Ledger.xlsx`);
  };

  const exportPDF = (b) => {
    const doc = new jsPDF();
    doc.text(`Bank Ledger: ${b.bankName} (${b.firmName})`, 14, 15);
    doc.autoTable({
      startY: 25,
      head: [['Date', 'Particulars', 'Receipt', 'Payment', 'Balance']],
      body: [['07/05/2026', 'Opening Balance', b.openingBal, '0', b.balance]],
    });
    doc.save(`${b.bankName}_Ledger.pdf`);
  };

  if (!user) return <LoginScreen />;

  return (
    <div className="app-shell">
      <div className="sidebar">
        <div className="sidebar-brand">BANKING PRO</div>
        <div className="nav-links">
          {['Dashboard', 'Firm Master', 'Bank Master', 'User Master'].map(tab => (
            <div key={tab} className={`nav-item ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</div>
          ))}
        </div>
        <div className="sidebar-footer">
          <strong>SOFTVIEW TECHNOLOGIES</strong><br/>
          Contact: 7972084304
        </div>
      </div>

      <div className="main-stage">
        <div className="top-right-header">
          <span className="user-badge">{user.email}</span>
          <span className="live-time">
            {currentTime.toLocaleDateString('en-GB')} || {currentTime.toLocaleTimeString()}
          </span>
          <button className="btn-logout-head" onClick={() => signOut(auth)}>Logout</button>
        </div>

        <div className="content-area">
          {activeTab === "Dashboard" && (
            <div className="fade-in">
              <div className="filter-container">
                <h2 style={{margin:0, color:'white'}}>Consolidated Bank Summary</h2>
                <select className="pro-select" value={selectedFirm} onChange={(e) => setSelectedFirm(e.target.value)}>
                  <option value="">Select Firm to View Ledger...</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>

              {!selectedFirm ? (
                <div className="card empty-dashboard">
                  <h3>Please select a firm to load financial data.</h3>
                </div>
              ) : (
                <div className="card no-padding">
                  <table className="pro-table">
                    <thead>
                      <tr><th>Bank Name</th><th>Account No</th><th>Balance Status</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {banks.filter(b => b.firmName === selectedFirm).map(b => (
                        <React.Fragment key={b.id}>
                          <tr>
                            <td><strong>{b.bankName}</strong></td>
                            <td><code>{b.accNo}</code></td>
                            <td className="txt-success">₹ {b.balance}</td>
                            <td>
                              <button className="btn-gold-sm" onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}>
                                {expandedBank === b.id ? "Hide Ledger" : "View Ledger"}
                              </button>
                            </td>
                          </tr>
                          {expandedBank === b.id && (
                            <tr>
                              <td colSpan="4" className="ledger-row-bg">
                                <div className="ledger-container card">
                                  <div className="ledger-header">
                                    <h4>Account Statement: {b.bankName}</h4>
                                    <div className="btn-group">
                                      <button className="btn-excel" onClick={() => exportExcel(b)}>Excel</button>
                                      <button className="btn-pdf" onClick={() => exportPDF(b)}>PDF</button>
                                    </div>
                                  </div>
                                  <table className="pro-table inner-table">
                                    <thead><tr><th>Date</th><th>Particulars</th><th>Receipt</th><th>Payment</th><th>Balance</th></tr></thead>
                                    <tbody>
                                      <tr><td>07/05/2026</td><td>Opening Balance</td><td>{b.openingBal}</td><td>0</td><td>{b.balance}</td></tr>
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
              )}
            </div>
          )}

          {/* Firm Master, Bank Master, and User Master code same as before */}
          {/* ... (rest of the masters logic) ... */}
        </div>
      </div>
    </div>
  );
}

function LoginScreen() {
  return (
    <div className="login-page">
      <div className="login-overlay">
        <div className="login-card">
          <div className="login-logo">🏦</div>
          <h1>BANKING PRO</h1>
          <p>Secure Enterprise Portal</p>
          <form className="login-form" onSubmit={(e) => {
            e.preventDefault();
            signInWithEmailAndPassword(auth, e.target.email.value, e.target.pass.value);
          }}>
            <div className="input-group">
              <label>Email Address</label>
              <input name="email" type="email" placeholder="admin@softview.com" required />
            </div>
            <div className="input-group">
              <label>Security Password</label>
              <input name="pass" type="password" placeholder="••••••••" required />
            </div>
            <button type="submit" className="login-submit">AUTHORIZE LOGIN</button>
          </form>
          <div className="login-footer">Powered by Softview Technologies</div>
        </div>
      </div>
    </div>
  );
}