import React, { useState, useEffect } from 'react';
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { collection, onSnapshot, doc, updateDoc, addDoc, query, orderBy } from "firebase/firestore";
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
          if (match) {
            setUserRole(match.role);
            setCurrentUserName(match.uName);
          }
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
        await addDoc(collection(db, coll), { ...form, status: 'Open', createdAt: new Date() });
      }
      setForm({}); alert("Successfully Updated!");
    } catch (e) { alert(e.message); }
  };

  const startEdit = (item) => {
    setForm(item);
    setEditId(item.id);
    window.scrollTo(0,0);
  };

  const exportPDF = (b) => {
    const doc = new jsPDF();
    doc.text("BANKING PRO - LEDGER", 14, 20);
    doc.autoTable({
      startY: 30,
      head: [['Date', 'Particulars', 'Dr', 'Cr', 'Balance']],
      body: [["Opening", "B/F", "-", "-", `₹ ${b.balance} ${b.type}`]],
      headStyles: { fillColor: [212, 175, 55] }
    });
    doc.save(`${b.bankName}.pdf`);
  };

  if (!user) return <LoginScreen />;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <aside className="executive-sidebar">
        <div style={{ padding: '30px 20px' }}>
          <h1 style={{ color: 'var(--gold)', margin: 0, fontSize: '20px' }}>BANKING PRO</h1>
          <p style={{ fontSize: '9px', color: '#64748b' }}>EXECUTIVE DASHBOARD</p>
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

      <main style={{ flex: 1, marginLeft: '260px', overflowY: 'auto', background: '#f8fafc' }}>
        <header className="luxury-header">
          <div style={{ fontWeight: 'bold' }}>{activeTab.toUpperCase()}</div>
          <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right', borderRight: '1px solid #ddd', paddingRight: '15px' }}>
                <div style={{ fontSize: '13px', fontWeight: '900', color: '#0a192f' }}>{time.toLocaleTimeString()}</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>{time.toLocaleDateString()}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{currentUserName || user.email}</div>
              <div style={{ fontSize: '11px', color: 'var(--gold)' }}>{userRole}</div>
            </div>
            <button className="btn-gold" style={{ background: '#ffefef', color: 'red' }} onClick={() => signOut(auth)}><LogOut size={16}/></button>
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
                        <td>{b.bankName}</td><td>{b.accNo}</td><td style={{textAlign:'right'}}>₹ {b.balance} {b.type}</td>
                        <td style={{textAlign:'center'}}><ChevronDown size={18} style={{color:'var(--gold)'}}/></td>
                      </tr>
                      {expandedBank === b.id && (
                        <tr>
                          <td colSpan="4" style={{padding:'20px', background:'#f1f5f9'}}>
                             <button onClick={() => exportPDF(b)} className="btn-gold" style={{marginBottom:'10px'}}><FileText size={14}/> Export PDF</button>
                             <table className="royal-table" style={{background:'white'}}>
                               <thead><tr><th>Date</th><th>Particulars</th><th>Dr</th><th>Cr</th><th>Balance</th></tr></thead>
                               <tbody><tr><td>Opening</td><td>B/F</td><td>-</td><td>-</td><td>₹ {b.balance} {b.type}</td></tr></tbody>
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
               <div className="ledger-box" style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px', background:'white', padding:'20px'}}>
                  <input placeholder="Firm Name" className="btn-gold" style={{background:'white', textAlign:'left'}} value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
                  <input placeholder="GST No" className="btn-gold" style={{background:'white', textAlign:'left'}} value={form.gst || ''} onChange={e => setForm({...form, gst: e.target.value})} />
                  <input placeholder="Address" className="btn-gold" style={{background:'white', textAlign:'left'}} value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} />
                  <button className="btn-gold" style={{gridColumn:'span 3'}} onClick={() => handleSave("Firms")}>{editId ? "UPDATE FIRM" : "SAVE FIRM"}</button>
               </div>
               <table className="royal-table" style={{marginTop:'20px'}}>
                 <thead><tr><th>Firm Name</th><th>GST</th><th>Actions</th></tr></thead>
                 <tbody>{firms.map(f => <tr key={f.id}><td>{f.name}</td><td>{f.gst}</td><td><Edit3 size={16} onClick={() => startEdit(f)} style={{cursor:'pointer'}}/></td></tr>)}</tbody>
               </table>
             </div>
          )}

          {activeTab === "Bank Master" && (
             <div>
               <div className="ledger-box" style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', background:'white', padding:'20px'}}>
                  <input placeholder="Bank Name" className="btn-gold" style={{background:'white'}} value={form.bankName || ''} onChange={e => setForm({...form, bankName: e.target.value})} />
                  <input placeholder="A/c No" className="btn-gold" style={{background:'white'}} value={form.accNo || ''} onChange={e => setForm({...form, accNo: e.target.value})} />
                  <input placeholder="Opening Bal" className="btn-gold" style={{background:'white'}} value={form.balance || ''} onChange={e => setForm({...form, balance: e.target.value})} />
                  <select className="btn-gold" style={{background:'white'}} value={form.type || ''} onChange={e => setForm({...form, type: e.target.value})}><option>dr/cr</option><option value="dr">dr</option><option value="cr">cr</option></select>
                  <select className="btn-gold" style={{background:'white', gridColumn:'span 2'}} value={form.linkedFirm || ''} onChange={e => setForm({...form, linkedFirm: e.target.value})}><option>Link Firm</option>{firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}</select>
                  <button className="btn-gold" style={{gridColumn:'span 3'}} onClick={() => handleSave("Bank Master")}>{editId ? "UPDATE BANK" : "SAVE BANK"}</button>
               </div>
               <table className="royal-table" style={{marginTop:'20px'}}>
                 <thead><tr><th>Bank</th><th>A/c No</th><th>Actions</th></tr></thead>
                 <tbody>{banks.map(b => <tr key={b.id}><td>{b.bankName}</td><td>{b.accNo}</td><td><Edit3 size={16} onClick={() => startEdit(b)} style={{cursor:'pointer'}}/></td></tr>)}</tbody>
               </table>
             </div>
          )}

          {activeTab === "User Master" && (
            <div>
              <div className="ledger-box" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', background:'white', padding:'20px'}}>
                <input placeholder="Name" className="btn-gold" style={{background:'white'}} value={form.uName || ''} onChange={e => setForm({...form, uName: e.target.value})} />
                <input placeholder="Email" className="btn-gold" style={{background:'white'}} value={form.uEmail || ''} onChange={e => setForm({...form, uEmail: e.target.value})} />
                <select className="btn-gold" style={{background:'white', gridColumn:'span 2'}} value={form.role || ''} onChange={e => setForm({...form, role: e.target.value})}><option>Role</option><option value="Admin">Admin</option><option value="Operator">Operator</option></select>
                <button className="btn-gold" style={{gridColumn:'span 2'}} onClick={() => handleSave("User Master")}>{editId ? "UPDATE USER" : "SAVE USER"}</button>
              </div>
              <table className="royal-table" style={{marginTop:'20px'}}>
                <thead><tr><th>Name</th><th>Email</th><th>Actions</th></tr></thead>
                <tbody>{usersList.map(u => <tr key={u.id}><td>{u.uName}</td><td>{u.uEmail}</td><td><Edit3 size={16} onClick={() => startEdit(u)} style={{cursor:'pointer'}}/></td></tr>)}</tbody>
              </table>
            </div>
          )}

          {activeTab === "Setting" && (
            <div className="ledger-box" style={{background:'white', padding:'40px', width:'400px'}}>
              <h3>Security Settings</h3>
              <input type="password" placeholder="New Password" className="btn-gold" style={{background:'#f8fafc', width:'100%', marginBottom:'20px'}} onChange={e => setNewPass(e.target.value)} />
              <button className="btn-gold" style={{width:'100%'}} onClick={() => updatePassword(auth.currentUser, newPass).then(() => alert("Updated")).catch(e => alert(e.message))}>UPDATE PASSWORD</button>
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
        <input type="email" placeholder="Email" className="btn-gold" style={{width:'100%', marginBottom:'15px', background:'#f8fafc'}} onChange={v => setE(v.target.value)} />
        <input type="password" placeholder="Password" className="btn-gold" style={{width:'100%', marginBottom:'25px', background:'#f8fafc'}} onChange={v => setP(v.target.value)} />
        <button type="submit" className="btn-gold" style={{width:'100%'}}>LOG IN</button>
        <p style={{textAlign:'center', fontSize:'10px', marginTop:'20px', color:'#94a3b8'}}>Developed by Softview Technologies</p>
      </form>
    </div>
  );
}