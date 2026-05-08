import React, { useState, useEffect } from 'react';
import { auth, db } from "./firebase"; // Aapka existing firebase setup
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, query, where } from "firebase/firestore";
import { LayoutDashboard, Building2, Landmark, Users, LogOut, Settings, ChevronDown, ArrowUp, ArrowDown, Download, FileText } from 'lucide-react';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("Viewer");
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [selectedFirm, setSelectedFirm] = useState("All");
  const [expandedBank, setExpandedBank] = useState(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        // Role check from User Master
        onSnapshot(collection(db, "User Master"), (snap) => {
          const match = snap.docs.find(d => d.data().uEmail === u.email);
          if (match) setUserRole(match.data().role);
        });
        // Data Load
        onSnapshot(collection(db, "Firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
        onSnapshot(collection(db, "Bank Master"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
      }
    });
    return () => { clearInterval(timer); unsub(); };
  }, [user]);

  if (!user) return <LoginScreen />;

  const dashboardData = banks.filter(b => {
    const firmMatch = selectedFirm === "All" || b.linkedFirm === selectedFirm;
    const hasBalance = parseFloat(b.balance || 0) !== 0;
    return firmMatch && (b.status === 'Open' || hasBalance);
  });

  return (
    <div style={{ display: 'flex' }}>
      {/* LEFT SIDEBAR WITH BRANDING */}
      <aside className="executive-sidebar">
        <div style={{ padding: '30px 20px' }}>
          <h1 style={{ color: 'var(--gold)', fontSize: '22px', margin: 0 }}>BANKING PRO</h1>
          <p style={{ color: '#64748b', fontSize: '10px' }}>EXECUTIVE VERSION 2.0</p>
        </div>

        <nav style={{ flex: 1 }}>
          <div className={`nav-item ${activeTab === 'Dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('Dashboard')}><LayoutDashboard size={20}/> Dashboard</div>
          {userRole !== 'Viewer' && (
            <>
              <div className={`nav-item ${activeTab === 'Firm Master' ? 'active' : ''}`} onClick={() => setActiveTab('Firm Master')}><Building2 size={20}/> Firm Master</div>
              <div className={`nav-item ${activeTab === 'Bank Master' ? 'active' : ''}`} onClick={() => setActiveTab('Bank Master')}><Landmark size={20}/> Bank Master</div>
            </>
          )}
          {userRole === 'Admin' && <div className={`nav-item ${activeTab === 'User Master' ? 'active' : ''}`} onClick={() => setActiveTab('User Master')}><Users size={20}/> User Master</div>}
          <div className={`nav-item ${activeTab === 'Setting' ? 'active' : ''}`} onClick={() => setActiveTab('Setting')}><Settings size={20}/> Setting</div>
        </nav>

        <div style={{ padding: '20px', borderTop: '1px solid rgba(212,175,55,0.2)' }}>
          <p style={{ color: '#64748b', fontSize: '9px', marginBottom: '5px' }}>DEVELOPED BY</p>
          <p style={{ color: 'var(--gold)', fontSize: '12px', fontWeight: 'bold' }}>SOFTVIEW TECHNOLOGIES<br/>+91 7972084304</p>
        </div>
      </aside>

      {/* MAIN PANEL */}
      <main style={{ marginLeft: '260px', width: 'calc(100% - 260px)', minHeight: '100vh' }}>
        <header className="luxury-header">
          <div style={{ fontWeight: 'bold', letterSpacing: '1px' }}>{activeTab.toUpperCase()}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{user.email.split('@')[0]} ({userRole})</div>
              <div style={{ fontSize: '11px', color: 'var(--gold)' }}>{time.toLocaleDateString()} | {time.toLocaleTimeString()}</div>
            </div>
            <button onClick={() => signOut(auth)} className="btn-gold" style={{ padding: '8px 15px', background: '#ffefef', color: 'red' }}><LogOut size={16}/></button>
          </div>
        </header>

        <div style={{ padding: '40px' }}>
          {activeTab === "Dashboard" && (
            <div>
              <div style={{ marginBottom: '30px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                <label style={{ fontWeight: 'bold', color: 'var(--dark-blue)' }}>Select Firm:</label>
                <select className="btn-gold" style={{ background: 'white' }} onChange={(e) => setSelectedFirm(e.target.value)}>
                  <option value="All">All Firms</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>

              <table className="royal-table">
                <thead>
                  <tr><th>Bank Name</th><th>A/c No.</th><th style={{textAlign:'right'}}>Closing Balance</th><th style={{textAlign:'center'}}>Ledger View</th></tr>
                </thead>
                <tbody>
                  {dashboardData.map(b => (
                    <tr key={b.id} style={{ background: b.status === 'Closed' ? '#f8fafc' : 'white' }}>
                      <td style={{ fontWeight: '600' }}>{b.bankName} {b.status === 'Closed' && <span className="status-closed">(CLOSED)</span>}</td>
                      <td>{b.accNo}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>₹ {b.balance} {b.type}</td>
                      <td style={{ textAlign: 'center' }}>
                        <ChevronDown style={{ cursor: 'pointer', color: 'var(--gold)' }} onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}/>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* ... Other Masters (Firm, Bank, User) will follow similar luxury design ... */}
        </div>
      </main>
    </div>
  );
}

function LoginScreen() {
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--dark-blue)' }}>
      <div style={{ background: 'white', padding: '50px', borderRadius: '15px', width: '400px', borderTop: '5px solid var(--gold)' }}>
        <h2 style={{ textAlign: 'center', color: 'var(--dark-blue)', marginBottom: '30px' }}>BANKING PRO</h2>
        <input type="text" placeholder="Login ID" className="btn-gold" style={{ width: '100%', marginBottom: '15px', background: '#f8fafc', textAlign: 'left' }} />
        <input type="password" placeholder="Password" className="btn-gold" style={{ width: '100%', marginBottom: '25px', background: '#f8fafc', textAlign: 'left' }} />
        <button className="btn-gold" style={{ width: '100%', padding: '15px' }}>LOG IN</button>
        <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '11px', color: '#94a3b8' }}>
          Developed by Softview Technologies<br/>7972084304
        </div>
      </div>
    </div>
  );
}