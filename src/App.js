import React, { useState, useEffect } from 'react';
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { LayoutDashboard, Building2, Landmark, Users, LogOut, Settings, ChevronDown, Edit3, Trash2, Clock, Download, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("Viewer");
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [selectedFirm, setSelectedFirm] = useState("All");
  const [expandedBank, setExpandedBank] = useState(null);
  const [time, setTime] = useState(new Date());
  const [form, setForm] = useState({}); // Isi mein edit ka data load hoga
  const [newPass, setNewPass] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        onSnapshot(collection(db, "User Master"), s => setUsersList(s.docs.map(d => ({id: d.id, ...d.data()}))));
        onSnapshot(collection(db, "Firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
        onSnapshot(collection(db, "Bank Master"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
        onSnapshot(collection(db, "User Master"), s => {
          const match = s.docs.find(d => d.data().uEmail === u.email);
          if (match) setUserRole(match.data().role);
        });
      }
    });
    return () => { clearInterval(timer); unsub(); };
  }, [user]);

  // --- SAVE & UPDATE LOGIC ---
  const handleSave = async (coll) => {
    if (userRole === "Viewer") return alert("Permission Denied!");
    try {
      if (form.id) {
        // UPDATE: Purana data badlega
        const { id, ...dataWithoutId } = form;
        await updateDoc(doc(db, coll, id), { ...dataWithoutId, updatedAt: new Date() });
        alert("Record Updated!");
      } else {
        // SAVE: Naya data add hoga
        await addDoc(collection(db, coll), { ...form, status: 'Open', createdAt: new Date() });
        alert("New Record Created!");
      }
      setForm({}); // Form khali kar dena
    } catch (e) { alert("Error: " + e.message); }
  };

  // --- EDIT: Data wapas form mein layega ---
  const handleEdit = (item) => {
    setForm(item);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (coll, id) => {
    if (window.confirm("Confirm Delete?")) await deleteDoc(doc(db, coll, id));
  };

  const handleCloseAccount = async (coll, id) => {
    const cDate = prompt("Closing Date (DD/MM/YYYY):", new Date().toLocaleDateString());
    if (cDate) await updateDoc(doc(db, coll, id), { status: 'Closed', closingDate: cDate });
  };

  if (!user) return <LoginScreen />;

  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      
      {/* SIDEBAR WITH FOOTER */}
      <aside className="executive-sidebar">
        <div style={{ padding: '30px 20px' }}>
          <h1 style={{ color: 'var(--gold)', margin: 0, fontSize: '20px' }}>BANKING PRO</h1>
          <p style={{ fontSize: '9px', color: '#64748b' }}>SOFTVIEW TECHNOLOGIES</p>
        </div>
        <nav style={{ flex: 1 }}>
          <div className={`nav-item ${activeTab === 'Dashboard' ? 'active' : ''}`} onClick={() => {setActiveTab('Dashboard'); setForm({});}}><LayoutDashboard size={18}/> Dashboard</div>
          <div className={`nav-item ${activeTab === 'Firm Master' ? 'active' : ''}`} onClick={() => {setActiveTab('Firm Master'); setForm({});}}><Building2 size={18}/> Firm Master</div>
          <div className={`nav-item ${activeTab === 'Bank Master' ? 'active' : ''}`} onClick={() => {setActiveTab('Bank Master'); setForm({});}}><Landmark size={18}/> Bank Master</div>
          <div className={`nav-item ${activeTab === 'User Master' ? 'active' : ''}`} onClick={() => {setActiveTab('User Master'); setForm({});}}><Users size={18}/> User Master</div>
          <div className={`nav-item ${activeTab === 'Setting' ? 'active' : ''}`} onClick={() => {setActiveTab('Setting'); setForm({});}}><Settings size={18}/> Setting</div>
        </nav>
        
        <div style={{ padding: '20px', borderTop: '1px solid rgba(212,175,55,0.1)', background: 'rgba(0,0,0,0.2)' }}>
          <p style={{ color: '#64748b', fontSize: '9px', margin: 0 }}>DEVELOPED BY</p>
          <p style={{ color: 'var(--gold)', fontWeight: 'bold', fontSize: '13px', margin: '2px 0' }}>SOFTVIEW TECHNOLOGIES</p>
          <p style={{ color: '#cbd5e1', fontSize: '10px', margin: 0 }}>📞 7972084304</p>
        </div>
      </aside>

      {/* MAIN AREA */}
      <main style={{ flex: 1, marginLeft: '260px', overflowY: 'auto', background: '#f8fafc' }}>
        <header className="luxury-header">
          <div style={{ fontWeight: 'bold' }}>{activeTab.toUpperCase()}</div>
          <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right', borderRight: '1px solid rgba(212,175,55,0.3)', paddingRight: '15px' }}>
                <div style={{ fontSize: '14px', fontWeight: '900', color: 'white' }}>
                  {user.email.split('@')[0].toUpperCase()} 
                  <span style={{ fontSize: '10px', background: 'var(--gold)', color: 'black', padding: '2px 6px', borderRadius: '4px', marginLeft: '10px' }}>{userRole}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}><Clock size={10}/> {time.toLocaleTimeString()} | {time.toLocaleDateString()}</div>
            </div>
            <button className="btn-gold" style={{ background: '#ffefef', color: 'red' }} onClick={() => signOut(auth)}><LogOut size={18}/></button>
          </div>
        </header>

        <div style={{ padding: '30px' }}>
          
          {/* FIRM MASTER */}
          {activeTab === "Firm Master" && (
             <div>
               <div className="ledger-box" style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px', background:'white', padding:'20px'}}>
                  <input placeholder="Firm Name" className="btn-gold" style={{background:'white', textAlign:'left'}} value={form.name || ""} onChange={e => setForm({...form, name: e.target.value})} />
                  <input placeholder="GST No" className="btn-gold" style={{background:'white', textAlign:'left'}} value={form.gst || ""} onChange={e => setForm({...form, gst: e.target.value})} />
                  <input placeholder="Address" className="btn-gold" style={{background:'white', textAlign:'left'}} value={form.address || ""} onChange={e => setForm({...form, address: e.target.value})} />
                  <button className="btn-gold" style={{gridColumn:'span 3'}} onClick={() => handleSave("Firms")}>{form.id ? "UPDATE FIRM DETAILS" : "SAVE NEW FIRM"}</button>
               </div>
               <table className="royal-table" style={{marginTop:'20px'}}>
                 <thead><tr><th>Firm Name</th><th>GST</th><th>Actions</th></tr></thead>
                 <tbody>{firms.map(f => <tr key={f.id}><td>{f.name}</td><td>{f.gst}</td>
                  <td>
                    <Edit3 size={18} color="blue" style={{cursor:'pointer', marginRight:'15px'}} onClick={() => handleEdit(f)} />
                    <Trash2 size={18} color="red" style={{cursor:'pointer'}} onClick={() => handleDelete("Firms", f.id)} />
                  </td>
                 </tr>)}</tbody>
               </table>
             </div>
          )}

          {/* BANK MASTER */}
          {activeTab === "Bank Master" && (
             <div>
               <div className="ledger-box" style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', background:'white', padding:'20px'}}>
                  <input placeholder="Bank Name" className="btn-gold" style={{background:'white'}} value={form.bankName || ""} onChange={e => setForm({...form, bankName: e.target.value})} />
                  <input placeholder="A/c No" className="btn-gold" style={{background:'white'}} value={form.accNo || ""} onChange={e => setForm({...form, accNo: e.target.value})} />
                  <input placeholder="Opening Bal" className="btn-gold" style={{background:'white'}} value={form.balance || ""} onChange={e => setForm({...form, balance: e.target.value})} />
                  <select className="btn-gold" style={{background:'white'}} value={form.type || ""} onChange={e => setForm({...form, type: e.target.value})}><option value="">Type</option><option value="dr">dr</option><option value="cr">cr</option></select>
                  <select className="btn-gold" style={{background:'white'}} value={form.linkedFirm || ""} onChange={e => setForm({...form, linkedFirm: e.target.value})}><option value="">Link Firm</option>{firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}</select>
                  <button className="btn-gold" style={{gridColumn:'span 3'}} onClick={() => handleSave("Bank Master")}>{form.id ? "UPDATE BANK DETAILS" : "SAVE NEW BANK"}</button>
               </div>
               <table className="royal-table" style={{marginTop:'20px'}}>
                 <thead><tr><th>Bank Name</th><th>A/c No</th><th>Balance</th><th>Actions</th></tr></thead>
                 <tbody>{banks.map(b => <tr key={b.id}>
                    <td>{b.bankName}</td><td>{b.accNo}</td><td>{b.balance} {b.type}</td>
                    <td>
                      <Edit3 size={18} color="blue" style={{cursor:'pointer', marginRight:'15px'}} onClick={() => handleEdit(b)} />
                      <Trash2 size={18} color="red" style={{cursor:'pointer', marginRight:'15px'}} onClick={() => handleDelete("Bank Master", b.id)} />
                      <button onClick={() => handleCloseAccount("Bank Master", b.id)} style={{fontSize:'10px', background: b.status==='Closed'?'#64748b':'#ef4444', color:'white', border:'none', padding:'4px 10px', borderRadius:'4px', cursor:'pointer'}}>
                        {b.status === 'Closed' ? `CLOSED ON ${b.closingDate}` : 'CLOSE'}
                      </button>
                    </td>
                 </tr>)}</tbody>
               </table>
             </div>
          )}

          {/* DASHBOARD & OTHER TABS FOLLOW SAME LOGIC */}
          {activeTab === "Dashboard" && (
            <div>
              <select className="btn-gold" style={{background:'white', marginBottom:'20px'}} onChange={(e) => setSelectedFirm(e.target.value)}>
                <option value="All">All Firms</option>
                {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
              <table className="royal-table">
                <thead><tr><th>Bank Name</th><th>A/c No.</th><th style={{textAlign:'right'}}>Closing Balance</th><th>Ledger</th></tr></thead>
                <tbody>{banks.filter(b => selectedFirm === "All" || b.linkedFirm === selectedFirm).map(b => (
                  <tr key={b.id}><td>{b.bankName} {b.status === 'Closed' && <span style={{color:'red', fontSize:'10px'}}>(CLOSED)</span>}</td><td>{b.accNo}</td><td style={{textAlign:'right'}}>₹ {b.balance} {b.type}</td><td style={{textAlign:'center'}}><ChevronDown size={18} color="var(--gold)"/></td></tr>
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
  const h = (ev) => { ev.preventDefault(); signInWithEmailAndPassword(auth, e, p).catch(() => alert("Login Failed")); };
  return (
    <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0a192f'}}>
      <form onSubmit={h} style={{background:'white', padding:'50px', borderRadius:'15px', width:'400px', borderTop:'5px solid #d4af37'}}>
        <h2 style={{textAlign:'center', color:'#0a192f'}}>BANKING PRO</h2>
        <input type="email" placeholder="Email" className="btn-gold" style={{width:'100%', marginBottom:'15px', background:'#f8fafc'}} onChange={v => setE(v.target.value)} />
        <input type="password" placeholder="Password" className="btn-gold" style={{width:'100%', marginBottom:'25px', background:'#f8fafc'}} onChange={v => setP(v.target.value)} />
        <button type="submit" className="btn-gold" style={{width:'100%'}}>LOG IN</button>
      </form>
    </div>
  );
}