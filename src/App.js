import React, { useState, useEffect } from 'react';
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { LayoutDashboard, Building2, Landmark, Users, Clock, ChevronDown, Edit3, Trash2, Settings, ArrowUp, ArrowDown } from 'lucide-react';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("Viewer");
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [selectedFirm, setSelectedFirm] = useState("All");
  const [time, setTime] = useState(new Date());
  const [form, setForm] = useState({});

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        // 🛠️ Role Check: 'User Master' collection se hi uthayega
        onSnapshot(collection(db, "User Master"), (snap) => {
          const match = snap.docs.find(d => d.data().uEmail === u.email);
          if (match) setUserRole(match.data().role);
        });

        // 📊 Data Fetching: 'Firms' aur 'Bank Master' nodes se
        onSnapshot(collection(db, "Firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
        onSnapshot(collection(db, "Bank Master"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
      }
    });
    return () => { clearInterval(timer); unsub(); };
  }, [user]);

  // Security Logic
  const handleSave = async (coll) => {
    if (userRole === "Viewer") return alert("Only Admin/Operator can Add!");
    try { await addDoc(collection(db, coll), { ...form, status: 'Open' }); setForm({}); alert("Saved!"); } 
    catch (e) { alert("Error!"); }
  };

  const handleEdit = async (coll, id, currentName) => {
    if (userRole !== "Admin") return alert("Only Admin can Edit!");
    const newVal = prompt("Edit Name:", currentName);
    if (newVal) await updateDoc(doc(db, coll, id), { name: newVal, bankName: newVal });
  };

  if (!user) return <LoginScreen />;

  const dashboardData = banks.filter(b => {
    const firmMatch = selectedFirm === "All" || b.linkedFirm === selectedFirm;
    const hasBalance = parseFloat(b.balance || 0) !== 0;
    return firmMatch && (b.status === 'Open' || hasBalance);
  });

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      {/* SIDEBAR */}
      <aside className="executive-sidebar">
        <div style={{ padding: '25px' }}><h1 style={{ color: 'var(--gold)', margin: 0, fontSize: '18px' }}>BANKING PRO</h1></div>
        <nav style={{ flex: 1 }}>
          <div className={`nav-item ${activeTab === 'Dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('Dashboard')}><LayoutDashboard size={18}/> Dashboard</div>
          {userRole !== "Viewer" && (
            <>
              <div className={`nav-item ${activeTab === 'Firm Master' ? 'active' : ''}`} onClick={() => setActiveTab('Firm Master')}><Building2 size={18}/> Firm Master</div>
              <div className={`nav-item ${activeTab === 'Bank Master' ? 'active' : ''}`} onClick={() => setActiveTab('Bank Master')}><Landmark size={18}/> Bank Master</div>
            </>
          )}
          {userRole === "Admin" && <div className={`nav-item ${activeTab === 'User Master' ? 'active' : ''}`} onClick={() => setActiveTab('User Master')}><Users size={18}/> User Master</div>}
        </nav>
        <div style={{ padding: '20px', borderTop: '1px solid rgba(212,175,55,0.1)' }}>
          <p style={{ color: 'var(--gold)', fontWeight: 'bold', fontSize: '11px' }}>SOFTVIEW TECHNOLOGIES</p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, marginLeft: '260px', overflowY: 'auto', background: '#f8fafc' }}>
        <header className="luxury-header">
          <div style={{ fontWeight: 'bold' }}>{activeTab.toUpperCase()} <span style={{fontSize:'10px', color:'var(--gold)'}}>({userRole})</span></div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right', fontSize: '12px' }}>{time.toLocaleTimeString()}</div>
            <button className="btn-gold" style={{ padding: '5px 15px', background:'#ffefef', color:'red' }} onClick={() => signOut(auth)}>Logout</button>
          </div>
        </header>

        <div style={{ padding: '30px' }}>
          {activeTab === "Dashboard" && (
            <div>
              <select className="btn-gold" style={{ background: 'white', marginBottom: '20px' }} onChange={(e) => setSelectedFirm(e.target.value)}>
                <option value="All">All Firms</option>
                {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
              <table className="royal-table">
                <thead><tr><th>Bank Name</th><th>A/c No</th><th style={{textAlign:'right'}}>Balance</th><th>View</th></tr></thead>
                <tbody>
                  {dashboardData.map(b => (
                    <tr key={b.id}>
                      <td>{b.bankName}</td><td>{b.accNo}</td><td style={{textAlign:'right'}}>₹ {b.balance}</td>
                      <td style={{textAlign:'center'}}><ChevronDown style={{color:'var(--gold)'}} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Add other master UIs here if needed... */}
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
      <form onSubmit={h} style={{background:'white', padding:'40px', borderRadius:'15px', width:'350px', borderTop:'5px solid #d4af37'}}>
        <h2 style={{textAlign:'center', color:'#0a192f'}}>BANKING PRO</h2>
        <input type="email" placeholder="Email" className="btn-gold" style={{width:'100%', marginBottom:'15px', background:'#f8fafc', textAlign:'left'}} onChange={v => setE(v.target.value)} />
        <input type="password" placeholder="Password" className="btn-gold" style={{width:'100%', marginBottom:'20px', background:'#f8fafc', textAlign:'left'}} onChange={v => setP(v.target.value)} />
        <button type="submit" className="btn-gold" style={{width:'100%'}}>LOG IN</button>
      </form>
    </div>
  );
}