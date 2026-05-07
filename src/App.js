import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from "./firebase"; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc } from "firebase/firestore";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [dateTime, setDateTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [banks, setBanks] = useState([]);
  const [firms, setFirms] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [selectedFirm, setSelectedFirm] = useState("All");
  const [expandedId, setExpandedId] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
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

  // 9) Colorful PDF Logic
  const exportPDF = (bank) => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.setTextColor(10, 14, 46);
    doc.text("BANK ACCOUNT LEDGER", 14, 15);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`Bank: ${bank.bankName} | A/c No: ${bank.accNo}`, 14, 22);
    
    doc.autoTable({
      startY: 30,
      head: [['Date', 'Particulars', 'Receipt (CR)', 'Payment (DR)', 'Balance']],
      body: [['01-04-2026', 'Opening Balance', '-', '-', bank.balance + ' CR']],
      headStyles: { fillColor: [10, 14, 46], textColor: [255, 202, 40] },
      styles: { cellPadding: 3, fontSize: 9 }
    });
    doc.save(`${bank.bankName}_Ledger.pdf`);
  };

  const handleSave = async (coll) => {
    await addDoc(collection(db, coll), { ...form, status: 'Open' });
    setForm({}); alert("Saved Successfully!");
  };

  if (!user) return <LoginScreen />;

  return (
    <div className="app-shell">
      {/* Sidebar with Logout (Point 3) */}
      <div className="sidebar">
        <div className="sidebar-logo">BANKING PRO</div>
        <div className="nav-group">
          {['Dashboard', 'Firm Master', 'Bank Master', 'User Master'].map(t => (
            <div key={t} className={`nav-item ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t}</div>
          ))}
        </div>
        <div className="logout-box">
          <button className="btn-logout" onClick={() => signOut(auth)}>LOGOUT</button>
        </div>
      </div>

      <div className="main-stage">
        {/* Header (Point 1 & 2) */}
        <div className="header-top">
          <div className="welcome-txt">Welcome, {user.email}</div>
          <div className="live-clock">{dateTime.toLocaleDateString('en-GB')} | {dateTime.toLocaleTimeString()}</div>
        </div>

        {/* Dashboard (Point 5, 6, 7, 8) */}
        {activeTab === "Dashboard" && (
          <div className="card">
            <div style={{marginBottom:'20px'}}>
              <label style={{fontWeight:'bold'}}>SELECT FIRM: </label>
              <select style={{padding:'8px', borderRadius:'5px'}} onChange={(e) => setSelectedFirm(e.target.value)}>
                <option value="All">-- All Firms --</option>
                {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
            </div>
            <table className="pro-table">
              <thead><tr><th>Bank Name</th><th>Account No</th><th>Balance</th><th>Action</th></tr></thead>
              <tbody>
                {banks.filter(b => selectedFirm === "All" || b.firmName === selectedFirm).map(b => (
                  <React.Fragment key={b.id}>
                    <tr>
                      <td>{b.bankName}</td><td>{b.accNo}</td>
                      <td style={{color:'green', fontWeight:'bold'}}>₹ {b.balance} CR</td>
                      <td><button onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}>{expandedId === b.id ? 'Close' : 'View'}</button></td>
                    </tr>
                    {expandedId === b.id && (
                      <tr><td colSpan="4">
                        <div style={{background:'#fffdf0', padding:'20px', border:'1px solid #ddd', borderRadius:'8px'}}>
                           <div style={{textAlign:'right', marginBottom:'10px'}}>
                             <button onClick={() => exportPDF(b)} style={{background:'#d32f2f', color:'white', padding:'5px 12px', border:'none', marginRight:'5px'}}>PDF</button>
                             <button style={{background:'#2e7d32', color:'white', padding:'5px 12px', border:'none'}}>Excel</button>
                           </div>
                           <table className="pro-table" style={{background:'white'}}>
                             <thead><tr><th>Date</th><th>Particulars</th><th>Dr</th><th>Cr</th><th>Balance</th></tr></thead>
                             <tbody><tr><td>01/04/2026</td><td>Opening Balance</td><td>-</td><td>-</td><td>{b.balance} CR</td></tr></tbody>
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

        {/* 11) Bank Master (Fixed Content) */}
        {activeTab === "Bank Master" && (
          <div className="card">
            <h3>Bank Master</h3>
            <div className="form-grid">
              <input placeholder="Bank Name" value={form.bankName || ''} onChange={e => setForm({...form, bankName: e.target.value})} />
              <input placeholder="Branch" value={form.branch || ''} onChange={e => setForm({...form, branch: e.target.value})} />
              <input placeholder="Account No" value={form.accNo || ''} onChange={e => setForm({...form, accNo: e.target.value})} />
              <input placeholder="IFSC Code" value={form.ifsc || ''} onChange={e => setForm({...form, ifsc: e.target.value})} />
              <input placeholder="Opening Balance" value={form.balance || ''} onChange={e => setForm({...form, balance: e.target.value})} />
              <select value={form.firmName || ''} onChange={e => setForm({...form, firmName: e.target.value})}>
                <option>Link to Firm</option>
                {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
            </div>
            <button className="btn-save" onClick={() => handleSave("banks")}>SAVE BANK</button>
          </div>
        )}

        {/* 10) Firm Master */}
        {activeTab === "Firm Master" && (
          <div className="card">
            <h3>Firm Master</h3>
            <div className="form-grid">
              <input placeholder="Firm Name" onChange={e => setForm({...form, name: e.target.value})} />
              <input placeholder="Address" onChange={e => setForm({...form, address: e.target.value})} />
              <input placeholder="GST No" onChange={e => setForm({...form, gst: e.target.value})} />
            </div>
            <button className="btn-save" onClick={() => handleSave("firms")}>SAVE FIRM</button>
          </div>
        )}

        {/* 12) User Master */}
        {activeTab === "User Master" && (
          <div className="card">
            <h3>User Master</h3>
            <div className="form-grid">
              <input placeholder="User ID" onChange={e => setForm({...form, uId: e.target.value})} />
              <input placeholder="Full Name" onChange={e => setForm({...form, uName: e.target.value})} />
              <input placeholder="Email" onChange={e => setForm({...form, uEmail: e.target.value})} />
              <input placeholder="Mobile No" onChange={e => setForm({...form, uMobile: e.target.value})} />
              <input type="password" placeholder="Password" onChange={e => setForm({...form, pass: e.target.value})} />
            </div>
            <button className="btn-save" onClick={() => handleSave("users")}>SAVE USER</button>
          </div>
        )}

        {/* Branding Footer (Point 4) */}
        <div className="footer-lock">
          <div className="softview-text">Developed by: SOFTVIEW TECHNOLOGIES</div>
          <div className="softview-phone">+91 7972084304</div>
        </div>
      </div>
    </div>
  );
}

function LoginScreen() {
  const [e, setE] = useState("");
  const [p, setP] = useState("");
  return (
    <div className="login-bg">
      <div className="login-box">
        <h1 style={{color: '#0a0e2e'}}>BANKING PRO</h1>
        <p className="login-subtitle">a Project by Softview Technologies</p>
        <form onSubmit={(ev) => { ev.preventDefault(); signInWithEmailAndPassword(auth, e, p); }}>
          <input placeholder="Email" style={{width:'100%', padding:'12px', margin:'10px 0'}} onChange={ev => setE(ev.target.value)} required />
          <input type="password" placeholder="Password" style={{width:'100%', padding:'12px', margin:'10px 0'}} onChange={ev => setP(ev.target.value)} required />
          <button type="submit" style={{width:'100%', padding:'12px', background:'#0a0e2e', color:'#ffca28', border:'none', borderRadius:'5px', fontWeight:'bold'}}>LOGIN TO SYSTEM</button>
        </form>
      </div>
    </div>
  );
}