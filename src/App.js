import React, { useState, useEffect } from 'react';
import { auth, db } from "./firebase"; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc } from "firebase/firestore";
import { Trash2, LayoutDashboard, Building2, Landmark, Users, LogOut, ChevronDown, UserPlus, ShieldCheck } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [banks, setBanks] = useState([]);
  const [firms, setFirms] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [form, setForm] = useState({});
  const [expandedBank, setExpandedBank] = useState(null);

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
      setForm({}); alert("Success!");
    } catch (e) { alert("Error!"); }
  };

  if (!user) return <LoginScreen />;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#f4f7f9', position: 'fixed' }}>
      {/* Sidebar - Fixed CSS Issues */}
      <aside style={{ width: '280px', background: '#0a0e2e', color: 'white', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '30px', textAlign: 'center', borderBottom: '1px solid #1a1e3e' }}>
          <h1 style={{ color: '#d4af37', margin: 0 }}>BANKING PRO</h1>
          <p style={{ fontSize: '10px', color: '#64748b' }}>EXECUTIVE SYSTEM</p>
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
        <div style={{ padding: '20px', textAlign: 'center', borderTop: '1px solid #1a1e3e', fontSize: '12px' }}>
          <p style={{ color: '#d4af37', fontWeight: 'bold' }}>SOFTVIEW TECHNOLOGIES</p>
          <span>+91 7972084304</span>
        </div>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ height: '70px', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px', borderBottom: '1px solid #ddd' }}>
          <h2 style={{ margin: 0 }}>{activeTab}</h2>
          <button onClick={() => signOut(auth)} style={{ padding: '8px 15px', background: '#ff4d4d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>LOGOUT</button>
        </header>

        <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
          {activeTab === "Firm Master" && (
            <div style={{ background: 'white', padding: '30px', borderRadius: '10px', borderTop: '5px solid #d4af37' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <input placeholder="Firm Name" style={{ padding: '12px' }} value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
                <input placeholder="GST No" style={{ padding: '12px' }} value={form.gst || ''} onChange={e => setForm({...form, gst: e.target.value})} />
                <input placeholder="Address" style={{ padding: '12px', gridColumn: 'span 2' }} value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} />
                <button onClick={() => handleSave("firms")} style={{ padding: '12px', background: '#0a0e2e', color: '#d4af37', fontWeight: 'bold', gridColumn: 'span 2' }}>SAVE FIRM</button>
              </div>
              <table style={{ width: '100%', marginTop: '30px', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8fafc' }}><tr><th style={{ padding: '12px', textAlign: 'left' }}>FIRM</th><th style={{ padding: '12px', textAlign: 'left' }}>GST</th><th style={{ padding: '12px', textAlign: 'left' }}>ADDRESS</th></tr></thead>
                <tbody>{firms.map(f => <tr key={f.id} style={{ borderBottom: '1px solid #eee' }}><td style={{ padding: '12px' }}>{f.name}</td><td style={{ padding: '12px' }}>{f.gst}</td><td style={{ padding: '12px' }}>{f.address}</td></tr>)}</tbody>
              </table>
            </div>
          )}

          {activeTab === "User Master" && (
            <div style={{ background: 'white', padding: '30px', borderRadius: '10px', borderTop: '5px solid #d4af37' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <input placeholder="Full Name" style={{ padding: '12px' }} value={form.uName || ''} onChange={e => setForm({...form, uName: e.target.value})} />
                <input placeholder="Email" style={{ padding: '12px' }} value={form.uEmail || ''} onChange={e => setForm({...form, uEmail: e.target.value})} />
                <input placeholder="Mobile" style={{ padding: '12px' }} value={form.uMobile || ''} onChange={e => setForm({...form, uMobile: e.target.value})} />
                <select style={{ padding: '12px' }} value={form.role || ''} onChange={e => setForm({...form, role: e.target.value})}><option value="">Role</option><option value="Admin">Admin</option></select>
                <input type="password" placeholder="Pass" style={{ padding: '12px' }} value={form.pass || ''} onChange={e => setForm({...form, pass: e.target.value})} />
                <input type="password" placeholder="Confirm" style={{ padding: '12px' }} value={form.cPass || ''} onChange={e => setForm({...form, cPass: e.target.value})} />
                <button onClick={() => handleSave("users")} style={{ padding: '12px', background: '#0a0e2e', color: '#d4af37', fontWeight: 'bold', gridColumn: 'span 3' }}>AUTHORIZE</button>
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
        <h2>BANKING LOGIN</h2>
        <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
          <input type="email" placeholder="EMAIL" style={{ padding: '15px' }} required onChange={v => setE(v.target.value)} />
          <input type="password" placeholder="PASSWORD" style={{ padding: '15px' }} required onChange={v => setP(v.target.value)} />
          <button type="submit" style={{ padding: '15px', background: '#0a0e2e', color: '#d4af37', fontWeight: 'bold', border: 'none', borderRadius: '8px' }}>LOGIN</button>
        </form>
      </div>
    </div>
  );
}