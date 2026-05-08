import React, { useState, useEffect } from 'react';
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { LayoutDashboard, Building2, Landmark, Users, LogOut, Settings, ChevronDown, Edit3, Trash2, UserCircle, FileText, Download } from 'lucide-react';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentUserName, setCurrentUserName] = useState("");
  const [userRole, setUserRole] = useState("Viewer");
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [selectedFirm, setSelectedFirm] = useState("All");
  const [expandedBank, setExpandedBank] = useState(null);
  const [time, setTime] = useState(new Date());
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);
  const [newPass, setNewPass] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        onSnapshot(collection(db, "User Master"), s => {
          const match = s.docs.map(d => d.data()).find(emp => emp.uEmail === u.email);
          if (match) { setUserRole(match.role); setCurrentUserName(match.uName); }
        });
        onSnapshot(collection(db, "Firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
        onSnapshot(collection(db, "Bank Master"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
      }
    });
    return () => { clearInterval(timer); unsub(); };
  }, [user]);

  const handleSave = async (coll) => {
    if (userRole === "Viewer") return alert("Access Denied!");
    try {
      if (editId) { await updateDoc(doc(db, coll, editId), { ...form }); setEditId(null); }
      else { await addDoc(collection(db, coll), { ...form, createdAt: new Date() }); }
      setForm({}); alert("Executive Command Processed!");
    } catch (e) { alert(e.message); }
  };

  if (!user) return <LoginScreen />;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#f4f7f9' }}>
      {/* SIDEBAR - ROYAL BLUE/DARK */}
      <aside style={{ width: '280px', background: '#0a192f', display: 'flex', flexDirection: 'column', boxShadow: '5px 0 25px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '45px 25px', borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
          <h1 style={{ color: '#d4af37', margin: 0, fontSize: '26px', fontWeight: '900', letterSpacing: '-0.5px' }}>BANKING PRO</h1>
          <p style={{ fontSize: '10px', color: '#64748b', letterSpacing: '2px', marginTop: '5px' }}>EXECUTIVE VERSION 2.0</p>
        </div>
        <nav style={{ flex: 1, padding: '30px 0' }}>
          {[
            { id: 'Dashboard', icon: <LayoutDashboard size={20}/> },
            { id: 'Firm Master', icon: <Building2 size={20}/> },
            { id: 'Bank Master', icon: <Landmark size={20}/> },
            { id: 'User Master', icon: <Users size={20}/> },
            { id: 'Setting', icon: <Settings size={20}/> }
          ].map(item => (
            <div key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}
                 style={{ display: 'flex', alignItems: 'center', padding: '18px 30px', color: activeTab === item.id ? '#d4af37' : '#94a3b8', cursor: 'pointer', transition: '0.3s' }}>
              {item.icon} <span style={{ marginLeft: '15px', fontWeight: '600', fontSize: '14px' }}>{item.id.toUpperCase()}</span>
            </div>
          ))}
        </nav>
        <div style={{ padding: '30px', background: 'rgba(0,0,0,0.2)' }}>
          <p style={{ color: '#d4af37', fontWeight: 'bold', fontSize: '11px', margin: 0 }}>DEVELOPED BY:</p>
          <p style={{ color: '#fff', fontSize: '13px', margin: '5px 0' }}>SOFTVIEW TECHNOLOGIES</p>
          <p style={{ color: '#64748b', fontSize: '11px' }}>Mob: +91 7972084304</p>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ height: '100px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 50px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#0a192f' }}>{activeTab}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
            <div style={{ textAlign: 'right', borderRight: '1px solid #eee', paddingRight: '30px' }}>
              <div style={{ fontSize: '19px', fontWeight: '900', color: '#0a192f' }}>{time.toLocaleTimeString()}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>{time.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#0a192f' }}>{currentUserName || "Admin"}</div>
                <div style={{ fontSize: '10px', color: '#d4af37', fontWeight: 'bold' }}>{user.email} • {userRole}</div>
              </div>
              <UserCircle size={40} color="#d4af37" strokeWidth={1.5} />
            </div>
            <button onClick={() => signOut(auth)} style={{ background: '#fff1f1', border: 'none', color: '#e11d48', padding: '12px', borderRadius: '12px', cursor: 'pointer' }}><LogOut size={22}/></button>
          </div>
        </header>

        <div style={{ flex: 1, padding: '50px', overflowY: 'auto' }}>
          {/* FIRM MASTER WITH ADDRESS FIELD RESTORED */}
          {activeTab === "Firm Master" && (
            <div className="royal-form-container">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '40px' }}>
                <div className="input-field">
                  <label>FIRM NAME</label>
                  <input placeholder="Enter Company Name" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="input-field">
                  <label>GST NUMBER</label>
                  <input placeholder="27XXXXX..." value={form.gst || ''} onChange={e => setForm({...form, gst: e.target.value})} />
                </div>
                <div className="input-field" style={{ gridColumn: 'span 2' }}>
                  <label>OFFICE ADDRESS</label>
                  <textarea rows="3" placeholder="Complete Registered Address" value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} />
                </div>
                <button onClick={() => handleSave("Firms")} className="btn-luxury-primary" style={{ gridColumn: 'span 2' }}>{editId ? "UPDATE FIRM DETAILS" : "AUTHORIZE NEW FIRM"}</button>
              </div>
              <table className="royal-table">
                <thead><tr><th>FIRM NAME</th><th>GST NO</th><th>ADDRESS</th><th>ACTION</th></tr></thead>
                <tbody>{firms.map(f => <tr key={f.id}><td>{f.name}</td><td>{f.gst}</td><td style={{fontSize:'12px'}}>{f.address}</td><td><Edit3 size={16} onClick={() => {setForm(f); setEditId(f.id);}}/></td></tr>)}</tbody>
              </table>
            </div>
          )}

          {/* SETTING TAB FIX */}
          {activeTab === "Setting" && (
            <div className="royal-form-container" style={{ maxWidth: '600px' }}>
              <h3 style={{ color: '#0a192f', marginBottom: '25px' }}>Security Configuration</h3>
              <div className="input-field">
                <label>NEW PASSWORD</label>
                <input type="password" placeholder="••••••••" value={newPass} onChange={e => setNewPass(e.target.value)} />
              </div>
              <button onClick={() => updatePassword(auth.currentUser, newPass).then(() => alert("Security Updated")).catch(e => alert(e.message))} className="btn-luxury-primary" style={{ marginTop: '20px' }}>COMMIT CHANGES</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function LoginScreen() {
  const [e, setE] = useState(""); const [p, setP] = useState("");
  const h = (ev) => { ev.preventDefault(); signInWithEmailAndPassword(auth, e, p).catch(() => alert("Unauthorized Access")); };
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a192f' }}>
      <form onSubmit={h} style={{ background: '#fff', padding: '60px', borderRadius: '30px', width: '450px', textAlign: 'center', borderTop: '10px solid #d4af37', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
        <h2 style={{ fontSize: '32px', margin: 0, fontWeight: '900', color: '#0a192f' }}>BANKING PRO</h2>
        <p style={{ color: '#d4af37', fontSize: '11px', fontWeight: 'bold', marginBottom: '40px' }}>EXECUTIVE VERSION 2.0</p>
        <input type="email" placeholder="Email Address" className="luxury-input" onChange={v => setE(v.target.value)} style={{ width: '100%', marginBottom: '20px' }} />
        <input type="password" placeholder="Secure Pin" className="luxury-input" onChange={v => setP(v.target.value)} style={{ width: '100%', marginBottom: '40px' }} />
        <button type="submit" className="btn-luxury-primary" style={{ width: '100%' }}>LOG IN</button>
        <div style={{ marginTop: '40px', fontSize: '11px', color: '#94a3b8' }}>Developed by Softview Technologies<br/><span style={{ color: '#0a192f', fontWeight: '900' }}>+91 7972084304</span></div>
      </form>
    </div>
  );
}