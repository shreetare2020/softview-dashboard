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
  const [selectedFirm, setSelectedFirm] = useState("");
  const [expandedBank, setExpandedBank] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => { clearInterval(timer); unsubscribe(); };
  }, []);

  useEffect(() => {
    if (user) {
      onSnapshot(collection(db, "firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "banks"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
  }, [user]);

  const exportExcel = (b) => {
    const ws = XLSX.utils.json_to_sheet([{ Date: '07/05/2026', Particulars: 'Opening Balance', Receipt: b.openingBal, Payment: 0, Balance: b.balance }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, `${b.bankName}_Ledger.xlsx`);
  };

  const exportPDF = (b) => {
    const doc = new jsPDF();
    doc.text(`Ledger: ${b.bankName}`, 14, 15);
    doc.autoTable({ head: [['Date', 'Particulars', 'Receipt', 'Payment', 'Balance']], body: [['07/05/2026', 'Opening Balance', b.openingBal, '0', b.balance]] });
    doc.save(`${b.bankName}_Ledger.pdf`);
  };

  if (!user) return (
    <div className="login-screen">
      <div className="login-card">
        <h1 style={{color: '#b58921'}}>BANKING PRO</h1>
        <p>CA Enterprise Portal</p>
        <form onSubmit={(e) => { e.preventDefault(); signInWithEmailAndPassword(auth, e.target.email.value, e.target.pass.value); }}>
          <input name="email" type="email" placeholder="Email" required />
          <input name="pass" type="password" placeholder="Password" required />
          <button type="submit" className="btn-gold">AUTHORIZE</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="app-shell">
      <div className="sidebar">
        <div className="sidebar-brand">BANKING PRO</div>
        <div className="nav-links">
          {['Dashboard', 'Firm Master', 'Bank Master', 'User Master'].map(t => (
            <div key={t} className={`nav-item ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t}</div>
          ))}
        </div>
        <div className="sidebar-footer">Developed by <strong>Softview Technologies</strong><br/>Contact: 7972084304</div>
      </div>

      <div className="main-stage">
        <div className="top-right-header">
          <span style={{fontWeight: 700}}>{user.email}</span>
          <span className="live-time">{currentTime.toLocaleDateString('en-GB')} || {currentTime.toLocaleTimeString()}</span>
          <button onClick={() => signOut(auth)} style={{background:'#fee2e2', color:'#ef4444', border:'none', padding:'8px 15px', borderRadius:'8px', cursor:'pointer'}}>Logout</button>
        </div>

        {activeTab === "Dashboard" && (
          <div>
            <div className="filter-container">
              <h2 style={{margin:0}}>Bank Summary</h2>
              <select className="pro-select" value={selectedFirm} onChange={(e) => setSelectedFirm(e.target.value)}>
                <option value="">-- Select Firm --</option>
                {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
            </div>

            {selectedFirm ? (
              <div className="card">
                <table className="pro-table">
                  <thead><tr><th>Bank Name</th><th>A/c No</th><th>Balance</th><th>Action</th></tr></thead>
                  <tbody>
                    {banks.filter(b => b.firmName === selectedFirm).map(b => (
                      <React.Fragment key={b.id}>
                        <tr>
                          <td><strong>{b.bankName}</strong></td>
                          <td>{b.accNo}</td>
                          <td style={{color:'#16a34a', fontWeight:700}}>₹ {b.balance}</td>
                          <td><button className="btn-gold" style={{padding:'5px 10px', width:'auto'}} onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}>Ledger</button></td>
                        </tr>
                        {expandedBank === b.id && (
                          <tr>
                            <td colSpan="4">
                              <div className="ledger-box">
                                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
                                  <h4>Account Statement</h4>
                                  <div>
                                    <button onClick={() => exportExcel(b)} style={{background:'#16a34a', color:'white', border:'none', padding:'5px 10px', borderRadius:'5px', marginRight:'5px'}}>Excel</button>
                                    <button onClick={() => exportPDF(b)} style={{background:'#dc2626', color:'white', border:'none', padding:'5px 10px', borderRadius:'5px'}}>PDF</button>
                                  </div>
                                </div>
                                <table className="pro-table">
                                  <thead><tr><th>Date</th><th>Particulars</th><th>Receipt</th><th>Payment</th><th>Balance</th></tr></thead>
                                  <tbody><tr><td>07/05/2026</td><td>Opening Balance</td><td>{b.openingBal}</td><td>0</td><td>{b.balance}</td></tr></tbody>
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
            ) : <div className="card">Please select a firm to load data.</div>}
          </div>
        )}
      </div>
    </div>
  );
}