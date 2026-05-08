import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from "./firebase"; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc } from "firebase/firestore";
import { Trash2, PlusCircle } from 'lucide-react';

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
    await addDoc(collection(db, coll), { ...form, createdAt: new Date() });
    setForm({}); alert("Saved!");
  };

  const handleDelete = async (coll, id) => {
    if(window.confirm("Delete this record?")) await deleteDoc(doc(db, coll, id));
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
        <div className="stats-header">
          <div className="stat-pill">Firms: {firms.length}</div>
          <div className="stat-pill">Banks: {banks.length}</div>
          <div className="stat-pill">Users: {usersList.length}</div>
        </div>

        {activeTab === "Firm Master" && (
          <div className="master-card">
            <h3><PlusCircle size={18}/> Firm Master</h3>
            <div className="grid-3">
              <input placeholder="Firm Name" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
              <input placeholder="GST No" value={form.gst || ''} onChange={e => setForm({...form, gst: e.target.value})} />
              <input placeholder="Address of Firm" value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} />
            </div>
            <button className="btn-save" onClick={() => handleSave("firms")}>SAVE FIRM</button>
            <table className="data-table">
              <thead><tr><th>Name</th><th>GST</th><th>Address</th><th>Action</th></tr></thead>
              <tbody>{firms.map(f => (<tr key={f.id}><td>{f.name}</td><td>{f.gst}</td><td>{f.address}</td><td><Trash2 className="icon-del" onClick={() => handleDelete("firms", f.id)} /></td></tr>))}</tbody>
            </table>
          </div>
        )}

        {activeTab === "Bank Master" && (
          <div className="master-card">
            <h3><PlusCircle size={18}/> Bank Master</h3>
            <div className="grid-3">
              <input placeholder="Bank Name" value={form.bankName || ''} onChange={e => setForm({...form, bankName: e.target.value})} />
              <input placeholder="Bank Branch" value={form.branch || ''} onChange={e => setForm({...form, branch: e.target.value})} />
              <input placeholder="A/c No" value={form.accNo || ''} onChange={e => setForm({...form, accNo: e.target.value})} />
              <select value={form.firmLink || ''} onChange={e => setForm({...form, firmLink: e.target.value})}>
                <option value="">Link to Firm</option>
                {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
            </div>
            <button className="btn-save" onClick={() => handleSave("banks")}>SAVE BANK</button>
            <table className="data-table">
              <thead><tr><th>Bank</th><th>Branch</th><th>A/c No</th><th>Action</th></tr></thead>
              <tbody>{banks.map(b => (<tr key={b.id}><td>{b.bankName}</td><td>{b.branch}</td><td>{b.accNo}</td><td><Trash2 className="icon-del" onClick={() => handleDelete("banks", b.id)} /></td></tr>))}</tbody>
            </table>
          </div>
        )}

        {activeTab === "User Master" && (
          <div className="master-card">
            <h3><PlusCircle size={18}/> User Master</h3>
            <div className="grid-3">
              <input placeholder="User Code" value={form.uCode || ''} onChange={e => setForm({...form, uCode: e.target.value})} />
              <input placeholder="User Name" value={form.uName || ''} onChange={e => setForm({...form, uName: e.target.value})} />
              <input placeholder="User Email" value={form.uEmail || ''} onChange={e => setForm({...form, uEmail: e.target.value})} />
              <input placeholder="Mobile No" value={form.uMob || ''} onChange={e => setForm({...form, uMob: e.target.value})} />
              <input type="password" placeholder="Password" value={form.uPass || ''} onChange={e => setForm({...form, uPass: e.target.value})} />
            </div>
            <button className="btn-save" onClick={() => handleSave("users")}>SAVE USER</button>
            <table className="data-table">
              <thead><tr><th>Code</th><th>Name</th><th>Mobile</th><th>Action</th></tr></thead>
              <tbody>{usersList.map(u => (<tr key={u.id}><td>{u.uCode}</td><td>{u.uName}</td><td>{u.uMob}</td><td><Trash2 className="icon-del" onClick={() => handleDelete("users", u.id)} /></td></tr>))}</tbody>
            </table>
          </div>
        )}

        {activeTab === "Dashboard" && <div className="master-card"><h3>Dashboard Live</h3><p>Select a firm to view ledgers.</p></div>}

        <div className="fixed-footer-right">
          <div className="sv-dev">Developed by:</div>
          <div className="sv-name">SOFTVIEW TECHNOLOGIES</div>
          <div className="sv-num">+91 7972084304</div>
        </div>
      </div>
    </div>
  );
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  return (
    <div className="login-box">
      <div className="login-card">
        <h2>BANKING PRO</h2>
        <form onSubmit={(e) => { e.preventDefault(); signInWithEmailAndPassword(auth, email, pass); }}>
          <input placeholder="Email" onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" onChange={e => setPass(e.target.value)} required />
          <button type="submit">LOGIN</button>
        </form>
      </div>
    </div>
  );
}