import React, { useState, useEffect } from 'react';
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { LayoutDashboard, Building2, Landmark, Users, LogOut, Settings, ChevronDown, Edit3, Trash2, Clock, ShieldCheck, UserCircle } from 'lucide-react';
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
    if (userRole === "Viewer") return alert("Unauthorized Action!");
    try {
      if (editId) {
        await updateDoc(doc(db, coll, editId), { ...form });
        setEditId(null);
      } else {
        await addDoc(collection(db, coll), { ...form, createdAt: new Date() });
      }
      setForm({}); alert("Records Successfully Authenticated!");
    } catch (e) { alert(e.message); }
  };

  const startEdit = (item) => { setForm(item); setEditId(item.id); };

  if (!user) return <LoginScreen />;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#f4f7f6' }}>
      {/* SIDEBAR */}
      <aside style={{ width: '280px', background: '#0a192f', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '40px 25px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h1 style={{ color: '#d4af37', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>BANKING PRO</h1>
          <p style={{ fontSize: '11px', color: '#64748b', letterSpacing: '1.5px', marginTop: '5px' }}>EXECUTIVE VERSION 2.0</p>
        </div>
        <nav style={{ flex: 1, padding: '20px 0' }}>
          {[
            { id: 'Dashboard', icon: <LayoutDashboard size={20}/> },
            { id: 'Firm Master', icon: <Building2 size={20}/> },
            { id: 'Bank Master', icon: <Landmark size={20}/> },
            { id: 'User Master', icon: <Users size={20}/> },
            { id: 'Setting', icon: <Settings size={20}/> }
          ].map(item => (
            <div key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => {setActiveTab(item.id); setEditId(null); setForm({});}} 
                 style={{ display: 'flex', alignItems: 'center', padding: '15px 25px', color: activeTab === item.id ? '#d4af37' : '#94a3b8', cursor: 'pointer', transition: '0.3s' }}>
              {item.icon} <span style={{ marginLeft: '15px', fontWeight: '500' }}>{item.id}</span>
            </div>
          ))}
        </nav>
        <div style={{ padding: '30px 25px', background: 'rgba(0,0,0,0.2)' }}>
          <p style={{ color: '#d4af37', fontWeight: 'bold', fontSize: '12px', margin: 0 }}>DEVELOPED BY:</p>
          <p style={{ color: '#fff', fontSize: '13px', margin: '5px 0' }}>SOFTVIEW TECHNOLOGIES</p>
          <p style={{ color: '#64748b', fontSize: '11px' }}>Mob: +91 7972084304</p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ height: '90px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#0a192f' }}>{activeTab}</div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '35px' }}>
            {/* Real-time Clock Design */}
            <div style={{ textAlign: 'right', paddingRight: '25px', borderRight: '1px solid #eee' }}>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#0a192f', fontFamily: 'monospace' }}>{time.toLocaleTimeString()}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>{time.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            </div>

            {/* Login User Info Bundle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#0a192f' }}>{currentUserName || "Executive"}</div>
                <div style={{ fontSize: '11px', color: '#d4af37', fontWeight: '600' }}>{user.email} • {userRole}</div>
              </div>
              <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4af37', border: '1px solid #eee' }}>
                <UserCircle size={28} />
              </div>
            </div>

            <button onClick={() => signOut(auth)} style={{ background: '#fff1f1', border: 'none', color: '#e11d48', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}>
              <LogOut size={20}/>
            </button>
          </div>
        </header>

        <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
          {activeTab === "Setting" && (
            <div style={{ maxWidth: '600px', background: '#fff', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
              <div style={{ marginBottom: '30px' }}>
                <h3 style={{ margin: 0, color: '#0a192f' }}>Security Configuration</h3>
                <p style={{ fontSize: '13px', color: '#64748b' }}>Update your administrative credentials</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#0a192f' }}>NEW PASSWORD</label>
                  <input type="password" placeholder="••••••••" className="luxury-input" onChange={e => setNewPass(e.target.value)} 
                         style={{ padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc' }} />
                </div>
                <button onClick={() => updatePassword(auth.currentUser, newPass).then(() => alert("Credential Updated")).catch(e => alert(e.message))} 
                        style={{ background: '#0a192f', color: '#d4af37', padding: '15px', borderRadius: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                  COMMIT CHANGES
                </button>
              </div>
            </div>
          )}

          {activeTab === "Bank Master" && (
            <div style={{ background: '#fff', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
                  <input placeholder="Bank Name" className="luxury-input" value={form.bankName || ''} onChange={e => setForm({...form, bankName: e.target.value})} />
                  <select className="luxury-input" value={form.status || 'Open'} onChange={e => setForm({...form, status: e.target.value})}>
                    <option value="Open">Status: ACTIVE (OPEN)</option>
                    <option value="Closed">Status: TERMINATED (CLOSED)</option>
                  </select>
                  {form.status === 'Closed' && <input type="date" className="luxury-input" value={form.closeDate || ''} onChange={e => setForm({...form, closeDate: e.target.value})} />}
                  <button onClick={() => handleSave("Bank Master")} style={{ gridColumn: 'span 3', background: '#d4af37', color: '#0a192f', padding: '15px', borderRadius: '12px', fontWeight: '800', border: 'none', cursor: 'pointer' }}>
                    {editId ? "CONFIRM UPDATE" : "AUTHORIZE NEW BANK ENTRY"}
                  </button>
               </div>
               <table className="royal-table">
                 <thead><tr><th>Bank Identity</th><th>Account Status</th><th>Termination Date</th><th>Actions</th></tr></thead>
                 <tbody>
                   {banks.map(b => (
                     <tr key={b.id}>
                       <td style={{ fontWeight: '600' }}>{b.bankName}</td>
                       <td><span style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', background: b.status === 'Open' ? '#ecfdf5' : '#fef2f2', color: b.status === 'Open' ? '#10b981' : '#ef4444' }}>{b.status}</span></td>
                       <td>{b.closeDate || '--'}</td>
                       <td>
                         <Edit3 size={18} onClick={() => startEdit(b)} style={{ cursor: 'pointer', color: '#0a192f' }}/>
                         <Trash2 size={18} style={{ marginLeft: '15px', color: '#e11d48', cursor: 'pointer' }}/>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          )}
        </div>
        <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '11px' }}>
          OFFICIAL EXECUTIVE PORTAL • POWERED BY SOFTVIEW TECHNOLOGIES
        </div>
      </main>
    </div>
  );
}

function LoginScreen() {
  const [e, setE] = useState(""); const [p, setP] = useState("");
  const h = (ev) => { ev.preventDefault(); signInWithEmailAndPassword(auth, e, p).catch(() => alert("Access Denied: Invalid Credentials")); };
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a192f' }}>
      <form onSubmit={h} style={{ background: '#fff', padding: '60px', borderRadius: '24px', width: '450px', boxShadow: '0 25px 60px rgba(0,0,0,0.5)', borderTop: '8px solid #d4af37' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ color: '#0a192f', fontSize: '32px', margin: 0, letterSpacing: '-1px' }}>BANKING PRO</h2>
          <p style={{ color: '#d4af37', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '5px' }}>Executive Version 2.0</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <input type="email" placeholder="Corporate Email" className="luxury-input" style={{ width: '100%', padding: '18px', borderRadius: '15px', border: '1px solid #e2e8f0' }} onChange={v => setE(v.target.value)} />
          <input type="password" placeholder="Secure Password" className="luxury-input" style={{ width: '100%', padding: '18px', borderRadius: '15px', border: '1px solid #e2e8f0' }} onChange={v => setP(v.target.value)} />
          <button type="submit" style={{ background: '#0a192f', color: '#d4af37', padding: '18px', borderRadius: '15px', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '16px' }}>AUTHORIZE ENTRY</button>
        </div>
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>Developed by Softview Technologies</p>
          <p style={{ fontSize: '11px', color: '#0a192f', fontWeight: 'bold' }}>+91 7972084304</p>
        </div>
      </form>
    </div>
  );
}