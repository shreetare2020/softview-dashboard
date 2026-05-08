import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from "./firebase"; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc } from "firebase/firestore";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from 'xlsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [dateTime, setDateTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [banks, setBanks] = useState([]);
  const [firms, setFirms] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [form, setForm] = useState({});
  const [selectedFirm, setSelectedFirm] = useState("All");
  const [expandedBank, setExpandedBank] = useState(null);
  const [newPass, setNewPass] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    if (user) {
      onSnapshot(collection(db, "firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "banks"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "users"), s => setUsersList(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
    return () => unsub();
  }, [user]);

  const exportPDF = (bankData) => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.setTextColor(10, 14, 46);
    doc.text("BANK TRANSACTION LEDGER", 14, 20);
    doc.setFontSize(10); doc.text(`Bank: ${bankData.bankName} | A/c: ${bankData.accNo}`, 14, 28);
    doc.autoTable({
      startY: 35,
      head: [['Date', 'Particulars', 'Debit', 'Credit', 'Balance']],
      body: [['08/05/2026', 'Opening Balance', '-', bankData.balance, bankData.balance]],
      headStyles: { fillColor: [10, 14, 46], textColor: [255, 202, 40] }
    });
    doc.save(`${bankData.bankName}_Ledger.pdf`);
  };

  const exportExcel = (bankData) => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["BANK TRANSACTION LEDGER"],
      [`Bank: ${bankData.bankName}`, `A/c: ${bankData.accNo}`],
      ["Date", "Particulars", "Debit", "Credit", "Balance"],
      ["08/05/2026", "Opening Balance", 0, bankData.balance, bankData.balance]
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, `${bankData.bankName}_Report.xlsx`);
  };

  const handleSave = async (coll) => {
    await addDoc(collection(db, coll), { ...form, createdAt: new Date() });
    setForm({}); alert("Saved Successfully!");
  };

  if (!user) return <LoginScreen />;

  return (
    <div className="app-shell">
      <div className="sidebar">
        <div className="sidebar-logo">BANKING PRO</div>
        <div className="nav-group">
          {['Dashboard', 'Firm Master', 'Bank Master', 'User Master', 'Settings'].map(t => (
            <div key={t} className={`nav-item ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t}</div>
          ))}
        </div>
        <button className="btn-logout" onClick={() => signOut(auth)}>LOGOUT</button>
      </div>

      <div className="main-stage">
        <div className="header-premium">
          <div className="welcome-msg">WELCOME, ADMIN</div>
          <div className="clock-msg">{dateTime.toLocaleDateString('en-GB')} | {dateTime.toLocaleTimeString()}</div>
        </div>

        {activeTab === "Dashboard" && (
          <div className="premium-card">
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
              <h3>Live Bank Ledger Dashboard</h3>
              <select className="firm-select" onChange={(e) => setSelectedFirm(e.target.value)}>
                <option value="All">-- All Firms --</option>
                {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
            </div>
            <table className="list-table">
              <thead><tr><th>Bank Name</th><th>Account No</th><th>Balance</th><th>Action</th></tr></thead>
              <tbody>
                {banks.filter(b => selectedFirm === "All" || b.firmLink === selectedFirm).map(b => (
                  <React.Fragment key={b.id}>
                    <tr>
                      <td><strong>{b.bankName}</strong></td><td>{b.accNo}</td>
                      <td style={{color:'green', fontWeight:'bold'}}>₹ {b.balance} CR</td>
                      <td><button className="btn-save" onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}>
                        {expandedBank === b.id ? "Close" : "Expand Ledger"}</button></td>
                    </tr>
                    {expandedBank === b.id && (
                      <tr>
                        <td colSpan="4" style={{background:'#f9f9f9', padding:'15px'}}>
                          <button onClick={() => exportExcel(b)} className="btn-save" style={{background:'#1D6F42', marginRight:'10px'}}>Excel</button>
                          <button onClick={() => exportPDF(b)} className="btn-save" style={{background:'#E11D48'}}>PDF</button>
                          <table className="list-table" style={{marginTop:'10px'}}>
                            <thead><tr style={{background:'#0a0e2e', color:'white'}}><th>Date</th><th>Particulars</th><th>Dr</th><th>Cr</th><th>Balance</th></tr></thead>
                            <tbody><tr><td>08/05/2026</td><td>Opening Balance</td><td>-</td><td>{b.balance}</td><td>{b.balance}</td></tr></tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "Firm Master" && (
          <div className="premium-card">
            <h3>Firm Master</h3>
            <div className="master-form-grid">
              <input placeholder="Firm Name" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
              <input placeholder="GST No" value={form.gst || ''} onChange={e => setForm({...form, gst: e.target.value})} />
            </div>
            <button className="btn-save" onClick={() => handleSave("firms")}>SAVE FIRM</button>
          </div>
        )}

        {activeTab === "Bank Master" && (
          <div className="premium-card">
            <h3>Bank Master</h3>
            <div className="master-form-grid">
              <input placeholder="Bank Name" value={form.bankName || ''} onChange={e => setForm({...form, bankName: e.target.value})} />
              <input placeholder="A/c No" value={form.accNo || ''} onChange={e => setForm({...form, accNo: e.target.value})} />
              <input placeholder="Balance" value={form.balance || ''} onChange={e => setForm({...form, balance: e.target.value})} />
              <select onChange={e => setForm({...form, firmLink: e.target.value})}>
                <option>Select Firm</option>
                {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
            </div>
            <button className="btn-save" onClick={() => handleSave("banks")}>SAVE BANK</button>
          </div>
        )}

        {activeTab === "User Master" && (
          <div className="premium-card">
            <h3>User Master</h3>
            <div className="master-form-grid">
              <input placeholder="User Name" value={form.uName || ''} onChange={e => setForm({...form, uName: e.target.value})} />
              <input placeholder="Email" value={form.uEmail || ''} onChange={e => setForm({...form, uEmail: e.target.value})} />
            </div>
            <button className="btn-save" onClick={() => handleSave("users")}>SAVE USER</button>
          </div>
        )}

        {activeTab === "Settings" && (
          <div className="premium-card">
            <h3>Change Password</h3>
            <input type="password" placeholder="New Password" onChange={e => setNewPass(e.target.value)} />
            <button className="btn-save" onClick={() => updatePassword(auth.currentUser, newPass).then(() => alert("Updated!"))}>UPDATE</button>
          </div>
        )}

        <div className="footer-branding-mini">
          <div className="sv-title">Developed by: SOFTVIEW TECHNOLOGIES</div>
          <div className="sv-mob">+91 7972084304</div>
        </div>
      </div>
    </div>
  );
}

function LoginScreen() {
  const [e, setE] = useState("");
  const [p, setP] = useState("");
  return (
    <div className="login-screen">
      <div className="login-card">
        <h1>BANKING PRO</h1>
        <form onSubmit={(ev) => { ev.preventDefault(); signInWithEmailAndPassword(auth, e, p); }}>
          <input placeholder="Email" onChange={ev => setE(ev.target.value)} required />
          <input type="password" placeholder="Password" onChange={ev => setP(ev.target.value)} required />
          <button type="submit">LOGIN TO SYSTEM</button>
        </form>
      </div>
    </div>
  );
}