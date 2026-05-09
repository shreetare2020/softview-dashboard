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
  const [form, setForm] = useState({});
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

  // --- NEW ACTIONS LOGIC (As per requirement) ---
  const handleSave = async (coll) => {
    if (userRole === "Viewer") return alert("Permission Denied!");
    try {
      await addDoc(collection(db, coll), { ...form, status: 'Open', createdAt: new Date() });
      setForm({}); alert("Data Locked & Saved!");
    } catch (e) { alert("Error: " + e.message); }
  };

  const handleDelete = async (coll, id) => {
    if (window.confirm("Are you sure you want to delete this?")) {
      await deleteDoc(doc(db, coll, id));
    }
  };

  const handleCloseEntry = async (coll, id) => {
    const cDate = prompt("Enter Closing Date (DD/MM/YYYY):", new Date().toLocaleDateString());
    if (cDate) {
      await updateDoc(doc(db, coll, id), { status: 'Closed', closingDate: cDate });
      alert("Account Closed!");
    }
  };
  const handleEdit = (data) => {
  setForm(data); // Ye pura data form state mein daal dega
  window.scrollTo({ top: 0, behavior: 'smooth' }); // Screen ko upar le jayega jahan form hai
  alert("Data loaded in form! Ab edit karke 'Save' dabayein.");
};

  const exportExcel = (b) => {
    const data = [{ Date: "Opening Balance", Particulars: "B/F", Voucher: "-", Dr: 0, Cr: 0, Balance: b.balance }];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, `${b.bankName}_Ledger.xlsx`);
  };

  const exportPDF = (b) => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.setTextColor(10, 25, 47);
    doc.text("BANKING PRO - LEDGER REPORT", 14, 20);
    doc.setFontSize(10); doc.text(`Bank: ${b.bankName} | A/c: ${b.accNo}`, 14, 28);
    const body = [["Opening Balance", "B/F", "-", "0", "0", `₹ ${b.balance} ${b.type}`]];
    doc.autoTable({ startY: 40, head: [['Date', 'Particulars', 'Voucher', 'Dr', 'Cr', 'Balance']], body: body });
    doc.save(`${b.bankName}_Ledger.pdf`);
  };

  if (!user) return <LoginScreen />;

  const dashboardData = banks.filter(b => selectedFirm === "All" || b.linkedFirm === selectedFirm);

  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      
      {/* SIDEBAR WITH FOOTER */}
      <aside className="executive-sidebar">
        <div style={{ padding: '30px 20px' }}>
          <h1 style={{ color: 'var(--gold)', margin: 0, fontSize: '20px' }}>BANKING PRO</h1>
          <p style={{ fontSize: '9px', color: '#64748b' }}>EXECUTIVE SYSTEM</p>
        </div>
        <nav style={{ flex: 1 }}>
          <div className={`nav-item ${activeTab === 'Dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('Dashboard')}><LayoutDashboard size={18}/> Dashboard</div>
          <div className={`nav-item ${activeTab === 'Firm Master' ? 'active' : ''}`} onClick={() => setActiveTab('Firm Master')}><Building2 size={18}/> Firm Master</div>
          <div className={`nav-item ${activeTab === 'Bank Master' ? 'active' : ''}`} onClick={() => setActiveTab('Bank Master')}><Landmark size={18}/> Bank Master</div>
          <div className={`nav-item ${activeTab === 'User Master' ? 'active' : ''}`} onClick={() => setActiveTab('User Master')}><Users size={18}/> User Master</div>
          <div className={`nav-item ${activeTab === 'Setting' ? 'active' : ''}`} onClick={() => setActiveTab('Setting')}><Settings size={18}/> Setting</div>
        </nav>
        
        {/* FOOTER LEFT - DEVELOPED BY */}
        <div style={{ padding: '20px', borderTop: '1px solid rgba(212,175,55,0.1)', background: 'rgba(0,0,0,0.2)' }}>
          <p style={{ color: '#64748b', fontSize: '9px', margin: 0 }}>DEVELOPED BY</p>
          <p style={{ color: 'var(--gold)', fontWeight: 'bold', fontSize: '13px', margin: '2px 0' }}>SOFTVIEW TECHNOLOGIES</p>
          <p style={{ color: '#cbd5e1', fontSize: '10px', margin: 0 }}>+91 7972084304</p>
        </div>
      </aside>

      {/* MAIN CONTENT WITH IMPROVED HEADER */}
      <main style={{ flex: 1, marginLeft: '260px', overflowY: 'auto', background: '#f8fafc' }}>
        <header className="luxury-header">
          <div style={{ fontWeight: 'bold' }}>{activeTab.toUpperCase()}</div>
          <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right', borderRight: '1px solid rgba(212,175,55,0.3)', paddingRight: '15px' }}>
                <div style={{ fontSize: '14px', fontWeight: '900', color: 'white' }}>
                  {user.email.split('@')[0].toUpperCase()} 
                  <span style={{ fontSize: '10px', background: 'var(--gold)', color: 'black', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' }}>{userRole}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>{time.toLocaleTimeString()} | {time.toLocaleDateString()}</div>
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
                <thead><tr><th>Bank Name</th><th>A/c No.</th><th style={{textAlign:'right'}}>Closing Balance</th><th>Ledger</th></tr></thead>
                <tbody>
                  {dashboardData.map(b => (
                    <React.Fragment key={b.id}>
                      <tr onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)} style={{cursor:'pointer'}}>
                        <td>{b.bankName} {b.status === 'Closed' && <span style={{color:'red', fontSize:'10px'}}>(CLOSED)</span>}</td>
                        <td>{b.accNo}</td>
                        <td style={{textAlign:'right'}}>₹ {b.balance} {b.type}</td>
                        <td style={{textAlign:'center'}}><ChevronDown style={{color:'var(--gold)', transform: expandedBank === b.id ? 'rotate(180deg)' : 'none'}}/></td>
                      </tr>
                      {expandedBank === b.id && (
                        <tr>
                          <td colSpan="4" style={{padding:'20px', background:'#f1f5f9'}}>
                             <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
                               <button onClick={() => exportExcel(b)} className="btn-gold" style={{padding:'5px 15px'}}><Download size={14}/> Excel</button>
                               <button onClick={() => exportPDF(b)} className="btn-gold" style={{padding:'5px 15px'}}><FileText size={14}/> PDF</button>
                             </div>
                             <table className="royal-table" style={{background:'white'}}>
                               <thead><tr><th>Date</th><th>Particulars</th><th>Dr</th><th>Cr</th><th>Balance</th></tr></thead>
                               <tbody><tr><td>Opening</td><td>Balance B/F</td><td>-</td><td>-</td><td>₹ {b.balance} {b.type}</td></tr></tbody>
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

          {/* MASTER SECTIONS WITH ACTIONS */}
          {activeTab === "Firm Master" && (
             <div>
               <div className="ledger-box" style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px', background:'white', padding:'20px'}}>
                  <input placeholder="Firm Name" className="btn-gold" style={{background:'white', textAlign:'left'}} onChange={e => setForm({...form, name: e.target.value})} />
                  <input placeholder="GST No" className="btn-gold" style={{background:'white', textAlign:'left'}} onChange={e => setForm({...form, gst: e.target.value})} />
                  <input placeholder="Address" className="btn-gold" style={{background:'white', textAlign:'left'}} onChange={e => setForm({...form, address: e.target.value})} />
                  <button className="btn-gold" style={{gridColumn:'span 3'}} onClick={() => handleSave("Firms")}>SAVE FIRM</button>
               </div>
               <table className="royal-table" style={{marginTop:'20px'}}>
                 <thead><tr><th>Firm Name</th><th>GST</th><th>Actions</th></tr></thead>
                 <tbody>{firms.map(f => <tr key={f.id}><td>{f.name}</td><td>{f.gst}</td>
                  <td>
                    
                    <Edit3 
  size={16} 
  color="blue" 
  style={{cursor:'pointer', marginRight:'10px'}} 
  onClick={() => handleEdit(f)} 
/>
                    <Trash2 size={16} color="red" style={{cursor:'pointer'}} onClick={() => handleDelete("Firms", f.id)}/>
                  </td>
                 </tr>)}</tbody>
               </table>
             </div>
          )}

          {activeTab === "Bank Master" && (
             <div>
               <div className="ledger-box" style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', background:'white', padding:'20px'}}>
                  <input placeholder="Bank Name" className="btn-gold" style={{background:'white'}} onChange={e => setForm({...form, bankName: e.target.value})} />
                  <input placeholder="A/c No" className="btn-gold" style={{background:'white'}} onChange={e => setForm({...form, accNo: e.target.value})} />
                  <input placeholder="Opening Bal" className="btn-gold" style={{background:'white'}} onChange={e => setForm({...form, balance: e.target.value})} />
                  <select className="btn-gold" style={{background:'white'}} onChange={e => setForm({...form, type: e.target.value})}><option>dr/cr</option><option value="dr">dr</option><option value="cr">cr</option></select>
                  <select className="btn-gold" style={{background:'white'}} onChange={e => setForm({...form, linkedFirm: e.target.value})}><option>Link Firm</option>{firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}</select>
                  <button className="btn-gold" style={{gridColumn:'span 3'}} onClick={() => handleSave("Bank Master")}>SAVE BANK</button>
               </div>
               <table className="royal-table" style={{marginTop:'20px'}}>
                 <thead><tr><th>Bank Name</th><th>A/c No</th><th>Balance</th><th>Actions</th></tr></thead>
                 <tbody>{banks.map(b => <tr key={b.id}>
                    <td>{b.bankName}</td><td>{b.accNo}</td><td>{b.balance} {b.type}</td>
                    <td>
                      
                      <Edit3 
  size={16} 
  color="blue" 
  style={{cursor:'pointer', marginRight:'10px'}} 
  onClick={() => handleEdit(b)} 
/>
                      <Trash2 size={16} color="red" style={{cursor:'pointer', marginRight:'10px'}} onClick={() => handleDelete("Bank Master", b.id)}/>
                      <button onClick={() => handleCloseEntry("Bank Master", b.id)} style={{fontSize:'9px', background: b.status==='Closed'?'#64748b':'#ef4444', color:'white', border:'none', padding:'4px 8px', borderRadius:'4px'}}>{b.status === 'Closed' ? `CLOSED: ${b.closingDate}` : 'CLOSE'}</button>
                    </td>
                 </tr>)}</tbody>
               </table>
             </div>
          )}

          {/* User Master and Setting logic follows the same action pattern... */}
          {activeTab === "User Master" && (
            <div>
              <div className="ledger-box" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', background:'white', padding:'20px'}}>
                <input placeholder="Name" className="btn-gold" style={{background:'white'}} onChange={e => setForm({...form, uName: e.target.value})} />
                <input placeholder="Email" className="btn-gold" style={{background:'white'}} onChange={e => setForm({...form, uEmail: e.target.value})} />
                <select className="btn-gold" style={{background:'white'}} onChange={e => setForm({...form, role: e.target.value})}><option>Role</option><option value="Admin">Admin</option><option value="Operator">Operator</option></select>
                <button className="btn-gold" onClick={() => handleSave("User Master")}>SAVE USER</button>
              </div>
              <table className="royal-table" style={{marginTop:'20px'}}>
                <thead><tr><th>Name</th><th>Role</th><th>Actions</th></tr></thead>
                <tbody>{usersList.map(u => <tr key={u.id}><td>{u.uName}</td><td>{u.role}</td>
                <td><Trash2 size={16} color="red" style={{cursor:'pointer'}} onClick={() => handleDelete("User Master", u.id)}/></td>
                </tr>)}</tbody>
              </table>
            </div>
          )}

          {activeTab === "Setting" && (
            <div className="ledger-box" style={{background:'white', padding:'40px', width:'400px'}}>
              <h3>Security Settings</h3>
              <input type="password" placeholder="New Password" className="btn-gold" style={{background:'#f8fafc', width:'100%', marginBottom:'20px'}} onChange={e => setNewPass(e.target.value)} />
              <button className="btn-gold" style={{width:'100%'}} onClick={() => updatePassword(auth.currentUser, newPass).then(() => alert("Password Updated")).catch(e => alert(e.message))}>UPDATE PASSWORD</button>
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