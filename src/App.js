import React, { useState, useEffect } from 'react';
import { auth, db } from "./firebase"; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { LayoutDashboard, Building2, Landmark, Users, LogOut, ShieldCheck, Clock, Calendar, ChevronDown, ArrowUp, ArrowDown, Settings, Edit3, Trash2, XCircle, FileText, Download } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [selectedFirm, setSelectedFirm] = useState("All");
  const [expandedBank, setExpandedBank] = useState(null);
  const [time, setTime] = useState(new Date());
  const [form, setForm] = useState({});

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

  if (!user) return <LoginScreen />;

  // Logic for Dashboard Visibility
  const filteredBanks = banks.filter(b => {
    const firmMatch = selectedFirm === "All" || b.linkedFirm === selectedFirm;
    const hasBalance = parseFloat(b.balance) !== 0;
    return firmMatch && hasBalance;
  });

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#f4f7f6', position: 'fixed', top: 0, left: 0, fontFamily: "'Poppins', sans-serif" }}>
      
      {/* SIDEBAR - ROYAL DARK BLUE */}
      <aside style={{ width: '300px', background: '#0a0e2e', color: 'white', display: 'flex', flexDirection: 'column', boxShadow: '5px 0 25px rgba(0,0,0,0.3)', zIndex: 10 }}>
        <div style={{ padding: '40px 25px', borderBottom: '1px solid rgba(212,175,55,0.2)' }}>
          <h1 style={{ color: '#d4af37', margin: 0, fontSize: '20px', letterSpacing: '1px', fontWeight: '800' }}>BANKING PRO</h1>
          <p style={{ fontSize: '10px', color: '#94a3b8', margin: '5px 0 0' }}>EXECUTIVE VERSION 2.0</p>
        </div>

        <nav style={{ flex: 1, paddingTop: '30px' }}>
          {[
            { id: 'Dashboard', icon: <LayoutDashboard size={20}/> },
            { id: 'Firm Master', icon: <Building2 size={20}/> },
            { id: 'Bank Master', icon: <Landmark size={20}/> },
            { id: 'User Master', icon: <Users size={20}/> },
            { id: 'Setting', icon: <Settings size={20}/> }
          ].map(item => (
            <div key={item.id} onClick={() => setActiveTab(item.id)} style={{
              padding: '18px 30px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer',
              background: activeTab === item.id ? 'linear-gradient(90deg, rgba(212,175,55,0.2), transparent)' : 'transparent',
              color: activeTab === item.id ? '#d4af37' : '#94a3b8',
              borderLeft: activeTab === item.id ? '4px solid #d4af37' : '4px solid transparent',
              transition: '0.3s'
            }}> {item.icon} <span style={{ fontWeight: activeTab === item.id ? 'bold' : '500' }}>{item.id}</span></div>
          ))}
        </nav>

        {/* BRANDING EXTREME LEFT BOTTOM */}
        <div style={{ padding: '30px 25px', background: '#070a1f' }}>
          <p style={{ fontSize: '10px', color: '#64748b', margin: 0, textTransform: 'uppercase' }}>Developed by</p>
          <p style={{ color: '#d4af37', fontWeight: 'bold', fontSize: '14px', margin: '2px 0' }}>SOFTVIEW TECHNOLOGIES</p>
          <p style={{ color: '#94a3b8', fontSize: '12px' }}>+91 7972084304</p>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* TOP HEADER - CLOCK & LOGOUT */}
        <header style={{ height: '85px', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#0a0e2e', fontWeight: 'bold', fontSize: '18px' }}>{activeTab}</div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0a0e2e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="#d4af37"/> {time.toLocaleTimeString()}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>{time.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            </div>
            <div style={{ width: '1px', height: '30px', background: '#ddd' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0a0e2e' }}>{user?.email?.split('@')[0].toUpperCase()}</span>
              <button onClick={() => signOut(auth)} style={{ padding: '8px 15px', background: '#fff1f1', color: '#ff4d4d', border: '1px solid #ff4d4d', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <LogOut size={14}/> LOGOUT
              </button>
            </div>
          </div>
        </header>

        <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
          
          {/* 1. DASHBOARD WITH FILTERS */}
          {activeTab === "Dashboard" && (
            <div style={{ animation: 'fadeIn 0.5s ease' }}>
              <div style={{ background: 'white', padding: '25px', borderRadius: '15px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
                <label style={{ fontWeight: 'bold', color: '#0a0e2e' }}>SELECT FIRM HERE:</label>
                <select onChange={(e) => setSelectedFirm(e.target.value)} style={{ padding: '10px 20px', borderRadius: '10px', border: '2px solid #f0f2f5', outline: 'none', minWidth: '200px' }}>
                  <option value="All">All Firms</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>

              <div style={{ background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 15px 50px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#0a0e2e', color: '#d4af37' }}>
                    <tr>
                      <th style={{ padding: '20px', textAlign: 'left' }}>BANK NAME</th>
                      <th style={{ padding: '20px', textAlign: 'left' }}>BANK A/C NO.</th>
                      <th style={{ padding: '20px', textAlign: 'right' }}>CLOSING BALANCE</th>
                      <th style={{ padding: '20px', textAlign: 'center' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBanks.map(b => (
                      <React.Fragment key={b.id}>
                        <tr style={{ borderBottom: '1px solid #eee', background: b.closeDate ? '#fff8f8' : 'white' }}>
                          <td style={{ padding: '20px', fontWeight: 'bold' }}>
                            {b.bankName} {b.closeDate && <span style={{fontSize: '10px', color: 'red', marginLeft: '10px'}}>(CLOSED)</span>}
                          </td>
                          <td style={{ padding: '20px' }}>{b.accNo}</td>
                          <td style={{ padding: '20px', textAlign: 'right', fontWeight: '900', color: '#0a0e2e' }}>₹ {b.balance} Cr/Dr</td>
                          <td style={{ padding: '20px', textAlign: 'center' }}>
                            <button onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d4af37' }}>
                              <ChevronDown size={24}/>
                            </button>
                          </td>
                        </tr>
                        {expandedBank === b.id && (
                          <tr>
                            <td colSpan="4" style={{ background: '#fcfdfd', padding: '30px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                  <button style={{ padding: '8px 15px', borderRadius: '5px', background: '#0a0e2e', color: '#d4af37', border: 'none' }}>Daily</button>
                                  <button style={{ padding: '8px 15px', borderRadius: '5px', background: '#f0f2f5', border: 'none' }}>Monthly</button>
                                  <button style={{ padding: '8px 15px', borderRadius: '5px', background: '#f0f2f5', border: 'none' }}>Period</button>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                  <button style={{ background: '#217346', color: 'white', padding: '8px 15px', border: 'none', borderRadius: '5px', display: 'flex', gap: '5px' }}><Download size={14}/> Excel</button>
                                  <button style={{ background: '#e11d48', color: 'white', padding: '8px 15px', border: 'none', borderRadius: '5px', display: 'flex', gap: '5px' }}><FileText size={14}/> PDF</button>
                                </div>
                              </div>
                              <table style={{ width: '100%', background: 'white', border: '1px solid #eee' }}>
                                <thead style={{ background: '#f8fafc' }}>
                                  <tr><th>Date</th><th>Particular</th><th>Receipt</th><th>Payment</th><th>Balance</th></tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td>08-May-26</td>
                                    <td>Office Rent</td>
                                    <td>-</td>
                                    <td style={{ color: 'red' }}>₹ 50,000 <ArrowUp size={12} inline/></td>
                                    <td>₹ 4,50,000</td>
                                  </tr>
                                  <tr>
                                    <td>08-May-26</td>
                                    <td>Service Fee</td>
                                    <td style={{ color: 'green' }}>₹ 1,20,000 <ArrowDown size={12} inline/></td>
                                    <td>-</td>
                                    <td>₹ 5,70,000</td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. FIRM MASTER */}
          {activeTab === "Firm Master" && (
             <div style={{ animation: 'fadeIn 0.5s ease' }}>
                <div style={{ background: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', borderTop: '5px solid #d4af37' }}>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                      <input placeholder="Firm Name" style={inputStyle} onChange={e => setForm({...form, name: e.target.value})} />
                      <input placeholder="GST No" style={inputStyle} onChange={e => setForm({...form, gst: e.target.value})} />
                      <input placeholder="Office Address" style={inputStyle} onChange={e => setForm({...form, address: e.target.value})} />
                   </div>
                   <button onClick={() => addDoc(collection(db, "firms"), form)} style={goldBtn}>SAVE FIRM MASTER</button>
                </div>
                
                <h3 style={{ margin: '40px 0 20px', color: '#0a0e2e' }}>Firm History</h3>
                <div style={{ background: 'white', borderRadius: '15px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc' }}>
                      <tr><th style={thStyle}>Firm Name</th><th style={thStyle}>GST</th><th style={thStyle}>Address</th><th style={thStyle}>Actions</th></tr>
                    </thead>
                    <tbody>
                      {firms.map(f => (
                        <tr key={f.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={tdStyle}>{f.name}</td>
                          <td style={tdStyle}>{f.gst}</td>
                          <td style={tdStyle}>{f.address}</td>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <Edit3 size={18} color="#d4af37" style={{ cursor: 'pointer' }} />
                              <Trash2 size={18} color="#ff4d4d" style={{ cursor: 'pointer' }} />
                              <XCircle size={18} color="#64748b" style={{ cursor: 'pointer' }} title="Close Firm" />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
          )}

          {/* 3. USER MASTER */}
          {activeTab === "User Master" && (
            <div style={{ animation: 'fadeIn 0.5s ease' }}>
              <div style={{ background: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', borderTop: '5px solid #d4af37' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <input placeholder="User Code" style={inputStyle} />
                  <input placeholder="User Name" style={inputStyle} />
                  <input placeholder="User Email" style={inputStyle} />
                  <input placeholder="Mobile" style={inputStyle} />
                  <select style={inputStyle}>
                    <option>Select Role</option>
                    <option>Admin</option>
                    <option>Operator</option>
                    <option>Viewer</option>
                  </select>
                </div>
                <button style={goldBtn}>SAVE USER MASTER</button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// PREMIUM LOGIN SCREEN
function LoginScreen() {
  const [e, setE] = useState(""); const [p, setP] = useState("");
  const login = (ev) => { ev.preventDefault(); signInWithEmailAndPassword(auth, e, p).catch(() => alert("Invalid Access!")); };
  
  return (
    <div style={{ height: '100vh', width: '100vw', background: '#0a0e2e', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ background: 'white', padding: '60px', borderRadius: '30px', textAlign: 'center', width: '450px', boxShadow: '0 25px 80px rgba(0,0,0,0.5)', border: '1px solid rgba(212,175,55,0.3)' }}>
        <div style={{ width: '80px', height: '80px', background: '#0a0e2e', borderRadius: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 30px', border: '2px solid #d4af37' }}>
          <ShieldCheck size={40} color="#d4af37" />
        </div>
        <h2 style={{ color: '#0a0e2e', margin: '0 0 10px', fontSize: '26px', fontWeight: '900' }}>BANKING PRO</h2>
        <p style={{ color: '#d4af37', fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '40px' }}>SECURE ACCESS PORTAL</p>
        
        <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <input type="email" placeholder="LOGIN ID" style={inputStyle} required onChange={v => setE(v.target.value)} />
          <input type="password" placeholder="PASSWORD" style={inputStyle} required onChange={v => setP(v.target.value)} />
          <button type="submit" style={{ padding: '18px', background: '#0a0e2e', color: '#d4af37', fontWeight: '900', border: '1px solid #d4af37', borderRadius: '15px', cursor: 'pointer', fontSize: '16px', marginTop: '10px' }}>LOG IN TO SYSTEM</button>
        </form>
        
        <div style={{ marginTop: '50px', borderTop: '1px solid #eee', paddingTop: '30px' }}>
          <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0 }}>Developed by</p>
          <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#0a0e2e', margin: '5px 0' }}>SOFTVIEW TECHNOLOGIES</p>
          <p style={{ fontSize: '12px', color: '#d4af37' }}>+91 7972084304</p>
        </div>
      </div>
    </div>
  );
}

// STYLES
const inputStyle = { padding: '15px', borderRadius: '12px', border: '2px solid #f0f2f5', outline: 'none', fontSize: '14px', background: '#fcfdfd' };
const goldBtn = { width: '100%', padding: '18px', background: '#0a0e2e', color: '#d4af37', fontWeight: '900', border: '1px solid #d4af37', borderRadius: '12px', cursor: 'pointer', marginTop: '20px' };
const thStyle = { padding: '15px', textAlign: 'left', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' };
const tdStyle = { padding: '15px', fontSize: '14px', color: '#0a0e2e', fontWeight: '500' };