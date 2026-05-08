import React, { useState, useEffect } from 'react';
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { LayoutDashboard, Building2, Landmark, Users, LogOut, Settings, ChevronDown, Edit3, Trash2, Clock, Download, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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
    if (userRole === "Viewer") return alert("No Rights!");
    try {
      if (editId) {
        await updateDoc(doc(db, coll, editId), { ...form });
        setEditId(null);
      } else {
        await addDoc(collection(db, coll), { ...form, createdAt: new Date() });
      }
      setForm({}); alert("Data Secured!");
    } catch (e) { alert(e.message); }
  };

  const handleDelete = async (coll, id) => {
    if (userRole !== "Admin") return alert("Admin Only!");
    if (window.confirm("Delete Forever?")) await deleteDoc(doc(db, coll, id));
  };

  const startEdit = (item) => { setForm(item); setEditId(item.id); };

  if (!user) return <LoginScreen />;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      {/* SIDEBAR */}
      <aside className="executive-sidebar">
        <div style={{ padding: '25px' }}>
          <h1 style={{ color: 'var(--gold)', margin: 0, fontSize: '20px' }}>BANKING PRO</h1>
          <p style={{ fontSize: '9px', color: '#64748b' }}>SOFTVIEW TECHNOLOGIES</p>
        </div>
        <nav style={{ flex: 1 }}>
          <div className={`nav-item ${activeTab === 'Dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('Dashboard')}><LayoutDashboard size={18}/> Dashboard</div>
          <div className={`nav-item ${activeTab === 'Firm Master' ? 'active' : ''}`} onClick={() => setActiveTab('Firm Master')}><Building2 size={18}/> Firm Master</div>
          <div className={`nav-item ${activeTab === 'Bank Master' ? 'active' : ''}`} onClick={() => setActiveTab('Bank Master')}><Landmark size={18}/> Bank Master</div>
          <div className={`nav-item ${activeTab === 'User Master' ? 'active' : ''}`} onClick={() => setActiveTab('User Master')}><Users size={18}/> User Master</div>
          <div className={`nav-item ${activeTab === 'Setting' ? 'active' : ''}`} onClick={() => setActiveTab('Setting')}><Settings size={18}/> Setting</div>
        </nav>
        <div style={{ padding: '20px', borderTop: '1px solid rgba(212,175,55,0.1)' }}>
          <p style={{ color: 'var(--gold)', fontWeight: 'bold', fontSize: '11px' }}>DEVELOPED BY:<br/>SOFTVIEW TECHNOLOGIES</p>
        </div>
      </aside>

      <main style={{ flex: 1, marginLeft: '260px', background: '#f8fafc', overflowY: 'auto' }}>
        {/* HEADER WITH NAME, CLOCK, DATE */}
        <header className="luxury-header" style={{display:'flex', justifyContent:'space-between', padding:'15px 30px', background:'white', borderBottom:'1px solid #e2e8f0'}}>
          <div style={{ fontWeight: 'bold', fontSize:'18px' }}>{activeTab.toUpperCase()}</div>
          <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right', borderRight: '1px solid #ddd', paddingRight: '15px' }}>
              <div style={{ fontSize: '14px', fontWeight: '900', color: '#0a192f' }}><Clock size={14} style={{verticalAlign:'middle'}}/> {time.toLocaleTimeString()}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>{time.toLocaleDateString()}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{currentUserName || user.email}</div>
              <div style={{ fontSize: '11px', color: 'var(--gold)' }}>{userRole}</div>
            </div>
            <button className="btn-gold" style={{ background: '#ffefef', color: 'red', border:'none', padding:'8px' }} onClick={() => signOut(auth)}><LogOut size={18}/></button>
          </div>
        </header>

        <div style={{ padding: '30px' }}>
          {activeTab === "Dashboard" && (
            <div>
              <select className="btn-gold" style={{background:'white', marginBottom:'20px'}} onChange={(e) => setSelectedFirm(e.target.value)}>
                <option value="All">All Firms</option>
                {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
              <table className="royal-table">
                <thead><tr><th>Bank Name</th><th>A/c No.</th><th style={{textAlign:'right'}}>Balance</th><th>Ledger</th></tr></thead>
                <tbody>
                  {banks.filter(b => selectedFirm === "All" || b.linkedFirm === selectedFirm).map(b => (
                    <React.Fragment key={b.id}>
                      <tr onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)} style={{cursor:'pointer'}}>
                        <td>{b.bankName}</td><td>{b.accNo}</td><td style={{textAlign:'right'}}>₹ {b.balance}</td>
                        <td style={{textAlign:'center'}}><ChevronDown size={18} style={{color:'var(--gold)'}}/></td>
                      </tr>
                      {expandedBank === b.id && (
                        <tr>
                          <td colSpan="4" style={{padding:'20px', background:'#f1f5f9'}}>
                            <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
                              <button className="btn-gold"><Download size={14}/> Excel</button>
                              <button className="btn-gold"><FileText size={14}/> PDF</button>
                            </div>
                            <table className="royal-table" style={{background:'white'}}>
                              <thead><tr><th>Date</th><th>Particulars</th><th>Balance</th></tr></thead>
                              <tbody><tr><td>Opening</td><td>B/F</td><td>₹ {b.balance}</td></tr></tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "Firm Master" && (
            <div>
              <div className="ledger-box" style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'10px', background:'white', padding:'20px'}}>
                <input placeholder="Firm Name" className="btn-gold" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
                <input placeholder="GST No" className="btn-gold" value={form.gst || ''} onChange={e => setForm({...form, gst: e.target.value})} />
                <button className="btn-gold" onClick={() => handleSave("Firms")}>{editId ? "UPDATE" : "SAVE"}</button>
              </div>
              <table className="royal-table" style={{marginTop:'20px'}}>
                <thead><tr><th>Firm Name</th><th>GST</th><th>Actions</th></tr></thead>
                <tbody>{firms.map(f => <tr key={f.id}><td>{f.name}</td><td>{f.gst}</td><td><Edit3 size={16} onClick={() => startEdit(f)}/><Trash2 size={16} onClick={() => handleDelete("Firms", f.id)} style={{color:'red', marginLeft:'10px'}}/></td></tr>)}</tbody>
              </table>
            </div>
          )}

          {activeTab === "Bank Master" && (
            <div>
              <div className="ledger-box" style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'10px', background:'white', padding:'20px'}}>
                <input placeholder="Bank Name" className="btn-gold" value={form.bankName || ''} onChange={e => setForm({...form, bankName: e.target.value})} />
                <input placeholder="A/c No" className="btn-gold" value={form.accNo || ''} onChange={e => setForm({...form, accNo: e.target.value})} />
                <select className="btn-gold" value={form.status || 'Open'} onChange={e => setForm({...form, status: e.target.value})}><option value="Open">Open</option><option value="Closed">Closed</option></select>
                <input type="date" className="btn-gold" value={form.closeDate || ''} onChange={e => setForm({...form, closeDate: e.target.value})} />
                <button className="btn-gold" onClick={() => handleSave("Bank Master")}>{editId ? "UPDATE" : "SAVE"}</button>
              </div>
              <table className="royal-table" style={{marginTop:'20px'}}>
                <thead><tr><th>Bank</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>{banks.map(b => <tr key={b.id}><td>{b.bankName}</td><td>{b.status}</td><td><Edit3 size={16} onClick={() => startEdit(b)}/><Trash2 size={16} onClick={() => handleDelete("Bank Master", b.id)} style={{color:'red', marginLeft:'10px'}}/></td></tr>)}</tbody>
              </table>
            </div>
          )}

          {activeTab === "User Master" && (
            <div>
              <div className="ledger-box" style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'10px', background:'white', padding:'20px'}}>
                <input placeholder="Name" className="btn-gold" value={form.uName || ''} onChange={e => setForm({...form, uName: e.target.value})} />
                <input placeholder="Email" className="btn-gold" value={form.uEmail || ''} onChange={e => setForm({...form, uEmail: e.target.value})} />
                <button className="btn-gold" onClick={() => handleSave("User Master")}>{editId ? "UPDATE" : "SAVE"}</button>
              </div>
              <table className="royal-table" style={{marginTop:'20px'}}>
                <thead><tr><th>Name</th><th>Email</th><th>Actions</th></tr></thead>
                <tbody>{usersList.map(u => <tr key={u.id}><td>{u.uName}</td><td>{u.uEmail}</td><td><Edit3 size={16} onClick={() => startEdit(u)}/><Trash2 size={16} onClick={() => handleDelete("User Master", u.id)} style={{color:'red', marginLeft:'10px'}}/></td></tr>)}</tbody>
              </table>
            </div>
          )}
        </div>
        <p style={{textAlign:'center', fontSize:'10px', color:'#94a3b8', padding:'20px'}}>Developed by Softview Technologies</p>
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
        <input type="email" placeholder="Email" className="btn-gold" style={{width:'100%', marginBottom:'15px'}} onChange={v => setE(v.target.value)} />
        <input type="password" placeholder="Password" className="btn-gold" style={{width:'100%', marginBottom:'25px'}} onChange={v => setP(v.target.value)} />
        <button type="submit" className="btn-gold" style={{width:'100%'}}>LOG IN</button>
        <p style={{textAlign:'center', fontSize:'10px', marginTop:'20px', color:'#94a3b8'}}>Developed by Softview Technologies</p>
      </form>
    </div>
  );
}