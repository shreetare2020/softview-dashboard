import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from "./firebase"; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc } from "firebase/firestore";
import { Trash2, Edit, ChevronDown, ChevronUp, FileSpreadsheet, FileText, Settings, LayoutDashboard, Building2, Landmark, Users, LogOut } from 'lucide-react';
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
  const [filterFirm, setFilterFirm] = useState("All");

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

  const handleSave = async (coll) => {
    try {
      await addDoc(collection(db, coll), { ...form, createdAt: new Date() });
      setForm({}); alert("Data Saved Successfully!");
    } catch (e) { alert("Error saving data"); }
  };

  const handleDelete = async (coll, id) => {
    if(window.confirm("Are you sure you want to delete?")) await deleteDoc(doc(db, coll, id));
  };

  const exportToExcel = (b) => {
    const ws = XLSX.utils.json_to_sheet([{ Bank: b.bankName, Account: b.accNo, Balance: b.balance, Branch: b.branch }]);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, `${b.bankName}_Ledger.xlsx`);
  };

  const exportToPDF = (b) => {
    const doc = new jsPDF(); doc.text(`Ledger: ${b.bankName}`, 14, 15);
    doc.autoTable({ head: [['Bank', 'A/c No', 'Branch', 'Balance']], body: [[b.bankName, b.accNo, b.branch, b.balance]] });
    doc.save(`${b.bankName}_Ledger.pdf`);
  };

  if (!user) return <LoginScreen />;

  return (
    <div className="luxury-app-container">
      <div className="sidebar">
        <div className="sidebar-brand">
          <div className="logo-gold">BANKING PRO</div>
          <span className="premium-tag">EXECUTIVE EDITION</span>
        </div>
        <div className="nav-menu">
          <div className={`nav-link ${activeTab === "Dashboard" ? "active" : ""}`} onClick={() => setActiveTab("Dashboard")}><LayoutDashboard size={18}/> Dashboard</div>
          <div className={`nav-link ${activeTab === "Firm Master" ? "active" : ""}`} onClick={() => setActiveTab("Firm Master")}><Building2 size={18}/> Firm Master</div>
          <div className={`nav-link ${activeTab === "Bank Master" ? "active" : ""}`} onClick={() => setActiveTab("Bank Master")}><Landmark size={18}/> Bank Master</div>
          <div className={`nav-link ${activeTab === "User Master" ? "active" : ""}`} onClick={() => setActiveTab("User Master")}><Users size={18}/> User Master</div>
          <div className={`nav-link ${activeTab === "Settings" ? "active" : ""}`} onClick={() => setActiveTab("Settings")}><Settings size={18}/> Settings</div>
        </div>
        <div className="sidebar-branding-luxury">
          <p className="sv-small">EXPERTLY CRAFTED BY</p>
          <p className="sv-gold-name">SOFTVIEW TECHNOLOGIES</p>
          <p className="sv-small">Support: +91 7972084304</p>
        </div>
      </div>

      <div className="main-stage">
        <header className="main-header">
          <div className="header-page-title">{activeTab}</div>
          <div className="header-right-meta">
            <div className="meta-user">
              <span className="meta-name">ADMIN</span>
              <span className="meta-time">{dateTime.toLocaleString()}</span>
            </div>
            <button className="logout-btn-premium" onClick={() => signOut(auth)}><LogOut size={16}/> Logout</button>
          </div>
        </header>

        <div className="scrolling-content">
          {activeTab === "Dashboard" && (
            <div className="dash-wrap">
              <div className="filter-card">
                <label>Filter by Firm:</label>
                <select value={filterFirm} onChange={(e) => setFilterFirm(e.target.value)}>
                  <option value="All">All Firms Summary</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>
              <div className="luxury-card-box">
                <table className="pro-table">
                  <thead><tr><th>Bank Name</th><th>A/c Number</th><th>Closing Balance</th><th>Action</th></tr></thead>
                  <tbody>
                    {banks.filter(b => filterFirm === "All" || b.firmLink === filterFirm).map(b => (
                      <React.Fragment key={b.id}>
                        <tr>
                          <td>{b.bankName}</td><td>{b.accNo}</td>
                          <td className="gold-amt">₹ {b.balance || '0'} Cr.</td>
                          <td><button className="view-btn" onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}>View Ledger</button></td>
                        </tr>
                        {expandedBank === b.id && (
                          <tr className="ledger-row"><td colSpan="4">
                            <div className="ledger-pane">
                              <div className="ledger-btns">
                                <button className="btn-ex excel" onClick={() => exportToExcel(b)}><FileSpreadsheet size={14}/> Excel</button>
                                <button className="btn-ex pdf" onClick={() => exportToPDF(b)}><FileText size={14}/> PDF</button>
                              </div>
                              <table className="inner-ledger-table">
                                <thead><tr><th>Date</th><th>Particulars</th><th>Receipt</th><th>Payment</th><th>Balance</th></tr></thead>
                                <tbody><tr><td>08/05/2026</td><td>Opening Balance</td><td className="green-t">₹ {b.balance} ↓</td><td className="red-t">₹ 0 ↑</td><td>₹ {b.balance}</td></tr></tbody>
                              </table>
                            </div>
                          </td></tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "Firm Master" && (
            <div className="luxury-card-box">
              <h3>Firm Master Management</h3>
              <div className="form-row-3">
                <input placeholder="Firm Name" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
                <input placeholder="GST Number" value={form.gst || ''} onChange={e => setForm({...form, gst: e.target.value})} />
                <input placeholder="Full Address" value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} />
              </div>
              <button className="save-btn-gold" onClick={() => handleSave("firms")}>REGISTER FIRM</button>
              <div className="history-list">
                <h4>Registered Firms ({firms.length})</h4>
                <table className="pro-table">
                  <thead><tr><th>Name</th><th>GST</th><th>Address</th><th>Action</th></tr></thead>
                  <tbody>{firms.map(f => (<tr key={f.id}><td>{f.name}</td><td>{f.gst}</td><td>{f.address}</td><td><Trash2 size={16} className="del-icon" onClick={() => handleDelete("firms", f.id)}/></td></tr>))}</tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "Bank Master" && (
            <div className="luxury-card-box">
              <h3>Bank Master Management</h3>
              <div className="form-row-3">
                <input placeholder="Bank Name" value={form.bankName || ''} onChange={e => setForm({...form, bankName: e.target.value})} />
                <input placeholder="Branch Name" value={form.branch || ''} onChange={e => setForm({...form, branch: e.target.value})} />
                <input placeholder="Account No" value={form.accNo || ''} onChange={e => setForm({...form, accNo: e.target.value})} />
                <select value={form.firmLink || ''} onChange={e => setForm({...form, firmLink: e.target.value})}>
                  <option value="">Link to Firm</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>
              <button className="save-btn-gold" onClick={() => handleSave("banks")}>SAVE BANK</button>
              <div className="history-list">
                <h4>Linked Banks ({banks.length})</h4>
                <table className="pro-table">
                  <thead><tr><th>Bank</th><th>Branch</th><th>A/c No</th><th>Firm</th><th>Action</th></tr></thead>
                  <tbody>{banks.map(b => (<tr key={b.id}><td>{b.bankName}</td><td>{b.branch}</td><td>{b.accNo}</td><td>{b.firmLink}</td><td><Trash2 size={16} className="del-icon" onClick={() => handleDelete("banks", b.id)}/></td></tr>))}</tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "User Master" && (
            <div className="luxury-card-box">
              <h3>User Master Management</h3>
              <div className="form-row-3">
                <input placeholder="User Code" value={form.uCode || ''} onChange={e => setForm({...form, uCode: e.target.value})} />
                <input placeholder="Full Name" value={form.uName || ''} onChange={e => setForm({...form, uName: e.target.value})} />
                <input placeholder="Email" value={form.uEmail || ''} onChange={e => setForm({...form, uEmail: e.target.value})} />
                <input placeholder="Mobile" value={form.uMob || ''} onChange={e => setForm({...form, uMob: e.target.value})} />
                <input type="password" placeholder="Password" value={form.uPass || ''} onChange={e => setForm({...form, uPass: e.target.value})} />
              </div>
              <button className="save-btn-gold" onClick={() => handleSave("users")}>CREATE USER</button>
              <div className="history-list">
                <h4>System Users ({usersList.length})</h4>
                <table className="pro-table">
                  <thead><tr><th>Code</th><th>Name</th><th>Email</th><th>Mobile</th><th>Action</th></tr></thead>
                  <tbody>{usersList.map(u => (<tr key={u.id}><td>{u.uCode}</td><td>{u.uName}</td><td>{u.uEmail}</td><td>{u.uMob}</td><td><Trash2 size={16} className="del-icon" onClick={() => handleDelete("users", u.id)}/></td></tr>))}</tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "Settings" && (
            <div className="luxury-card-box">
              <h3>Security Settings</h3>
              <p>Update your system access credentials.</p>
              <input type="password" placeholder="Enter New Password" style={{width: '300px'}} />
              <button className="save-btn-gold" style={{marginLeft: '15px'}}>UPDATE PASSWORD</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  return (
    <div className="login-luxury-overlay">
      <div className="login-gold-card">
        <h2>BANKING PRO</h2>
        <p>SECURE EXECUTIVE LOGIN</p>
        <form onSubmit={(e) => { e.preventDefault(); signInWithEmailAndPassword(auth, email, pass); }}>
          <input placeholder="Registered Email" onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Security Password" onChange={e => setPass(e.target.value)} required />
          <button type="submit">ACCESS SYSTEM</button>
        </form>
        <div className="login-footer-branding">
          Developed by <strong>SOFTVIEW TECHNOLOGIES</strong>
        </div>
      </div>
    </div>
  );
}