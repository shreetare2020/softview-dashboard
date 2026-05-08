import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from "./firebase"; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc } from "firebase/firestore";

// Export Libraries
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
    onAuthStateChanged(auth, (u) => setUser(u));
    if (user) {
      onSnapshot(collection(db, "firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "banks"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "users"), s => setUsersList(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
  }, [user]);

  // --- PREMIUM PDF EXPORT LOGIC ---
  const exportPDF = (bankData) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(10, 14, 46); // Deep Blue
    doc.text("BANK TRANSACTION LEDGER", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Bank: ${bankData.bankName} | A/c: ${bankData.accNo}`, 14, 28);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 33);

    doc.autoTable({
      startY: 40,
      head: [['Date', 'Particulars', 'Debit (Dr)', 'Credit (Cr)', 'Balance']],
      body: [
        ['08/05/2026', 'Opening Balance', '-', bankData.balance, bankData.balance],
        // Future transactions will map here
      ],
      headStyles: { fillColor: [10, 14, 46], textColor: [255, 202, 40] }, // Blue & Gold
      alternateRowStyles: { fillColor: [240, 242, 245] },
      margin: { top: 40 }
    });
    doc.save(`${bankData.bankName}_Ledger.pdf`);
  };

  // --- COLORFUL EXCEL EXPORT LOGIC ---
  const exportExcel = (bankData) => {
    const data = [
      ["BANK TRANSACTION LEDGER"],
      [`Bank Name: ${bankData.bankName}`, `Account No: ${bankData.accNo}`],
      ["Date", "Particulars", "Debit", "Credit", "Balance"],
      ["08/05/2026", "Opening Balance", 0, bankData.balance, bankData.balance]
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, `${bankData.bankName}_Report.xlsx`);
  };

  const handleSave = async (coll) => {
    await addDoc(collection(db, coll), { ...form, status: 'Open', createdAt: new Date() });
    setForm({}); alert("Data Saved Successfully!");
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
                      <td>
                        <button className="btn-save" style={{padding:'5px 15px'}} onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}>
                          {expandedBank === b.id ? "Hide" : "Expand Ledger"}
                        </button>
                      </td>
                    </tr>
                    {expandedBank === b.id && (
                      <tr>
                        <td colSpan="4" style={{background:'#f9f9f9', padding:'20px', border:'1px solid #ddd'}}>
                          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
                            <h4 style={{color:'#0a0e2e'}}>Transaction History for {b.bankName}</h4>
                            <div>
                              <button onClick={() => exportExcel(b)} style={{background:'#1D6F42', color:'white', padding:'8px 15px', border:'none', borderRadius:'5px', marginRight:'10px', cursor:'pointer', fontWeight:'bold'}}>Excel Export</button>
                              <button onClick={() => exportPDF(b)} style={{background:'#E11D48', color:'white', padding:'8px 15px', border:'none', borderRadius:'5px', cursor:'pointer', fontWeight:'bold'}}>PDF Export</button>
                            </div>
                          </div>
                          <table className="list-table" style={{background:'white'}}>
                            <thead><tr style={{background:'#0a0e2e'}}><th style={{color:'#ffca28'}}>Date</th><th style={{color:'#ffca28'}}>Particulars</th><th style={{color:'#ffca28'}}>Dr</th><th style={{color:'#ffca28'}}>Cr</th><th style={{color:'#ffca28'}}>Balance</th></tr></thead>
                            <tbody><tr><td>08/05/2026</td><td>Opening Balance</td><td>0</td><td>{b.balance}</td><td>{b.balance}</td></tr></tbody>
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

        {/* --- BANK MASTER SECTION --- */}
        {activeTab === "Bank Master" && (
          <div className="premium-card">
            <h3>Bank Master</h3>
            <div className="master-form-grid">
              <input placeholder="Bank Name" value={form.bankName || ''} onChange={e => setForm({...form, bankName: e.target.value})} />
              <input placeholder="Branch" value={form.branch || ''} onChange={e => setForm({...form, branch: e.target.value})} />
              <input placeholder="A/c No" value={form.accNo || ''} onChange={e => setForm({...form, accNo: e.target.value})} />
              <input placeholder="IFSC" value={form.ifsc || ''} onChange={e => setForm({...form, ifsc: e.target.value})} />
              <input placeholder="Balance" value={form.balance || ''} onChange={e => setForm({...form, balance: e.target.value})} />
              <select onChange={e => setForm({...form, firmLink: e.target.value})}>
                <option>Select Firm</option>
                {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
            </div>
            <button className="btn-save" onClick={() => handleSave("banks")}>SAVE BANK</button>
          </div>
        )}

        {/* --- FIRM & USER MASTERS (Add your logic here) --- */}

        {activeTab === "Settings" && (
          <div className="premium-card">
            <h3>Change Password</h3>
            <div className="master-form-grid" style={{maxWidth:'300px'}}>
              <input type="password" placeholder="New Password" value={newPass} onChange={e => setNewPass(e.target.value)} />
              <button className="btn-save" onClick={() => { updatePassword(auth.currentUser, newPass).then(()=>alert("Done!")); }}>UPDATE</button>
            </div>
          </div>
        )}

        <div className="footer-branding">
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
          <button type="submit">LOGIN</button>
        </form>
      </div>
    </div>
  );
}