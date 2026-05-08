import React, { useState, useEffect } from 'react';
import { auth, db } from "./firebase"; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc } from "firebase/firestore";
import { LayoutDashboard, Building2, Landmark, Users, LogOut, ShieldCheck, Trash2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [banks, setBanks] = useState([]);
  const [firms, setFirms] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [form, setForm] = useState({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    if (user) {
      onSnapshot(collection(db, "firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "banks"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "users"), s => setUsersList(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
    return () => unsub();
  }, [user]);

  const handleSave = async (coll) => {
    try {
      await addDoc(collection(db, coll), { ...form, createdAt: new Date() });
      setForm({}); alert("Saved!");
    } catch (e) { alert("Error!"); }
  };

  if (!user) return <LoginScreen />;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#f4f7f9', position: 'fixed', top: 0, left: 0 }}>
      {/* SIDEBAR */}
      <aside style={{ width: '280px', background: '#0a0e2e', color: 'white', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '30px', textAlign: 'center', borderBottom: '1px solid #1a1e3e' }}>
          <h1 style={{ color: '#d4af37', margin: 0, fontSize: '24px' }}>BANKING PRO</h1>
          <p style={{ fontSize: '10px', color: '#64748b' }}>EXECUTIVE SYSTEM 2.0</p>
        </div>
        <nav style={{ flex: 1, paddingTop: '20px' }}>
          {[
            { id: 'Dashboard', icon: <LayoutDashboard size={18}/> },
            { id: 'Firm Master', icon: <Building2 size={18}/> },
            { id: 'Bank Master', icon: <Landmark size={18}/> },
            { id: 'User Master', icon: <Users size={18}/> }
          ].map(item => (
            <div key={item.id} onClick={() => setActiveTab(item.id)} style={{
              padding: '15px 30px', display: 'flex', gap: '15px', cursor: 'pointer',
              background: activeTab === item.id ? 'rgba(212,175,55,0.1)' : 'transparent',
              color: activeTab === item.id ? '#d4af37' : '#94a3b8',
              borderRight: activeTab === item.id ? '4px solid #d4af37' : 'none'
            }}>{item.icon} {item.id}</div>
          ))}
        </nav>
        <div style={{ padding: '20px', textAlign: 'center', borderTop: '1px solid #1a1e3e' }}>
          <p style={{ color: '#d4af37', fontWeight: 'bold', margin: 0 }}>SOFTVIEW TECHNOLOGIES</p>
          <span style={{ fontSize: '12px' }}>+91 7972084304</span>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ height: '70px', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px', borderBottom: '1px solid #ddd' }}>
          <h2 style={{ margin: 0, color: '#0a0e2e' }}>{activeTab}</h2>
          <button onClick={() => signOut(auth)} style={{ padding: '10px 20px', background: '#ff4d4d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>LOGOUT</button>
        </header>

        <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
          {/* DASHBOARD RESTORED */}
          {activeTab === "Dashboard" && (
            <div style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '2px solid #eee' }}>
                  <tr>
                    <th style={{ padding: '15px', textAlign: 'left' }}>BANK NAME</th>
                    <th style={{ padding: '15px', textAlign: 'left' }}>ACCOUNT NUMBER</th>
                    <th style={{ padding: '15px', textAlign: 'left' }}>CLOSING BALANCE</th>
                  </tr>
                </thead>
                <tbody>
                  {banks.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '15px' }}>{b.bankName}</td>
                      <td style={{ padding: '15px' }}>{b.accNo}</td>
                      <td style={{ padding: '15px', fontWeight: 'bold', color: '#0a0e2e' }}>₹ {b.balance} Cr.</td>
                    </tr>
                  ))}
                  {banks.length === 0 && <tr><td colSpan="3" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>No Bank Accounts Linked.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* FIRM MASTER WITH ADDRESS */}
          {activeTab === "Firm Master" && (
            <div style={{ background: 'white', padding: '30px', borderRadius: '15px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
                <input placeholder="Firm Name" style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }} onChange={e => setForm({...form, name: e.target.value})} />
                <input placeholder="GST No" style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '8px' }} onChange={e => setForm({...form, gst: e.target.value})} />
                <input placeholder="Full Office Address" style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '8px', gridColumn: 'span 2' }} onChange={e => setForm({...form, address: e.target.value})} />
                <button onClick={() => handleSave("firms")} style={{ padding: '12px', background: '#0a0e2e', color: '#d4af37', fontWeight: 'bold', gridColumn: 'span 2', borderRadius: '8px', cursor: 'pointer' }}>SAVE FIRM</button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#f8fafc' }}><th style={{ padding: '12px' }}>FIRM</th><th style={{ padding: '12px' }}>GST</th><th style={{ padding: '12px' }}>ADDRESS</th></tr></thead>
                <tbody>{firms.map(f => <tr key={f.id} style={{ borderBottom: '1px solid #eee' }}><td style={{ padding: '12px' }}>{f.name}</td><td style={{ padding: '12px' }}>{f.gst}</td><td style={{ padding: '12px' }}>{f.address}</td></tr>)}</tbody>
              </table>
            </div>
          )}

          {/* USER MASTER - FULL FIELDS */}
          {activeTab === "User Master" && (
            <div style={{ background: 'white', padding: '30px', borderRadius: '15px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <input placeholder="Full Name" style={{ padding: '12px', border: '1px solid #ddd' }} onChange={e => setForm({...form, uName: e.target.value})} />
                <input placeholder="Email" style={{ padding: '12px', border: '1px solid #ddd' }} onChange={e => setForm({...form, uEmail: e.target.value})} />
                <input placeholder="Mobile" style={{ padding: '12px', border: '1px solid #ddd' }} onChange={e => setForm({...form, uMobile: e.target.value})} />
                <select style={{ padding: '12px', border: '1px solid #ddd' }} onChange={e => setForm({...form, role: e.target.value})}><option value="">Role</option><option value="Admin">Admin</option></select>
                <input type="password" placeholder="Password" style={{ padding: '12px', border: '1px solid #ddd' }} onChange={e => setForm({...form, pass: e.target.value})} />
                <input type="password" placeholder="Confirm" style={{ padding: '12px', border: '1px solid #ddd' }} onChange={e => setForm({...form, cPass: e.target.value})} />
                <button onClick={() => handleSave("users")} style={{ padding: '12px', background: '#0a0e2e', color: '#d4af37', fontWeight: 'bold', gridColumn: 'span 3', borderRadius: '8px' }}>AUTHORIZE USER</button>
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
  const login = (ev) => { ev.preventDefault(); signInWithEmailAndPassword(auth, e, p).catch(() => alert("Failed")); };
  return (
    <div style={{ height: '100vh', width: '100vw', background: '#0a0e2e', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ background: 'white', padding: '50px', borderRadius: '15px', textAlign: 'center', width: '380px' }}>
        <ShieldCheck size={50} color="#d4af37" style={{ marginBottom: '20px' }} />
        <h2 style={{ color: '#0a0e2e' }}>BANKING LOGIN</h2>
        <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
          <input type="email" placeholder="EMAIL" style={{ padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }} required onChange={v => setE(v.target.value)} />
          <input type="password" placeholder="PASSWORD" style={{ padding: '15px', borderRadius: '8px', border: '1px solid #ddd' }} required onChange={v => setP(v.target.value)} />
          <button type="submit" style={{ padding: '15px', background: '#0a0e2e', color: '#d4af37', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>LOGIN</button>
        </form>
      </div>
    </div>
  );
}