import React, { useState, useEffect } from 'react';
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { LayoutDashboard, Building2, Landmark, Users, Clock, ChevronDown, Edit3, Trash2, XCircle, Settings } from 'lucide-react';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("Viewer"); 
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [selectedFirm, setSelectedFirm] = useState("All");
  const [expandedBank, setExpandedBank] = useState(null);
  const [time, setTime] = useState(new Date());
  const [form, setForm] = useState({});

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        // 🔥 User Role Check (User Master se)
        onSnapshot(collection(db, "User Master"), (snap) => {
          const loggedInUser = snap.docs.find(d => d.data().uEmail === u.email);
          if (loggedInUser) setUserRole(loggedInUser.data().role);
        });
        // 📊 Data Fetching
        onSnapshot(collection(db, "Firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
        onSnapshot(collection(db, "Bank Master"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
      }
    });
    return () => { clearInterval(timer); unsub(); };
  }, [user]);

  // ✅ Admin Check Functions
  const isAdmin = () => {
    if (userRole === "Admin") return true;
    alert("Sirf Admin hi badlav kar sakta hai!");
    return false;
  };

  const handleSave = async (coll) => {
    if (!isAdmin()) return;
    try { await addDoc(collection(db, coll), { ...form, status: 'Open' }); setForm({}); alert("Saved!"); } catch (e) { alert("Error!"); }
  };

  const handleEdit = async (coll, id, currentName) => {
    if (!isAdmin()) return;
    const newVal = prompt("Edit Name:", currentName);
    if (newVal) await updateDoc(doc(db, coll, id), { name: newVal, bankName: newVal });
  };

  const handleDelete = async (coll, id) => {
    if (!isAdmin()) return;
    if (window.confirm("Delete karein?")) await deleteDoc(doc(db, coll, id));
  };

  if (!user) return <LoginScreen />;

  // 📈 Dashboard Filter (Fixed)
  const dashboardData = banks.filter(b => {
    const firmMatch = selectedFirm === "All" || b.linkedFirm === selectedFirm;
    return firmMatch && (b.status === 'Open' || parseFloat(b.balance || 0) !== 0);
  });

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <aside className="executive-sidebar">
        <div className="sidebar-header">
          <h1 style={{ color: 'var(--gold)', margin: 0, fontSize: '18px' }}>BANKING PRO</h1>
          <p style={{ fontSize: '9px', color: '#94a3b8' }}>EXECUTIVE VERSION 2.0</p>
        </div>
        <nav style={{ flex: 1, paddingTop: '20px' }}>
          <div className={`nav-item ${activeTab === 'Dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('Dashboard')}><LayoutDashboard size={18}/> Dashboard</div>
          <div className={`nav-item ${activeTab === 'Firm Master' ? 'active' : ''}`} onClick={() => setActiveTab('Firm Master')}><Building2 size={18}/> Firm Master</div>
          <div className={`nav-item ${activeTab === 'Bank Master' ? 'active' : ''}`} onClick={() => setActiveTab('Bank Master')}><Landmark size={18}/> Bank Master</div>
          <div className={`nav-item ${activeTab === 'User Master' ? 'active' : ''}`} onClick={() => setActiveTab('User Master')}><Users size={18}/> User Master</div>
        </nav>
        <div className="sidebar-header" style={{ borderTop: '1px solid rgba(212,175,55,0.1)' }}>
          <p style={{ color: 'var(--gold)', fontWeight: 'bold', fontSize: '12px' }}>SOFTVIEW TECHNOLOGIES</p>
        </div>
      </aside>

      <main className="main-content">
        <header className="luxury-header">
          <div style={{ fontWeight: '900', color: 'var(--dark-blue)' }}>{activeTab.toUpperCase()} <span style={{fontSize:'10px', color:'var(--gold)'}}>({userRole})</span></div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right', fontSize: '12px' }}>{time.toLocaleTimeString()}</div>
            <button className="btn-gold" style={{ padding: '5px 15px', background:'#ffefef', color:'red', border:'1px solid red' }} onClick={() => signOut(auth)}>Logout</button>
          </div>
        </header>

        <div style={{ padding: '30px', overflowY: 'auto' }}>
          {activeTab === "Dashboard" && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <select className="btn-gold" style={{ background: 'white' }} onChange={(e) => setSelectedFirm(e.target.value)}>
                  <option value="All">All Firms</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>
              <table className="royal-table">
                <thead><tr><th>Bank Name</th><th>A/c No</th><th style={{textAlign:'right'}}>Balance</th><th>Ledger</th></tr></thead>
                <tbody>
                  {dashboardData.length > 0 ? dashboardData.map(b => (
                    <tr key={b.id}>
                      <td>{b.bankName}</td><td>{b.accNo}</td><td style={{textAlign:'right'}}>₹ {b.balance}</td>
                      <td style={{textAlign:'center'}}><ChevronDown style={{cursor:'pointer'}} /></td>
                    </tr>
                  )) : <tr><td colSpan="4" style={{textAlign:'center', padding:'20px'}}>No Bank Data. Check Bank Master Linkage.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "Firm Master" && (
            <div>
              <div className="ledger-box" style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', background:'white'}}>
                <input placeholder="Firm Name" className="btn-gold" style={{textAlign:'left'}} onChange={e => setForm({...form, name: e.target.value})} />
                <input placeholder="GST No" className="btn-gold" style={{textAlign:'left'}} onChange={e => setForm({...form, gst: e.target.value})} />
                <button className="btn-gold" style={{gridColumn:'span 3'}} onClick={() => handleSave("Firms")}>SAVE FIRM MASTER</button>
              </div>
              <table className="royal-table" style={{marginTop:'20px'}}>
                <thead><tr><th>Name</th><th>GST</th><th>Actions</th></tr></thead>
                <tbody>
                  {firms.map(f => (
                    <tr key={f.id}>
                      <td>{f.name}</td><td>{f.gst}</td>
                      <td>
                        <Edit3 size={16} onClick={() => handleEdit('Firms', f.id, f.name)} style={{cursor:'pointer', marginRight:'10px'}}/>
                        <Trash2 size={16} color="red" onClick={() => handleDelete('Firms', f.id)} style={{cursor:'pointer'}}/>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function LoginScreen() {
  const [e, setE] = useState(""); const [p, setP] = useState("");
  const h = (ev) => { ev.preventDefault(); import("firebase/auth").then(a => a.signInWithEmailAndPassword(auth, e, p)).catch(() => alert("Login Failed")); };
  return (
    <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f1f5f9'}}>
      <form onSubmit={h} style={{background:'white', padding:'40px', borderRadius:'15px', boxShadow:'0 10px 25px rgba(0,0,0,0.1)', width:'350px'}}>
        <h2 style={{textAlign:'center', color:'var(--dark-blue)'}}>BANKING PRO</h2>
        <input type="email" placeholder="Email" style={{width:'100%', padding:'10px', marginBottom:'15px', borderRadius:'5px', border:'1px solid #ddd'}} onChange={v => setE(v.target.value)} />
        <input type="password" placeholder="Password" style={{width:'100%', padding:'10px', marginBottom:'15px', borderRadius:'5px', border:'1px solid #ddd'}} onChange={v => setP(v.target.value)} />
        <button type="submit" className="btn-gold" style={{width:'100%'}}>LOG IN</button>
      </form>
    </div>
  );
}