import React, { useState, useEffect } from 'react';
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { LayoutDashboard, Building2, Landmark, Users, LogOut, Settings, ChevronDown, Edit3, Trash2, FileText, Download, UserCircle, ShieldCheck } from 'lucide-react';
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
    if (userRole === "Viewer") return alert("Unauthorized!");
    try {
      if (editId) { await updateDoc(doc(db, coll, editId), { ...form }); setEditId(null); }
      else { await addDoc(collection(db, coll), { ...form, createdAt: new Date() }); }
      setForm({}); alert("Executive Sync Complete!");
    } catch (e) { alert(e.message); }
  };

  const handleDelete = async (coll, id) => {
    if (window.confirm("Delete this record permanently?")) {
      await deleteDoc(doc(db, coll, id));
    }
  };

  if (!user) return <LoginScreen />;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#f8fafc' }}>
      {/* SIDEBAR - ROYAL GOLD DARK */}
      <aside style={{ width: '300px', background: '#0a192f', display: 'flex', flexDirection: 'column', boxShadow: '10px 0 30px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '50px 35px', borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
          <h1 style={{ color: '#d4af37', margin: 0, fontSize: '28px', fontWeight: '900', letterSpacing: '-1px' }}>BANKING PRO</h1>
          <p style={{ fontSize: '10px', color: '#64748b', letterSpacing: '3px', marginTop: '8px', fontWeight: 'bold' }}>EXECUTIVE VERSION 2.0</p>
        </div>
        <nav style={{ flex: 1, padding: '30px 0' }}>
          {[
            { id: 'Dashboard', icon: <LayoutDashboard size={22}/> },
            { id: 'Firm Master', icon: <Building2 size={22}/> },
            { id: 'Bank Master', icon: <Landmark size={22}/> },
            { id: 'User Master', icon: <Users size={22}/> },
            { id: 'Setting', icon: <Settings size={22}/> }
          ].map(item => (
            <div key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => {setActiveTab(item.id); setEditId(null); setForm({});}}
                 style={{ display: 'flex', alignItems: 'center', padding: '18px 35px', color: activeTab === item.id ? '#d4af37' : '#94a3b8', cursor: 'pointer', transition: '0.4s' }}>
              {item.icon} <span style={{ marginLeft: '18px', fontWeight: '600', fontSize: '15px' }}>{item.id}</span>
            </div>
          ))}
        </nav>
        <div style={{ padding: '35px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ color: '#d4af37', fontWeight: 'bold', fontSize: '11px', margin: 0 }}>DEVELOPED BY:</p>
          <p style={{ color: '#fff', fontSize: '14px', fontWeight: '600', margin: '5px 0' }}>SOFTVIEW TECHNOLOGIES</p>
          <p style={{ color: '#64748b', fontSize: '11px' }}>Mob: +91 7972084304</p>
        </div>
      </aside>

      {/* MAIN CONTENT - SUPER PREMIUM VIEW */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ height: '110px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 60px', boxShadow: '0 4px 25px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#0a192f' }}>{activeTab}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '50px' }}>
            <div style={{ textAlign: 'right', paddingRight: '35px', borderRight: '2px solid #f1f5f9' }}>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#0a192f', fontFamily: 'monospace' }}>{time.toLocaleTimeString()}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>{time.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#0a192f' }}>{currentUserName || "Executive"}</div>
                <div style={{ fontSize: '11px', color: '#d4af37', fontWeight: '900' }}>{user.email} | {userRole}</div>
              </div>
              <UserCircle size={45} color="#d4af37" strokeWidth={1.5} />
            </div>
            <button onClick={() => signOut(auth)} style={{ background: '#fff1f1', border: 'none', color: '#e11d48', padding: '12px', borderRadius: '15px', cursor: 'pointer' }}><LogOut size={24}/></button>
          </div>
        </header>

        <div style={{ flex: 1, padding: '50px', overflowY: 'auto' }}>
          {/* DASHBOARD - GOLDEN BUTTONS RESTORED */}
          {activeTab === "Dashboard" && (
            <div className="premium-card">
              <select className="luxury-select" style={{ width: '350px', marginBottom: '35px' }} onChange={(e) => setSelectedFirm(e.target.value)}>
                <option value="All">All Corporate Entities</option>
                {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
              <table className="royal-table">
                <thead><tr><th>BANK IDENTITY</th><th>ACCOUNT NO</th><th style={{textAlign:'right'}}>BALANCE</th><th style={{textAlign:'center'}}>ACTION</th></tr></thead>
                <tbody>
                  {banks.filter(b => selectedFirm === "All" || b.linkedFirm === selectedFirm).map(b => (
                    <React.Fragment key={b.id}>
                      <tr onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)} style={{ cursor: 'pointer' }}>
                        <td style={{ fontWeight: '700' }}>{b.bankName}</td>
                        <td>{b.accNo}</td>
                        <td style={{ textAlign: 'right', fontWeight: '900', color: '#10b981' }}>₹ {b.balance}</td>
                        <td style={{ textAlign: 'center' }}><ChevronDown size={20} color="#d4af37" style={{ transform: expandedBank === b.id ? 'rotate(180deg)' : '' }}/></td>
                      </tr>
                      {expandedBank === b.id && (
                        <tr style={{ background: '#f8fafc' }}>
                          <td colSpan="4" style={{ padding: '30px 50px' }}>
                            <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
                              <span style={{ fontWeight: '800', color: '#0a192f', fontSize: '14px' }}>EXPORT OPTIONS:</span>
                              <button className="gold-btn-pdf"><FileText size={18}/> DOWNLOAD PDF</button>
                              <button className="gold-btn-excel"><Download size={18}/> EXCEL REPORT</button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* USER MASTER - FULLY RESTORED */}
          {activeTab === "User Master" && (
            <div className="premium-card">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
                <input placeholder="Full Name" className="luxury-input" value={form.uName || ''} onChange={e => setForm({...form, uName: e.target.value})} />
                <input placeholder="Corporate Email" className="luxury-input" value={form.uEmail || ''} onChange={e => setForm({...form, uEmail: e.target.value})} />
                <select className="luxury-input" value={form.role || 'Viewer'} onChange={e => setForm({...form, role: e.target.value})}>
                  <option value="Admin">Admin Access</option>
                  <option value="Maker">Maker Access</option>
                  <option value="Viewer">Viewer Only</option>
                </select>
                <button onClick={() => handleSave("User Master")} className="btn-royal-exec" style={{ gridColumn: 'span 3' }}>{editId ? "UPDATE USER PERMISSIONS" : "CREATE NEW USER"}</button>
              </div>
              <table className="royal-table">
                <thead><tr><th>USER NAME</th><th>EMAIL ID</th><th>ROLE</th><th>HISTORY</th></tr></thead>
                <tbody>{usersList.map(u => <tr key={u.id}><td>{u.uName}</td><td>{u.uEmail}</td><td><span className={`badge-${u.role}`}>{u.role}</span></td><td><Edit3 size={18} color="#d4af37" onClick={() => {setForm(u); setEditId(u.id);}}/></td></tr>)}</tbody>
              </table>
            </div>
          )}

          {/* SETTING - CHANGE PASSWORD RESTORED */}
          {activeTab === "Setting" && (
            <div className="premium-card" style={{ maxWidth: '650px', margin: '0 auto', textAlign: 'center' }}>
              <div style={{ background: '#0a192f', padding: '40px', borderRadius: '25px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                <ShieldCheck size={50} color="#d4af37" style={{ marginBottom: '20px' }} />
                <h2 style={{ color: '#fff', margin: '0 0 10px 0' }}>Security Configuration</h2>
                <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '35px' }}>Update your administrative credentials</p>
                <input type="password" placeholder="Enter New Security Password" value={newPass} className="luxury-input" style={{ width: '100%', marginBottom: '25px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(212,175,55,0.3)' }} onChange={e => setNewPass(e.target.value)} />
                <button onClick={() => updatePassword(auth.currentUser, newPass).then(() => {alert("Password Secured!"); setNewPass("");})} className="btn-royal-exec" style={{ width: '100%' }}>COMMIT CHANGES</button>
              </div>
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
      <form onSubmit={h} style={{ background: '#fff', padding: '70px', borderRadius: '35px', width: '480px', textAlign: 'center', borderTop: '12px solid #d4af37', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>
        <h2 style={{ fontSize: '36px', fontWeight: '900', color: '#0a192f', margin: 0 }}>BANKING PRO</h2>
        <p style={{ color: '#d4af37', fontSize: '12px', fontWeight: 'bold', letterSpacing: '3px', marginBottom: '50px' }}>EXECUTIVE PORTAL</p>
        <input type="email" placeholder="Corporate User ID" className="luxury-input" style={{ width: '100%', marginBottom: '25px' }} onChange={v => setE(v.target.value)} />
        <input type="password" placeholder="Administrative Pin" className="luxury-input" style={{ width: '100%', marginBottom: '45px' }} onChange={v => setP(v.target.value)} />
        <button type="submit" className="btn-royal-exec" style={{ width: '100%' }}>AUTHENTICATE ENTRY</button>
        <div style={{ marginTop: '50px', fontSize: '12px', color: '#94a3b8' }}>Developed by Softview Technologies<br/><span style={{ color: '#0a192f', fontWeight: '900', fontSize: '14px' }}>+91 7972084304</span></div>
      </form>
    </div>
  );
}