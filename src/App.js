import React, { useState, useEffect } from 'react';
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, query, where } from "firebase/firestore";
import { LayoutDashboard, Building2, Landmark, Users, LogOut, Settings, ChevronDown, Edit3, Trash2, Download, UserCircle, ArrowUp, ArrowDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({}); // Role-based data
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [selectedFirm, setSelectedFirm] = useState("All");
  const [filterType, setFilterType] = useState("Daily");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);
  const [expandedBank, setExpandedBank] = useState(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        // Load All Masters
        onSnapshot(collection(db, "Firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
        onSnapshot(collection(db, "Bank Master"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
        onSnapshot(collection(db, "User Master"), s => {
          const allUsers = s.docs.map(d => ({id: d.id, ...d.data()}));
          setUsersList(allUsers);
          const current = allUsers.find(x => x.uEmail === u.email);
          setUserData(current || { uName: "Unknown", role: "Viewer" });
        });
      }
    });
    return () => { clearInterval(timer); unsub(); };
  }, []);

  const handleSave = async (coll) => {
    if (userData.role === 'Viewer') return alert("Access Denied: Viewer Role");
    try {
      if (editId) { await updateDoc(doc(db, coll, editId), { ...form }); setEditId(null); }
      else { await addDoc(collection(db, coll), { ...form, createdAt: new Date() }); }
      setForm({}); alert("Master Saved!");
    } catch (e) { alert(e.message); }
  };

  const handleExport = (b, type) => {
    const data = [{ Date: "09/05/2026", Opening: 100000, Particular: "Opening Balance", Receipt: 0, Payment: 0, Closing: 100000 }];
    if (type === 'excel') {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Ledger");
      XLSX.writeFile(wb, `${b.bankName}_Ledger.xlsx`);
    } else {
      const doc = new jsPDF();
      doc.text(`${b.bankName} Ledger`, 10, 10);
      doc.autoTable({ head: [['Date', 'Particular', 'Receipt', 'Payment', 'Balance']], body: data.map(d => [d.Date, d.Particular, d.Receipt, d.Payment, d.Closing]) });
      doc.save(`${b.bankName}.pdf`);
    }
  };

  if (!user) return <LoginScreen />;

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div style={{ padding: '20px 10px' }}>
          <h1 style={{ color: '#d4af37', fontSize: '20px', fontWeight: '900', margin: 0 }}>BANKING PRO</h1>
          <p style={{ color: '#64748b', fontSize: '10px' }}>(EXECUTIVE VERSION 2.0)</p>
        </div>
        <nav style={{ flex: 1, marginTop: '20px' }}>
          {['Dashboard', 'Firm Master', 'Bank Master', 'User Master', 'Setting'].map(id => (
            <div key={id} onClick={() => setActiveTab(id)} 
                 style={{ padding: '15px 10px', color: activeTab === id ? '#d4af37' : '#94a3b8', cursor: 'pointer', background: activeTab === id ? 'rgba(212,175,55,0.05)' : '' }}>
              {id}
            </div>
          ))}
        </nav>
        <div className="branding-footer">
          <p style={{ color: '#d4af37', fontSize: '9px', fontWeight: 'bold', margin: 0 }}>DEVELOPED BY</p>
          <p style={{ color: '#fff', fontSize: '13px', fontWeight: '800', margin: 0 }}>SOFTVIEW TECHNOLOGIES</p>
          <p style={{ color: '#64748b', fontSize: '11px' }}>+91 7972084304</p>
        </div>
      </aside>

      <main>
        {/* HEADER */}
        <header style={{ height: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ color: '#d4af37' }}>{activeTab}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold' }}>{userData.uName || "Loading..."}</div>
              <div style={{ fontSize: '11px', color: '#d4af37' }}>{time.toLocaleString()}</div>
            </div>
            <button onClick={() => signOut(auth)} style={{ background: '#ef4444', border: 'none', padding: '8px', borderRadius: '50%', color: '#fff', cursor: 'pointer' }}><LogOut size={16}/></button>
          </div>
        </header>

        <div style={{ padding: '30px' }}>
          {/* DASHBOARD WITH FILTERS */}
          {activeTab === "Dashboard" && (
            <>
              <div className="premium-card" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '10px', color: '#d4af37' }}>SELECT FIRM HERE</label>
                  <select className="luxury-input" value={selectedFirm} onChange={e => setSelectedFirm(e.target.value)}>
                    <option value="All">All Firms</option>
                    {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['Daily', 'Monthly', 'Period'].map(t => (
                    <button key={t} onClick={() => setFilterType(t)} style={{ background: filterType === t ? '#d4af37' : 'transparent', color: filterType === t ? '#000' : '#fff', border: '1px solid #d4af37', padding: '5px 15px', borderRadius: '5px' }}>{t}</button>
                  ))}
                </div>
                {filterType === 'Period' && (
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <input type="date" className="luxury-input" onChange={e => setDateRange({...dateRange, from: e.target.value})} />
                    <input type="date" className="luxury-input" onChange={e => setDateRange({...dateRange, to: e.target.value})} />
                  </div>
                )}
              </div>

              <div className="premium-card">
                <table className="royal-table">
                  <thead><tr><th>BANK NAME</th><th>A/C NO</th><th>CLOSING BALANCE</th><th>VIEW</th></tr></thead>
                  <tbody>{banks.filter(b => (selectedFirm === "All" || b.linkFirm === selectedFirm) && (b.balance !== 0)).map(b => (
                    <React.Fragment key={b.id}>
                      <tr onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)} style={{ cursor: 'pointer' }}>
                        <td>{b.bankName} {b.status === 'Closed' && <span className="closed-tag">CLOSED</span>}</td>
                        <td>{b.accNo}</td>
                        <td style={{ color: '#10b981', fontWeight: 'bold' }}>₹ {b.balance || '0'}</td>
                        <td><ChevronDown size={18} color="#d4af37"/></td>
                      </tr>
                      {expandedBank === b.id && (
                        <tr><td colSpan="4">
                          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                              <button onClick={() => handleExport(b, 'excel')} className="btn-royal" style={{ fontSize: '10px' }}><Download size={12}/> Excel</button>
                              <button onClick={() => handleExport(b, 'pdf')} className="btn-royal" style={{ fontSize: '10px', background: '#fff', color: '#000' }}><Download size={12}/> PDF</button>
                            </div>
                            <table className="royal-table">
                              <thead><tr><th>DATE</th><th>PARTICULAR</th><th>RECEIPT</th><th>PAYMENT</th><th>CLOSING</th></tr></thead>
                              <tbody>
                                <tr>
                                  <td>09/05/2026</td>
                                  <td>Sample Data</td>
                                  <td className="receipt"><ArrowDown size={12}/> 50,000</td>
                                  <td className="payment"><ArrowUp size={12}/> 20,000</td>
                                  <td>1,30,000</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </td></tr>
                      )}
                    </React.Fragment>
                  ))}</tbody>
                </table>
              </div>
            </>
          )}

          {/* FIRM MASTER */}
          {activeTab === "Firm Master" && (
            <>
              <div className="premium-card">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <input placeholder="Firm Name" className="luxury-input" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
                  <input placeholder="GST No" className="luxury-input" value={form.gst || ''} onChange={e => setForm({...form, gst: e.target.value})} />
                  <textarea placeholder="Office Address" className="luxury-input" style={{ gridColumn: 'span 2' }} value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} />
                </div>
                <button onClick={() => handleSave("Firms")} className="btn-royal">Save Firm</button>
              </div>
              <div className="premium-card">
                <table className="royal-table">
                  <thead><tr><th>FIRM NAME</th><th>GST</th><th>STATUS</th><th>ACTION</th></tr></thead>
                  <tbody>{firms.map(f => (
                    <tr key={f.id}>
                      <td>{f.name}</td><td>{f.gst}</td>
                      <td>{f.status === 'Closed' ? `Closed on ${f.closeDate}` : 'Active'}</td>
                      <td>
                        {userData.role !== 'Viewer' && <Edit3 size={16} color="#d4af37" onClick={()=> {setForm(f); setEditId(f.id);}}/>}
                        {userData.role === 'Admin' && <Trash2 size={16} color="#ef4444" style={{marginLeft:'10px'}} onClick={()=>deleteDoc(doc(db,"Firms",f.id))}/>}
                        <button style={{ marginLeft: '10px', fontSize: '10px' }} onClick={() => {const d = prompt("Enter Close Date"); updateDoc(doc(db, "Firms", f.id), {status: 'Closed', closeDate: d})}}>Close</button>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </>
          )}

          {/* BANK MASTER */}
          {activeTab === "Bank Master" && (
            <>
              <div className="premium-card">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                  <input placeholder="Bank Name" className="luxury-input" value={form.bankName || ''} onChange={e => setForm({...form, bankName: e.target.value})} />
                  <input placeholder="Branch" className="luxury-input" value={form.branch || ''} onChange={e => setForm({...form, branch: e.target.value})} />
                  <input placeholder="A/c No" className="luxury-input" value={form.accNo || ''} onChange={e => setForm({...form, accNo: e.target.value})} />
                  <input placeholder="IFSC" className="luxury-input" value={form.ifsc || ''} onChange={e => setForm({...form, ifsc: e.target.value})} />
                  <input placeholder="Opening Balance" className="luxury-input" value={form.balance || ''} onChange={e => setForm({...form, balance: e.target.value})} />
                  <select className="luxury-input" value={form.linkFirm || ''} onChange={e => setForm({...form, linkFirm: e.target.value})}>
                    <option>Select Firm</option>
                    {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                  </select>
                </div>
                <button onClick={() => handleSave("Bank Master")} className="btn-royal">Save Bank</button>
              </div>
              <div className="premium-card">
                <table className="royal-table">
                  <thead><tr><th>BANK</th><th>A/C NO</th><th>STATUS</th><th>ACTION</th></tr></thead>
                  <tbody>{banks.map(b => (
                    <tr key={b.id}>
                      <td>{b.bankName}</td><td>{b.accNo}</td><td>{b.status || 'Active'}</td>
                      <td>
                        <Edit3 size={16} onClick={()=> {setForm(b); setEditId(b.id);}}/>
                        <button style={{ marginLeft: '10px', fontSize: '10px' }} onClick={() => {const d = prompt("Enter Close Date"); updateDoc(doc(db, "Bank Master", b.id), {status: 'Closed', closeDate: d})}}>Close</button>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </>
          )}

          {/* USER MASTER */}
          {activeTab === "User Master" && (
            <>
              <div className="premium-card">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                  <input placeholder="User Code" className="luxury-input" value={form.code || ''} onChange={e => setForm({...form, code: e.target.value})} />
                  <input placeholder="User Name" className="luxury-input" value={form.uName || ''} onChange={e => setForm({...form, uName: e.target.value})} />
                  <input placeholder="Email" className="luxury-input" value={form.uEmail || ''} onChange={e => setForm({...form, uEmail: e.target.value})} />
                  <input placeholder="Mobile" className="luxury-input" value={form.mobile || ''} onChange={e => setForm({...form, mobile: e.target.value})} />
                  <select className="luxury-input" value={form.role || 'Viewer'} onChange={e => setForm({...form, role: e.target.value})}>
                    <option value="Admin">Admin</option>
                    <option value="Operator">Operator</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>
                <button onClick={() => handleSave("User Master")} className="btn-royal">Save User</button>
              </div>
              <div className="premium-card">
                <table className="royal-table">
                  <thead><tr><th>CODE</th><th>NAME</th><th>ROLE</th><th>ACTION</th></tr></thead>
                  <tbody>{usersList.map(u => (
                    <tr key={u.id}>
                      <td>{u.code}</td><td>{u.uName}</td><td>{u.role}</td>
                      <td><Edit3 size={16} onClick={()=> {setForm(u); setEditId(u.id);}}/></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </>
          )}

          {/* SETTING */}
          {activeTab === "Setting" && (
            <div className="premium-card" style={{ maxWidth: '400px', margin: '0 auto' }}>
              <h3>Change Password</h3>
              <input type="password" placeholder="New Password" className="luxury-input" onChange={e => setForm({pass: e.target.value})} />
              <button onClick={() => updatePassword(auth.currentUser, form.pass).then(() => alert("Updated!"))} className="btn-royal" style={{ width: '100%' }}>Update Password</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function LoginScreen() {
  const [e, setE] = useState(""); const [p, setP] = useState("");
  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617' }}>
      <div style={{ background: '#0f172a', padding: '50px', borderRadius: '20px', border: '1px solid #d4af37', textAlign: 'center', width: '400px' }}>
        <h1 style={{ color: '#d4af37' }}>LOGIN</h1>
        <input type="email" placeholder="Login ID" className="luxury-input" onChange={v => setE(v.target.value)} />
        <input type="password" placeholder="Password" className="luxury-input" onChange={v => setP(v.target.value)} />
        <button onClick={() => signInWithEmailAndPassword(auth, e, p)} className="btn-royal" style={{ width: '100%', marginTop: '20px' }}>Login</button>
        <div style={{ marginTop: '30px', borderTop: '1px solid rgba(212,175,55,0.2)', paddingTop: '20px' }}>
          <p style={{ color: '#d4af37', fontSize: '10px' }}>Developed By</p>
          <p style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', margin: 0 }}>Softview Technologies</p>
          <p style={{ color: '#64748b', fontSize: '12px' }}>7972084304</p>
        </div>
      </div>
    </div>
  );
}