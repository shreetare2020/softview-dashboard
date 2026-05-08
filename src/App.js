import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from "./firebase"; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc } from "firebase/firestore";
import { Trash2, FileSpreadsheet, FileText, Settings, LayoutDashboard, Building2, Landmark, Users, LogOut, ChevronDown, ArrowDownLeft, ArrowUpRight, Edit } from 'lucide-react';
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
      setForm({}); alert("Saved Successfully!");
    } catch (e) { alert("Error saving data"); }
  };

  const handleDelete = async (coll, id) => {
    if(window.confirm("Delete this record?")) await deleteDoc(doc(db, coll, id));
  };

  // Export Functions
  const exportToExcel = (b) => {
    const data = [{ Date: '08/05/2026', Particulars: 'Opening Balance', Receipt: '', Payment: '', Balance: `${b.balance} Cr.` }];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, `${b.bankName}_Ledger.xlsx`);
  };

  const exportToPDF = (b) => {
    const doc = new jsPDF();
    doc.text(`Bank Ledger: ${b.bankName}`, 14, 15);
    doc.autoTable({ head: [['Date', 'Particulars', 'Receipt', 'Payment', 'Balance']], body: [['08/05/2026', 'Opening Balance', '-', '-', `${b.balance} Cr.`]] });
    doc.save(`${b.bankName}_Ledger.pdf`);
  };

  // Filter Logic Fix: Dono cases handle honge
  const filteredBanks = firmFilter === "All" ? banks : banks.filter(b => b.firmLink === firmFilter);

  if (!user) return <LoginScreen />;

  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <div className="sb-header">
          <h2 className="gold-text">BANKING PRO</h2>
          <p className="sb-sub">EXECUTIVE SECURE ACCESS</p>
        </div>
        <nav className="sb-nav">
          <div className={activeTab === "Dashboard" ? "nav-btn active" : "nav-btn"} onClick={() => setActiveTab("Dashboard")}><LayoutDashboard size={18}/> Dashboard</div>
          <div className={activeTab === "Firm Master" ? "nav-btn active" : "nav-btn"} onClick={() => setActiveTab("Firm Master")}><Building2 size={18}/> Firm Master</div>
          <div className={activeTab === "Bank Master" ? "nav-btn active" : "nav-btn"} onClick={() => setActiveTab("Bank Master")}><Landmark size={18}/> Bank Master</div>
          <div className={activeTab === "User Master" ? "nav-btn active" : "nav-btn"} onClick={() => setActiveTab("User Master")}><Users size={18}/> User Master</div>
          <div className={activeTab === "Settings" ? "nav-btn active" : "nav-btn"} onClick={() => setActiveTab("Settings")}><Settings size={18}/> Settings</div>
        </nav>
        <div className="sb-branding">
          <p className="sv-small">EXPERTLY CRAFTED BY</p>
          <p className="sv-main">SOFTVIEW TECHNOLOGIES</p>
          <p className="sv-small">+91 7972084304</p>
        </div>
      </aside>

      <main className="app-main">
        <header className="app-header">
          <div className="header-title">{activeTab}</div>
          <div className="header-meta">
            <div className="admin-info">
              <span className="name">ADMIN</span>
              <span className="clock">{dateTime.toLocaleString()}</span>
            </div>
            <button className="logout-btn" onClick={() => signOut(auth)}><LogOut size={16}/> Logout</button>
          </div>
        </header>

        <section className="app-body">
          {activeTab === "Dashboard" && (
            <div className="luxury-card">
              <div className="filter-row">
                <label>Filter by Firm:</label>
                <select value={firmFilter} onChange={(e) => setFirmFilter(e.target.value)}>
                  <option value="All">All Firms Summary</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>
              <table className="master-table">
                <thead><tr><th>Bank Name</th><th>Account Number</th><th>Closing Balance</th><th>Action</th></tr></thead>
                <tbody>
                  {filteredBanks.map(b => (
                    <React.Fragment key={b.id}>
                      <tr>
                        <td>{b.bankName}</td><td>{b.accNo}</td>
                        <td className="gold-amt">₹ {b.balance} Cr.</td>
                        <td><button className="v-btn" onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}><ChevronDown size={14}/> View Ledger</button></td>
                      </tr>
                      {expandedBank === b.id && (
                        <tr className="ledger-row"><td colSpan="4">
                          <div className="ledger-pane">
                            <div className="pane-header">
                              <h4>Account Ledger</h4>
                              <div className="pane-tools">
                                <button className="tool-btn exl" onClick={() => exportToExcel(b)}><FileSpreadsheet size={14}/> Excel</button>
                                <button className="tool-btn pdf" onClick={() => exportToPDF(b)}><FileText size={14}/> PDF</button>
                              </div>
                            </div>
                            <table className="inner-table">
                              <thead><tr><th>Date</th><th>Particulars</th><th>Receipt</th><th>Payment</th><th>Balance</th></tr></thead>
                              <tbody>
                                <tr>
                                  <td>08/05/2026</td>
                                  <td><strong>Opening Balance</strong></td>
                                  <td>-</td><td>-</td>
                                  <td><strong>₹ {b.balance} Cr.</strong></td>
                                </tr>
                                <tr>
                                  <td>08/05/2026</td><td>Sample Transaction</td>
                                  <td className="txt-g"><ArrowDownLeft size={12}/> ₹ 5,000</td>
                                  <td>-</td><td>₹ {parseFloat(b.balance) + 5000} Cr.</td>
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

          {activeTab === "Firm Master" && (
            <div className="luxury-card">
              <div className="master-form">
                <h3>Firm Registration</h3>
                <div className="form-grid">
                  <input placeholder="Firm Name" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
                  <input placeholder="GST No." value={form.gst || ''} onChange={e => setForm({...form, gst: e.target.value})} />
                  <input placeholder="Address" value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} />
                </div>
                <button className="save-btn" onClick={() => handleSave("firms")}>REGISTER FIRM</button>
              </div>
              <div className="history-section">
                <h4>Registered Firms History</h4>
                <table className="master-table">
                  <thead><tr><th>Firm Name</th><th>GST No.</th><th>Address</th><th>Action</th></tr></thead>
                  <tbody>{firms.map(f => (<tr key={f.id}><td>{f.name}</td><td>{f.gst}</td><td>{f.address}</td><td><Edit size={16} className="edit-icon"/><Trash2 size={16} className="del-icon" onClick={() => handleDelete("firms", f.id)}/></td></tr>))}</tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "Bank Master" && (
            <div className="luxury-card">
              <div className="master-form">
                <h3>Bank Management</h3>
                <div className="form-grid">
                  <input placeholder="Bank Name" value={form.bankName || ''} onChange={e => setForm({...form, bankName: e.target.value})} />
                  <input placeholder="Branch" value={form.branch || ''} onChange={e => setForm({...form, branch: e.target.value})} />
                  <input placeholder="Account No." value={form.accNo || ''} onChange={e => setForm({...form, accNo: e.target.value})} />
                  <input placeholder="Opening Balance" value={form.balance || ''} onChange={e => setForm({...form, balance: e.target.value})} />
                  <select value={form.firmLink || ''} onChange={e => setForm({...form, firmLink: e.target.value})}>
                    <option value="">Link to Firm</option>
                    {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                  </select>
                </div>
                <button className="save-btn" onClick={() => handleSave("banks")}>LINK BANK ACCOUNT</button>
              </div>
              <div className="history-section">
                <h4>Bank Accounts History</h4>
                <table className="master-table">
                  <thead><tr><th>Bank</th><th>Branch</th><th>A/c No.</th><th>Linked Firm</th><th>Action</th></tr></thead>
                  <tbody>{banks.map(b => (<tr key={b.id}><td>{b.bankName}</td><td>{b.branch}</td><td>{b.accNo}</td><td>{b.firmLink}</td><td><Edit size={16} className="edit-icon"/><Trash2 size={16} className="del-icon" onClick={() => handleDelete("banks", b.id)}/></td></tr>))}</tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "User Master" && (
            <div className="luxury-card">
              <div className="master-form">
                <h3>User Administration</h3>
                <div className="form-grid">
                  <input placeholder="User Code" value={form.uCode || ''} onChange={e => setForm({...form, uCode: e.target.value})} />
                  <input placeholder="User Name" value={form.uName || ''} onChange={e => setForm({...form, uName: e.target.value})} />
                  <input placeholder="User Email" value={form.uEmail || ''} onChange={e => setForm({...form, uEmail: e.target.value})} />
                  <input placeholder="Mobile No." value={form.uMob || ''} onChange={e => setForm({...form, uMob: e.target.value})} />
                  <input type="password" placeholder="Password" value={form.uPass || ''} onChange={e => setForm({...form, uPass: e.target.value})} />
                </div>
                <button className="save-btn" onClick={() => handleSave("users")}>CREATE SYSTEM USER</button>
              </div>
              <div className="history-section">
                <h4>User Access History</h4>
                <table className="master-table">
                  <thead><tr><th>Code</th><th>Name</th><th>Email</th><th>Mobile</th><th>Action</th></tr></thead>
                  <tbody>{usersList.map(u => (<tr key={u.id}><td>{u.uCode}</td><td>{u.uName}</td><td>{u.uEmail}</td><td>{u.uMob}</td><td><Edit size={16} className="edit-icon"/><Trash2 size={16} className="del-icon" onClick={() => handleDelete("users", u.id)}/></td></tr>))}</tbody>
                </table>
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
  const handleLogin = (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, pass).catch(err => alert("Access Denied: Invalid Credentials"));
  };
  return (
    <div className="login-page">
      <div className="login-container">
        <h1>BANKING PRO</h1>
        <p className="premium-subtitle">EXECUTIVE SECURE ACCESS</p>
        <form className="login-form" onSubmit={handleLogin}>
          <input type="email" placeholder="Registered Email" onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Security Password" onChange={e => setPass(e.target.value)} required />
          <button type="submit" className="btn-authorize">AUTHORIZE ACCESS</button>
        </form>
        <div className="login-footer-branding">Developed by <strong>SOFTVIEW TECHNOLOGIES</strong></div>
      </div>
    </div>
  );
}