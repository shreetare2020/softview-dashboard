import React, { useState, useEffect } from 'react';
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { LayoutDashboard, Building2, Landmark, Users, LogOut, Settings, X, FileText, ArrowDownCircle, Clock } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const theme = {
  bg: '#020617', card: '#0f172a', gold: '#d4af37', border: 'rgba(212, 175, 55, 0.3)', text: '#ffffff'
};

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [banks, setBanks] = useState([]);
  const [firms, setFirms] = useState([]);
  const [viewLedger, setViewLedger] = useState(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        onSnapshot(collection(db, "Bank Master"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
        onSnapshot(collection(db, "Firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
      }
    });
    return () => { clearInterval(timer); unsub(); };
  }, []);

  if (!user) return <LoginScreen />;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: theme.bg, color: theme.text, overflow: 'hidden' }}>
      
      {/* SIDEBAR - Masters Yahan Hain */}
      <aside style={{ width: '280px', borderRight: `1px solid ${theme.border}`, background: '#010409', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '40px 30px' }}>
          <h1 style={{ color: theme.gold, fontSize: '22px', fontWeight: '900' }}>BANKING PRO</h1>
        </div>

        <nav style={{ flex: 1 }}>
          {[
            { id: 'Dashboard', icon: <LayoutDashboard size={20}/> },
            { id: 'Firm Master', icon: <Building2 size={20}/> },
            { id: 'Bank Master', icon: <Landmark size={20}/> },
            { id: 'User Master', icon: <Users size={20}/> },
            { id: 'Setting', icon: <Settings size={20}/> }
          ].map(item => (
            <div key={item.id} onClick={() => setActiveTab(item.id)} 
                 style={{ 
                   display: 'flex', alignItems: 'center', padding: '18px 30px', cursor: 'pointer',
                   color: activeTab === item.id ? theme.gold : '#94a3b8',
                   background: activeTab === item.id ? 'rgba(212,175,55,0.05)' : '',
                   borderLeft: activeTab === item.id ? `4px solid ${theme.gold}` : '4px solid transparent'
                 }}>
              {item.icon} <span style={{ marginLeft: '15px' }}>{item.id}</span>
            </div>
          ))}
        </nav>

        <div style={{ padding: '30px', borderTop: `1px solid ${theme.border}` }}>
          <p style={{ color: theme.gold, fontSize: '12px', fontWeight: 'bold' }}>SOFTVIEW TECHNOLOGIES</p>
        </div>
      </aside>

      {/* MAIN AREA */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ height: '90px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px', borderBottom: `1px solid ${theme.border}` }}>
          <h2 style={{ color: theme.gold }}>{activeTab.toUpperCase()}</h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold', color: theme.gold }}>{user.email.split('@')[0]}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}><Clock size={12}/> {time.toLocaleTimeString()}</div>
            </div>
            {/* LOGOUT BUTTON - Wapas aa gaya */}
            <button onClick={() => signOut(auth)} style={{ background: '#ef4444', border: 'none', padding: '10px', borderRadius: '10px', color: '#fff', cursor: 'pointer' }}>
              <LogOut size={20}/>
            </button>
          </div>
        </header>

        <div style={{ padding: '40px' }}>
          {activeTab === "Dashboard" ? (
            <div style={{ background: theme.card, borderRadius: '15px', border: `1px solid ${theme.border}`, padding: '30px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ color: theme.gold, borderBottom: `2px solid ${theme.gold}` }}>
                  <tr>
                    <th style={{ padding: '15px', textAlign: 'left' }}>BANK IDENTITY</th>
                    <th style={{ padding: '15px' }}>ACCOUNT NO.</th>
                    <th style={{ padding: '15px' }}>BALANCE</th>
                    <th style={{ padding: '15px' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {banks.map(b => (
                    <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '15px' }}>{b.bankName}</td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>{b.accNo}</td>
                      <td style={{ padding: '15px', color: '#10b981', fontWeight: 'bold', textAlign: 'center' }}>₹ {b.balance}</td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <button onClick={() => setViewLedger(b)} style={{ background: theme.gold, border: 'none', padding: '8px 15px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>LEDGER</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ background: theme.card, padding: '40px', borderRadius: '15px', border: `1px solid ${theme.border}`, textAlign: 'center' }}>
              <h3 style={{ color: theme.gold }}>{activeTab} Content Area</h3>
              <p style={{ color: '#94a3b8' }}>Form integration for {activeTab} is active.</p>
            </div>
          )}
        </div>
      </main>

      {/* LEDGER OVERLAY */}
      {viewLedger && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: theme.bg, zIndex: 2000, padding: '50px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `2px solid ${theme.gold}`, paddingBottom: '20px' }}>
            <h1 style={{ color: theme.gold }}>{viewLedger.bankName} LEDGER</h1>
            <button onClick={() => setViewLedger(null)} style={{ background: '#334155', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>CLOSE</button>
          </div>
          <table style={{ width: '100%', marginTop: '30px', borderCollapse: 'collapse' }}>
            <thead style={{ background: theme.gold, color: '#000' }}>
              <tr>
                <th style={{ padding: '12px' }}>DATE</th>
                <th style={{ padding: '12px' }}>PARTICULARS</th>
                <th style={{ padding: '12px' }}>RECEIPT</th>
                <th style={{ padding: '12px' }}>PAYMENT</th>
                <th style={{ padding: '12px' }}>BALANCE</th>
              </tr>
            </thead>
            <tbody style={{ textAlign: 'center' }}>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '15px' }}>09/05/2026</td>
                <td style={{ padding: '15px', textAlign: 'left' }}>Balance Transfer</td>
                <td style={{ color: '#10b981' }}>50,000</td>
                <td style={{ color: '#ef4444' }}>-</td>
                <td style={{ fontWeight: 'bold' }}>{viewLedger.balance}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LoginScreen() {
  const [e, setE] = useState(""); const [p, setP] = useState("");
  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617' }}>
      <div style={{ background: '#0f172a', padding: '50px', borderRadius: '20px', border: '1px solid #d4af37', width: '400px', textAlign: 'center' }}>
        <h1 style={{ color: '#d4af37' }}>EXECUTIVE LOGIN</h1>
        <input type="email" placeholder="Email" onChange={v => setE(v.target.value)} style={{ width: '100%', padding: '12px', margin: '10px 0', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid #d4af37', borderRadius: '8px' }} />
        <input type="password" placeholder="Password" onChange={v => setP(v.target.value)} style={{ width: '100%', padding: '12px', margin: '10px 0', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid #d4af37', borderRadius: '8px' }} />
        <button onClick={() => signInWithEmailAndPassword(auth, e, p)} style={{ width: '100%', background: '#d4af37', color: '#000', padding: '12px', borderRadius: '8px', fontWeight: 'bold', marginTop: '20px', cursor: 'pointer' }}>ENTER</button>
      </div>
    </div>
  );
}