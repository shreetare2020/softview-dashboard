import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from "./firebase"; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc, query, where } from "firebase/firestore";
import { Trash2, FileSpreadsheet, FileText, Settings, LayoutDashboard, Building2, Landmark, Users, LogOut, ChevronDown, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

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
      setForm({}); alert("Data Saved Successfully!");
    } catch (e) { alert("Error saving data"); }
  };

  const filteredBanks = firmFilter === "All" ? banks : banks.filter(b => b.firmLink === firmFilter);

  if (!user) return <LoginScreen />;

  return (
    <div className="app-layout">
      {/* LEFT SIDEBAR */}
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

      {/* RIGHT CONTENT AREA */}
      <main className="app-main">
        <header className="app-header">
          <div className="header-title">{activeTab}</div>
          <div className="header-meta">
            <div className="admin-info">
              <span className="name">SHREEKANT RATHI</span>
              <span className="clock">{dateTime.toLocaleDateString()} | {dateTime.toLocaleTimeString()}</span>
            </div>
            <button className="logout-btn" onClick={() => signOut(auth)}><LogOut size={16}/> Logout</button>
          </div>
        </header>

        <section className="app-body">
          {/* DASHBOARD WITH FIRM FILTER & LEDGER */}
          {activeTab === "Dashboard" && (
            <div className="luxury-card">
              <div className="filter-row">
                <label>Filter by Firm:</label>
                <select onChange={(e) => setFirmFilter(e.target.value)}>
                  <option value="All">All Firms Summary</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>
              <table className="master-table">
                <thead><tr><th>Bank Name</th><th>Account Number</th><th>Closing Balance</th><th>Action</th></tr></thead>
                <tbody>
                  {filteredBanks.map(b => (
                    <React.Fragment key={b.id}>
                      <tr className="main-row">
                        <td>{b.bankName}</td><td>{b.accNo}</td>
                        <td className="gold-amt">₹ {b.balance} Cr.</td>
                        <td><button className="v-btn" onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}><ChevronDown size={14}/> View Ledger</button></td>
                      </tr>
                      {expandedBank === b.id && (
                        <tr className="ledger-row"><td colSpan="4">
                          <div className="ledger-pane">
                            <div className="pane-header">
                              <h4>Transaction Ledger</h4>
                              <div className="pane-tools">
                                <button className="tool-btn exl"><FileSpreadsheet size={14}/> Excel</button>
                                <button className="tool-btn pdf"><FileText size={14}/> PDF</button>
                              </div>
                            </div>
                            <table className="inner-table">
                              <thead><tr><th>Date</th><th>Particulars</th><th>Receipt</th><th>Payment</th><th>Balance</th></tr></thead>
                              <tbody>
                                <tr>
                                  <td>08/05/2026</td><td>Opening Balance</td>
                                  <td><span className="txt-g"><ArrowDownLeft size={12}/> ₹ {b.balance}</span></td>
                                  <td><span className="txt-r"><ArrowUpRight size={12}/> ₹ 0</span></td>
                                  <td>₹ {b.balance} Cr.</td>
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

          {/* FIRM MASTER */}
          {activeTab === "Firm Master" && (
            <div className="luxury-card">
              <h3>Firm Registration</h3>
              <div className="form-grid">
                <input placeholder="Firm Name" onChange={e => setForm({...form, name: e.target.value})} />
                <input placeholder="GST No." onChange={e => setForm({...form, gst: e.target.value})} />
                <input placeholder="Full Address" onChange={e => setForm({...form, address: e.target.value})} />
              </div>
              <button className="save-btn" onClick={() => handleSave("firms")}>SAVE FIRM</button>
              <table className="master-table mt-20">
                <thead><tr><th>Name</th><th>GST No.</th><th>Address</th><th>Action</th></tr></thead>
                <tbody>{firms.map(f => (<tr key={f.id}><td>{f.name}</td><td>{f.gst}</td><td>{f.address}</td><td><Trash2 size={16} className="del-icon"/></td></tr>))}</tbody>
              </table>
            </div>
          )}

          {/* BANK MASTER */}
          {activeTab === "Bank Master" && (
            <div className="luxury-card">
              <h3>Bank Management</h3>
              <div className="form-grid">
                <input placeholder="Bank Name" onChange={e => setForm({...form, bankName: e.target.value})} />
                <input placeholder="Branch" onChange={e => setForm({...form, branch: e.target.value})} />
                <input placeholder="Account No." onChange={e => setForm({...form, accNo: e.target.value})} />
                <select onChange={e => setForm({...form, firmLink: e.target.value})}>
                  <option>Select Firm</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>
              <button className="save-btn" onClick={() => handleSave("banks")}>LINK BANK</button>
            </div>
          )}

          {/* SETTINGS (CHANGE PASSWORD) */}
          {activeTab === "Settings" && (
            <div className="luxury-card">
              <h3>Account Settings</h3>
              <div className="form-grid">
                <input type="password" placeholder="New Password" />
                <input type="password" placeholder="Confirm Password" />
              </div>
              <button className="save-btn">UPDATE PASSWORD</button>
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
    signInWithEmailAndPassword(auth, email, pass).catch(err => alert("Access Denied"));
  };
  return (
    <div className="login-page">
      <div className="login-container">
        <h1>BANKING PRO</h1>
        <p className="premium-subtitle">EXECUTIVE SECURE ACCESS</p>
        <form className="login-form" onSubmit={handleLogin}>
          <input type="email" placeholder="Registered Email" onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Security Password" onChange={e => setPass(e.target.value)} required />
          <button type="submit" className="btn-authorize">AUTHORIZE LOGIN</button>
        </form>
        <div className="login-footer-branding">Powered by <strong>SOFTVIEW TECHNOLOGIES</strong></div>
      </div>
    </div>
  );
}