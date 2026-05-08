import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from "./firebase"; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc } from "firebase/firestore";
import { Trash2, FileSpreadsheet, FileText, Settings, LayoutDashboard, Building2, Landmark, Users, LogOut, ChevronDown, ShieldCheck, Edit3 } from 'lucide-react';
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

  const handleSave = async (coll) => {
    try {
      await addDoc(collection(db, coll), { ...form, createdAt: new Date() });
      setForm({}); alert("Saved Successfully");
    } catch (e) { alert("Error"); }
  };

  const handleDelete = async (coll, id) => {
    if(window.confirm("Delete record?")) await deleteDoc(doc(db, coll, id));
  };

  const exportData = (b, type) => {
    const data = [
      { date: '08/05/2026', desc: 'Opening Balance', dr: '', cr: b.balance, bal: b.balance + ' Cr.' },
      { date: '08/05/2026', desc: 'Sample Transaction', dr: '', cr: '5,000', bal: (parseFloat(b.balance) + 5000) + ' Cr.' }
    ];
    if (type === 'excel') {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Ledger");
      XLSX.writeFile(wb, `${b.bankName}_Ledger.xlsx`);
    } else {
      const doc = new jsPDF();
      doc.setFillColor(10, 14, 46); doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(212, 175, 55); doc.setFontSize(18); doc.text("BANK TRANSACTION LEDGER", 14, 25);
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
    <div className="app-container">
      <aside className="sidebar-luxury">
        <div className="side-head">
          <h2 className="gold-txt">BANKING PRO</h2>
          <p className="v-tag">EXECUTIVE VERSION 2.0</p>
        </div>
        <nav className="side-nav">
          <div className={activeTab === "Dashboard" ? "nav-item active" : "nav-item"} onClick={() => setActiveTab("Dashboard")}><LayoutDashboard size={18}/> Dashboard</div>
          <div className={activeTab === "Firm Master" ? "nav-item active" : "nav-item"} onClick={() => setActiveTab("Firm Master")}><Building2 size={18}/> Firm Master</div>
          <div className={activeTab === "Bank Master" ? "nav-item active" : "nav-item"} onClick={() => setActiveTab("Bank Master")}><Landmark size={18}/> Bank Master</div>
          <div className={activeTab === "User Master" ? "nav-item active" : "nav-item"} onClick={() => setActiveTab("User Master")}><Users size={18}/> User Master</div>
          <div className={activeTab === "Settings" ? "nav-item active" : "nav-item"} onClick={() => setActiveTab("Settings")}><Settings size={18}/> Settings</div>
        </nav>
        <div className="side-foot">
          <div className="gold-line"></div>
          <p className="crafted-txt">EXPERTLY CRAFTED BY</p>
          <h4 className="sv-brand">SOFTVIEW TECHNOLOGIES</h4>
          <p className="sv-phone">+91 7972084304</p>
        </div>
      </aside>

      <main className="main-panel">
        <header className="panel-header">
          <div><p className="sys-tag">System Portal</p><h2 className="tab-name">{activeTab}</h2></div>
          <div className="header-info">
            <div className="admin-status"><span>ADMIN ACCESS</span><strong>{dateTime.toLocaleTimeString()}</strong></div>
            <button className="logout-btn-gold" onClick={() => signOut(auth)}><LogOut size={16}/> LOGOUT</button>
          </div>
        </header>

        <div className="panel-body">
          {activeTab === "Dashboard" && (
            <div className="card-luxury">
              <div className="filter-bar-gold">
                <label>Select Firm Here:</label>
                <select className="select-gold" value={firmFilter} onChange={(e) => setFirmFilter(e.target.value)}>
                  <option value="All">--- ALL FIRMS SUMMARY ---</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>
              <table className="table-luxury">
                <thead><tr><th>BANK NAME</th><th>A/C NO</th><th>BALANCE</th><th>ACTION</th></tr></thead>
                <tbody>
                  {filteredBanks.map(b => (
                    <React.Fragment key={b.id}>
                      <tr className="tr-main">
                        <td><strong>{b.bankName}</strong></td><td>{b.accNo}</td>
                        <td className="amt-gold">₹ {b.balance} Cr.</td>
                        <td><button className="btn-view-ledger" onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}>VIEW LEDGER <ChevronDown size={14}/></button></td>
                      </tr>
                      {expandedBank === b.id && (
                        <tr><td colSpan="4">
                          <div className="ledger-expanded">
                            <div className="ledger-top-row"><span>Account Ledger Report</span>
                              <div className="ex-btns">
                                <button className="ex-btn excel" onClick={() => exportData(b, 'excel')}><FileSpreadsheet size={14}/> EXCEL</button>
                                <button className="ex-btn pdf" onClick={() => exportData(b, 'pdf')}><FileText size={14}/> PDF</button>
                              </div>
                            </div>
                            <table className="ledger-inner-table">
                              <thead><tr><th>Date</th><th>Particulars</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead>
                              <tbody>
                                <tr className="row-open"><td>08/05/2026</td><td><strong>OPENING BALANCE</strong></td><td>-</td><td>₹ {b.balance}</td><td>₹ {b.balance} Cr.</td></tr>
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

          {activeTab === "Firm Master" && (
            <div className="card-luxury">
              <h3>Firm Registration</h3>
              <div className="master-form">
                <input placeholder="Firm Name" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
                <input placeholder="GST No" value={form.gst || ''} onChange={e => setForm({...form, gst: e.target.value})} />
                <input placeholder="Address" value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} />
                <button className="btn-save-gold" onClick={() => handleSave("firms")}>REGISTER FIRM</button>
              </div>
              <div className="master-history">
                <h4>Registered Firms</h4>
                <table className="history-table">
                  <thead><tr><th>Firm Name</th><th>GST</th><th>Address</th><th>Action</th></tr></thead>
                  <tbody>{firms.map(f => (<tr key={f.id}><td>{f.name}</td><td>{f.gst}</td><td>{f.address}</td><td><Trash2 size={16} color="red" onClick={() => handleDelete("firms", f.id)}/></td></tr>))}</tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "Bank Master" && (
            <div className="card-luxury">
              <h3>Bank Setup</h3>
              <div className="master-form">
                <input placeholder="Bank Name" value={form.bankName || ''} onChange={e => setForm({...form, bankName: e.target.value})} />
                <input placeholder="A/c No" value={form.accNo || ''} onChange={e => setForm({...form, accNo: e.target.value})} />
                <input placeholder="Balance" value={form.balance || ''} onChange={e => setForm({...form, balance: e.target.value})} />
                <select value={form.firmLink || ''} onChange={e => setForm({...form, firmLink: e.target.value})}>
                  <option value="">Link to Firm</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
                <button className="btn-save-gold" onClick={() => handleSave("banks")}>LINK BANK</button>
              </div>
              <div className="master-history">
                <h4>Linked Accounts</h4>
                <table className="history-table">
                  <thead><tr><th>Bank</th><th>A/c No</th><th>Firm</th><th>Action</th></tr></thead>
                  <tbody>{banks.map(b => (<tr key={b.id}><td>{b.bankName}</td><td>{b.accNo}</td><td>{b.firmLink}</td><td><Trash2 size={16} color="red" onClick={() => handleDelete("banks", b.id)}/></td></tr>))}</tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "Settings" && (
            <div className="card-luxury">
              <h3 className="gold-border-title">Security & Password</h3>
              <div className="settings-form-luxury">
                <div className="set-row"><label>New Admin Password</label><input type="password" placeholder="••••••••" /></div>
                <div className="set-row"><label>Confirm Password</label><input type="password" placeholder="••••••••" /></div>
                <button className="btn-save-gold">UPDATE SECURITY</button>
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
    <div className="login-overlay">
      <div className="login-card-luxury">
        <ShieldCheck size={50} color="#d4af37"/>
        <h1 className="gold-txt">BANKING PRO</h1>
        <p className="v-tag">EXECUTIVE VERSION 2.0</p>
        <form onSubmit={handleLogin} className="login-form">
          <input type="email" placeholder="EMAIL" onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="PASSWORD" onChange={e => setPass(e.target.value)} required />
          <button type="submit" className="login-btn-gold">AUTHORIZE SYSTEM</button>
        </form>
        <p className="login-foot">Powered by <strong>SOFTVIEW TECHNOLOGIES</strong></p>
      </div>
    </div>
  );
}