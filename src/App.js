import React, { useState, useEffect } from 'react';
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, query, orderBy } from "firebase/firestore";
import { LayoutDashboard, Building2, Landmark, Users, LogOut, Settings, ChevronDown, Edit3, Trash2, Clock, Download, FileText, Calendar } from 'lucide-react';
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
        onSnapshot(collection(db, "User Master"), s => {
          const list = s.docs.map(d => ({id: d.id, ...d.data()}));
          setUsersList(list);
          const match = list.find(emp => emp.uEmail === u.email);
          if (match) setUserRole(match.role);
        });
        onSnapshot(collection(db, "Firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
        
        // 🛠️ SMART FETCH: Dono nodes se data check karega
        onSnapshot(collection(db, "Bank Master"), s => {
            const masterData = s.docs.map(d => ({id: d.id, ...d.data()}));
            setBanks(masterData);
        });
      }
    });
    return () => { clearInterval(timer); unsub(); };
  }, [user]);

  const handleSave = async (coll) => {
    if (userRole === "Viewer") return alert("Access Denied!");
    await addDoc(collection(db, coll), { ...form, status: 'Open', createdAt: new Date() });
    setForm({}); alert("Data Saved Successfully!");
  };

  const exportToExcel = (data, name) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, `${name}_Ledger.xlsx`);
  };

  const exportToPDF = (data, name) => {
    const doc = new jsPDF();
    doc.text(`Ledger Report: ${name}`, 14, 15);
    doc.autoTable({ head: [['Date', 'Particulars', 'Voucher', 'Dr', 'Cr', 'Balance']], body: data });
    doc.save(`${name}_Ledger.pdf`);
  };

  if (!user) return <LoginScreen />;

  const dashboardData = banks.filter(b => selectedFirm === "All" || b.linkedFirm === selectedFirm);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      {/* --- SIDEBAR --- */}
      <aside className="executive-sidebar">
        <div style={{ padding: '25px' }}>
          <h1 style={{ color: 'var(--gold)', margin: 0, fontSize: '20px' }}>BANKING PRO</h1>
          <p style={{ fontSize: '9px', color: '#64748b' }}>EXECUTIVE VERSION 2.0</p>
        </div>
        <nav style={{ flex: 1 }}>
          <div className={`nav-item ${activeTab === 'Dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('Dashboard')}><LayoutDashboard size={18}/> Dashboard</div>
          <div className={`nav-item ${activeTab === 'Firm Master' ? 'active' : ''}`} onClick={() => setActiveTab('Firm Master')}><Building2 size={18}/> Firm Master</div>
          <div className={`nav-item ${activeTab === 'Bank Master' ? 'active' : ''}`} onClick={() => setActiveTab('Bank Master')}><Landmark size={18}/> Bank Master</div>
          <div className={`nav-item ${activeTab === 'User Master' ? 'active' : ''}`} onClick={() => setActiveTab('User Master')}><Users size={18}/> User Master</div>
          <div className={`nav-item ${activeTab === 'Setting' ? 'active' : ''}`} onClick={() => setActiveTab('Setting')}><Settings size={18}/> Setting</div>
        </nav>
        <div style={{ padding: '20px', borderTop: '1px solid rgba(212,175,55,0.1)' }}>
          <p style={{ color: 'var(--gold)', fontWeight: 'bold', fontSize: '11px' }}>SOFTVIEW TECHNOLOGIES<br/>+91 7972084304</p>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main style={{ flex: 1, marginLeft: '260px', overflowY: 'auto', background: '#f8fafc' }}>
        <header className="luxury-header">
          <div style={{ fontWeight: 'bold' }}>{activeTab.toUpperCase()}</div>
          <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
             <div style={{ textAlign: 'right', borderRight: '1px solid #ddd', paddingRight: '15px' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0a192f' }}><Clock size={12} style={{marginRight:5}}/> {time.toLocaleTimeString()}</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>{time.toLocaleDateString()}</div>
             </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{user.email} ({userRole})</div>
              <div style={{ fontSize: '11px', color: 'var(--gold)' }}>ACTIVE SESSION</div>
            </div>
            <button className="btn-gold" style={{ background: '#ffefef', color: 'red' }} onClick={() => signOut(auth)}><LogOut size={16}/></button>
          </div>
        </header>

        <div style={{ padding: '30px' }}>
          
          {activeTab === "Dashboard" && (
            <div>
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <label style={{fontWeight:'bold'}}>Select Firm:</label>
                <select className="btn-gold" style={{background:'white'}} onChange={(e) => setSelectedFirm(e.target.value)}>
                  <option value="All">All Firms</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>
              <table className="royal-table">
                <thead><tr><th>Bank Name</th><th>A/c No.</th><th style={{textAlign:'right'}}>Closing Balance</th><th style={{textAlign:'center'}}>Ledger View</th></tr></thead>
                <tbody>
                  {dashboardData.map(b => (
                    <React.Fragment key={b.id}>
                      <tr onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)} style={{cursor:'pointer'}}>
                        <td>{b.bankName}</td><td>{b.accNo}</td><td style={{textAlign:'right', fontWeight:'bold'}}>₹ {b.balance} {b.type}</td>
                        <td style={{textAlign:'center'}}><ChevronDown size={18} style={{transform: expandedBank === b.id ? 'rotate(180deg)' : 'none', color:'var(--gold)'}}/></td>
                      </tr>
                      {expandedBank === b.id && (
                        <tr>
                          <td colSpan="4" style={{padding:'20px', background:'#f1f5f9'}}>
                             <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
                               <h4 style={{margin:0}}>Transaction Ledger: {b.bankName}</h4>
                               <div style={{display:'flex', gap:'10px'}}>
                                 <button onClick={() => exportToExcel([], b.bankName)} className="btn-gold" style={{fontSize:'10px'}}><Download size={12}/> Excel</button>
                                 <button onClick={() => exportToPDF([], b.bankName)} className="btn-gold" style={{fontSize:'10px'}}><FileText size={12}/> PDF</button>
                               </div>
                             </div>
                             <table className="royal-table" style={{background:'white', fontSize:'12px'}}>
                               <thead><tr><th>Date</th><th>Particulars</th><th>Voucher</th><th>Dr</th><th>Cr</th><th>Balance</th></tr></thead>
                               <tbody><tr><td colSpan="6" style={{textAlign:'center', color:'#94a3b8'}}>No Transactions Found</td></tr></tbody>
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
            <div className="fade-in">
              <div className="ledger-box" style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px', background:'white', padding:'20px'}}>
                <input placeholder="Firm Name" className="btn-gold" style={{background:'white', textAlign:'left'}} onChange={e => setForm({...form, name: e.target.value})} />
                <input placeholder="GST No" className="btn-gold" style={{background:'white', textAlign:'left'}} onChange={e => setForm({...form, gst: e.target.value})} />
                <input placeholder="Office Address" className="btn-gold" style={{background:'white', textAlign:'left'}} onChange={e => setForm({...form, address: e.target.value})} />
                <button className="btn-gold" style={{gridColumn:'span 3'}} onClick={() => handleSave("Firms")}>SAVE FIRM MASTER</button>
              </div>
              <table className="royal-table" style={{marginTop:'20px'}}>
                <thead><tr><th>Firm Name</th><th>GST</th><th>Address</th><th>Action</th></tr></thead>
                <tbody>{firms.map(f => <tr key={f.id}><td>{f.name}</td><td>{f.gst}</td><td>{f.address}</td><td><Edit3 size={16}/></td></tr>)}</tbody>
              </table>
            </div>
          )}

          {activeTab === "Bank Master" && (
             <div className="ledger-box" style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', background:'white', padding:'20px'}}>
                <input placeholder="Bank Name" className="btn-gold" style={{background:'white'}} onChange={e => setForm({...form, bankName: e.target.value})} />
                <input placeholder="Bank Branch" className="btn-gold" style={{background:'white'}} onChange={e => setForm({...form, branch: e.target.value})} />
                <input placeholder="A/c no." className="btn-gold" style={{background:'white'}} onChange={e => setForm({...form, accNo: e.target.value})} />
                <input placeholder="Ifsc code" className="btn-gold" style={{background:'white'}} onChange={e => setForm({...form, ifsc: e.target.value})} />
                <input placeholder="Opening Balance" className="btn-gold" style={{background:'white'}} onChange={e => setForm({...form, balance: e.target.value})} />
                <select className="btn-gold" style={{background:'white'}} onChange={e => setForm({...form, type: e.target.value})}><option>dr/cr</option><option value="dr">dr</option><option value="cr">cr</option></select>
                <select className="btn-gold" style={{background:'white', gridColumn:'span 3'}} onChange={e => setForm({...form, linkedFirm: e.target.value})}><option>Link Firm</option>{firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}</select>
                <button className="btn-gold" style={{gridColumn:'span 3'}} onClick={() => handleSave("Bank Master")}>SAVE BANK MASTER</button>
             </div>
          )}

          {activeTab === "User Master" && (
            <div className="ledger-box" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', background:'white', padding:'20px'}}>
                <input placeholder="User code" className="btn-gold" style={{background:'white'}} onChange={e => setForm({...form, code: e.target.value})} />
                <input placeholder="User name" className="btn-gold" style={{background:'white'}} onChange={e => setForm({...form, uName: e.target.value})} />
                <input placeholder="User email" className="btn-gold" style={{background:'white'}} onChange={e => setForm({...form, uEmail: e.target.value})} />
                <input placeholder="Mobile" className="btn-gold" style={{background:'white'}} onChange={e => setForm({...form, mobile: e.target.value})} />
                <select className="btn-gold" style={{background:'white'}} onChange={e => setForm({...form, role: e.target.value})}><option>Select Role</option><option value="Admin">Admin</option><option value="Operator">Operator</option><option value="Viewer">Viewer</option></select>
                <button className="btn-gold" onClick={() => handleSave("User Master")}>SAVE USER MASTER</button>
            </div>
          )}

          {activeTab === "Setting" && (
            <div className="ledger-box" style={{background:'white', padding:'40px', width:'400px'}}>
              <h3 style={{marginTop:0}}>Change Password</h3>
              <input type="password" placeholder="New Password" className="btn-gold" style={{background:'#f8fafc', width:'100%', marginBottom:'20px'}} onChange={e => setNewPass(e.target.value)} />
              <button className="btn-gold" style={{width:'100%'}} onClick={() => updatePassword(auth.currentUser, newPass).then(() => alert("Success")).catch(e => alert(e.message))}>UPDATE</button>
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
        <h2 style={{textAlign:'center', color:'#0a192f', marginBottom:'30px'}}>BANKING PRO</h2>
        <input type="email" placeholder="Login ID" className="btn-gold" style={{width:'100%', marginBottom:'15px', background:'#f8fafc'}} onChange={v => setE(v.target.value)} />
        <input type="password" placeholder="Password" className="btn-gold" style={{width:'100%', marginBottom:'25px', background:'#f8fafc'}} onChange={v => setP(v.target.value)} />
        <button type="submit" className="btn-gold" style={{width:'100%', padding:'15px'}}>LOG IN</button>
        <p style={{textAlign:'center', fontSize:'11px', marginTop:'20px', color:'#94a3b8'}}>Developed by Softview Technologies</p>
      </form>
    </div>
  );
}