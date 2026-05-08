import React, { useState, useEffect } from 'react';
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { LayoutDashboard, Building2, Landmark, Users, LogOut, Settings, ChevronDown, Edit3, Trash2, XCircle } from 'lucide-react';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("Viewer");
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [selectedFirm, setSelectedFirm] = useState("All");
  const [time, setTime] = useState(new Date());
  const [form, setForm] = useState({});
  const [newPass, setNewPass] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        onSnapshot(collection(db, "User Master"), s => {
          const list = s.docs.map(d => ({id: d.id, ...d.data()}));
          setUsersList(list);
          const match = list.find(emp => emp.uEmail === u.email);
          if (match) setUserRole(match.role);
        });
        onSnapshot(collection(db, "Firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
        onSnapshot(collection(db, "Bank Master"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
      }
    });
    return () => { clearInterval(timer); unsub(); };
  }, [user]);

  const handleSave = async (coll) => {
    if (userRole === "Viewer") return alert("No Rights!");
    if (userRole === "Operator" && coll === "User Master") return alert("Admin Only!");
    await addDoc(collection(db, coll), { ...form, status: 'Active' });
    setForm({}); alert("Saved Successfully!");
  };

  const handlePassChange = () => {
    updatePassword(auth.currentUser, newPass).then(() => alert("Password Changed!")).catch(e => alert(e.message));
  };

  if (!user) return <LoginScreen />;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      {/* SIDEBAR */}
      <aside className="executive-sidebar">
        <div style={{ padding: '25px' }}>
          <h1 style={{ color: 'var(--gold)', margin: 0, fontSize: '20px' }}>BANKING PRO</h1>
          <p style={{ fontSize: '9px', color: '#64748b' }}>EXECUTIVE VERSION 2.0</p>
        </div>
        <nav style={{ flex: 1 }}>
          <div className={`nav-item ${activeTab === 'Dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('Dashboard')}><LayoutDashboard size={18}/> Dashboard</div>
          <div className={`nav-item ${activeTab === 'Firm Master' ? 'active' : ''}`} onClick={() => setActiveTab('Firm Master')}><Building2 size={18}/> Firm Master</div>
          <div className={`nav-item ${activeTab === 'Bank Master' ? 'active' : ''}`} onClick={() => setActiveTab('Bank Master')}><Landmark size={18}/> Bank Master</div>
          <div className={`nav-item ${activeTab === 'User Master' ? 'active' : ''}`} onClick={() => setActiveTab('User Master')}><Users size={18}/> User Master</div>
          <div className={`nav-item ${activeTab === 'Setting' ? 'active' : ''}`} onClick={() => setActiveTab('Setting')}><Settings size={18}/> Setting</div>
        </nav>
        <div style={{ padding: '20px', borderTop: '1px solid rgba(212,175,55,0.1)' }}>
          <p style={{ color: 'var(--gold)', fontWeight: 'bold', fontSize: '11px' }}>SOFTVIEW TECHNOLOGIES<br/>+91 7972084304</p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, marginLeft: '260px', overflowY: 'auto', background: '#f8fafc' }}>
        <header className="luxury-header">
          <div style={{ fontWeight: 'bold' }}>{activeTab.toUpperCase()}</div>
          <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{user.email} ({userRole})</div>
              <div style={{ fontSize: '11px', color: 'var(--gold)' }}>{time.toLocaleTimeString()}</div>
            </div>
            <button className="btn-gold" style={{ background: '#ffefef', color: 'red' }} onClick={() => signOut(auth)}>Logout</button>
          </div>
        </header>

        <div style={{ padding: '30px' }}>
          
          {/* 1. FIRM MASTER */}
          {activeTab === "Firm Master" && (
            <div>
              <div className="ledger-box" style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px', background:'white', padding:'20px'}}>
                <input placeholder="Firm Name" className="btn-gold" style={{background:'white', textAlign:'left'}} onChange={e => setForm({...form, name: e.target.value})} />
                <input placeholder="GST No" className="btn-gold" style={{background:'white', textAlign:'left'}} onChange={e => setForm({...form, gst: e.target.value})} />
                <input placeholder="Office Address" className="btn-gold" style={{background:'white', textAlign:'left'}} onChange={e => setForm({...form, address: e.target.value})} />
                <button className="btn-gold" style={{gridColumn:'span 3'}} onClick={() => handleSave("Firms")}>SAVE FIRM</button>
              </div>
              <table className="royal-table" style={{marginTop:'20px'}}>
                <thead><tr><th>Firm Name</th><th>GST</th><th>Address</th><th>Actions</th></tr></thead>
                <tbody>{firms.map(f => <tr key={f.id}><td>{f.name}</td><td>{f.gst}</td><td>{f.address}</td><td><Edit3 size={16}/> <Trash2 size={16} color="red"/></td></tr>)}</tbody>
              </table>
            </div>
          )}

          {/* 2. BANK MASTER */}
          {activeTab === "Bank Master" && (
            <div>
              <div className="ledger-box" style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', background:'white', padding:'20px'}}>
                <input placeholder="Bank Name" className="btn-gold" style={{background:'white'}} onChange={e => setForm({...form, bankName: e.target.value})} />
                <input placeholder="Bank Branch" className="btn-gold" style={{background:'white'}} onChange={e => setForm({...form, branch: e.target.value})} />
                <input placeholder="A/c No" className="btn-gold" style={{background:'white'}} onChange={e => setForm({...form, accNo: e.target.value})} />
                <input placeholder="IFSC Code" className="btn-gold" style={{background:'white'}} onChange={e => setForm({...form, ifsc: e.target.value})} />
                <input placeholder="Opening Balance" className="btn-gold" style={{background:'white'}} onChange={e => setForm({...form, balance: e.target.value})} />
                <select className="btn-gold" style={{background:'white'}} onChange={e => setForm({...form, type: e.target.value})}><option>Dr/Cr</option><option value="Dr">Dr</option><option value="Cr">Cr</option></select>
                <button className="btn-gold" style={{gridColumn:'span 3'}} onClick={() => handleSave("Bank Master")}>SAVE BANK</button>
              </div>
            </div>
          )}

          {/* 3. USER MASTER */}
          {activeTab === "User Master" && (
            <div>
              <div className="ledger-box" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', background:'white', padding:'20px'}}>
                <input placeholder="User Code" className="btn-gold" style={{background:'white'}} onChange={e => setForm({...form, code: e.target.value})} />
                <input placeholder="User Name" className="btn-gold" style={{background:'white'}} onChange={e => setForm({...form, uName: e.target.value})} />
                <input placeholder="User Email" className="btn-gold" style={{background:'white'}} onChange={e => setForm({...form, uEmail: e.target.value})} />
                <input placeholder="Mobile" className="btn-gold" style={{background:'white'}} onChange={e => setForm({...form, mobile: e.target.value})} />
                <select className="btn-gold" style={{background:'white'}} onChange={e => setForm({...form, role: e.target.value})}><option>Select Role</option><option value="Admin">Admin</option><option value="Operator">Operator</option><option value="Viewer">Viewer</option></select>
                <button className="btn-gold" onClick={() => handleSave("User Master")}>SAVE USER</button>
              </div>
            </div>
          )}

          {/* 4. SETTING */}
          {activeTab === "Setting" && (
            <div className="ledger-box" style={{background:'white', padding:'40px', width:'400px'}}>
              <h3 style={{color:'var(--dark-blue)'}}>Change Password</h3>
              <input type="password" placeholder="New Password" className="btn-gold" style={{background:'#f8fafc', width:'100%', marginBottom:'20px'}} onChange={e => setNewPass(e.target.value)} />
              <button className="btn-gold" style={{width:'100%'}} onClick={handlePassChange}>UPDATE PASSWORD</button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

function LoginScreen() {
  const [e, setE] = useState(""); const [p, setP] = useState("");
  const h = (ev) => { ev.preventDefault(); signInWithEmailAndPassword(auth, e, p).catch(() => alert("Login Failed")); };
  return (
    <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0a192f'}}>
      <form onSubmit={h} style={{background:'white', padding:'50px', borderRadius:'15px', width:'400px', borderTop:'5px solid #d4af37'}}>
        <h2 style={{textAlign:'center', color:'#0a192f'}}>BANKING PRO</h2>
        <input type="email" placeholder="Login ID" className="btn-gold" style={{width:'100%', marginBottom:'15px', background:'#f8fafc'}} onChange={v => setE(v.target.value)} />
        <input type="password" placeholder="Password" className="btn-gold" style={{width:'100%', marginBottom:'25px', background:'#f8fafc'}} onChange={v => setP(v.target.value)} />
        <button type="submit" className="btn-gold" style={{width:'100%', padding:'15px'}}>LOG IN</button>
        <p style={{textAlign:'center', fontSize:'11px', marginTop:'20px', color:'#94a3b8'}}>Developed by Softview Technologies</p>
      </form>
    </div>
  );
}