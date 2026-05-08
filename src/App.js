import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from "./firebase"; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc } from "firebase/firestore";
import { Settings, LayoutDashboard, Building2, Landmark, Users, LogOut, ChevronDown, ShieldCheck, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from "jspdf";
import "jspdf-autotable";

export default function App() {
  const [user, setUser] = useState(null);
  const [dateTime, setDateTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [banks, setBanks] = useState([]);
  const [firms, setFirms] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [form, setForm] = useState({});
  const [expandedBank, setExpandedBank] = useState(null);
  const [firmFilter, setFirmFilter] = useState("All");

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    if (user) {
      onSnapshot(collection(db, "firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "banks"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "users"), s => setUsersList(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
    return () => { clearInterval(timer); unsub(); };
  }, [user]);

  const exportData = (b, type) => {
    const data = [
      { date: '08/05/2026', desc: 'Opening Balance', dr: '-', cr: b.balance, bal: b.balance + ' Cr.' },
      { date: '08/05/2026', desc: 'Sample Transaction', dr: '-', cr: '5,000', bal: (parseFloat(b.balance) + 5000) + ' Cr.' }
    ];
    if (type === 'excel') {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Ledger");
      XLSX.writeFile(wb, `${b.bankName}_Ledger.xlsx`);
    } else {
      const doc = new jsPDF();
      doc.setFillColor(10, 14, 46); doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(212, 175, 55); doc.text("BANK TRANSACTION LEDGER", 14, 25);
      doc.autoTable({
        startY: 45,
        head: [['Date', 'Particulars', 'Debit', 'Credit', 'Balance']],
        body: data.map(r => [r.date, r.desc, r.dr, r.cr, r.bal]),
        headStyles: { fillColor: [10, 14, 46], textColor: [212, 175, 55] }
      });
      doc.save(`${b.bankName}_Ledger.pdf`);
    }
  };

  const filteredBanks = firmFilter === "All" ? banks : banks.filter(b => b.firmLink === firmFilter);

  if (!user) return <LoginScreen />;

  return (
    <div className="layout-root">
      <aside className="sidebar-premium">
        <div className="sidebar-top">
          <h2 className="gold-txt">BANKING PRO</h2>
          <p className="version-txt">EXECUTIVE VERSION 2.0</p>
        </div>
        <nav className="nav-col">
          <div className={activeTab === "Dashboard" ? "nav-item active" : "nav-item"} onClick={() => setActiveTab("Dashboard")}><LayoutDashboard size={18}/> Dashboard</div>
          <div className={activeTab === "Firm Master" ? "nav-item active" : "nav-item"} onClick={() => setActiveTab("Firm Master")}><Building2 size={18}/> Firm Master</div>
          <div className={activeTab === "Bank Master" ? "nav-item active" : "nav-item"} onClick={() => setActiveTab("Bank Master")}><Landmark size={18}/> Bank Master</div>
          <div className={activeTab === "User Master" ? "nav-item active" : "nav-item"} onClick={() => setActiveTab("User Master")}><Users size={18}/> User Master</div>
          <div className={activeTab === "Settings" ? "nav-item active" : "nav-item"} onClick={() => setActiveTab("Settings")}><Settings size={18}/> Settings</div>
        </nav>
        <div className="sidebar-foot">
          <div className="gold-line"></div>
          <p className="foot-label">EXPERTLY CRAFTED BY</p>
          <h4 className="softview-name">SOFTVIEW TECHNOLOGIES</h4>
          <p className="softview-contact">+91 7972084304</p>
        </div>
      </aside>

      <main className="main-content">
        <header className="main-header">
          <div><p className="tagline">System Portal</p><h2 className="page-title">{activeTab}</h2></div>
          <div className="header-meta">
            <div className="time-box"><span>ADMIN ACCESS</span><strong>{dateTime.toLocaleTimeString()}</strong></div>
            <button className="logout-btn" onClick={() => signOut(auth)}><LogOut size={16}/> LOGOUT</button>
          </div>
        </header>

        <div className="content-scroll">
          {activeTab === "Dashboard" && (
            <div className="executive-card">
              <div className="filter-row">
                <label>Select Firm Here:</label>
                <select className="premium-select" value={firmFilter} onChange={(e) => setFirmFilter(e.target.value)}>
                  <option value="All">--- ALL FIRMS SUMMARY ---</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>
              <table className="premium-table">
                <thead><tr><th>BANK NAME</th><th>A/C NO</th><th>BALANCE</th><th>ACTION</th></tr></thead>
                <tbody>
                  {filteredBanks.map(b => (
                    <React.Fragment key={b.id}>
                      <tr className="main-tr">
                        <td><strong>{b.bankName}</strong></td><td>{b.accNo}</td>
                        <td className="gold-amt">₹ {b.balance} Cr.</td>
                        <td><button className="view-ledger-btn" onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}>VIEW LEDGER <ChevronDown size={14}/></button></td>
                      </tr>
                      {expandedBank === b.id && (
                        <tr><td colSpan="4">
                          <div className="ledger-preview">
                            <div className="ledger-header"><span>Account Ledger Report</span>
                              <div className="export-btns">
                                <button className="btn-ex excel" onClick={() => exportData(b, 'excel')}><FileSpreadsheet size={14}/> EXCEL</button>
                                <button className="btn-ex pdf" onClick={() => exportData(b, 'pdf')}><FileText size={14}/> PDF</button>
                              </div>
                            </div>
                            <table className="ledger-grid">
                              <thead><tr><th>Date</th><th>Particulars</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead>
                              <tbody>
                                <tr><td>08/05/2026</td><td><strong>OPENING BALANCE</strong></td><td>-</td><td>₹ {b.balance}</td><td>₹ {b.balance} Cr.</td></tr>
                                <tr><td>08/05/2026</td><td>Sample Transaction</td><td>-</td><td>₹ 5,000</td><td>₹ {parseFloat(b.balance) + 5000} Cr.</td></tr>
                              </tbody>
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

          {activeTab.includes("Master") && (
            <div className="executive-card">
              <h3>{activeTab} Entry</h3>
              <div className="master-form-grid">
                {activeTab === "Firm Master" && (
                  <>
                    <input placeholder="Firm Name" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
                    <input placeholder="GST Number" value={form.gst || ''} onChange={e => setForm({...form, gst: e.target.value})} />
                  </>
                )}
                {/* Banks and Users inputs follow same pattern... */}
              </div>
              <button className="gold-action-btn">SAVE RECORDS</button>
            </div>
          )}

          {activeTab === "Settings" && (
            <div className="executive-card">
              <h3 className="gold-border-h3">Security Management</h3>
              <div className="settings-form">
                <div className="set-input-row"><label>New Access Password</label><input type="password" /></div>
                <div className="set-input-row"><label>Confirm Password</label><input type="password" /></div>
                <button className="gold-action-btn">UPDATE SYSTEM SECURITY</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const handleLogin = (e) => { e.preventDefault(); signInWithEmailAndPassword(auth, email, pass).catch(() => alert("Denied")); };
  return (
    <div className="login-full-bg">
      <div className="login-premium-card">
        <ShieldCheck size={50} color="#d4af37"/>
        <h1 className="gold-txt">BANKING PRO</h1>
        <p className="v-tag">EXECUTIVE VERSION 2.0</p>
        <form onSubmit={handleLogin} className="login-fields">
          <input type="email" placeholder="ADMIN EMAIL" onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="SECURE PASSWORD" onChange={e => setPass(e.target.value)} required />
          <button type="submit" className="login-submit">AUTHORIZE SYSTEM</button>
        </form>
        <p className="softview-footer">Developed by <strong>SOFTVIEW TECHNOLOGIES</strong></p>
      </div>
    </div>
  );
}