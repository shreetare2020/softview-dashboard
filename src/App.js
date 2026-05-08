import React, { useState, useEffect } from 'react';
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { LayoutDashboard, Building2, Landmark, Users, LogOut, Settings, ChevronDown, Edit3, Trash2, Clock, UserCircle } from 'lucide-react';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentUserName, setCurrentUserName] = useState("");
  const [userRole, setUserRole] = useState("Viewer");
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [usersList, setUsersList] = useState([]);
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
        // Essential Data Syncing
        onSnapshot(collection(db, "User Master"), s => {
          const list = s.docs.map(d => ({id: d.id, ...d.data()}));
          setUsersList(list);
          const match = list.find(emp => emp.uEmail === u.email);
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
      if (editId) {
        await updateDoc(doc(db, coll, editId), { ...form });
        setEditId(null);
      } else {
        await addDoc(collection(db, coll), { ...form, createdAt: new Date() });
      }
      setForm({}); alert("Process Completed Successfully!");
    } catch (e) { alert(e.message); }
  };

  if (!user) return <LoginScreen />;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#f8fafc' }}>
      {/* SIDEBAR - PREMIUM DARK */}
      <aside style={{ width: '280px', background: '#0a192f', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
        <div style={{ padding: '40px 25px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h1 style={{ color: '#d4af37', margin: 0, fontSize: '24px' }}>BANKING PRO</h1>
          <p style={{ fontSize: '11px', color: '#64748b', letterSpacing: '1px' }}>EXECUTIVE VERSION 2.0</p>
        </div>
        <nav style={{ flex: 1, padding: '20px 0' }}>
          {[
            { id: 'Dashboard', icon: <LayoutDashboard size={20}/> },
            { id: 'Firm Master', icon: <Building2 size={20}/> },
            { id: 'Bank Master', icon: <Landmark size={20}/> },
            { id: 'User Master', icon: <Users size={20}/> },
            { id: 'Setting', icon: <Settings size={20}/> }
          ].map(item => (
            <div key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`} 
                 onClick={() => {setActiveTab(item.id); setEditId(null); setForm({});}}
                 style={{ display: 'flex', alignItems: 'center', padding: '15px 25px', color: activeTab === item.id ? '#d4af37' : '#94a3b8', cursor: 'pointer' }}>
              {item.icon} <span style={{ marginLeft: '15px' }}>{item.id}</span>
            </div>
          ))}
        </nav>
        <div style={{ padding: '25px', background: 'rgba(0,0,0,0.2)' }}>
          <p style={{ color: '#d4af37', fontWeight: 'bold', fontSize: '11px', margin: 0 }}>SOFTVIEW TECHNOLOGIES</p>
          <p style={{ color: '#64748b', fontSize: '10px' }}>Mob: +91 7972084304</p>
        </div>
      </aside>

      {/* MAIN LAYOUT */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ height: '85px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#0a192f' }}>{activeTab}</div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
            <div style={{ textAlign: 'right', borderRight: '1px solid #e2e8f0', paddingRight: '25px' }}>
              <div style={{ fontSize: '17px', fontWeight: '800', color: '#0a192f' }}>{time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{time.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0a192f' }}>{currentUserName || "Admin"}</div>
                <div style={{ fontSize: '10px', color: '#d4af37' }}>{user.email} | {userRole}</div>
              </div>
              <UserCircle size={40} color="#d4af37" strokeWidth={1.5} />
            </div>

            <button onClick={() => signOut(auth)} style={{ background: '#fff1f1', border: 'none', color: '#e11d48', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}>
              <LogOut size={20}/>
            </button>
          </div>
        </header>

        <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
          {/* DASHBOARD RESTORED */}
          {activeTab === "Dashboard" && (
            <div>
              <select className="luxury-input" style={{ width: '250px', marginBottom: '25px' }} onChange={(e) => setSelectedFirm(e.target.value)}>
                <option value="All">All Companies</option>
                {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
              <table className="royal-table">
                <thead><tr><th>Bank Name</th><th>Account No</th><th style={{ textAlign: 'right' }}>Balance</th><th>View</th></tr></thead>
                <tbody>
                  {banks.filter(b => selectedFirm === "All" || b.linkedFirm === selectedFirm).map(b => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: '600' }}>{b.bankName}</td>
                      <td>{b.accNo}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>₹ {b.balance}</td>
                      <td style={{ textAlign: 'center' }}><ChevronDown size={18} color="#d4af37"/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* SETTING TAB FIX */}
          {activeTab === "Setting" && (
            <div style={{ maxWidth: '500px', background: '#fff', padding: '40px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 25px 0', color: '#0a192f' }}>Access Control</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <input type="password" placeholder="Enter New Password" value={newPass} className="luxury-input" onChange={e => setNewPass(e.target.value)} />
                <button onClick={() => updatePassword(auth.currentUser, newPass).then(() => {alert("Password Secured"); setNewPass("");})} 
                        style={{ background: '#0a192f', color: '#d4af37', padding: '15px', borderRadius: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                  UPDATE CREDENTIALS
                </button>
              </div>
            </div>
          )}

          {/* BANK MASTER WITH CLOSED DATE LOGIC */}
          {activeTab === "Bank Master" && (
            <div style={{ background: '#fff', padding: '30px', borderRadius: '20px' }}>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '30px' }}>
                  <input placeholder="Bank Name" className="luxury-input" value={form.bankName || ''} onChange={e => setForm({...form, bankName: e.target.value})} />
                  <select className="luxury-input" value={form.status || 'Open'} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="Open">Active (Open)</option>
                    <option value="Closed">Terminated (Closed)</option>
                  </select>
                  {form.status === 'Closed' && <input type="date" className="luxury-input" value={form.closeDate || ''} onChange={e => setForm({...form, closeDate: e.target.value})} />}
                  <button onClick={() => handleSave("Bank Master")} style={{ gridColumn: 'span 3', background: '#d4af37', color: '#0a192f', padding: '15px', borderRadius: '12px', fontWeight: 'bold', border: 'none' }}>
                    {editId ? "SAVE CHANGES" : "CREATE NEW BANK"}
                  </button>
               </div>
               <table className="royal-table">
                 <thead><tr><th>Bank</th><th>Status</th><th>Termination Date</th><th>Actions</th></tr></thead>
                 <tbody>
                   {banks.map(b => (
                     <tr key={b.id}>
                       <td>{b.bankName}</td>
                       <td>{b.status}</td>
                       <td>{b.closeDate || 'N/A'}</td>
                       <td><Edit3 size={16} onClick={() => {setForm(b); setEditId(b.id);}}/></td>
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
  const h = (ev) => { ev.preventDefault(); signInWithEmailAndPassword(auth, e, p).catch(() => alert("Access Denied")); };
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a192f' }}>
      <form onSubmit={h} style={{ background: '#fff', padding: '60px', borderRadius: '24px', width: '420px', borderTop: '8px solid #d4af37' }}>
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <h2 style={{ color: '#0a192f', margin: 0 }}>BANKING PRO</h2>
          <p style={{ color: '#d4af37', fontSize: '12px', fontWeight: 'bold' }}>EXECUTIVE VERSION 2.0</p>
        </div>
        <input type="email" placeholder="Corporate ID" className="luxury-input" style={{ width: '100%', marginBottom: '20px' }} onChange={v => setE(v.target.value)} />
        <input type="password" placeholder="Pin" className="luxury-input" style={{ width: '100%', marginBottom: '30px' }} onChange={v => setP(v.target.value)} />
        <button type="submit" style={{ width: '100%', background: '#0a192f', color: '#d4af37', padding: '16px', borderRadius: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>AUTHENTICATE</button>
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>Developed by Softview Technologies</p>
          <p style={{ fontSize: '11px', color: '#0a192f', fontWeight: 'bold' }}>+91 7972084304</p>
        </div>
      </form>
    </div>
  );
}