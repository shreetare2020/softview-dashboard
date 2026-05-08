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
  const [selectedFirm, setSelectedFirm] = useState("All");

  // Point 2: Live Clock with Seconds
  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Syncing Data from Firebase
  useEffect(() => {
    onAuthStateChanged(auth, (u) => setUser(u));
    if (user) {
      onSnapshot(collection(db, "firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "banks"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "users"), s => setUsersList(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
  }, [user]);

  const handleSave = async (coll) => {
    await addDoc(collection(db, coll), { ...form, status: 'Open', date: new Date().toLocaleDateString() });
    setForm({}); alert("Saved Successfully!");
  };

  const handleDelete = async (coll, id) => {
    if(window.confirm("Are you sure?")) await deleteDoc(doc(db, coll, id));
  };

  if (!user) return <LoginScreen />;

  return (
    <div className="app-shell">
      {/* Point 3: Sidebar with Bottom Logout */}
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
        {/* Point 1 & 2: Premium Header */}
        <div className="header-premium">
          <div className="welcome-msg">WELCOME, ADMIN</div>
          <div className="clock-msg">{dateTime.toLocaleDateString('en-GB')} | {dateTime.toLocaleTimeString()}</div>
        </div>

        {/* 10. Firm Master */}
        {activeTab === "Firm Master" && (
          <div className="premium-card">
            <h3>Add New Firm</h3>
            <div className="master-form-grid">
              <input placeholder="Firm Name" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
              <input placeholder="Firm Address" value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} />
              <input placeholder="GST Number" value={form.gst || ''} onChange={e => setForm({...form, gst: e.target.value})} />
            </div>
            <button className="btn-save" onClick={() => handleSave("firms")}>SAVE FIRM</button>
            <div style={{marginTop:'30px'}}>
              <h4>Opened Firms List ({firms.length})</h4>
              <table className="list-table">
                <thead><tr><th>Firm Name</th><th>GST</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {firms.map(f => (
                    <tr key={f.id}><td>{f.name}</td><td>{f.gst}</td><td><span className="status-pill">● {f.status}</span></td>
                    <td><b style={{color:'blue', cursor:'pointer'}}>Edit</b> | <b style={{color:'red', cursor:'pointer'}} onClick={()=>handleDelete("firms", f.id)}>Delete</b></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 11. Bank Master - 5 Fields + List */}
        {activeTab === "Bank Master" && (
          <div className="premium-card">
            <h3>Add New Bank Account</h3>
            <div className="master-form-grid">
              <input placeholder="Bank Name" value={form.bankName || ''} onChange={e => setForm({...form, bankName: e.target.value})} />
              <input placeholder="Branch" value={form.branch || ''} onChange={e => setForm({...form, branch: e.target.value})} />
              <input placeholder="Account No" value={form.accNo || ''} onChange={e => setForm({...form, accNo: e.target.value})} />
              <input placeholder="IFSC Code" value={form.ifsc || ''} onChange={e => setForm({...form, ifsc: e.target.value})} />
              <input placeholder="Opening Balance" value={form.balance || ''} onChange={e => setForm({...form, balance: e.target.value})} />
              <select value={form.firmLink || ''} onChange={e => setForm({...form, firmLink: e.target.value})}>
                 <option>Link to Firm</option>
                 {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
            </div>
            <button className="btn-save" onClick={() => handleSave("banks")}>SAVE BANK</button>
            <div style={{marginTop:'30px'}}>
              <h4>Opened Banks List ({banks.length})</h4>
              <table className="list-table">
                <thead><tr><th>Bank Name</th><th>A/c No</th><th>IFSC</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {banks.map(b => (
                    <tr key={b.id}><td>{b.bankName}</td><td>{b.accNo}</td><td>{b.ifsc}</td>
                    <td><span className="status-pill">● {b.status}</span></td>
                    <td><b style={{color:'blue', cursor:'pointer'}}>Edit</b> | <b style={{color:'red', cursor:'pointer'}} onClick={()=>handleDelete("banks", b.id)}>Delete</b></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 12. User Master - 5 Fields + List */}
        {activeTab === "User Master" && (
          <div className="premium-card">
            <h3>Add New User (Admin/Staff)</h3>
            <div className="master-form-grid">
              <input placeholder="User ID" value={form.uId || ''} onChange={e => setForm({...form, uId: e.target.value})} />
              <input placeholder="Full Name" value={form.uName || ''} onChange={e => setForm({...form, uName: e.target.value})} />
              <input placeholder="Mobile No" value={form.uMob || ''} onChange={e => setForm({...form, uMob: e.target.value})} />
              <input placeholder="Email" value={form.uEmail || ''} onChange={e => setForm({...form, uEmail: e.target.value})} />
              <input type="password" placeholder="Password" value={form.uPass || ''} onChange={e => setForm({...form, uPass: e.target.value})} />
            </div>
            <button className="btn-save" onClick={() => handleSave("users")}>SAVE USER</button>
            <div style={{marginTop:'30px'}}>
              <h4>Active Users List ({usersList.length})</h4>
              <table className="list-table">
                <thead><tr><th>Name</th><th>Mobile</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {usersList.map(u => (
                    <tr key={u.id}><td>{u.uName}</td><td>{u.uMob}</td><td>{u.uEmail}</td>
                    <td><span className="status-pill">● {u.status}</span></td>
                    <td><b style={{color:'blue', cursor:'pointer'}}>Edit</b> | <b style={{color:'red', cursor:'pointer'}} onClick={()=>handleDelete("users", u.id)}>Delete</b></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5, 6, 7, 8, 9 Dashboard Logic */}
        {activeTab === "Dashboard" && (
           <div className="premium-card">
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <h3>Live Bank Ledger Dashboard</h3>
                <select className="firm-select" onChange={(e) => setSelectedFirm(e.target.value)}>
                   <option value="All">-- All Firms --</option>
                   {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>
              <table className="list-table" style={{marginTop:'20px'}}>
                 <thead><tr><th>Bank Name</th><th>Account No</th><th>Balance</th><th>Action</th></tr></thead>
                 <tbody>
                    {banks.filter(b => selectedFirm === "All" || b.firmLink === selectedFirm).map(b => (
                      <tr key={b.id}>
                        <td><strong>{b.bankName}</strong></td><td>{b.accNo}</td>
                        <td style={{color:'green', fontWeight:'bold'}}>₹ {b.balance} CR</td>
                        <td><button className="btn-save" style={{padding:'5px 15px', fontSize:'12px'}}>Expand Ledger</button></td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        )}

        {/* Point 4: Footer Branding */}
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