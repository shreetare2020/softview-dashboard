import React, { useState, useEffect } from 'react';
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { LayoutDashboard, Building2, Landmark, Users, Clock, ChevronDown, Settings, Edit3, Trash2, XCircle } from 'lucide-react';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("Viewer"); // Default role
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [selectedFirm, setSelectedFirm] = useState("All");
  const [expandedBank, setExpandedBank] = useState(null);
  const [time, setTime] = useState(new Date());
  const [form, setForm] = useState({});

  // 1. Database se Data aur User Role uthane ka logic
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        // Aapka Admin Role check karne ke liye (User Master collection se)
        onSnapshot(collection(db, "User Master"), (snapshot) => {
          const userData = snapshot.docs.map(d => d.data());
          const loggedInUser = userData.find(emp => emp.uEmail === u.email);
          if (loggedInUser) setUserRole(loggedInUser.role);
        });

        // Baki data fetch karne ke liye
        onSnapshot(collection(db, "Firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
        onSnapshot(collection(db, "Bank Master"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
      }
    });
    return () => { clearInterval(timer); unsub(); };
  }, [user]);

  // 2. Action Handlers (With Admin Security)
  const handleSave = async (coll) => {
    if (userRole !== "Admin") return alert("Only Admin can perform this action!");
    try { 
      await addDoc(collection(db, coll), { ...form, status: 'Open' }); 
      setForm({}); 
      alert("Saved Successfully!"); 
    } catch (e) { alert("Error saving data!"); }
  };

  const handleEdit = async (coll, id, currentName) => {
    if (userRole !== "Admin") return alert("Only Admin can Edit!");
    const newVal = prompt("Edit Name:", currentName);
    if (newVal) await updateDoc(doc(db, coll, id), { name: newVal, bankName: newVal });
  };

  const handleDelete = async (coll, id) => {
    if (userRole !== "Admin") return alert("Only Admin can Delete!");
    if (window.confirm("Confirm Delete?")) await deleteDoc(doc(db, coll, id));
  };

  if (!user) return <LoginScreen />;

  // 3. Dashboard Filter Logic (Fixed)
  const dashboardData = banks.filter(b => {
    const firmMatch = selectedFirm === "All" || b.linkedFirm === selectedFirm;
    return firmMatch && (b.status === 'Open' || parseFloat(b.balance) !== 0);
  });

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      {/* SIDEBAR */}
      <aside className="executive-sidebar">
        <div className="sidebar-header">
          <h1 style={{ color: 'var(--gold)', margin: 0, fontSize: '18px' }}>BANKING PRO</h1>
          <p style={{ fontSize: '9px', color: '#94a3b8' }}>EXECUTIVE VERSION 2.0</p>
        </div>
        <nav style={{ flex: 1, paddingTop: '20px' }}>
          <div className={`nav-item ${activeTab === 'Dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('Dashboard')}><LayoutDashboard size={18}/> Dashboard</div>
          <div className={`nav-item ${activeTab === 'Firm Master' ? 'active' : ''}`} onClick={() => setActiveTab('Firm Master')}><Building2 size={18}/> Firm Master</div>
          <div className={`nav-item ${activeTab === 'Bank Master' ? 'active' : ''}`} onClick={() => setActiveTab('Bank Master')}><Landmark size={18}/> Bank Master</div>
          <div className={`nav-item ${activeTab === 'User Master' ? 'active' : ''}`} onClick={() => setActiveTab('User Master')}><Users size={18}/> User Master</div>
        </nav>
        <div className="sidebar-header" style={{ borderTop: '1px solid rgba(212,175,55,0.3)' }}>
          <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0 }}>Developed by</p>
          <p style={{ color: 'var(--gold)', fontWeight: 'bold', fontSize: '12px' }}>SOFTVIEW TECHNOLOGIES</p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="luxury-header">
          <div style={{ fontWeight: '900', color: 'var(--dark-blue)' }}>{activeTab.toUpperCase()} ({userRole})</div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right', fontSize: '12px' }}>{time.toLocaleTimeString()}</div>
            <button className="btn-gold" style={{ padding: '5px 15px' }} onClick={() => signOut(auth)}>Logout</button>
          </div>
        </header>

        <div style={{ padding: '30px' }}>
          {activeTab === "Dashboard" && (
            <div>
              <select className="btn-gold" style={{ background: 'white', marginBottom: '20px' }} onChange={(e) => setSelectedFirm(e.target.value)}>
                <option value="All">All Firms</option>
                {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
              <table className="royal-table">
                <thead><tr><th>Bank Name</th><th>A/c No</th><th>Balance</th><th>Ledger</th></tr></thead>
                <tbody>
                  {dashboardData.map(b => (
                    <tr key={b.id}>
                      <td>{b.bankName}</td><td>{b.accNo}</td><td>₹ {b.balance}</td>
                      <td><ChevronDown style={{cursor:'pointer'}} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "Firm Master" && (
            <div>
              <div className="ledger-box" style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', background:'white'}}>
                <input placeholder="Firm Name" className="btn-gold" style={{textAlign:'left'}} onChange={e => setForm({...form, name: e.target.value})} />
                <input placeholder="GST No" className="btn-gold" style={{textAlign:'left'}} onChange={e => setForm({...form, gst: e.target.value})} />
                <button className="btn-gold" style={{gridColumn:'span 3'}} onClick={() => handleSave("Firms")}>SAVE FIRM</button>
              </div>
              <table className="royal-table" style={{marginTop:'20px'}}>
                <thead><tr><th>Name</th><th>GST</th><th>Actions</th></tr></thead>
                <tbody>
                  {firms.map(f => (
                    <tr key={f.id}>
                      <td>{f.name}</td><td>{f.gst}</td>
                      <td>
                        <Edit3 size={16} onClick={() => handleEdit('Firms', f.id, f.name)} />
                        <Trash2 size={16} color="red" onClick={() => handleDelete('Firms', f.id)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* ... User Master UI ... */}
        </div>
      </main>
    </div>
  );
}

function LoginScreen() {
  // Same login UI...
  return <div>Login UI Content</div>;
}