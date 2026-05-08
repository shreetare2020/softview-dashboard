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
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    if (user) {
      onSnapshot(collection(db, "firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "banks"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "users"), s => setUsersList(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
    return () => unsub();
  }, [user]);

  // --- PREMIUM PDF EXPORT (FIXED) ---
  const exportPDF = (bankData) => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.setTextColor(10, 14, 46);
      doc.text("BANK TRANSACTION LEDGER", 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Bank: ${bankData.bankName} | A/c: ${bankData.accNo}`, 14, 28);

      doc.autoTable({
        startY: 35,
        head: [['Date', 'Particulars', 'Debit', 'Credit', 'Balance']],
        body: [['08/05/2026', 'Opening Balance', '-', bankData.balance, bankData.balance]],
        headStyles: { fillColor: [10, 14, 46], textColor: [255, 202, 40], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });
      doc.save(`${bankData.bankName}_Ledger.pdf`);
    } catch (err) { alert("PDF Error: " + err.message); }
  };

  // --- COLORFUL EXCEL EXPORT (FIXED) ---
  const exportExcel = (bankData) => {
    const header = [["BANK TRANSACTION LEDGER"], [`Bank: ${bankData.bankName}`, `A/c: ${bankData.accNo}`], [""]];
    const tableHeader = [["Date", "Particulars", "Debit", "Credit", "Balance"]];
    const tableBody = [["08/05/2026", "Opening Balance", 0, bankData.balance, bankData.balance]];
    
    const ws = XLSX.utils.aoa_to_sheet([...header, ...tableHeader, ...tableBody]);
    
    // Cell styling (Colorful headers)
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + "4"; // Header row is 4
      if (!ws[address]) continue;
      ws[address].s = { fill: { fgColor: { rgb: "0A0E2E" } }, font: { color: { rgb: "FFCA28" }, bold: true } };
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, `${bankData.bankName}_Report.xlsx`);
  };

  const handleSave = async (coll) => {
    await addDoc(collection(db, coll), { ...form, status: 'Open', createdAt: new Date() });
    setForm({}); alert("Saved!");
  };

  const handleDelete = async (coll, id) => {
    if(window.confirm("Are you sure?")) await deleteDoc(doc(db, coll, id));
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

        {/* 1. DASHBOARD WITH EXPORT & LEDGER */}
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
                      <td><button className="btn-save" style={{padding:'5px 12px'}} onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}>{expandedBank === b.id ? "Close" : "Expand Ledger"}</button></td>
                    </tr>
                    {expandedBank === b.id && (
                      <tr>
                        <td colSpan="4" style={{background:'#fdfdfd', padding:'15px', border:'1px solid #eee'}}>
                          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
                            <h4 style={{fontSize:'14px'}}>Transactions: {b.bankName}</h4>
                            <div>
                              <button onClick={() => exportExcel(b)} style={{background:'#1D6F42', color:'white', border:'none', padding:'5px 12px', borderRadius:'4px', marginRight:'8px', cursor:'pointer'}}>Excel</button>
                              <button onClick={() => exportPDF(b)} style={{background:'#E11D48', color:'white', border:'none', padding:'5px 12px', borderRadius:'4px', cursor:'pointer'}}>PDF</button>
                            </div>
                          </div>
                          <table className="list-table" style={{fontSize:'12px'}}>
                            <thead style={{background:'#0a0e2e', color:'white'}}><tr><th>Date</th><th>Particulars</th><th>Dr</th><th>Cr</th><th>Balance</th></tr></thead>
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

        {/* 2. FIRM MASTER (RESTORED) */}
        {activeTab === "Firm Master" && (
          <div className="premium-card">
            <h3>Firm Master</h3>
            <div className="master-form-grid">
              <input placeholder="Firm Name" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
              <input placeholder="GST No" value={form.gst || ''} onChange={e => setForm({...form, gst: e.target.value})} />
            </div>
            <button className="btn-save" onClick={() => handleSave("firms")}>SAVE FIRM</button>
            <div style={{marginTop:'20px'}}>
              <h4>Firms List</h4>
              <table className="list-table">
                <thead><tr><th>Name</th><th>GST</th><th>Action</th></tr></thead>
                <tbody>{firms.map(f => (<tr key={f.id}><td>{f.name}</td><td>{f.gst}</td><td><b style={{color:'red', cursor:'pointer'}} onClick={()=>handleDelete("firms", f.id)}>Delete</b></td></tr>))}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. BANK MASTER (RESTORED) */}
        {activeTab === "Bank Master" && (
          <div className="premium-card">
            <h3>Bank Master</h3>
            <div className="master-form-grid">
              <input placeholder="Bank Name" value={form.bankName || ''} onChange={e => setForm({...form, bankName: e.target.value})} />