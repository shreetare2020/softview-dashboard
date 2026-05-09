import React, { useState, useEffect } from 'react';
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { LayoutDashboard, Building2, Landmark, Users, LogOut, Settings, ChevronDown, Edit3, FileText, Download, UserCircle, Clock } from 'lucide-react';
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
      setForm({}); alert("System Updated Successfully!");
    } catch (e) { alert(e.message); }
  };

  if (!user) return <LoginScreen />;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#f0f2f5' }}>
      {/* SIDEBAR - ROYAL STYLE */}
      <aside style={{ width: '280px', background: '#0a192f', display: 'flex', flexDirection: 'column', zIndex: 100 }}>
        <div style={{ padding: '40px 25px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h1 style={{ color: '#d4af37', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>BANKING PRO</h1>
          <p style={{ fontSize: '10px', color: '#64748b', letterSpacing: '1.5px', marginTop: '5px' }}>EXECUTIVE VERSION 2.0</p>
        </div>
        <nav style={{ flex: 1, padding: '20px 0' }}>
          {[{id:'Dashboard', icon:<LayoutDashboard size={20}/>}, {id:'Firm Master', icon:<Building2 size={20}/>}, {id:'Bank Master', icon:<Landmark size={20}/>}, {id:'User Master', icon:<Users size={20}/>}, {id:'Setting', icon:<Settings size={20}/>}].map(item => (
            <div key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}
                 style={{ display: 'flex', alignItems: 'center', padding: '16px 25px', color: activeTab === item.id ? '#d4af37' : '#94a3b8', cursor: 'pointer' }}>
              {item.icon} <span style={{ marginLeft: '15px', fontWeight: '600' }}>{item.id}</span>
            </div>
          ))}
        </nav>
        <div style={{ padding: '25px', background: 'rgba(0,0,0,0.2)' }}>
          <p style={{ color: '#d4af37', fontWeight: 'bold', fontSize: '11px', margin: 0 }}>DEVELOPED BY:</p>
          <p style={{ color: '#fff', fontSize: '13px', margin: '4px 0' }}>SOFTVIEW TECHNOLOGIES</p>
          <p style={{ color: '#64748b', fontSize: '11px' }}>Mob: +91 7972084304</p>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ height: '90px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#0a192f' }}>{activeTab}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
            <div style={{ textAlign: 'right', borderRight: '1px solid #eee', paddingRight: '25px' }}>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#0a192f' }}>{time.toLocaleTimeString()}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'bold' }}>{time.toLocaleDateString('en-GB')}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0a192f' }}>{currentUserName || "Admin"}</div>
                <div style={{ fontSize: '10px', color: '#d4af37', fontWeight: 'bold' }}>{user.email}</div>
              </div>
              <UserCircle size={40} color="#d4af37" strokeWidth={1.5} />
            </div>
            <button onClick={() => signOut(auth)} style={{ background: '#fff1f1', border: 'none', color: '#e11d48', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}><LogOut size={20}/></button>
          </div>
        </header>

        <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
          {/* DASHBOARD WITH EXPAND & EXPORT */}
          {activeTab === "Dashboard" && (
            <div className="premium-card">
              <select className="luxury-input" style={{ width: '300px', marginBottom: '25px' }} onChange={(e) => setSelectedFirm(e.target.value)}>
                <option value="All">All Companies</option>
                {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
              <table className="royal-table">
                <thead><tr><th>BANK NAME</th><th>ACCOUNT NO</th><th style={{textAlign:'right'}}>BALANCE</th><th>VIEW</th></tr></thead>
                <tbody>
                  {banks.filter(b => selectedFirm === "All" || b.linkedFirm === selectedFirm).map(b => (
                    <React.Fragment key={b.id}>
                      <tr onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)} style={{ cursor: 'pointer' }}>
                        <td>{b.bankName}</td><td>{b.accNo}</td><td style={{textAlign:'right', fontWeight:'bold'}}>₹ {b.balance}</td><td style={{textAlign:'center'}}><ChevronDown size={18} color="#d4af37"/></td>
                      </tr>
                      {expandedBank === b.id && (
                        <tr style={{ background: '#f8fafc' }}>
                          <td colSpan="4" style={{ padding: '20px 30px' }}>
                            <div style={{ display: 'flex', gap: '15px' }}>
                              <button className="btn-pdf"><FileText size={16}/> DOWNLOAD PDF</button>
                              <button className="btn-excel"><Download size={16}/> EXCEL REPORT</button>
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

          {/* FIRM MASTER WITH FULL FIELDS */}
          {activeTab === "Firm Master" && (
            <div className="premium-card">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                <input placeholder="Firm Name" className="luxury-input" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
                <input placeholder="GST No" className="luxury-input" value={form.gst || ''} onChange={e => setForm({...form, gst: e.target.value})} />
                <textarea placeholder="Office Address" className="luxury-input" style={{ gridColumn: 'span 2', height: '80px' }} value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} />
                <button onClick={() => handleSave("Firms")} className="btn-main" style={{ gridColumn: 'span 2' }}>{editId ? "UPDATE FIRM" : "SAVE NEW FIRM"}</button>
              </div>
              <table className="royal-table">
                <thead><tr><th>NAME</th><th>GST</th><th>ADDRESS</th><th>ACTION</th></tr></thead>
                <tbody>{firms.map(f => <tr key={f.id}><td>{f.name}</td><td>{f.gst}</td><td>{f.address}</td><td><Edit3 size={16} onClick={() => {setForm(f); setEditId(f.id);}}/></td></tr>)}</tbody>
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
  const h = (ev) => { ev.preventDefault(); signInWithEmailAndPassword(auth, e, p).catch(() => alert("Denied")); };
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a192f' }}>
      <form onSubmit={h} style={{ background: '#fff', padding: '60px', borderRadius: '25px', width: '420px', textAlign: 'center', borderTop: '8px solid #d4af37' }}>
        <h2 style={{ color: '#0a192f', margin: 0 }}>BANKING PRO</h2>
        <p style={{ color: '#d4af37', fontSize: '11px', fontWeight: 'bold', marginBottom: '30px' }}>EXECUTIVE VERSION 2.0</p>
        <input type="email" placeholder="Corporate ID" className="luxury-input" style={{ width: '100%', marginBottom: '20px' }} onChange={v => setE(v.target.value)} />
        <input type="password" placeholder="Secure Pin" className="luxury-input" style={{ width: '100%', marginBottom: '35px' }} onChange={v => setP(v.target.value)} />
        <button type="submit" className="btn-main" style={{ width: '100%' }}>AUTHENTICATE</button>
        <div style={{ marginTop: '30px', fontSize: '11px', color: '#94a3b8' }}>Developed by Softview Technologies<br/>+91 7972084304</div>
      </form>
    </div>
  );
}