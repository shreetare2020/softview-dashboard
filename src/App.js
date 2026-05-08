import React, { useState, useEffect } from 'react';
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, query, where, orderBy } from "firebase/firestore";
import { LayoutDashboard, Building2, Landmark, Users, LogOut, Settings, ChevronDown, ArrowUp, ArrowDown, Download, FileText, Calendar, Filter } from 'lucide-react';
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
  const [ledgerData, setLedgerData] = useState([]);
  const [filterType, setFilterType] = useState("Daily"); // Daily, Monthly, Period
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [time, setTime] = useState(new Date());
  const [form, setForm] = useState({});

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        onSnapshot(collection(db, "User Master"), (s) => {
          const list = s.docs.map(d => ({id: d.id, ...d.data()}));
          setUsersList(list);
          const match = list.find(emp => emp.uEmail === u.email);
          if (match) setUserRole(match.role);
        });
        onSnapshot(collection(db, "Firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
        onSnapshot(collection(db, "Bank Master"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
      }
    });
    return () => { clearInterval(timer); unsub(); };
  }, [user]);

  // Security Gate
  const canAction = (action) => {
    if (userRole === "Admin") return true;
    if (userRole === "Operator" && action === "add") return true;
    alert("Permission Denied!"); return false;
  };

  const handleSave = async (coll) => {
    if (!canAction("add")) return;
    await addDoc(collection(db, coll), { ...form, status: 'Active', createdAt: new Date() });
    setForm({}); alert("Data Saved!");
  };

  const dashboardData = banks.filter(b => {
    const firmMatch = selectedFirm === "All" || b.linkedFirm === selectedFirm;
    const hasBal = parseFloat(b.balance || 0) !== 0;
    return firmMatch && (b.status === 'Active' || hasBal);
  });

  if (!user) return <LoginScreen />;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw' }}>
      {/* --- SIDEBAR --- */}
      <aside className="executive-sidebar">
        <div style={{ padding: '30px 20px' }}>
          <h1 style={{ color: 'var(--gold)', fontSize: '22px', margin: 0 }}>BANKING PRO</h1>
          <p style={{ color: '#64748b', fontSize: '9px' }}>EXECUTIVE VERSION 2.0</p>
        </div>

        <nav style={{ flex: 1 }}>
          <div className={`nav-item ${activeTab === 'Dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('Dashboard')}><LayoutDashboard size={18}/> Dashboard</div>
          <div className={`nav-item ${activeTab === 'Firm Master' ? 'active' : ''}`} onClick={() => setActiveTab('Firm Master')}><Building2 size={18}/> Firm Master</div>
          <div className={`nav-item ${activeTab === 'Bank Master' ? 'active' : ''}`} onClick={() => setActiveTab('Bank Master')}><Landmark size={18}/> Bank Master</div>
          <div className={`nav-item ${activeTab === 'User Master' ? 'active' : ''}`} onClick={() => setActiveTab('User Master')}><Users size={18}/> User Master</div>
          <div className={`nav-item ${activeTab === 'Setting' ? 'active' : ''}`} onClick={() => setActiveTab('Setting')}><Settings size={18}/> Setting</div>
        </nav>

        <div style={{ padding: '20px', borderTop: '1px solid rgba(212,175,55,0.1)' }}>
          <p style={{ color: '#64748b', fontSize: '9px' }}>DEVELOPED BY</p>
          <p style={{ color: 'var(--gold)', fontSize: '11px', fontWeight: 'bold' }}>SOFTVIEW TECHNOLOGIES<br/>+91 7972084304</p>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main style={{ flex: 1, marginLeft: '260px', background: '#f8fafc' }}>
        <header className="luxury-header">
          <div style={{ fontWeight: '900', letterSpacing: '1px' }}>{activeTab.toUpperCase()}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{user.email} <span style={{color:'var(--gold)'}}>({userRole})</span></div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{time.toLocaleString()}</div>
            </div>
            <button className="btn-gold" style={{ background: '#ffefef', color: 'red', padding: '5px 12px' }} onClick={() => signOut(auth)}><LogOut size={16}/></button>
          </div>
        </header>

        <div style={{ padding: '30px' }}>
          
          {/* DASHBOARD TAB */}
          {activeTab === "Dashboard" && (
            <div>
              <div style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <label style={{fontWeight:'bold', color:'var(--dark-blue)'}}>Select Firm Here:</label>
                <select className="btn-gold" style={{background:'white', minWidth:'200px'}} onChange={(e) => setSelectedFirm(e.target.value)}>
                  <option value="All">All Firms</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>

              <table className="royal-table">
                <thead>
                  <tr><th>Bank Name</th><th>Bank A/c No.</th><th style={{textAlign:'right'}}>Closing Balance</th><th style={{textAlign:'center'}}>Action</th></tr>
                </thead>
                <tbody>
                  {dashboardData.map(b => (
                    <tr key={b.id}>
                      <td>{b.bankName}</td><td>{b.accNo}</td>
                      <td style={{textAlign:'right', fontWeight:'bold'}}>₹ {b.balance}</td>
                      <td style={{textAlign:'center'}}><ChevronDown style={{cursor:'pointer', color:'var(--gold)'}} onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* FIRM MASTER TAB */}
          {activeTab === "Firm Master" && (
            <div>
              <div className="ledger-box" style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px', background:'white', padding:'20px', borderRadius:'10px'}}>
                <input placeholder="Firm Name" className="btn-gold" style={{background:'white', textAlign:'left'}} onChange={e => setForm({...form, name: e.target.value})} />
                <input placeholder="GST No" className="btn-gold" style={{background:'white', textAlign:'left'}} onChange={e => setForm({...form, gst: e.target.value})} />
                <input placeholder="Office Address" className="btn-gold" style={{background:'white', textAlign:'left'}} onChange={e => setForm({...form, address: e.target.value})} />
                <button className="btn-gold" style={{gridColumn:'span 3'}} onClick={() => handleSave("Firms")}>SAVE FIRM MASTER</button>
              </div>
              <h3 style={{marginTop:'30px', color:'var(--dark-blue)'}}>Firm History</h3>
              <table className="royal-table">
                <thead><tr><th>Firm Name</th><th>GST</th><th>Address</th><th>Actions</th></tr></thead>
                <tbody>{firms.map(f => (<tr key={f.id}><td>{f.name}</td><td>{f.gst}</td><td>{f.address}</td><td><Edit3 size={16}/> <Trash2 size={16} color="red"/></td></tr>))}</tbody>
              </table>
            </div>
          )}

          {/* BANK MASTER TAB */}
          {activeTab === "Bank Master" && (
            <div>
              <div className="ledger-box" style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', background:'white', padding:'20px'}}>
                <input placeholder="Bank Name" className="btn-gold" style={{background:'white', textAlign:'left'}} onChange={e => setForm({...form, bankName: e.target.value})} />
                <input placeholder="A/c No" className="btn-gold" style={{background:'white', textAlign:'left'}} onChange={e => setForm({...form, accNo: e.target.value})} />
                <input placeholder="IFSC" className="btn-gold" style={{background:'white', textAlign:'left'}} onChange={e => setForm({...form, ifsc: e.target.value})} />
                <select className="btn-gold" style={{background:'white'}} onChange={e => setForm({...form, linkedFirm: e.target.value})}>
                  <option>Link Firm</option>{firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
                <button className="btn-gold" style={{gridColumn:'span 3'}} onClick={() => handleSave("Bank Master")}>SAVE BANK MASTER</button>
              </div>
              <table className="royal-table" style={{marginTop:'20px'}}>
                <thead><tr><th>Bank</th><th>A/c No</th><th>Firm</th><th>Actions</th></tr></thead>
                <tbody>{banks.map(b => (<tr key={b.id}><td>{b.bankName}</td><td>{b.accNo}</td><td>{b.linkedFirm}</td><td><Edit3 size={16}/></td></tr>))}</tbody>
              </table>
            </div>
          )}

          {/* USER MASTER TAB */}
          {activeTab === "User Master" && (
            <div>
              <div className="ledger-box" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', background:'white', padding:'20px'}}>
                <input placeholder="User Name" className="btn-gold" style={{background:'white', textAlign:'left'}} onChange={e => setForm({...form, uName: e.target.value})} />
                <input placeholder="Email" className="btn-gold" style={{background:'white', textAlign:'left'}} onChange={e => setForm({...form, uEmail: e.target.value})} />
                <select className="btn-gold" style={{background:'white'}} onChange={e => setForm({...form, role: e.target.value})}>
                  <option value="Viewer">Viewer</option><option value="Operator">Operator</option><option value="Admin">Admin</option>
                </select>
                <button className="btn-gold" onClick={() => handleSave("User Master")}>SAVE USER</button>
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
  const handleLogin = (ev) => { ev.preventDefault(); signInWithEmailAndPassword(auth, e, p).catch(() => alert("Login Failed")); };
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a192f' }}>
      <form onSubmit={handleLogin} style={{ background: 'white', padding: '40px', borderRadius: '15px', width: '380px', borderTop: '5px solid #d4af37' }}>
        <h2 style={{ textAlign: 'center', color: '#0a192f', margin: '0 0 10px 0' }}>BANKING PRO</h2>
        <p style={{ textAlign: 'center', fontSize: '10px', color: '#94a3b8', marginBottom: '30px' }}>EXECUTIVE VERSION 2.0</p>
        <input type="email" placeholder="Login ID" className="btn-gold" style={{ width: '100%', marginBottom: '15px', background: '#f8fafc', textAlign: 'left' }} onChange={v => setE(v.target.value)} />
        <input type="password" placeholder="Password" className="btn-gold" style={{ width: '100%', marginBottom: '25px', background: '#f8fafc', textAlign: 'left' }} onChange={v => setP(v.target.value)} />
        <button type="submit" className="btn-gold" style={{ width: '100%', padding: '15px' }}>LOG IN</button>
        <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '11px', color: '#94a3b8' }}>Developed by Softview Technologies<br/>7972084304</div>
      </form>
    </div>
  );
}