import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from "./firebase"; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc } from "firebase/firestore";
import { Trash2, Edit, ChevronDown, ChevronUp, FileSpreadsheet, FileText, Settings, LayoutDashboard, Building2, Landmark, Users, LogOut } from 'lucide-react';

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
      setForm({}); alert("Records updated successfully!");
    } catch (e) { alert("Error saving data"); }
  };

  const handleDelete = async (coll, id) => {
    if(window.confirm("Confirm delete?")) await deleteDoc(doc(db, coll, id));
  };

  if (!user) return <LoginScreen />;

  return (
    <div className="luxury-app">
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

        {/* Sober Luxury Branding */}
        <div className="sidebar-branding-sober">
          <p className="sv-dev-text">Expertly Crafted By</p>
          <p className="sv-brand-gold">SOFTVIEW TECHNOLOGIES</p>
          <p className="sv-contact-line">Support: +91 7972084304</p>
        </div>
      </div>

      <div className="main-content">
        <header className="premium-header">
          <div className="page-title">{activeTab}</div>
          <div className="header-right">
            <div className="user-profile-box">
              <span className="u-name-top">ADMIN</span>
              <span className="u-time-top">{dateTime.toLocaleDateString()} | {dateTime.toLocaleTimeString()}</span>
            </div>
            <button className="header-logout-btn" onClick={() => signOut(auth)}>
              <LogOut size={16}/> <span>Logout</span>
            </button>
          </div>
        </header>

        <div className="content-area">
          {activeTab === "Dashboard" && (
            <div className="dashboard-view">
              <div className="luxury-filter-box">
                <label>Firm View:</label>
                <select onChange={(e) => setFilterFirm(e.target.value)}>
                  <option value="All">All Entities Summary</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>

              <div className="luxury-card mt-20">
                <table className="luxury-table">
                  <thead>
                    <tr><th>Bank</th><th>A/c Number</th><th>Balance</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {banks.filter(b => filterFirm === "All" || b.firmLink === filterFirm).map(b => (
                      <React.Fragment key={b.id}>
                        <tr className="main-row">
                          <td>{b.bankName}</td><td>{b.accNo}</td>
                          <td className="balance-gold">₹ {b.balance || '0'} Cr.</td>
                          <td><button className="expand-gold-btn" onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}>
                            {expandedBank === b.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>} View Ledger</button></td>
                        </tr>
                        {expandedBank === b.id && (
                          <tr className="ledger-dropdown">
                            <td colSpan="4">
                              <div className="ledger-container-gold">
                                <div className="ledger-tools">
                                  <button className="tool-btn excel"><FileSpreadsheet size={14}/> EXCEL</button>
                                  <button className="tool-btn pdf"><FileText size={14}/> PDF</button>
                                </div>
                                <table className="ledger-inner-table">
                                  <thead><tr><th>Date</th><th>Particulars</th><th>Receipt</th><th>Payment</th><th>Closing</th></tr></thead>
                                  <tbody>
                                    <tr>
                                      <td>08/05/2026</td><td>Opening Entry</td>
                                      <td className="txt-receipt">₹ {b.balance} ↓</td>
                                      <td className="txt-payment">₹ 0 ↑</td><td>₹ {b.balance}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Firm Master / Bank Master / User Master Code remains same as logic provided before */}
          {activeTab === "Firm Master" && (
            <div className="luxury-card">
              <h3>Firm Master Management</h3>
              <div className="luxury-form-row">
                <input placeholder="Firm Name" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
                <input placeholder="GST Number" value={form.gst || ''} onChange={e => setForm({...form, gst: e.target.value})} />
                <input placeholder="Full Address" value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} />
              </div>
              <button className="btn-gold-action" onClick={() => handleSave("firms")}>REGISTER FIRM</button>
              <div className="history-section">
                <p>Registered Firms: {firms.length}</p>
                <table className="luxury-table-mini">
                  <thead><tr><th>Name</th><th>GST</th><th>Action</th></tr></thead>
                  <tbody>{firms.map(f => (<tr key={f.id}><td>{f.name}</td><td>{f.gst}</td><td><Trash2 size={16} onClick={()=>handleDelete("firms", f.id)} className="ptr"/></td></tr>))}</tbody>
                </table>
              </div>
            </div>
          )}
          {/* ... Add Bank Master and User Master similarly ... */}
        </div>
      </div>
    </div>
  );
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  return (
    <div className="login-luxury-bg">
      <div className="login-gold-frame">
        <div className="login-header-gold">
          <h1>BANKING PRO</h1>
          <span>EXECUTIVE SECURE ACCESS</span>
        </div>
        <form className="login-form-gold" onSubmit={(e) => { e.preventDefault(); signInWithEmailAndPassword(auth, email, pass); }}>
          <input placeholder="Email Address" onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Access Code" onChange={e => setPass(e.target.value)} required />
          <button type="submit">AUTHORIZE LOGIN</button>
        </form>
        <div className="login-gold-footer">
          <p>Powered by <strong>SOFTVIEW TECHNOLOGIES</strong></p>
        </div>
      </div>
    </div>
  );
}