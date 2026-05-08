import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from "./firebase"; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc } from "firebase/firestore";
import { Trash2, FileSpreadsheet, FileText, Settings, LayoutDashboard, Building2, Landmark, Users, LogOut, ChevronDown, ShieldCheck } from 'lucide-react';
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
    const ledgerData = [
      { Date: '08/05/2026', Particulars: 'Opening Balance', Debit: '-', Credit: b.balance, Balance: b.balance + ' Cr.' },
      { Date: '08/05/2026', Particulars: 'Transaction Test', Debit: '-', Credit: '5,000', Balance: (parseFloat(b.balance) + 5000) + ' Cr.' }
    ];
    if (type === 'excel') {
      const ws = XLSX.utils.json_to_sheet(ledgerData);
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Ledger");
      XLSX.writeFile(wb, `${b.bankName}_Ledger.xlsx`);
    } else {
      const doc = new jsPDF();
      doc.setFillColor(10, 14, 46); doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(212, 175, 55); doc.setFontSize(20); doc.text("BANK TRANSACTION LEDGER", 14, 22);
      doc.autoTable({
        startY: 45,
        head: [['Date', 'Particulars', 'Debit', 'Credit', 'Balance']],
        body: ledgerData.map(r => [r.Date, r.Particulars, r.Debit, r.Credit, r.Balance]),
        headStyles: { fillColor: [10, 14, 46], textColor: [212, 175, 55] }
      });
      doc.save(`${b.bankName}_Ledger.pdf`);
    }
  };

  const filteredBanks = firmFilter === "All" ? banks : banks.filter(b => b.firmLink === firmFilter);

  if (!user) return <LoginScreen />;

  return (
    <div className="main-wrapper">
      <aside className="sidebar-gold">
        <div className="sidebar-brand">
          <h2 className="gold-text">BANKING PRO</h2>
          <p className="version-text">EXECUTIVE VERSION 2.0</p>
        </div>
        <nav className="sidebar-menu">
          <div className={activeTab === "Dashboard" ? "menu-item active" : "menu-item"} onClick={() => setActiveTab("Dashboard")}><LayoutDashboard size={18}/> Dashboard</div>
          <div className={activeTab === "Firm Master" ? "menu-item active" : "menu-item"} onClick={() => setActiveTab("Firm Master")}><Building2 size={18}/> Firm Master</div>
          <div className={activeTab === "Bank Master" ? "menu-item active" : "menu-item"} onClick={() => setActiveTab("Bank Master")}><Landmark size={18}/> Bank Master</div>
          <div className={activeTab === "User Master" ? "menu-item active" : "menu-item"} onClick={() => setActiveTab("User Master")}><Users size={18}/> User Master</div>
          <div className={activeTab === "Settings" ? "menu-item active" : "menu-item"} onClick={() => setActiveTab("Settings")}><Settings size={18}/> Settings</div>
        </nav>
        <div className="branding-box">
          <div className="divider-line"></div>
          <p className="small-label">EXPERTLY CRAFTED BY</p>
          <h4 className="sv-title">SOFTVIEW TECHNOLOGIES</h4>
          <p className="sv-phone">+91 7972084304</p>
        </div>
      </aside>

      <main className="content-gold">
        <header className="main-header">
          <div><p className="portal-tag">System Portal</p><h2 className="tab-title">{activeTab}</h2></div>
          <div className="header-right">
            <div className="admin-status"><span className="status-name">ADMIN ACCESS</span><span className="status-time">{dateTime.toLocaleTimeString()}</span></div>
            <button className="btn-logout" onClick={() => signOut(auth)}><LogOut size={16}/> LOGOUT</button>
          </div>
        </header>

        <section className="scroll-content">
          {activeTab === "Dashboard" && (
            <div className="luxury-panel">
              <div className="filter-executive">
                <label>Select Firm Here:</label>
                <select className="gold-select" value={firmFilter} onChange={(e) => setFirmFilter(e.target.value)}>
                  <option value="All">--- ALL FIRMS SUMMARY ---</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>
              <table className="executive-table">
                <thead><tr><th>BANK</th><th>A/C NO</th><th>BALANCE</th><th>ACTION</th></tr></thead>
                <tbody>
                  {filteredBanks.map(b => (
                    <React.Fragment key={b.id}>
                      <tr className="row-main">
                        <td><strong>{b.bankName}</strong></td><td>{b.accNo}</td>
                        <td className="gold-amt">₹ {b.balance} Cr.</td>
                        <td><button className="btn-ledger" onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}>VIEW LEDGER <ChevronDown size={14}/></button></td>
                      </tr>
                      {expandedBank === b.id && (
                        <tr><td colSpan="4">
                          <div className="ledger-box">
                            <div className="ledger-top"><span>Ledger Summary</span>
                              <div className="export-btns">
                                <button className="ex-excel" onClick={() => exportData(b, 'excel')}><FileSpreadsheet size={14}/> EXCEL</button>
                                <button className="ex-pdf" onClick={() => exportData(b, 'pdf')}><FileText size={14}/> PDF</button>
                              </div>
                            </div>
                            <table className="ledger-table">
                              <thead><tr><th>Date</th><th>Particulars</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead>
                              <tbody><tr className="open-row"><td>08/05/2026</td><td>OPENING BALANCE</td><td>-</td><td>₹ {b.balance}</td><td>₹ {b.balance} Cr.</td></tr></tbody>
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
          {activeTab === "Settings" && (
            <div className="luxury-panel">
              <h3 className="panel-title">Change Password</h3>
              <div className="form-luxury">
                <input type="password" placeholder="New Password" />
                <input type="password" placeholder="Confirm Password" />
                <button className="gold-action-btn">UPDATE ACCESS</button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const handleLogin = (e) => { e.preventDefault(); signInWithEmailAndPassword(auth, email, pass).catch(() => alert("Denied")); };
  return (
    <div className="login-luxury-bg">
      <div className="login-card-gold">
        <ShieldCheck size={45} color="#d4af37"/>
        <h1 className="gold-title">BANKING PRO</h1>
        <p className="v-tag">EXECUTIVE VERSION 2.0</p>
        <form className="login-form-gold" onSubmit={handleLogin}>
          <input type="email" placeholder="EMAIL" onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="PASSWORD" onChange={e => setPass(e.target.value)} required />
          <button type="submit" className="login-btn">LOGIN SYSTEM</button>
        </form>
        <div className="login-foot">Powered by <strong>SOFTVIEW TECHNOLOGIES</strong></div>
      </div>
    </div>
  );
}