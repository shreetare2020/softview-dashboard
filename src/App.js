import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from "./firebase"; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc } from "firebase/firestore";
import { Trash2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [banks, setBanks] = useState([]);
  const [firms, setFirms] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [form, setForm] = useState({});

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
    if (!form.name && !form.bankName && !form.uName) { alert("Please fill details"); return; }
    await addDoc(collection(db, coll), { ...form, createdAt: new Date() });
    setForm({}); alert("Data Saved!");
  };

  const handleDelete = async (coll, id) => {
    if(window.confirm("Are you sure you want to delete?")) await deleteDoc(doc(db, coll, id));
  };

  if (!user) return <LoginScreen />;

  return (
    <div className="app-shell">
      <div className="sidebar">
        <div className="sidebar-logo">BANKING PRO</div>
        <div className="nav-group">
          {['Dashboard', 'Firm Master', 'Bank Master', 'User Master'].map(t => (
            <div key={t} className={`nav-item ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t}</div>
          ))}
        </div>
        <button className="btn-logout" onClick={() => signOut(auth)}>LOGOUT</button>
      </div>

      <div className="main-stage">
        {/* History Counters - Points fulfilled */}
        <div className="stats-row">
          <div className="stat-card">Firms: {firms.length}</div>
          <div className="stat-card">Banks: {banks.length}</div>
          <div className="stat-card">Users: {usersList.length}</div>
        </div>

        {activeTab === "Firm Master" && (
          <div className="premium-card">
            <h3>Firm Master</h3>
            <div className="master-form-grid">
              <input placeholder="Firm Name" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
              <input placeholder="GST No" value={form.gst || ''} onChange={e => setForm({...form, gst: e.target.value})} />
              <input placeholder="Address of Firm" value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} />
            </div>
            <button className="btn-save" onClick={() => handleSave("firms")}>SAVE FIRM</button>
            <div className="list-container">
              <table className="list-table">
                <thead><tr><th>Name</th><th>Address</th><th>Action</th></tr></thead>
                <tbody>{firms.map(f => (<tr key={f.id}><td>{f.name}</td><td>{f.address}</td><td><Trash2 className="icon-del" onClick={() => handleDelete("firms", f.id)} /></td></tr>))}</tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "Bank Master" && (
          <div className="premium-card">
            <h3>Bank Master</h3>
            <div className="master-form-grid">
              <input placeholder="Bank Name" value={form.bankName || ''} onChange={e => setForm({...form, bankName: e.target.value})} />
              <input placeholder="Bank Branch" value={form.branch || ''} onChange={e => setForm({...form, branch: e.target.value})} />
              <input placeholder="Account No" value={form.accNo || ''} onChange={e => setForm({...form, accNo: e.target.value})} />
              <select value={form.firmLink || ''} onChange={e => setForm({...form, firmLink: e.target.value})}>
                <option value="">Select Firm</option>
                {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
            </div>
            <button className="btn-save" onClick={() => handleSave("banks")}>SAVE BANK</button>
            <div className="list-container">
              <table className="list-table">
                <thead><tr><th>Bank</th><th>Branch</th><th>Action</th></tr></thead>
                <tbody>{banks.map(b => (<tr key={b.id}><td>{b.bankName}</td><td>{b.branch}</td><td><Trash2 className="icon-del" onClick={() => handleDelete("banks", b.id)} /></td></tr>))}</tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "User Master" && (
          <div className="premium-card">
            <h3>User Master</h3>
            <div className="master-form-grid">
              <input placeholder="User Code" value={form.uCode || ''} onChange={e => setForm({...form, uCode: e.target.value})} />
              <input placeholder="User Name" value={form.uName || ''} onChange={e => setForm({...form, uName: e.target.value})} />
              <input placeholder="User Email" value={form.uEmail || ''} onChange={e => setForm({...form, uEmail: e.target.value})} />
              <input placeholder="Mobile No" value={form.uMob || ''} onChange={e => setForm({...form, uMob: e.target.value})} />
              <input type="password" placeholder="Password" value={form.uPass || ''} onChange={e => setForm({...form, uPass: e.target.value})} />
            </div>
            <button className="btn-save" onClick={() => handleSave("users")}>SAVE USER</button>
            <div className="list-container">
              <table className="list-table">
                <thead><tr><th>Name</th><th>Mobile</th><th>Action</th></tr></thead>
                <tbody>{usersList.map(u => (<tr key={u.id}><td>{u.uName}</td><td>{u.uMob}</td><td><Trash2 className="icon-del" onClick={() => handleDelete("users", u.id)} /></td></tr>))}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* Dashboard contents... same as before */}

        {/* Fixed Footer - Move nahi hoga */}
        <div className="footer-branding-fixed">
          <div className="sv-small">Developed by:</div>
          <div className="sv-main">SOFTVIEW TECHNOLOGIES</div>
          <div className="sv-contact">+91 7972084304</div>
        </div>
      </div>
    </div>
  );
}

// LOGIN SCREEN RESTORED
function LoginScreen() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  return (
    <div className="login-screen">
      <div className="login-card">
        <h1 style={{color: '#0a0e2e', marginBottom: '5px'}}>BANKING PRO</h1>
        <p style={{fontSize: '12px', marginBottom: '20px'}}>A Project by Softview Technologies</p>
        <form onSubmit={(e) => { e.preventDefault(); signInWithEmailAndPassword(auth, email, pass); }}>
          <input placeholder="Email" style={{width: '100%', padding: '12px', marginBottom: '10px'}} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" style={{width: '100%', padding: '12px', marginBottom: '15px'}} onChange={e => setPass(e.target.value)} required />
          <button type="submit" className="btn-save" style={{width: '100%', background: '#0a0e2e'}}>LOGIN TO SYSTEM</button>
        </form>
      </div>
    </div>
  );
}