import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from "./firebase"; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc } from "firebase/firestore";

export default function App() {
  const [user, setUser] = useState(null);
  const [dateTime, setDateTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [banks, setBanks] = useState([]);
  const [firms, setFirms] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [form, setForm] = useState({});

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => setUser(u));
    if (user) {
      onSnapshot(collection(db, "firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "banks"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "users"), s => setUsersList(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
  }, [user]);

  const handleSave = async (coll) => {
    await addDoc(collection(db, coll), { ...form, status: 'Open' });
    setForm({}); alert("Data Saved!");
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
        <div className="logout-box">
          <button className="btn-logout" onClick={() => signOut(auth)}>LOGOUT</button>
        </div>
      </div>

      <div className="main-stage">
        <div className="header-top">
          <div className="welcome-txt">Welcome, ADMIN</div>
          <div className="live-clock">{dateTime.toLocaleDateString('en-GB')} | {dateTime.toLocaleTimeString()}</div>
        </div>

        {/* FIRM MASTER WITH LIST */}
        {activeTab === "Firm Master" && (
          <div className="card">
            <h3>Add New Firm</h3>
            <div className="form-grid">
              <input placeholder="Firm Name" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
              <input placeholder="GST No" value={form.gst || ''} onChange={e => setForm({...form, gst: e.target.value})} />
              <button className="btn-save" onClick={() => handleSave("firms")}>SAVE</button>
            </div>
            <h4>Opened Firms List</h4>
            <table className="list-table">
              <thead><tr><th>Firm Name</th><th>GST</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {firms.map(f => (
                  <tr key={f.id}><td>{f.name}</td><td>{f.gst}</td><td>{f.status}</td>
                  <td><button className="btn-edit">Edit</button><button className="btn-del" onClick={()=>handleDelete("firms", f.id)}>Delete</button></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* BANK MASTER WITH LIST */}
        {activeTab === "Bank Master" && (
          <div className="card">
            <h3>Add New Bank</h3>
            <div className="form-grid">
              <input placeholder="Bank Name" value={form.bankName || ''} onChange={e => setForm({...form, bankName: e.target.value})} />
              <input placeholder="A/c No" value={form.accNo || ''} onChange={e => setForm({...form, accNo: e.target.value})} />
              <input placeholder="IFSC" value={form.ifsc || ''} onChange={e => setForm({...form, ifsc: e.target.value})} />
              <button className="btn-save" onClick={() => handleSave("banks")}>SAVE</button>
            </div>
            <h4>Opened Banks List</h4>
            <table className="list-table">
              <thead><tr><th>Bank Name</th><th>A/c No</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {banks.map(b => (
                  <tr key={b.id}><td>{b.bankName}</td><td>{b.accNo}</td><td>{b.status}</td>
                  <td><button className="btn-edit">Edit</button><button className="btn-del" onClick={()=>handleDelete("banks", b.id)}>Delete</button></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* USER MASTER WITH LIST */}
        {activeTab === "User Master" && (
          <div className="card">
            <h3>Add New User</h3>
            <div className="form-grid">
              <input placeholder="User Name" onChange={e => setForm({...form, uName: e.target.value})} />
              <input placeholder="Mobile" onChange={e => setForm({...form, uMobile: e.target.value})} />
              <button className="btn-save" onClick={() => handleSave("users")}>SAVE</button>
            </div>
            <h4>Opened Users List</h4>
            <table className="list-table">
              <thead><tr><th>User Name</th><th>Mobile</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {usersList.map(u => (
                  <tr key={u.id}><td>{u.uName}</td><td>{u.uMobile}</td><td>{u.status}</td>
                  <td><button className="btn-edit">Edit</button><button className="btn-del" onClick={()=>handleDelete("users", u.id)}>Delete</button></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="footer-lock">
          <div className="softview-text">Developed by: SOFTVIEW TECHNOLOGIES</div>
          <div className="softview-phone">+91 7972084304</div>
        </div>
      </div>
    </div>
  );
}

function LoginScreen() {
  const [e, setE] = useState("");
  const [p, setP] = useState("");
  return (
    <div className="login-bg">
      <div className="login-box">
        <h1>BANKING PRO</h1>
        <p className="login-subtitle">a Project by Softview Technologies</p>
        <form onSubmit={(ev) => { ev.preventDefault(); signInWithEmailAndPassword(auth, e, p); }}>
          <input placeholder="Email" style={{width:'100%', padding:'12px', margin:'10px 0'}} onChange={ev => setE(ev.target.value)} required />
          <input type="password" placeholder="Password" style={{width:'100%', padding:'12px', margin:'10px 0'}} onChange={ev => setP(ev.target.value)} required />
          <button type="submit" style={{width:'100%', padding:'12px', background:'#0a0e2e', color:'#ffca28', border:'none', borderRadius:'5px', fontWeight:'bold'}}>LOGIN TO SYSTEM</button>
        </form>
      </div>
    </div>
  );
}