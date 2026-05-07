import React, { useState, useEffect } from "react";
import "./App.css";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc } from "firebase/firestore";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [time, setTime] = useState(new Date());
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [expandedBank, setExpandedBank] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => { unsub(); clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (user) {
      onSnapshot(collection(db, "firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "banks"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
  }, [user]);

  const handleLogin = (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, e.target.email.value, e.target.pass.value);
  };

  // UI Components
  if (!user) return (
    <div className="login-bg">
      <div className="login-card">
        <h2 style={{color: '#0f172a'}}>ADMIN PORTAL</h2>
        <form onSubmit={handleLogin}>
          <input name="email" type="email" placeholder="Email Address" required />
          <input name="pass" type="password" placeholder="Password" required />
          <button type="submit">LOGIN</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="app-shell">
      <div className="sidebar">
        <div style={{padding:'25px', fontSize:'20px', fontWeight:'800', borderBottom:'1px solid #334155'}}>BANKING ERP</div>
        <div className="nav-links">
          {['Dashboard', 'Firm Master', 'Bank Master', 'User Master'].map(t => (
            <div key={t} className={`nav-item ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t}</div>
          ))}
        </div>
        <div className="logout-box"><button className="logout-btn" onClick={() => signOut(auth)}>LOGOUT</button></div>
      </div>

      <div className="main-content">
        <div className="header-right">
          <div className="user-name">{user.email}</div>
          <div className="live-clock">{time.toLocaleDateString('en-GB')} || {time.toLocaleTimeString()}</div>
        </div>

        <div className="page-container">
          {activeTab === "Dashboard" && (
            <div className="card">
              <h3>Bank Summary</h3>
              <table className="pro-table">
                <thead><tr><th>Firm</th><th>Bank Name</th><th>A/c No</th><th>Balance</th><th>Status</th><th>Ledger</th></tr></thead>
                <tbody>
                  {banks.map(b => (
                    <tr key={b.id} className={b.status === 'Closed' && parseFloat(b.balance) !== 0 ? 'bank-closed-row' : ''}>
                      <td>{b.firmName}</td>
                      <td>{b.bankName}</td>
                      <td>{b.accNo}</td>
                      <td className={parseFloat(b.balance) >= 0 ? 'amt-receipt' : 'amt-payment'}>
                        ₹ {b.balance} {parseFloat(b.balance) >= 0 ? ' ↓' : ' ↑'}
                      </td>
                      <td>{b.status}</td>
                      <td><button onClick={() => setExpandedBank(expandedBank === b.id ? b.id : b.id)}>Expand</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Form and Logic for Masters */}
          {activeTab === "Bank Master" && (
             <div className="card">
                <h3>🏦 Add / Edit Bank</h3>
                {/* Bank Master Form with linking to firm dropdown */}
             </div>
          )}
        </div>

        <div className="footer-left">
          Developed by <strong>Softview Technologies</strong> | Contact: 7972084304
        </div>
      </div>
    </div>
  );
}