import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from "./firebase"; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc } from "firebase/firestore";

export default function App() {
  const [user, setUser] = useState(null);
  const [dateTime, setDateTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [banks, setBanks] = useState([]);
  const [firms, setFirms] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [form, setForm] = useState({});
  const [selectedFirm, setSelectedFirm] = useState("All");
  const [expandedBank, setExpandedBank] = useState(null); // Point 7: Ledger Expand
  const [newPass, setNewPass] = useState("");

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
    await addDoc(collection(db, coll), { ...form, status: 'Open', createdAt: new Date() });
    setForm({}); alert("Saved!");
  };

  const handlePasswordChange = async () => {
    if(!newPass) return alert("Enter new password");
    try {
      await updatePassword(auth.currentUser, newPass);
      alert("Password updated successfully!");
      setNewPass("");
    } catch (err) { alert(err.message); }
  };

  if (!user) return <LoginScreen />;

  return (
    <div className="app-shell">
      <div className="sidebar">
        <div className="sidebar-logo">BANKING PRO</div>
        <div className="nav-group">
          {['Dashboard', 'Firm Master', 'Bank Master', 'User Master', 'Settings'].map(t => (
            <div key={t} className={`nav-item ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t}</div>
          ))}
        </div>
        <button className="btn-logout" onClick={() => signOut(auth)}>LOGOUT</button>
      </div>

      <div className="main-stage">
        <div className="header-premium">
          <div className="welcome-msg">WELCOME, ADMIN</div>
          <div className="clock-msg">{dateTime.toLocaleDateString('en-GB')} | {dateTime.toLocaleTimeString()}</div>
        </div>

        {/* Dashboard with Expandable Ledger & Export Buttons */}
        {activeTab === "Dashboard" && (
          <div className="premium-card">
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
              <h3>Live Bank Ledger Dashboard</h3>
              <select className="firm-select" onChange={(e) => setSelectedFirm(e.target.value)}>
                <option value="All">-- All Firms --</option>
                {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
            </div>
            <table className="list-table">
              <thead><tr><th>Bank Name</th><th>Account No</th><th>Balance</th><th>Action</th></tr></thead>
              <tbody>
                {banks.filter(b => selectedFirm === "All" || b.firmLink === selectedFirm).map(b => (
                  <React.Fragment key={b.id}>
                    <tr>
                      <td><strong>{b.bankName}</strong></td><td>{b.accNo}</td>
                      <td style={{color:'green', fontWeight:'bold'}}>₹ {b.balance} CR</td>
                      <td>
                        <button className="btn-save" style={{padding:'5px 15px'}} onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}>
                          {expandedBank === b.id ? "Close Ledger" : "Expand Ledger"}
                        </button>
                      </td>
                    </tr>
                    {/* Point 7, 8, 9: Expanded Ledger Section */}
                    {expandedBank === b.id && (
                      <tr>
                        <td colSpan="4" style={{background:'#f9f9f9', padding:'20px'}}>
                          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
                            <h4 style={{color:'var(--blue)'}}>Detailed Transaction History: {b.bankName}</h4>
                            <div>
                              <button style={{background:'#1D6F42', color:'white', padding:'8px 15px', border:'none', borderRadius:'5px', marginRight:'10px', cursor:'pointer'}}>Export Excel</button>
                              <button style={{background:'#E11D48', color:'white', padding:'8px 15px', border:'none', borderRadius:'5px', cursor:'pointer'}}>Export PDF</button>
                            </div>
                          </div>
                          <table className="list-table" style={{background:'white'}}>
                            <thead><tr style={{background:'#eee'}}><th style={{color:'#333'}}>Date</th><th style={{color:'#333'}}>Narration</th><th style={{color:'#333'}}>Debit</th><th style={{color:'#333'}}>Credit</th></tr></thead>
                            <tbody><tr><td>08/05/2026</td><td>Opening Balance</td><td>-</td><td>₹ {b.balance}</td></tr></tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Settings: Password Change Facility */}
        {activeTab === "Settings" && (
          <div className="premium-card">
            <h3 style={{marginBottom:'20px'}}>Account Settings</h3>
            <div className="master-form-grid" style={{maxWidth:'400px'}}>
              <label>Update New Password:</label>
              <input type="password" placeholder="New Password" value={newPass} onChange={e => setNewPass(e.target.value)} />
              <button className="btn-save" onClick={handlePasswordChange}>UPDATE PASSWORD</button>
            </div>
          </div>
        )}

        {/* Master Tabs (Firm, Bank, User) - Keep your existing code for these sections here */}
        {activeTab === "Firm Master" && ( /* ... keep firm master code ... */ <div className="premium-card">Firm Master Content</div>)}
        {activeTab === "Bank Master" && ( /* ... keep bank master code ... */ <div className="premium-card">Bank Master Content</div>)}
        {activeTab === "User Master" && ( /* ... keep user master code ... */ <div className="premium-card">User Master Content</div>)}

        <div className="footer-branding">
          <div className="sv-title">Developed by: SOFTVIEW TECHNOLOGIES</div>
          <div className="sv-mob">+91 7972084304</div>
        </div>
      </div>
    </div>
  );
}

function LoginScreen() {
  const [e, setE] = useState("");
  const [p, setP] = useState("");
  return (
    <div className="login-screen">
      <div className="login-card">
        <h1>BANKING PRO</h1>
        <p>a Project by Softview Technologies</p>
        <form onSubmit={(ev) => { ev.preventDefault(); signInWithEmailAndPassword(auth, e, p); }}>
          <input placeholder="Email" onChange={ev => setE(ev.target.value)} required />
          <input type="password" placeholder="Password" onChange={ev => setP(ev.target.value)} required />
          <button type="submit">LOGIN TO SYSTEM</button>
        </form>
      </div>
    </div>
  );
}