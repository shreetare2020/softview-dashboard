import React, { useState, useEffect } from 'react';
import { auth, db } from "./firebase"; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc } from "firebase/firestore";
import { LayoutDashboard, Building2, Landmark, Users, LogOut, ShieldCheck, Clock, Calendar, Phone } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [banks, setBanks] = useState([]);
  const [firms, setFirms] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [form, setForm] = useState({});
  const [time, setTime] = useState(new Date());

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
    try {
      await addDoc(collection(db, coll), { ...form, createdAt: new Date() });
      setForm({}); alert("Successfully Saved!");
    } catch (e) { alert("Error Saving Data!"); }
  };

  if (!user) return <LoginScreen />;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#f0f2f5', position: 'fixed', top: 0, left: 0, fontFamily: 'sans-serif' }}>
      
      {/* SIDEBAR - LUXURY NAVY BLUE */}
      <aside style={{ width: '280px', background: '#0a0e2e', color: 'white', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '40px 20px', textAlign: 'center', borderBottom: '1px solid #1a1e3e' }}>
          <h1 style={{ color: '#d4af37', margin: 0, fontSize: '22px', letterSpacing: '2px' }}>BANKING PRO</h1>
          <p style={{ fontSize: '10px', color: '#64748b', marginTop: '5px' }}>EXECUTIVE VERSION 2.0</p>
        </div>
        <nav style={{ flex: 1, paddingTop: '20px' }}>
          {[
            { id: 'Dashboard', icon: <LayoutDashboard size={20}/> },
            { id: 'Firm Master', icon: <Building2 size={20}/> },
            { id: 'Bank Master', icon: <Landmark size={20}/> },
            { id: 'User Master', icon: <Users size={20}/> }
          ].map(item => (
            <div key={item.id} onClick={() => setActiveTab(item.id)} style={{
              padding: '18px 30px', display: 'flex', gap: '15px', cursor: 'pointer',
              background: activeTab === item.id ? 'rgba(212,175,55,0.15)' : 'transparent',
              color: activeTab === item.id ? '#d4af37' : '#94a3b8',
              borderRight: activeTab === item.id ? '4px solid #d4af37' : 'none',
              fontWeight: activeTab === item.id ? 'bold' : 'normal'
            }}>{item.icon} {item.id}</div>
          ))}
        </nav>
        {/* BRANDING FIXED AT BOTTOM */}
        <div style={{ padding: '25px', textAlign: 'center', borderTop: '1px solid #1a1e3e', background: '#070a1f' }}>
          <p style={{ color: '#d4af37', fontWeight: 'bold', margin: 0, fontSize: '14px' }}>SOFTVIEW TECHNOLOGIES</p>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>+91 7972084304</span>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* HEADER WITH CLOCK & DATE */}
        <header style={{ height: '80px', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px', borderBottom: '1px solid #e1e4e8' }}>
          <h2 style={{ margin: 0, color: '#0a0e2e', textTransform: 'uppercase' }}>{activeTab}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
             <div style={{ textAlign: 'right', color: '#0a0e2e', fontWeight: 'bold' }}>
                <div style={{ fontSize: '16px' }}><Clock size={14} style={{ marginRight: '5px' }}/>{time.toLocaleTimeString()}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}><Calendar size={12}/> {time.toLocaleDateString()}</div>
             </div>
             <button onClick={() => signOut(auth)} style={{ padding: '10px 20px', background: '#ff4d4d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>LOGOUT</button>
          </div>
        </header>

        <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
          {/* DASHBOARD - NO BLANK ISSUE */}
          {activeTab === "Dashboard" && (
            <div style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', borderTop: '5px solid #d4af37' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr><th style={{ padding: '15px', textAlign: 'left' }}>BANK NAME</th><th style={{ padding: '15px', textAlign: 'left' }}>A/C NO</th><th style={{ padding: '15px', textAlign: 'right' }}>BALANCE</th></tr>
                </thead>
                <tbody>
                  {banks.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '15px' }}>{b.bankName}</td><td style={{ padding: '15px' }}>{b.accNo}</td>
                      <td style={{ padding: '15px', textAlign: 'right', fontWeight: '900' }}>₹ {b.balance} Cr.</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* FIRM MASTER - ADDRESS FULL WIDTH */}
          {activeTab === "Firm Master" && (
            <div style={{ background: 'white', padding: '35px', borderRadius: '15px', borderTop: '5px solid #d4af37' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <input placeholder="Firm Name" style={{ padding: '15px', borderRadius: '10px', border: '1px solid #ddd' }} onChange={e => setForm({...form, name: e.target.value})} />
                <input placeholder="GST Number" style={{ padding: '15px', borderRadius: '10px', border: '1px solid #ddd' }} onChange={e => setForm({...form, gst: e.target.value})} />
                <input placeholder="Office Address" style={{ padding: '15px', borderRadius: '10px', border: '1px solid #ddd', gridColumn: 'span 2' }} onChange={e => setForm({...form, address: e.target.value})} />
                <button onClick={() => handleSave("firms")} style={{ gridColumn: 'span 2', padding: '15px', background: '#0a0e2e', color: '#d4af37', fontWeight: 'bold', borderRadius: '10px' }}>SAVE FIRM</button>
              </div>
            </div>
          )}

          {/* USER MASTER - 6 FIELDS RESTORED */}
          {activeTab === "User Master" && (
            <div style={{ background: 'white', padding: '35px', borderRadius: '15px', borderTop: '5px solid #d4af37' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                <input placeholder="Full Name" style={{ padding: '12px', border: '1px solid #ddd' }} onChange={e => setForm({...form, uName: e.target.value})} />
                <input placeholder="Email" style={{ padding: '12px', border: '1px solid #ddd' }} onChange={e => setForm({...form, uEmail: e.target.value})} />
                <input placeholder="Mobile" style={{ padding: '12px', border: '1px solid #ddd' }} onChange={e => setForm({...form, uMobile: e.target.value})} />
                <select style={{ padding: '12px', border: '1px solid #ddd' }} onChange={e => setForm({...form, role: e.target.value})}><option value="">Role</option><option value="Admin">Admin</option></select>
                <input type="password" placeholder="Pass" style={{ padding: '12px', border: '1px solid #ddd' }} onChange={e => setForm({...form, pass: e.target.value})} />
                <input type="password" placeholder="Confirm" style={{ padding: '12px', border: '1px solid #ddd' }} onChange={e => setForm({...form, cPass: e.target.value})} />
                <button onClick={() => handleSave("users")} style={{ gridColumn: 'span 3', padding: '15px', background: '#0a0e2e', color: '#d4af37', fontWeight: 'bold' }}>AUTHORIZE</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function LoginScreen() {
  const [e, setE] = useState(""); const [p, setP] = useState("");
  const login = (ev) => { ev.preventDefault(); signInWithEmailAndPassword(auth, e, p).catch(() => alert("Login Failed")); };
  return (
    <div style={{ height: '100vh', width: '100vw', background: '#0a0e2e', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'fixed' }}>
      <div style={{ background: 'white', padding: '50px', borderRadius: '20px', textAlign: 'center', width: '380px' }}>
        <ShieldCheck size={60} color="#d4af37" style={{ marginBottom: '20px' }} />
        <h2 style={{ color: '#0a0e2e' }}>BANKING LOGIN</h2>
        <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '30px' }}>
          <input type="email" placeholder="EMAIL" style={{ padding: '15px' }} required onChange={v => setE(v.target.value)} />
          <input type="password" placeholder="PASSWORD" style={{ padding: '15px' }} required onChange={v => setP(v.target.value)} />
          <button type="submit" style={{ padding: '15px', background: '#0a0e2e', color: '#d4af37', fontWeight: 'bold' }}>LOGIN</button>
        </form>
      </div>
    </div>
  );
}