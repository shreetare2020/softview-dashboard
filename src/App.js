import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from "./firebase"; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc } from "firebase/firestore";
import { Trash2, FileSpreadsheet, FileText, Settings, LayoutDashboard, Building2, Landmark, Users, LogOut } from 'lucide-react';
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

  // Time aur Auth Connection
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
      setForm({}); alert("Successfully Saved!");
    } catch (e) { alert("Error saving data"); }
  };

  const handleDelete = async (coll, id) => {
    if(window.confirm("Confirm Delete?")) await deleteDoc(doc(db, coll, id));
  };

  // Export Logic
  const exportToExcel = (b) => {
    const ws = XLSX.utils.json_to_sheet([{ Bank: b.bankName, Account: b.accNo, Balance: b.balance }]);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, `${b.bankName}_Ledger.xlsx`);
  };

  const exportToPDF = (b) => {
    const doc = new jsPDF();
    doc.text(`Bank Ledger: ${b.bankName}`, 14, 15);
    doc.autoTable({ head: [['Bank', 'A/c No', 'Balance']], body: [[b.bankName, b.accNo, b.balance]] });
    doc.save(`${b.bankName}_Ledger.pdf`);
  };

  if (!user) return <LoginScreen />;

  return (
    <div className="app-layout">
      {/* SIDEBAR FIXED */}
      <aside className="app-sidebar">
        <div className="sb-header">
          <h2 className="gold-text">BANKING PRO</h2>
          <p className="sb-sub">EXECUTIVE EDITION</p>
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

      {/* MAIN CONTENT AREA */}
      <main className="app-main">
        <header className="app-header">
          <div className="header-title">{activeTab}</div>
          <div className="header-meta">
            <div className="admin-info">
              <span className="name">ADMIN</span>
              <span className="clock">{dateTime.toLocaleString()}</span>
            </div>
            <button className="logout-gold" onClick={() => signOut(auth)}><LogOut size={16}/> Logout</button>
          </div>
        </header>

        <section className="app-body">
          {activeTab === "Dashboard" && (
            <div className="luxury-card">
              <table className="master-table">
                <thead><tr><th>Bank</th><th>A/c No</th><th>Balance</th><th>Action</th></tr></thead>
                <tbody>
                  {banks.map(b => (
                    <React.Fragment key={b.id}>
                      <tr>
                        <td>{b.bankName}</td><td>{b.accNo}</td>
                        <td className="gold-amt">₹ {b.balance} Cr.</td>
                        <td><button className="v-btn" onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}>View Ledger</button></td>
                      </tr>
                      {expandedBank === b.id && (
                        <tr className="ledger-row"><td colSpan="4">
                          <div className="ledger-pane">
                            <div className="pane-tools">
                                <button className="tool-btn exl" onClick={() => exportToExcel(b)}><FileSpreadsheet size={14}/> Excel</button>
                                <button className="tool-btn pdf" onClick={() => exportToPDF(b)}><FileText size={14}/> PDF</button>
                            </div>
                            <table className="inner-table">
                              <thead><tr><th>Date</th><th>Particulars</th><th>Receipt</th><th>Payment</th><th>Balance</th></tr></thead>
                              <tbody><tr><td>08/05/2026</td><td>Opening Balance</td><td className="txt-g">₹ {b.balance}</td><td>₹ 0</td><td>₹ {b.balance}</td></tr></tbody>
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
              <h3>Register New Firm</h3>
              <div className="form-grid">
                <input placeholder="Firm Name" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
                <input placeholder="GST Number" value={form.gst || ''} onChange={e => setForm({...form, gst: e.target.value})} />
                <input placeholder="Full Address" value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} />
              </div>
              <button className="save-btn" onClick={() => handleSave("firms")}>SAVE FIRM</button>
              <table className="master-table mt-20">
                <thead><tr><th>Firm Name</th><th>GST</th><th>Action</th></tr></thead>
                <tbody>{firms.map(f => (<tr key={f.id}><td>{f.name}</td><td>{f.gst}</td><td><Trash2 className="del" size={16} onClick={() => handleDelete("firms", f.id)}/></td></tr>))}</tbody>
              </table>
            </div>
          )}

          {activeTab === "Bank Master" && (
            <div className="luxury-card">
              <h3>Link Bank Account</h3>
              <div className="form-grid">
                <input placeholder="Bank Name" value={form.bankName || ''} onChange={e => setForm({...form, bankName: e.target.value})} />
                <input placeholder="A/c No" value={form.accNo || ''} onChange={e => setForm({...form, accNo: e.target.value})} />
                <input placeholder="Opening Balance" value={form.balance || ''} onChange={e => setForm({...form, balance: e.target.value})} />
                <select value={form.firmLink || ''} onChange={e => setForm({...form, firmLink: e.target.value})}>
                  <option value="">Select Firm</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>
              <button className="save-btn" onClick={() => handleSave("banks")}>SAVE BANK</button>
              <table className="master-table mt-20">
                <thead><tr><th>Bank</th><th>A/c No</th><th>Firm</th><th>Action</th></tr></thead>
                <tbody>{banks.map(b => (<tr key={b.id}><td>{b.bankName}</td><td>{b.accNo}</td><td>{b.firmLink}</td><td><Trash2 className="del" size={16} onClick={() => handleDelete("banks", b.id)}/></td></tr>))}</tbody>
              </table>
            </div>
          )}

          {activeTab === "User Master" && (
            <div className="luxury-card">
              <h3>System User Management</h3>
              <div className="form-grid">
                <input placeholder="User Name" value={form.uName || ''} onChange={e => setForm({...form, uName: e.target.value})} />
                <input placeholder="User Email" value={form.uEmail || ''} onChange={e => setForm({...form, uEmail: e.target.value})} />
                <input type="password" placeholder="Set Password" value={form.uPass || ''} onChange={e => setForm({...form, uPass: e.target.value})} />
              </div>
              <button className="save-btn" onClick={() => handleSave("users")}>CREATE USER</button>
              <table className="master-table mt-20">
                <thead><tr><th>Name</th><th>Email</th><th>Action</th></tr></thead>
                <tbody>{usersList.map(u => (<tr key={u.id}><td>{u.uName}</td><td>{u.uEmail}</td><td><Trash2 className="del" size={16} onClick={() => handleDelete("users", u.id)}/></td></tr>))}</tbody>
              </table>
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
    signInWithEmailAndPassword(auth, email, pass).catch(err => alert("Login Error: " + err.message));
  };
  return (
    <div className="login-page">
      <div className="login-container">
        <h1>BANKING PRO</h1>
        <p className="premium-subtitle">EXECUTIVE ACCESS</p>
        <form className="login-form" onSubmit={handleLogin}>
          <input type="email" placeholder="Email Address" onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" onChange={e => setPass(e.target.value)} required />
          <button type="submit" className="btn-authorize">ACCESS SYSTEM</button>
        </form>
        <div className="login-footer-branding">Developed by <strong>SOFTVIEW TECHNOLOGIES</strong></div>
      </div>
    </div>
  );
}