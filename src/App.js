import React, { useState, useEffect } from 'react';
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { LayoutDashboard, Building2, Landmark, Users, LogOut, Settings, ChevronDown, Edit3, Trash2, Clock, FileText, Download, UserCircle } from 'lucide-react';
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
    if (userRole === "Viewer") return alert("Unauthorized Access!");
    try {
      if (editId) { await updateDoc(doc(db, coll, editId), { ...form }); setEditId(null); }
      else { await addDoc(collection(db, coll), { ...form, createdAt: new Date() }); }
      setForm({}); alert("Executive Data Secured!");
    } catch (e) { alert(e.message); }
  };

  if (!user) return <LoginScreen />;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#f0f4f8', fontFamily: 'Inter, sans-serif' }}>
      {/* SIDEBAR - ROYAL DARK */}
      <aside style={{ width: '280px', background: '#0a192f', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 15px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '45px 30px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h1 style={{ color: '#d4af37', margin: 0, fontSize: '26px', fontWeight: '900', letterSpacing: '-1px' }}>BANKING PRO</h1>
          <p style={{ fontSize: '10px', color: '#64748b', letterSpacing: '2px', fontWeight: 'bold', marginTop: '5px' }}>EXECUTIVE VERSION 2.0</p>
        </div>
        <nav style={{ flex: 1, padding: '25px 0' }}>
          {[
            { id: 'Dashboard', icon: <LayoutDashboard size={20}/> },
            { id: 'Firm Master', icon: <Building2 size={20}/> },
            { id: 'Bank Master', icon: <Landmark size={20}/> },
            { id: 'User Master', icon: <Users size={20}/> },
            { id: 'Setting', icon: <Settings size={20}/> }
          ].map(item => (
            <div key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}
                 style={{ display: 'flex', alignItems: 'center', padding: '16px 30px', color: activeTab === item.id ? '#d4af37' : '#94a3b8', cursor: 'pointer', transition: '0.3s' }}>
              {item.icon} <span style={{ marginLeft: '15px', fontWeight: '600', fontSize: '14px' }}>{item.id.toUpperCase()}</span>
            </div>
          ))}
        </nav>
        <div style={{ padding: '30px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ color: '#d4af37', fontWeight: '900', fontSize: '11px', margin: 0 }}>DEVELOPED BY:</p>
          <p style={{ color: '#fff', fontSize: '13px', fontWeight: '600', margin: '4px 0' }}>SOFTVIEW TECHNOLOGIES</p>
          <p style={{ color: '#64748b', fontSize: '11px' }}>Mob: +91 7972084304</p>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ height: '100px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 50px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#0a192f' }}>{activeTab}</div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '45px' }}>
            {/* Clock & Date Section */}
            <div style={{ textAlign: 'right', paddingRight: '30px', borderRight: '2px solid #f1f5f9' }}>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#0a192f', fontFamily: 'JetBrains Mono, monospace' }}>{time.toLocaleTimeString()}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>{time.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            </div>

            {/* User Profile Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#0a192f' }}>{currentUserName || "Admin User"}</div>
                <div style={{ fontSize: '10px', color: '#d4af37', fontWeight: '800' }}>{user.email} • {userRole.toUpperCase()}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
                <UserCircle size={32} color="#0a192f" strokeWidth={1.5} />
              </div>
            </div>

            <button onClick={() => signOut(auth)} style={{ background: '#fff1f1', border: 'none', color: '#e11d48', padding: '12px', borderRadius: '12px', cursor: 'pointer' }}><LogOut size={22}/></button>
          </div>
        </header>

        <div style={{ flex: 1, padding: '50px', overflowY: 'auto' }}>
          {/* DASHBOARD WITH EXPAND & BUTTONS */}
          {activeTab === "Dashboard" && (
            <div className="royal-card">
              <select className="luxury-select" style={{ width: '320px', marginBottom: '30px' }} onChange={(e) => setSelectedFirm(e.target.value)}>
                <option value="All">All Corporate Entities</option>
                {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
              <table className="royal-table">
                <thead><tr><th>BANK IDENTITY</th><th>ACCOUNT NO</th><th style={{textAlign:'right'}}>AVAILABLE BALANCE</th><th style={{textAlign:'center'}}>REPORTS</th></tr></thead>
                <tbody>
                  {banks.filter(b => selectedFirm === "All" || b.linkedFirm === selectedFirm).map(b => (
                    <React.Fragment key={b.id}>
                      <tr onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)} style={{ cursor: 'pointer' }}>
                        <td style={{ fontWeight: '700', color: '#0a192f' }}>{b.bankName}</td>
                        <td style={{ color: '#64748b', fontWeight: '500' }}>{b.accNo}</td>
                        <td style={{ textAlign: 'right', fontWeight: '900', color: '#10b981' }}>₹ {b.balance}</td>
                        <td style={{ textAlign: 'center' }}><ChevronDown size={20} color="#d4af37" style={{ transform: expandedBank === b.id ? 'rotate(180deg)' : '' }}/></td>
                      </tr>
                      {expandedBank === b.id && (
                        <tr style={{ background: '#f8fafc' }}>
                          <td colSpan="4" style={{ padding: '25px 40px' }}>
                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                              <span style={{ fontWeight: '700', fontSize: '13px', color: '#0a192f' }}>EXPORT STATEMENT:</span>
                              <button className="btn-export-pdf"><FileText size={16}/> PDF REPORT</button>
                              <button className="btn-export-excel"><Download size={16}/> EXCEL SHEET</button>
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

          {/* FIRM MASTER WITH ADDRESS FIELD */}
          {activeTab === "Firm Master" && (
            <div className="royal-card">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '40px' }}>
                <div className="input-group">
                  <label>FIRM NAME</label>
                  <input placeholder="Enter Company Name" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="input-group">
                  <label>GST NUMBER</label>
                  <input placeholder="27XXXXX..." value={form.gst || ''} onChange={e => setForm({...form, gst: e.target.value})} />
                </div>
                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label>OFFICE ADDRESS</label>
                  <textarea placeholder="Complete Building/Street Address" rows="3" value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} 
                            style={{ padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', width: '100%' }} />
                </div>
                <button onClick={() => handleSave("Firms")} style={{ gridColumn: 'span 2', background: '#0a192f', color: '#d4af37', padding: '18px', borderRadius: '15px', fontWeight: '900', border: 'none', cursor: 'pointer' }}>
                  {editId ? "CONFIRM UPDATE" : "AUTHORIZE NEW FIRM"}
                </button>
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
      <form onSubmit={h} style={{ background: '#fff', padding: '65px', borderRadius: '30px', width: '450px', borderTop: '10px solid #d4af37', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: '45px' }}>
          <h2 style={{ color: '#0a192f', fontSize: '32px', margin: 0, fontWeight: '900' }}>BANKING PRO</h2>
          <p style={{ color: '#d4af37', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px' }}>Executive Version 2.0</p>
        </div>
        <input type="email" placeholder="Corporate ID" className="luxury-input" style={{ width: '100%', marginBottom: '20px' }} onChange={v => setE(v.target.value)} />
        <input type="password" placeholder="Security Pin" className="luxury-input" style={{ width: '100%', marginBottom: '35px' }} onChange={v => setP(v.target.value)} />
        <button type="submit" style={{ width: '100%', background: '#0a192f', color: '#d4af37', padding: '18px', borderRadius: '15px', fontWeight: '900', border: 'none', cursor: 'pointer' }}>AUTHENTICATE ENTRY</button>
        <div style={{ marginTop: '45px', textAlign: 'center', fontSize: '11px', color: '#94a3b8' }}>
          Developed by Softview Technologies<br/><span style={{ color: '#0a192f', fontWeight: '900', fontSize: '13px' }}>+91 7972084304</span>
        </div>
      </form>
    </div>
  );
}