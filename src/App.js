import React, { useState, useEffect } from 'react';
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { LayoutDashboard, Building2, Landmark, Users, LogOut, Settings, ChevronDown, Edit3, Trash2, FileText, Download, UserCircle, ShieldCheck, XCircle } from 'lucide-react';
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
    if (userRole === "Viewer") return alert("Unauthorized Access!");
    try {
      if (editId) { await updateDoc(doc(db, coll, editId), { ...form }); setEditId(null); }
      else { await addDoc(collection(db, coll), { ...form, createdAt: new Date() }); }
      setForm({}); alert("Executive Data Updated!");
    } catch (e) { alert(e.message); }
  };

  if (!user) return <LoginScreen />;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#f8fafc' }}>
      {/* SIDEBAR */}
      <aside style={{ width: '280px', background: '#0a192f', display: 'flex', flexDirection: 'column', boxShadow: '10px 0 30px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '40px 30px' }}>
          <h1 style={{ color: '#d4af37', margin: 0, fontSize: '26px', fontWeight: '900' }}>BANKING PRO</h1>
          <p style={{ fontSize: '10px', color: '#64748b', letterSpacing: '2px' }}>EXECUTIVE VERSION 2.0</p>
        </div>
        <nav style={{ flex: 1 }}>
          {[
            { id: 'Dashboard', icon: <LayoutDashboard size={20}/> },
            { id: 'Firm Master', icon: <Building2 size={20}/> },
            { id: 'Bank Master', icon: <Landmark size={20}/> },
            { id: 'User Master', icon: <Users size={20}/> },
            { id: 'Setting', icon: <Settings size={20}/> }
          ].map(item => (
            <div key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => {setActiveTab(item.id); setForm({}); setEditId(null);}}
                 style={{ display: 'flex', alignItems: 'center', padding: '16px 30px', color: '#94a3b8', cursor: 'pointer' }}>
              {item.icon} <span style={{ marginLeft: '15px', fontWeight: '600' }}>{item.id}</span>
            </div>
          ))}
        </nav>
        <div style={{ padding: '30px', background: 'rgba(0,0,0,0.2)' }}>
          <p style={{ color: '#fff', fontSize: '12px', margin: 0 }}>SOFTVIEW TECHNOLOGIES</p>
          <p style={{ color: '#64748b', fontSize: '10px' }}>+91 7972084304</p>
        </div>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* EXECUTIVE HEADER */}
        <header style={{ height: '100px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 50px', borderBottom: '1px solid #eee' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#0a192f' }}>{activeTab}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#0a192f' }}>{time.toLocaleTimeString()}</div>
              <div style={{ fontSize: '11px', color: '#d4af37', fontWeight: 'bold' }}>{time.toLocaleDateString('en-GB')}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '8px 20px', background: '#f8fafc', borderRadius: '15px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: '800' }}>{currentUserName || "Admin"}</div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>{userRole}</div>
              </div>
              <UserCircle size={40} color="#d4af37" />
            </div>
            <button onClick={() => signOut(auth)} style={{ background: '#fff1f1', border: 'none', color: '#e11d48', padding: '12px', borderRadius: '12px', cursor: 'pointer' }}><LogOut size={22}/></button>
          </div>
        </header>

        <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
          {/* USER MASTER - RESTORED WITH HISTORY */}
          {activeTab === "User Master" && (
            <div className="premium-card">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '35px' }}>
                <input placeholder="Executive Name" className="luxury-input" value={form.uName || ''} onChange={e => setForm({...form, uName: e.target.value})} />
                <input placeholder="Email Address" className="luxury-input" value={form.uEmail || ''} onChange={e => setForm({...form, uEmail: e.target.value})} />
                <select className="luxury-input" value={form.role || 'Viewer'} onChange={e => setForm({...form, role: e.target.value})}>
                  <option value="Admin">Administrator</option>
                  <option value="Maker">Maker (Edit Access)</option>
                  <option value="Viewer">Viewer Only</option>
                </select>
                <button onClick={() => handleSave("User Master")} className="btn-royal-exec" style={{ gridColumn: 'span 3' }}>{editId ? "UPDATE USER ACCESS" : "AUTHORIZE NEW USER"}</button>
              </div>
              <table className="royal-table">
                <thead><tr><th>NAME</th><th>EMAIL</th><th>ROLE</th><th>HISTORY</th></tr></thead>
                <tbody>
                  {usersList.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: '700' }}>{u.uName}</td>
                      <td>{u.uEmail}</td>
                      <td><span className={`badge-${u.role}`}>{u.role}</span></td>
                      <td>
                        <Edit3 size={18} color="#d4af37" style={{ cursor: 'pointer', marginRight: '15px' }} onClick={() => {setForm(u); setEditId(u.id);}} />
                        <Trash2 size={18} color="#e11d48" style={{ cursor: 'pointer' }} onClick={async () => {if(window.confirm("Delete User?")) await deleteDoc(doc(db, "User Master", u.id))}} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* DASHBOARD - GOLDEN LEDGER BUTTONS */}
          {activeTab === "Dashboard" && (
            <div className="premium-card">
              <select className="luxury-input" style={{ width: '350px', marginBottom: '30px' }} onChange={(e) => setSelectedFirm(e.target.value)}>
                <option value="All">All Corporate Entities</option>
                {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
              <table className="royal-table">
                <thead><tr><th>BANK IDENTITY</th><th>ACCOUNT NO</th><th style={{textAlign:'right'}}>BALANCE</th><th>VIEW</th></tr></thead>
                <tbody>
                  {banks.filter(b => selectedFirm === "All" || b.linkedFirm === selectedFirm).map(b => (
                    <React.Fragment key={b.id}>
                      <tr onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)} style={{ cursor: 'pointer' }}>
                        <td style={{ fontWeight: '700' }}>{b.bankName}</td>
                        <td>{b.accNo}</td>
                        <td style={{ textAlign: 'right', fontWeight: '900', color: '#10b981' }}>₹ {b.balance}</td>
                        <td style={{ textAlign: 'center' }}><ChevronDown size={20} color="#d4af37" /></td>
                      </tr>
                      {expandedBank === b.id && (
                        <tr style={{ background: '#f8fafc' }}>
                          <td colSpan="4" style={{ padding: '30px' }}>
                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                              <span style={{ fontWeight: '800', color: '#0a192f' }}>LEDGER EXPORT:</span>
                              <button className="gold-btn-pdf"><FileText size={18}/> PDF LEDGER</button>
                              <button className="gold-btn-excel"><Download size={18}/> EXCEL SHEET</button>
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

          {/* BANK MASTER - WITH CLOSED DATE LOGIC */}
          {activeTab === "Bank Master" && (
            <div className="premium-card">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '30px' }}>
                <input placeholder="Bank Name" className="luxury-input" value={form.bankName || ''} onChange={e => setForm({...form, bankName: e.target.value})} />
                <input placeholder="Account Number" className="luxury-input" value={form.accNo || ''} onChange={e => setForm({...form, accNo: e.target.value})} />
                <select className="luxury-input" value={form.status || 'Active'} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="Active">Operational (Active)</option>
                  <option value="Closed">Closed</option>
                </select>
                {form.status === 'Closed' && (
                  <input type="date" className="luxury-input" value={form.closedDate || ''} onChange={e => setForm({...form, closedDate: e.target.value})} />
                )}
                <button onClick={() => handleSave("Bank Master")} className="btn-royal-exec" style={{ gridColumn: 'span 2' }}>{editId ? "UPDATE BANK DATA" : "REGISTER BANK ACCOUNT"}</button>
              </div>
              {/* History Table niche functional hai */}
              <table className="royal-table">
                <thead><tr><th>BANK</th><th>A/C NO</th><th>STATUS</th><th>CLOSED ON</th><th>ACTION</th></tr></thead>
                <tbody>{banks.map(b => (
                  <tr key={b.id}>
                    <td>{b.bankName}</td><td>{b.accNo}</td>
                    <td>{b.status}</td><td>{b.closedDate || '--'}</td>
                    <td><Edit3 size={16} onClick={() => {setForm(b); setEditId(b.id);}} /></td>
                  </tr>
                ))}</tbody>
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
      <form onSubmit={h} style={{ background: '#fff', padding: '60px', borderRadius: '35px', width: '450px', textAlign: 'center', borderTop: '10px solid #d4af37' }}>
        <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#0a192f', margin: 0 }}>BANKING PRO</h2>
        <p style={{ color: '#d4af37', fontSize: '11px', fontWeight: 'bold', marginBottom: '40px' }}>EXECUTIVE PORTAL</p>
        <input type="email" placeholder="Corporate ID" className="luxury-input" style={{ width: '100%', marginBottom: '20px' }} onChange={v => setE(v.target.value)} />
        <input type="password" placeholder="Secure Pin" className="luxury-input" style={{ width: '100%', marginBottom: '40px' }} onChange={v => setP(v.target.value)} />
        <button type="submit" className="btn-royal-exec" style={{ width: '100%' }}>AUTHENTICATE</button>
      </form>
    </div>
  );
}