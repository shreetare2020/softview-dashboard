import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from "./firebase"; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc } from "firebase/firestore";
import { Trash2, FileSpreadsheet, FileText, Settings, LayoutDashboard, Building2, Landmark, Users, LogOut, ChevronDown, ArrowDownLeft, ArrowUpRight, ShieldCheck } from 'lucide-react';
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

  // EXPORT LOGIC WITH FULL DATA
  const exportData = (b, type) => {
    const ledgerData = [
      { Date: '08/05/2026', Particulars: 'Opening Balance', Debit: '', Credit: b.balance, Balance: b.balance + ' Cr.' },
      { Date: '08/05/2026', Particulars: 'Sample Transaction', Debit: '', Credit: '5,000', Balance: (parseFloat(b.balance) + 5000) + ' Cr.' }
    ];

    if (type === 'excel') {
      const ws = XLSX.utils.json_to_sheet(ledgerData);
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Bank_Ledger");
      XLSX.writeFile(wb, `${b.bankName}_Executive_Ledger.xlsx`);
    } else {
      const doc = new jsPDF();
      doc.setFillColor(10, 14, 46); doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(212, 175, 55); doc.setFontSize(22); doc.text("BANK TRANSACTION LEDGER", 14, 20);
      doc.setFontSize(10); doc.setTextColor(255, 255, 255);
      doc.text(`Bank: ${b.bankName} | A/c No: ${b.accNo}`, 14, 30);
      doc.autoTable({
        startY: 45,
        head: [['Date', 'Particulars', 'Debit', 'Credit', 'Balance']],
        body: ledgerData.map(row => [row.Date, row.Particulars, row.Debit, row.Credit, row.Balance]),
        headStyles: { fillStyle: 'f', fillColor: [10, 14, 46], textColor: [212, 175, 55] },
        alternateRowStyles: { fillColor: [245, 247, 250] }
      });
      doc.save(`${b.bankName}_Executive_Ledger.pdf`);
    }
  };

  const filteredBanks = firmFilter === "All" ? banks : banks.filter(b => b.firmLink && b.firmLink.trim() === firmFilter.trim());

  if (!user) return <LoginScreen />;

  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <div className="sb-header">
          <h2 className="gold-text">BANKING PRO</h2>
          <p className="sb-sub">EXECUTIVE VERSION 2.0</p>
        </div>
        <nav className="sb-nav">
          <div className={activeTab === "Dashboard" ? "nav-btn active" : "nav-btn"} onClick={() => setActiveTab("Dashboard")}><LayoutDashboard size={18}/> Dashboard</div>
          <div className={activeTab === "Firm Master" ? "nav-btn active" : "nav-btn"} onClick={() => setActiveTab("Firm Master")}><Building2 size={18}/> Firm Master</div>
          <div className={activeTab === "Bank Master" ? "nav-btn active" : "nav-btn"} onClick={() => setActiveTab("Bank Master")}><Landmark size={18}/> Bank Master</div>
          <div className={activeTab === "User Master" ? "nav-btn active" : "nav-btn"} onClick={() => setActiveTab("User Master")}><Users size={18}/> User Master</div>
          <div className={activeTab === "Settings" ? "nav-btn active" : "nav-btn"} onClick={() => setActiveTab("Settings")}><Settings size={18}/> Settings</div>
        </nav>
        <div className="sb-branding-premium">
          <div className="gold-divider"></div>
          <p className="premium-label">EXPERTLY CRAFTED BY</p>
          <h4 className="sv-brand">SOFTVIEW TECHNOLOGIES</h4>
          <p className="sv-contact">+91 7972084304</p>
        </div>
      </aside>

      <main className="app-main">
        <header className="app-header">
          <div className="header-title-container">
            <span className="header-label">System Portal</span>
            <h2 className="header-main-title">{activeTab}</h2>
          </div>
          <div className="header-meta">
            <div className="admin-box">
              <span className="admin-name">ADMIN ACCESS</span>
              <span className="admin-clock">{dateTime.toLocaleTimeString()}</span>
            </div>
            <button className="logout-premium" onClick={() => signOut(auth)}><LogOut size={16}/> LOGOUT</button>
          </div>
        </header>

        <section className="app-body">
          {activeTab === "Dashboard" && (
            <div className="luxury-card-main">
              <div className="premium-filter-bar">
                <div className="filter-group">
                  <label>Select Firm Here:</label>
                  <select className="luxury-select" value={firmFilter} onChange={(e) => setFirmFilter(e.target.value)}>
                    <option value="All">--- ALL FIRMS CONSOLIDATED ---</option>
                    {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                  </select>
                </div>
              </div>
              
              <table className="luxury-table">
                <thead><tr><th>BANK NAME</th><th>A/C NUMBER</th><th>CLOSING BALANCE</th><th>EXECUTIVE ACTION</th></tr></thead>
                <tbody>
                  {filteredBanks.map(b => (
                    <React.Fragment key={b.id}>
                      <tr className="main-row">
                        <td><strong>{b.bankName}</strong></td><td>{b.accNo}</td>
                        <td className="gold-balance">₹ {b.balance} Cr.</td>
                        <td><button className="luxury-view-btn" onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}>VIEW LEDGER <ChevronDown size={14}/></button></td>
                      </tr>
                      {expandedBank === b.id && (
                        <tr><td colSpan="4">
                          <div className="expanded-ledger-box">
                            <div className="ledger-header">
                              <span className="ledger-title">Transaction History Report</span>
                              <div className="export-cluster">
                                <button className="ex-btn excel" onClick={() => exportData(b, 'excel')}><FileSpreadsheet size={14}/> EXPORT EXCEL</button>
                                <button className="ex-btn pdf" onClick={() => exportData(b, 'pdf')}><FileText size={14}/> EXPORT PDF</button>
                              </div>
                            </div>
                            <table className="internal-ledger-table">
                              <thead><tr><th>Date</th><th>Particulars</th><th>Debit (Dr)</th><th>Credit (Cr)</th><th>Net Balance</th></tr></thead>
                              <tbody>
                                <tr className="opening-row">
                                  <td>08/05/2026</td><td><strong>OPENING BALANCE</strong></td><td>-</td><td>₹ {b.balance}</td><td>₹ {b.balance} Cr.</td>
                                </tr>
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

          {activeTab === "Settings" && (
            <div className="luxury-card-main">
              <h3 className="gold-border-title">Security & Password Management</h3>
              <div className="premium-form-grid">
                <div className="input-unit"><label>New Security Password</label><input type="password" placeholder="••••••••" /></div>
                <div className="input-unit"><label>Confirm New Password</label><input type="password" placeholder="••••••••" /></div>
              </div>
              <button className="luxury-action-btn">UPDATE SYSTEM CREDENTIALS</button>
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
  const handleLogin = (e) => { e.preventDefault(); signInWithEmailAndPassword(auth, email, pass).catch(err => alert("Unauthorized Access")); };
  return (
    <div className="luxury-login-page">
      <div className="login-box-premium">
        <ShieldCheck size={50} color="#d4af37" style={{marginBottom: '20px'}}/>
        <h1 className="gold-title">BANKING PRO</h1>
        <p className="version-tag">EXECUTIVE VERSION 2.0</p>
        <form className="luxury-form" onSubmit={handleLogin}>
          <input type="email" placeholder="ADMIN EMAIL" onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="ACCESS CODE" onChange={e => setPass(e.target.value)} required />
          <button type="submit" className="login-gold-btn">AUTHORIZE SYSTEM ACCESS</button>
        </form>
        <div className="login-branding">Powered by <strong>SOFTVIEW TECHNOLOGIES</strong></div>
      </div>
    </div>
  );
}