import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from "./firebase"; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc } from "firebase/firestore";
import { Trash2, Edit, ChevronDown, ChevronUp, FileSpreadsheet, FileText, Settings, LayoutDashboard, Building2, Landmark, Users } from 'lucide-react';

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
    await addDoc(collection(db, coll), { ...form, createdAt: new Date() });
    setForm({}); alert("Successfully Saved in Records!");
  };

  if (!user) return <LoginScreen />;

  return (
    <div className="luxury-app">
      {/* Sidebar - Left Side Luxury */}
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

        <div className="sidebar-footer">
          <div className="dev-by">Developed by:</div>
          <div className="dev-name">SOFTVIEW TECHNOLOGIES</div>
          <div className="dev-contact">Contact: 7972084304</div>
          <button className="gold-logout" onClick={() => signOut(auth)}>LOGOUT</button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        <header className="premium-header">
          <div className="page-title">{activeTab.toUpperCase()}</div>
          <div className="user-profile">
            <div className="user-info">
              <span className="u-name">{user.email.split('@')[0].toUpperCase()}</span>
              <span className="u-clock">{dateTime.toLocaleDateString('en-GB')} | {dateTime.toLocaleTimeString()}</span>
            </div>
          </div>
        </header>

        <div className="content-scroller">
          {activeTab === "Dashboard" && (
            <div className="dashboard-section">
              <div className="filter-bar luxury-card">
                <label>Filter by Firm:</label>
                <select onChange={(e) => setFilterFirm(e.target.value)}>
                  <option value="All">All Firms Summary</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>

              <div className="luxury-card mt-20">
                <table className="luxury-table">
                  <thead>
                    <tr><th>Bank Name</th><th>Account Number</th><th>Closing Balance</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {banks.filter(b => filterFirm === "All" || b.firmLink === filterFirm).map(b => (
                      <React.Fragment key={b.id}>
                        <tr className="main-row">
                          <td>{b.bankName}</td><td>{b.accNo}</td>
                          <td className="gold-text">₹ {b.balance} Cr.</td>
                          <td><button className="btn-expand" onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}>
                            {expandedBank === b.id ? <ChevronUp/> : <ChevronDown/>} View Ledger</button></td>
                        </tr>
                        {expandedBank === b.id && (
                          <tr className="dropdown-row">
                            <td colSpan="4">
                              <div className="ledger-box">
                                <div className="ledger-actions">
                                  <button className="btn-action excel"><FileSpreadsheet size={16}/> Excel</button>
                                  <button className="btn-action pdf"><FileText size={16}/> PDF</button>
                                </div>
                                <table className="inner-table">
                                  <thead><tr><th>Date</th><th>Particulars</th><th>Receipt</th><th>Payment</th><th>Balance</th></tr></thead>
                                  <tbody>
                                    <tr>
                                      <td>08/05/2026</td><td>Opening Balance</td>
                                      <td className="green-text">₹ {b.balance} ↓</td>
                                      <td className="red-text">₹ 0 ↑</td><td>₹ {b.balance}</td>
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

          {activeTab === "Firm Master" && (
            <div className="luxury-card">
              <h3>Create New Firm</h3>
              <div className="form-grid-3">
                <input placeholder="Firm Name" onChange={e => setForm({...form, name: e.target.value})} />
                <input placeholder="GST No." onChange={e => setForm({...form, gst: e.target.value})} />
                <input placeholder="Address" onChange={e => setForm({...form, address: e.target.value})} />
              </div>
              <button className="btn-gold-save" onClick={() => handleSave("firms")}>SAVE FIRM</button>
              <h4 className="mt-20">History: {firms.length} Firms</h4>
              <table className="luxury-table">
                <thead><tr><th>Name</th><th>GST</th><th>Address</th><th>Action</th></tr></thead>
                <tbody>{firms.map(f => (<tr key={f.id}><td>{f.name}</td><td>{f.gst}</td><td>{f.address}</td><td><Trash2 className="icon-gold"/> <Edit className="icon-gold"/></td></tr>))}</tbody>
              </table>
            </div>
          )}

          {activeTab === "Bank Master" && (
            <div className="luxury-card">
              <h3>Bank Master</h3>
              <div className="form-grid-3">
                <input placeholder="Bank Name" onChange={e => setForm({...form, bankName: e.target.value})} />
                <input placeholder="Bank Branch" onChange={e => setForm({...form, branch: e.target.value})} />
                <input placeholder="A/c No." onChange={e => setForm({...form, accNo: e.target.value})} />
                <select onChange={e => setForm({...form, firmLink: e.target.value})}>
                  <option>Link to Firm Master</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>
              <button className="btn-gold-save" onClick={() => handleSave("banks")}>SAVE BANK</button>
              <h4 className="mt-20">History: {banks.length} Banks</h4>
              <table className="luxury-table">
                <thead><tr><th>Bank</th><th>Branch</th><th>Firm</th><th>Action</th></tr></thead>
                <tbody>{banks.map(b => (<tr key={b.id}><td>{b.bankName}</td><td>{b.branch}</td><td>{b.firmLink}</td><td><Trash2 className="icon-gold"/></td></tr>))}</tbody>
              </table>
            </div>
          )}

          {activeTab === "User Master" && (
            <div className="luxury-card">
              <h3>User Master</h3>
              <div className="form-grid-3">
                <input placeholder="User Code" onChange={e => setForm({...form, uCode: e.target.value})} />
                <input placeholder="User Name" onChange={e => setForm({...form, uName: e.target.value})} />
                <input placeholder="User Email" onChange={e => setForm({...form, uEmail: e.target.value})} />
                <input placeholder="Mobile No." onChange={e => setForm({...form, uMob: e.target.value})} />
                <input type="password" placeholder="Password" onChange={e => setForm({...form, uPass: e.target.value})} />
              </div>
              <button className="btn-gold-save" onClick={() => handleSave("users")}>SAVE USER</button>
              <h4 className="mt-20">History: {usersList.length} Users</h4>
              <table className="luxury-table">
                <thead><tr><th>Code</th><th>Name</th><th>Mobile</th><th>Action</th></tr></thead>
                <tbody>{usersList.map(u => (<tr key={u.id}><td>{u.uCode}</td><td>{u.uName}</td><td>{u.uMob}</td><td><Trash2 className="icon-gold"/></td></tr>))}</tbody>
              </table>
            </div>
          )}

          {activeTab === "Settings" && (
            <div className="luxury-card">
              <h3>Security Settings</h3>
              <input type="password" placeholder="New Password" style={{width:'300px'}} />
              <button className="btn-gold-save ml-10">CHANGE PASSWORD</button>
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
    <div className="login-page">
      <div className="login-container">
        <div className="login-brand">
          <h1>BANKING PRO</h1>
          <p>MASTER FINANCIAL DASHBOARD</p>
        </div>
        <form className="login-form" onSubmit={(e) => { e.preventDefault(); signInWithEmailAndPassword(auth, email, pass); }}>
          <input placeholder="Email Address" onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Security Key" onChange={e => setPass(e.target.value)} required />
          <button type="submit">LOGIN TO SYSTEM</button>
        </form>
        <div className="login-footer">
          <p>Developed by: <strong>SOFTVIEW TECHNOLOGIES</strong></p>
          <p>Support: 7972084304</p>
        </div>
      </div>
    </div>
  );
}