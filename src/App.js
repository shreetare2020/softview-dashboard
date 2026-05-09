import React, { useState, useEffect } from 'react';
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { LayoutDashboard, Building2, Landmark, Users, LogOut, Settings, ChevronDown, Edit3, Trash2, FileText, Download, UserCircle, Clock, ShieldCheck } from 'lucide-react';
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
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        onSnapshot(collection(db, "Firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
        onSnapshot(collection(db, "Bank Master"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
        onSnapshot(collection(db, "User Master"), s => setUsersList(s.docs.map(d => ({id: d.id, ...d.data()}))));
      }
    });
    return () => { clearInterval(timer); unsub(); };
  }, []);

  const handleSave = async (coll) => {
    try {
      if (editId) { await updateDoc(doc(db, coll, editId), { ...form }); setEditId(null); }
      else { await addDoc(collection(db, coll), { ...form, createdAt: new Date() }); }
      setForm({}); alert("Executive Data Updated!");
    } catch (e) { alert(e.message); }
  };

  const handleExport = (b) => {
    const ws = XLSX.utils.json_to_sheet([{ Bank: b.bankName, Acc: b.accNo, Balance: b.balance }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, "Ledger_Report.xlsx");
  };

  if (!user) return <LoginScreen />;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      {/* SIDEBAR */}
      <aside style={{ width: '280px', background: '#050a14', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(212,175,55,0.2)' }}>
        <div style={{ padding: '40px 30px' }}>
          <h1 style={{ color: '#d4af37', fontSize: '24px', fontWeight: '900', margin: 0 }}>BANKING PRO</h1>
          <p style={{ color: '#64748b', fontSize: '10px', letterSpacing: '2px' }}>V2.0 EXECUTIVE</p>
        </div>
        <nav style={{ flex: 1 }}>
          {[
            { id: 'Dashboard', icon: <LayoutDashboard size={20}/> },
            { id: 'Firm Master', icon: <Building2 size={20}/> },
            { id: 'Bank Master', icon: <Landmark size={20}/> },
            { id: 'User Master', icon: <Users size={20}/> },
            { id: 'Setting', icon: <Settings size={20}/> }
          ].map(item => (
            <div key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`} 
                 onClick={() => {setActiveTab(item.id); setForm({}); setEditId(null);}}
                 style={{ display: 'flex', alignItems: 'center', padding: '18px 30px', color: activeTab === item.id ? '#d4af37' : '#94a3b8', cursor: 'pointer' }}>
              {item.icon} <span style={{ marginLeft: '15px', fontWeight: '600' }}>{item.id}</span>
            </div>
          ))}
        </nav>
        {/* DEVELOPED BY - PREMIUM LOOK */}
        <div style={{ padding: '30px', background: 'rgba(212,175,55,0.05)', borderTop: '1px solid rgba(212,175,55,0.1)' }}>
          <p style={{ color: '#d4af37', fontSize: '10px', fontWeight: 'bold', marginBottom: '5px' }}>DEVELOPED BY</p>
          <p style={{ color: '#fff', fontSize: '14px', fontWeight: '800', margin: 0 }}>SOFTVIEW TECHNOLOGIES</p>
          <p style={{ color: '#64748b', fontSize: '11px' }}>+91 7972084304</p>
        </div>
      </aside>

      <main>
        {/* EXECUTIVE HEADER */}
        <header style={{ height: '100px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 50px', background: 'rgba(255,255,255,0.02)' }}>
          <h2 style={{ color: '#d4af37', fontWeight: '900', fontSize: '26px' }}>{activeTab}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#fff' }}>{time.toLocaleTimeString()}</div>
              <div style={{ fontSize: '12px', color: '#d4af37' }}>{time.toLocaleDateString('en-GB')}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#fff', fontWeight: '800' }}>{user.email.split('@')[0]}</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>ADMIN ACCESS</div>
              </div>
              <UserCircle size={45} color="#d4af37" />
            </div>
            <button onClick={() => signOut(auth)} style={{ background: 'rgba(225,29,72,0.1)', border: 'none', color: '#e11d48', padding: '12px', borderRadius: '12px', cursor: 'pointer' }}><LogOut/></button>
          </div>
        </header>

        <div style={{ padding: '50px', overflowY: 'auto' }}>
          {activeTab === "Dashboard" && (
            <div className="premium-card">
              <table className="royal-table">
                <thead><tr><th>BANK</th><th>ACCOUNT NO</th><th>BALANCE</th><th>ACTION</th></tr></thead>
                <tbody>
                  {banks.map(b => (
                    <React.Fragment key={b.id}>
                      <tr onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)} style={{ cursor: 'pointer' }}>
                        <td style={{ fontWeight: 'bold' }}>{b.bankName}</td><td>{b.accNo}</td><td style={{ color: '#10b981', fontWeight: '900' }}>₹ {b.balance || '1,25,000'}</td><td><ChevronDown size={20} color="#d4af37" /></td>
                      </tr>
                      {expandedBank === b.id && (
                        <tr><td colSpan="4" style={{ padding: '30px' }}>
                          <div style={{ display: 'flex', gap: '20px' }}>
                            <button className="btn-export" onClick={() => handleExport(b)}><Download/> EXCEL REPORT</button>
                            <button className="btn-export"><FileText/> PDF LEDGER</button>
                          </div>
                        </td></tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "User Master" && (
            <div className="premium-card">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
                <input placeholder="User Name" className="luxury-input" value={form.uName || ''} onChange={e => setForm({...form, uName: e.target.value})} />
                <input placeholder="Mobile No" className="luxury-input" value={form.mobile || ''} onChange={e => setForm({...form, mobile: e.target.value})} />
                <input placeholder="Email" className="luxury-input" value={form.uEmail || ''} onChange={e => setForm({...form, uEmail: e.target.value})} />
                <button onClick={() => handleSave("User Master")} className="btn-gold" style={{ gridColumn: 'span 3' }}>Save User</button>
              </div>
              <table className="royal-table">
                <thead><tr><th>NAME</th><th>MOBILE</th><th>EMAIL</th><th>ACTION</th></tr></thead>
                <tbody>{usersList.map(u => (
                  <tr key={u.id}><td>{u.uName}</td><td>{u.mobile}</td><td>{u.uEmail}</td><td><Edit3 size={18} color="#d4af37" onClick={() => {setForm(u); setEditId(u.id);}}/> <Trash2 size={18} color="#e11d48" onClick={async () => await deleteDoc(doc(db,"User Master",u.id))}/></td></tr>
                ))}</tbody>
              </table>
            </div>
          )}

          {activeTab === "Setting" && (
            <div className="premium-card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
               <ShieldCheck size={60} color="#d4af37" style={{ marginBottom: '20px' }} />
               <h2 style={{ color: '#fff' }}>Change Administrative Password</h2>
               <input type="password" placeholder="Enter New Password" className="luxury-input" style={{ width: '100%', marginBottom: '20px' }} onChange={e => setForm({pass: e.target.value})} />
               <button onClick={() => updatePassword(auth.currentUser, form.pass).then(() => alert("Password Updated"))} className="btn-gold" style={{ width: '100%' }}>Secure Changes</button>
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
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050a14' }}>
      <form onSubmit={h} style={{ background: '#0a121e', padding: '60px', borderRadius: '30px', border: '1px solid #d4af37', textAlign: 'center' }}>
        <h1 style={{ color: '#d4af37', marginBottom: '40px' }}>BANKING PRO</h1>
        <input type="email" placeholder="Email" className="luxury-input" style={{ width: '100%', marginBottom: '20px' }} onChange={v => setE(v.target.value)} />
        <input type="password" placeholder="Pin" className="luxury-input" style={{ width: '100%', marginBottom: '40px' }} onChange={v => setP(v.target.value)} />
        <button type="submit" className="btn-gold" style={{ width: '100%' }}>Login</button>
      </form>
    </div>
  );
}