import React, { useState, useEffect } from 'react';
import { auth, db } from "./firebase"; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc, query, orderBy } from "firebase/firestore";
import { LayoutDashboard, Building2, Landmark, Users, LogOut, ShieldCheck, Trash2, Clock, Calendar, ChevronRight } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [banks, setBanks] = useState([]);
  const [firms, setFirms] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [form, setForm] = useState({});
  const [time, setTime] = useState(new Date());

  // Clock Functionality
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    if (user) {
      onSnapshot(collection(db, "firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "banks"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "users"), s => setUsersList(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
    return () => { clearInterval(timer); unsub(); };
  }, [user]);

  const handleSave = async (coll) => {
    if (coll === "users" && form.pass !== form.cPass) { alert("Password Mismatch!"); return; }
    try {
      await addDoc(collection(db, coll), { ...form, createdAt: new Date() });
      setForm({}); alert("Data Secured Successfully!");
    } catch (e) { alert("System Error!"); }
  };

  if (!user) return <LoginScreen />;

  const menuItems = [
    { id: 'Dashboard', icon: <LayoutDashboard size={20}/> },
    { id: 'Firm Master', icon: <Building2 size={20}/> },
    { id: 'Bank Master', icon: <Landmark size={20}/> },
    { id: 'User Master', icon: <Users size={20}/> }
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#f8fafc', position: 'fixed', top: 0, left: 0, fontFamily: "'Segoe UI', Roboto, sans-serif" }}>
      
      {/* SIDEBAR - LUXURY DARK */}
      <aside style={{ width: '280px', background: '#0a0e2e', color: 'white', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 15px rgba(0,0,0,0.2)', zIndex: 10 }}>
        <div style={{ padding: '40px 25px', textAlign: 'center', background: 'linear-gradient(180deg, #111845 0%, #0a0e2e 100%)' }}>
          <h1 style={{ color: '#d4af37', margin: 0, fontSize: '22px', letterSpacing: '2px', fontWeight: '900' }}>BANKING PRO</h1>
          <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '5px', fontWeight: 'bold' }}>EXECUTIVE ACCESS 2.0</p>
        </div>
        
        <nav style={{ flex: 1, paddingTop: '30px' }}>
          {menuItems.map(item => (
            <div key={item.id} onClick={() => setActiveTab(item.id)} style={{
              padding: '16px 30px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer',
              background: activeTab === item.id ? 'rgba(212,175,55,0.1)' : 'transparent',
              color: activeTab === item.id ? '#d4af37' : '#94a3b8',
              borderLeft: activeTab === item.id ? '5px solid #d4af37' : '5px solid transparent',
              transition: '0.3s all'
            }}>
              {item.icon} <span style={{ fontWeight: activeTab === item.id ? 'bold' : '500' }}>{item.id}</span>
              {activeTab === item.id && <ChevronRight size={14} style={{ marginLeft: 'auto' }}/>}
            </div>
          ))}
        </nav>

        {/* BRANDING */}
        <div style={{ padding: '25px', borderTop: '1px solid #1e293b', background: '#070a1f', textAlign: 'center' }}>
          <p style={{ color: '#d4af37', fontWeight: '900', margin: 0, fontSize: '13px' }}>SOFTVIEW TECHNOLOGIES</p>
          <p style={{ color: '#64748b', fontSize: '11px', margin: '5px 0' }}>Support: +91 7972084304</p>
        </div>
      </aside>

      {/* MAIN PANEL */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* HEADER WITH CLOCK & DATE */}
        <header style={{ height: '80px', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', zIndex: 5 }}>
          <div>
            <h2 style={{ margin: 0, color: '#0a0e2e', fontSize: '20px', fontWeight: '800' }}>{activeTab.toUpperCase()}</h2>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
            <div style={{ textAlign: 'right', color: '#64748b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 'bold', color: '#0a0e2e' }}>
                <Clock size={16} color="#d4af37"/> {time.toLocaleTimeString()}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <Calendar size={14}/> {time.toLocaleDateString()}
              </div>
            </div>
            <button onClick={() => signOut(auth)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', background: '#fff1f1', color: '#ff4d4d', border: '1px solid #ff4d4d', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
              <LogOut size={18}/> LOGOUT
            </button>
          </div>
        </header>

        <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
          
          {/* DASHBOARD - EXECUTIVE SUMMARY */}
          {activeTab === "Dashboard" && (
            <div style={{ background: 'white', borderRadius: '20px', padding: '35px', boxShadow: '0 15px 40px rgba(0,0,0,0.04)', borderTop: '6px solid #d4af37' }}>
              <h3 style={{ marginTop: 0, marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <LayoutDashboard color="#d4af37"/> All Bank Accounts Summary
              </h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f1f5f9' }}>
                    <tr>
                      <th style={{ padding: '18px', textAlign: 'left', color: '#475569' }}>BANK NAME</th>
                      <th style={{ padding: '18px', textAlign: 'left', color: '#475569' }}>ACCOUNT NO.</th>
                      <th style={{ padding: '18px', textAlign: 'left', color: '#475569' }}>FIRM LINKED</th>
                      <th style={{ padding: '18px', textAlign: 'right', color: '#475569' }}>CLOSING BALANCE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {banks.map(b => (
                      <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '18px', fontWeight: 'bold', color: '#0a0e2e' }}>{b.bankName}</td>
                        <td style={{ padding: '18px', color: '#64748b' }}>{b.accNo}</td>
                        <td style={{ padding: '18px' }}><span style={{ padding: '5px 12px', background: '#f0fdf4', color: '#166534', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{b.firmLink}</span></td>
                        <td style={{ padding: '18px', textAlign: 'right', fontWeight: '900', color: '#0a0e2e', fontSize: '18px' }}>₹ {b.balance} Cr.</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* FIRM MASTER */}
          {activeTab === "Firm Master" && (
            <div style={{ background: 'white', borderRadius: '20px', padding: '40px', boxShadow: '0 15px 40px rgba(0,0,0,0.04)', borderTop: '6px solid #d4af37' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>FIRM NAME</label>
                  <input style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px' }} value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>GST NUMBER</label>
                  <input style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px' }} value={form.gst || ''} onChange={e => setForm({...form, gst: e.target.value})} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>OFFICE ADDRESS (FULL)</label>
                  <input style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px' }} value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} />
                </div>
                <button onClick={() => handleSave("firms")} style={{ gridColumn: 'span 2', padding: '18px', background: '#0a0e2e', color: '#d4af37', fontWeight: '900', borderRadius: '12px', cursor: 'pointer', border: '1px solid #d4af37', marginTop: '10px' }}>REGISTER FIRM</button>
              </div>
            </div>
          )}

          {/* USER MASTER */}
          {activeTab === "User Master" && (
            <div style={{ background: 'white', borderRadius: '20px', padding: '40px', boxShadow: '0 15px 40px rgba(0,0,0,0.04)', borderTop: '6px solid #d4af37' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                <input placeholder="Name" style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px' }} value={form.uName || ''} onChange={e => setForm({...form, uName: e.target.value})} />
                <input placeholder="Email" style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px' }} value={form.uEmail || ''} onChange={e => setForm({...form, uEmail: e.target.value})} />
                <input placeholder="Mobile" style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px' }} value={form.uMobile || ''} onChange={e => setForm({...form, uMobile: e.target.value})} />
                <select style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px' }} value={form.role || ''} onChange={e => setForm({...form, role: e.target.value})}>
                  <option value="">Role</option><option value="Admin">Admin</option><option value="Operator">Operator</option>
                </select>
                <input type="password" placeholder="Password" style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px' }} value={form.pass || ''} onChange={e => setForm({...form, pass: e.target.value})} />
                <input type="password" placeholder="Confirm" style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px' }} value={form.cPass || ''} onChange={e => setForm({...form, cPass: e.target.value})} />
                <button onClick={() => handleSave("users")} style={{ gridColumn: 'span 3', padding: '18px', background: '#0a0e2e', color: '#d4af37', fontWeight: '900', borderRadius: '12px', cursor: 'pointer' }}>ADD USER ACCESS</button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// LOGIN SCREEN FIX
function LoginScreen() {
  const [e, setE] = useState(""); const [p, setP] = useState("");
  const doLogin = (ev) => { ev.preventDefault(); signInWithEmailAndPassword(auth, e, p).catch(() => alert("Access Denied!")); };
  return (
    <div style={{ height: '100vh', width: '100vw', background: '#0a0e2e', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'fixed' }}>
      <div style={{ background: 'white', padding: '60px', borderRadius: '30px', textAlign: 'center', width: '420px', boxShadow: '0 30px 70px rgba(0,0,0,0.6)' }}>
        <ShieldCheck size={70} color="#d4af37" style={{ marginBottom: '25px' }} />
        <h2 style={{ color: '#0a0e2e', letterSpacing: '2px', fontWeight: '900' }}>BANKING PORTAL</h2>
        <p style={{ color: '#d4af37', fontSize: '11px', fontWeight: 'bold', marginBottom: '40px' }}>SECURE EXECUTIVE ACCESS</p>
        <form onSubmit={doLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <input type="email" placeholder="ADMIN EMAIL" style={{ padding: '18px', borderRadius: '15px', border: '1px solid #e2e8f0', background: '#f8fafc' }} required onChange={v => setE(v.target.value)} />
          <input type="password" placeholder="PASSWORD" style={{ padding: '18px', borderRadius: '15px', border: '1px solid #e2e8f0', background: '#f8fafc' }} required onChange={v => setP(v.target.value)} />
          <button type="submit" style={{ padding: '18px', background: '#0a0e2e', color: '#d4af37', fontWeight: '900', border: '1px solid #d4af37', borderRadius: '15px', cursor: 'pointer', fontSize: '16px' }}>LOGIN TO SYSTEM</button>
        </form>
        <p style={{ marginTop: '40px', fontSize: '12px', color: '#94a3b8' }}>Powered by Softview Technologies</p>
      </div>
    </div>
  );
}