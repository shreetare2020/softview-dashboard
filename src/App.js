import React, { useState, useEffect } from 'react';
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { LayoutDashboard, Building2, Landmark, Users, LogOut, Settings, ChevronDown, Edit3, Trash2, Download, UserCircle, ShieldCheck } from 'lucide-react';
import * as XLSX from 'xlsx';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);
  const [expandedBank, setExpandedBank] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        onSnapshot(collection(db, "Firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
        onSnapshot(collection(db, "Bank Master"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
        onSnapshot(collection(db, "User Master"), s => setUsersList(s.docs.map(d => ({id: d.id, ...d.data()}))));
      }
    });
    return unsub;
  }, []);

  const handleSave = async (coll) => {
    try {
      if (editId) { 
        await updateDoc(doc(db, coll, editId), { ...form }); 
        setEditId(null); 
      } else { 
        await addDoc(collection(db, coll), { ...form, createdAt: new Date() }); 
      }
      setForm({});
      alert("System Updated Successfully!");
    } catch (e) { alert("Error: " + e.message); }
  };

  const handleExport = (b) => {
    const data = [{ Date: "09/05/2026", Detail: "System Entry", Amount: 50000, Balance: b.balance || 0 }];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, `${b.bankName}_Ledger.xlsx`);
  };

  if (!user) return <LoginScreen />;

  return (
    <div className="app-wrapper">
      {/* SIDEBAR */}
      <aside style={{ width: '280px', background: '#050a14', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-gold)' }}>
        <div style={{ padding: '40px 30px' }}>
          <h1 style={{ color: '#d4af37', fontSize: '24px', fontWeight: '900', margin: 0 }}>BANKING PRO</h1>
          <p style={{ color: '#64748b', fontSize: '10px' }}>V2.0 EXECUTIVE</p>
        </div>
        <nav style={{ flex: 1 }}>
          {[
            {id: 'Dashboard', icon: <LayoutDashboard size={18}/>},
            {id: 'Firm Master', icon: <Building2 size={18}/>},
            {id: 'Bank Master', icon: <Landmark size={18}/>},
            {id: 'User Master', icon: <Users size={18}/>},
            {id: 'Setting', icon: <Settings size={18}/>}
          ].map(item => (
            <div key={item.id} onClick={() => {setActiveTab(item.id); setForm({}); setEditId(null);}} 
                 style={{ display: 'flex', alignItems: 'center', padding: '18px 30px', color: activeTab === item.id ? '#d4af37' : '#94a3b8', cursor: 'pointer', background: activeTab === item.id ? 'rgba(212,175,55,0.05)' : '' }}>
              {item.icon} <span style={{ marginLeft: '15px', fontWeight: '600' }}>{item.id}</span>
            </div>
          ))}
        </nav>
        {/* DEVELOPED BY - BRANDING */}
        <div style={{ padding: '30px', background: 'rgba(212,175,55,0.05)', borderTop: '1px solid var(--border-gold)' }}>
          <p style={{ color: '#d4af37', fontSize: '10px', fontWeight: 'bold' }}>DEVELOPED BY</p>
          <p style={{ color: '#fff', fontSize: '14px', fontWeight: '800', margin: 0 }}>SOFTVIEW TECHNOLOGIES</p>
          <p style={{ color: '#64748b', fontSize: '11px' }}>+91 7972084304</p>
        </div>
      </aside>

      <main>
        {/* HEADER */}
        <header style={{ height: '100px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 50px' }}>
          <h2 style={{ color: '#d4af37', fontWeight: '900' }}>{activeTab}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#fff' }}>SHREEKANT RATHI</div>
              <div style={{ fontSize: '11px', color: '#d4af37' }}>ADMIN PORTAL | 09/05/2026</div>
            </div>
            <UserCircle size={45} color="#d4af37" />
            <button onClick={() => signOut(auth)} style={{ color: '#e11d48', background: 'none', border: 'none', cursor: 'pointer' }}><LogOut/></button>
          </div>
        </header>

        <div style={{ padding: '40px' }}>
          {/* FIRM MASTER */}
          {activeTab === "Firm Master" && (
            <>
              <div className="premium-card">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <input placeholder="Firm Name" className="luxury-input" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
                  <input placeholder="GST Number" className="luxury-input" value={form.gst || ''} onChange={e => setForm({...form, gst: e.target.value})} />
                  <textarea placeholder="Full Office Address" className="luxury-input" style={{ gridColumn: 'span 2' }} value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} />
                </div>
                <button onClick={() => handleSave("Firms")} className="btn-royal">{editId ? 'Update' : 'Save'} Firm</button>
              </div>
              <div className="premium-card">
                <table className="royal-table">
                  <thead><tr><th>FIRM NAME</th><th>GST NO</th><th>ACTION</th></tr></thead>
                  <tbody>{firms.map(f => <tr key={f.id}><td>{f.name}</td><td>{f.gst}</td><td><Edit3 size={18} color="#d4af37" style={{cursor:'pointer'}} onClick={()=>{setForm(f); setEditId(f.id);}}/> <Trash2 size={18} color="#e11d48" style={{marginLeft:'15px', cursor:'pointer'}} onClick={()=>deleteDoc(doc(db,"Firms",f.id))}/></td></tr>)}</tbody>
                </table>
              </div>
            </>
          )}

          {/* BANK MASTER */}
          {activeTab === "Bank Master" && (
            <>
              <div className="premium-card">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                  <input placeholder="Bank Name" className="luxury-input" value={form.bankName || ''} onChange={e => setForm({...form, bankName: e.target.value})} />
                  <input placeholder="A/c No" className="luxury-input" value={form.accNo || ''} onChange={e => setForm({...form, accNo: e.target.value})} />
                  <input placeholder="IFSC Code" className="luxury-input" value={form.ifsc || ''} onChange={e => setForm({...form, ifsc: e.target.value})} />
                  <input placeholder="Branch" className="luxury-input" value={form.branch || ''} onChange={e => setForm({...form, branch: e.target.value})} />
                  <select className="luxury-input" value={form.status || 'Active'} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="Active">Active</option><option value="Closed">Closed</option>
                  </select>
                  {form.status === 'Closed' && <input type="date" className="luxury-input" value={form.closedDate || ''} onChange={e => setForm({...form, closedDate: e.target.value})} />}
                </div>
                <button onClick={() => handleSave("Bank Master")} className="btn-royal">Register Bank</button>
              </div>
              <div className="premium-card">
                <table className="royal-table">
                  <thead><tr><th>BANK</th><th>ACCOUNT NO</th><th>STATUS</th><th>ACTION</th></tr></thead>
                  <tbody>{banks.map(b => <tr key={b.id}><td>{b.bankName}</td><td>{b.accNo}</td><td>{b.status}</td><td><Edit3 size={18} color="#d4af37" style={{cursor:'pointer'}} onClick={()=>{setForm(b); setEditId(b.id);}}/></td></tr>)}</tbody>
                </table>
              </div>
            </>
          )}

          {/* USER MASTER */}
          {activeTab === "User Master" && (
            <>
              <div className="premium-card">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                  <input placeholder="User Code" className="luxury-input" value={form.code || ''} onChange={e => setForm({...form, code: e.target.value})} />
                  <input placeholder="Name" className="luxury-input" value={form.uName || ''} onChange={e => setForm({...form, uName: e.target.value})} />
                  <input placeholder="Mobile No" className="luxury-input" value={form.mobile || ''} onChange={e => setForm({...form, mobile: e.target.value})} />
                  <input placeholder="Email ID" className="luxury-input" value={form.uEmail || ''} onChange={e => setForm({...form, uEmail: e.target.value})} />
                  <input type="password" placeholder="Password" className="luxury-input" value={form.pass || ''} onChange={e => setForm({...form, pass: e.target.value})} />
                </div>
                <button onClick={() => handleSave("User Master")} className="btn-royal">Save User</button>
              </div>
              <div className="premium-card">
                <table className="royal-table">
                  <thead><tr><th>CODE</th><th>NAME</th><th>MOBILE</th><th>ACTION</th></tr></thead>
                  <tbody>{usersList.map(u => <tr key={u.id}><td>{u.code}</td><td>{u.uName}</td><td>{u.mobile}</td><td><Edit3 size={18} color="#d4af37" style={{cursor:'pointer'}} onClick={()=>{setForm(u); setEditId(u.id);}}/></td></tr>)}</tbody>
                </table>
              </div>
            </>
          )}

          {/* DASHBOARD - EXPANDABLE LEDGER */}
          {activeTab === "Dashboard" && (
            <div className="premium-card">
              <table className="royal-table">
                <thead><tr><th>BANK IDENTITY</th><th>A/C NO</th><th>BALANCE</th><th>ACTION</th></tr></thead>
                <tbody>{banks.map(b => (
                  <React.Fragment key={b.id}>
                    <tr onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)} style={{ cursor: 'pointer' }}>
                      <td style={{ fontWeight: '800' }}>{b.bankName}</td><td>{b.accNo}</td><td style={{ color: '#10b981', fontWeight: '900' }}>₹ {b.balance || '1,25,000'}</td><td><ChevronDown size={20} color="#d4af37" /></td>
                    </tr>
                    {expandedBank === b.id && (
                      <tr><td colSpan="4" style={{ padding: '30px' }}>
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                          <button className="btn-royal" onClick={() => handleExport(b)}><Download size={16}/> EXCEL REPORT</button>
                          <button className="btn-royal" style={{ background: '#fff', color: '#000' }}><Download size={16}/> PDF LEDGER</button>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '15px', border: '1px solid var(--border-gold)' }}>
                           <p style={{ color: '#64748b' }}>Latest Transaction (System Generated):</p>
                           <p>09/05/2026 - Receipt - <span style={{ color: '#10b981' }}>+ ₹ 50,000</span></p>
                        </div>
                      </td></tr>
                    )}
                  </React.Fragment>
                ))}</tbody>
              </table>
            </div>
          )}

          {/* SETTING */}
          {activeTab === "Setting" && (
            <div className="premium-card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
               <ShieldCheck size={60} color="#d4af37" style={{ marginBottom: '20px' }} />
               <h2 style={{ color: '#fff' }}>Security Management</h2>
               <input type="password" placeholder="New Access Password" className="luxury-input" onChange={e => setForm({pass: e.target.value})} />
               <button onClick={() => updatePassword(auth.currentUser, form.pass).then(() => alert("Securely Updated"))} className="btn-royal" style={{ width: '100%' }}>Change Password</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function LoginScreen() {
  const [e, setE] = useState(""); const [p, setP] = useState("");
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050a14' }}>
      <div style={{ background: '#0a121e', padding: '60px', borderRadius: '30px', border: '1px solid #d4af37', textAlign: 'center' }}>
        <h1 style={{ color: '#d4af37', marginBottom: '40px' }}>EXECUTIVE PORTAL</h1>
        <input type="email" placeholder="Email" className="luxury-input" onChange={v => setE(v.target.value)} />
        <input type="password" placeholder="Pin" className="luxury-input" onChange={v => setP(v.target.value)} />
        <button onClick={() => signInWithEmailAndPassword(auth, e, p)} className="btn-royal" style={{ width: '100%' }}>Login</button>
      </div>
    </div>
  );
}