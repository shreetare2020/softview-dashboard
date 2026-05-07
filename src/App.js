import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from "./firebase"; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc } from "firebase/firestore";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [banks, setBanks] = useState([]);
  const [firms, setFirms] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedFirm, setSelectedFirm] = useState("All");

  useEffect(() => {
    onAuthStateChanged(auth, (u) => setUser(u));
    if (user) {
      onSnapshot(collection(db, "firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "banks"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
  }, [user]);

  const generatePDF = (bank) => {
    const doc = new jsPDF();
    doc.text(`Account Ledger: ${bank.bankName}`, 14, 15);
    doc.autoTable({
      startY: 20,
      head: [['Date', 'Particulars', 'Receipt', 'Payment', 'Balance']],
      body: [['01-04-2026', 'Opening Balance', '-', '-', bank.balance + ' CR']],
      headStyles: { fillColor: [10, 14, 46] }
    });
    doc.save(`${bank.bankName}.pdf`);
  };

  if (!user) return <LoginScreen />;

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-logo">BANKING PRO</div>
        {['Dashboard', 'Firm Master', 'Bank Master', 'User Master'].map(t => (
          <button key={t} className={`nav-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t}</button>
        ))}
        <div className="logout-container">
          <button className="btn-logout" onClick={() => signOut(auth)}>LOGOUT</button>
        </div>
      </div>

      <div className="main-content">
        <div className="header-right">
          <p className="welcome-txt">Welcome, {user.email}</p>
          <p className="clock-txt">{new Date().toLocaleString()}</p>
        </div>

        {activeTab === "Dashboard" && (
          <div className="card">
            <h2 style={{marginBottom: '15px'}}>Dashboard</h2>
            <select onChange={(e) => setSelectedFirm(e.target.value)} style={{padding: '8px', marginBottom: '20px'}}>
              <option value="All">All Firms</option>
              {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
            </select>
            <table border="1" cellPadding="10" style={{width: '100%', borderCollapse: 'collapse'}}>
              <thead style={{background: '#eee'}}>
                <tr><th>Bank</th><th>A/c No</th><th>Balance</th><th>Action</th></tr>
              </thead>
              <tbody>
                {banks.filter(b => selectedFirm === "All" || b.firmName === selectedFirm).map(b => (
                  <React.Fragment key={b.id}>
                    <tr>
                      <td>{b.bankName}</td><td>{b.accNo}</td>
                      <td style={{color: 'green', fontWeight: 'bold'}}>₹ {b.balance}</td>
                      <td><button onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}>Ledger</button></td>
                    </tr>
                    {expandedId === b.id && (
                      <tr><td colSpan="4">
                        <div className="ledger-box">
                          <button onClick={() => generatePDF(b)} style={{background: 'red', color: 'white', padding: '5px 10px', marginBottom: '10px', border: 'none'}}>Download PDF</button>
                          <table border="1" width="100%" style={{borderCollapse: 'collapse', background: 'white'}}>
                            <thead><tr><th>Date</th><th>Particular</th><th>CR</th><th>DR</th><th>Bal</th></tr></thead>
                            <tbody><tr><td>01/04/2026</td><td>Opening Balance</td><td>-</td><td>-</td><td>{b.balance}</td></tr></tbody>
                          </table>
                        </div>
                      </td></tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="footer-right">
          <div className="softview-brand">Developed by: SOFTVIEW TECHNOLOGIES</div>
          <div className="softview-phone">+91 7972084304</div>
        </div>
      </div>
    </div>
  );
}

function LoginScreen() {
  const [e, setE] = useState("");
  const [p, setP] = useState("");
  const handleLogin = (ev) => { ev.preventDefault(); signInWithEmailAndPassword(auth, e, p); };
  return (
    <div className="login-screen">
      <div className="login-card">
        <h1>BANKING PRO</h1>
        <p className="login-subtitle">a Project by Softview Technologies</p>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email" style={{width: '100%', padding: '10px', margin: '10px 0'}} onChange={ev => setE(ev.target.value)} required />
          <input type="password" placeholder="Password" style={{width: '100%', padding: '10px', margin: '10px 0'}} onChange={ev => setP(ev.target.value)} required />
          <button type="submit" style={{width: '100%', padding: '12px', background: '#0a0e2e', color: '#ffca28', border: 'none', cursor: 'pointer', fontWeight: 'bold'}}>LOGIN TO SYSTEM</button>
        </form>
      </div>
    </div>
  );
}