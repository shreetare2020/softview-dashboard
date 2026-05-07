import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from "./firebase"; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc } from "firebase/firestore";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function App() {
  const [user, setUser] = useState(null);
  const [clock, setClock] = useState(new Date());
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [banks, setBanks] = useState([]);
  const [firms, setFirms] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedFirm, setSelectedFirm] = useState("All");

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => setUser(u));
    if (user) {
      onSnapshot(collection(db, "firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "banks"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
  }, [user]);

  // Point 9: PDF Export Fix (Strict Logic)
  const downloadPDF = (bank) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("BANK ACCOUNT LEDGER", 14, 15);
    doc.setFontSize(10);
    doc.text(`Bank Name: ${bank.bankName} | A/c No: ${bank.accNo}`, 14, 25);
    
    doc.autoTable({
      startY: 30,
      head: [['Date', 'Particulars', 'Receipt (CR)', 'Payment (DR)', 'Balance']],
      body: [['01-04-2026', 'Opening Balance', '-', '-', bank.balance + ' CR']],
      headStyles: { fillColor: [10, 14, 46], textColor: [255, 202, 40] }, // Dark Blue & Gold
      styles: { fontSize: 9 }
    });
    doc.save(`${bank.bankName}_Ledger.pdf`);
  };

  if (!user) return <LoginScreen />;

  return (
    <div className="app-shell">
      {/* Sidebar with Logout at Bottom Left */}
      <div className="sidebar">
        <div className="sidebar-brand">BANKING PRO</div>
        <div className="nav-items">
          {['Dashboard', 'Firm Master', 'Bank Master', 'User Master'].map(tab => (
            <div key={tab} className={`nav-item ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</div>
          ))}
        </div>
        <div className="logout-area">
          <button className="btn-logout" onClick={() => signOut(auth)}>LOGOUT</button>
        </div>
      </div>

      <div className="main-stage">
        {/* Top Header - Welcome & Clock */}
        <div className="header-top">
          <div className="welcome">Welcome, <strong>{user.email}</strong></div>
          <div className="clock">{clock.toLocaleDateString('en-GB')} | {clock.toLocaleTimeString()}</div>
        </div>

        {activeTab === "Dashboard" && (
          <div className="card">
            <div className="filter-box">
              <label>Select Firm Here:</label>
              <select onChange={(e) => setSelectedFirm(e.target.value)}>
                <option value="All">All Banks</option>
                {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
            </div>
            <table className="pro-table">
              <thead><tr><th>Bank Details</th><th>A/c No</th><th>Balance</th><th>Action</th></tr></thead>
              <tbody>
                {banks.filter(b => selectedFirm === "All" || b.firmName === selectedFirm).map(bank => (
                  <React.Fragment key={bank.id}>
                    <tr>
                      <td><strong>{bank.bankName}</strong><br/><small>{bank.branch}</small></td>
                      <td>{bank.accNo}</td>
                      <td className="bal">₹ {bank.balance} CR</td>
                      <td><button onClick={() => setExpandedId(expandedId === bank.id ? null : bank.id)}>View Ledger</button></td>
                    </tr>
                    {expandedId === bank.id && (
                      <tr>
                        <td colSpan="4">
                          <div className="ledger-expanded">
                            <div className="ledger-actions">
                              <button onClick={() => downloadPDF(bank)} className="btn-pdf">Download PDF</button>
                            </div>
                            <table className="inner-table">
                              <thead><tr><th>Date</th><th>Particular</th><th>CR</th><th>DR</th><th>Balance</th></tr></thead>
                              <tbody><tr><td>01/04/2026</td><td>Opening Balance</td><td>-</td><td>-</td><td>{bank.balance} CR</td></tr></tbody>
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
        
        {/* Footer Branding */}
        <div className="footer-branded">
          <p className="softview-name">Developed by: SOFTVIEW TECHNOLOGIES</p>
          <p className="softview-num">+91 7972084304</p>
        </div>
      </div>
    </div>
  );
}

function LoginScreen() {
  const [e, setE] = useState("");
  const [p, setP] = useState("");
  return (
    <div className="login-full">
      <div className="login-container">
        <h1>BANKING PRO</h1>
        {/* Point: "a Project by Softview Technologies" title ana niche */}
        <p className="login-subtitle">a Project by Softview Technologies</p>
        <form onSubmit={(ev) => { ev.preventDefault(); signInWithEmailAndPassword(auth, e, p); }}>
          <input placeholder="Email" onChange={ev => setE(ev.target.value)} required />
          <input type="password" placeholder="Password" onChange={ev => setP(ev.target.value)} required />
          <button type="submit">LOGIN TO SYSTEM</button>
        </form>
      </div>
    </div>
  );
}