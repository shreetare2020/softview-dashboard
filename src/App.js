import React, { useState, useEffect } from 'react';
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { LayoutDashboard, Building2, Landmark, Users, LogOut, ShieldCheck, Clock, Calendar, ChevronDown, ArrowUp, ArrowDown, Settings, Edit3, Trash2, XCircle, FileText, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './App.css';

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
  const [newPass, setNewPass] = useState("");

  // Role Permissions
  const userRole = usersList.find(u => u.uEmail === user?.email)?.role || 'Viewer';

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
    if (userRole === 'Viewer') return alert("Access Denied!");
    try {
      await addDoc(collection(db, coll), { ...form, createdAt: new Date(), status: 'Open' });
      setForm({}); alert("Data Saved Successfully!");
    } catch (e) { alert("Error Saving Data!"); }
  };

  const handleEdit = async (coll, id, data) => {
    if (userRole !== 'Admin') return alert("Only Admin can Edit!");
    const newVal = prompt("Enter New Name/Value:", data);
    if (newVal) await updateDoc(doc(db, coll, id), { name: newVal });
  };

  const handleDelete = async (coll, id) => {
    if (userRole !== 'Admin') return alert("Only Admin can Delete!");
    if (window.confirm("Are you sure?")) await deleteDoc(doc(db, coll, id));
  };

  const handleClose = async (coll, id) => {
    if (userRole !== 'Admin') return alert("Only Admin can Close!");
    const cDate = prompt("Enter Closing Date (DD/MM/YYYY):");
    if (cDate) await updateDoc(doc(db, coll, id), { closeDate: cDate, status: 'Closed' });
  };

  // EXPORT LOGIC
  const exportExcel = (data, name) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${name}.xlsx`);
  };

  const exportPDF = (data, title) => {
    const doc = new jsPDF();
    doc.text(title, 20, 10);
    doc.autoTable({ body: data });
    doc.save(`${title}.pdf`);
  };

  if (!user) return <LoginScreen />;

  const filteredBanks = banks.filter(b => {
    const matchFirm = selectedFirm === "All" || b.linkedFirm === selectedFirm;
    const isVisible = b.status === 'Open' || (b.status === 'Closed' && parseFloat(b.balance) !== 0);
    return matchFirm && isVisible;
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
          <div className={`nav-item ${activeTab === 'Setting' ? 'active' : ''}`} onClick={() => setActiveTab('Setting')}><Settings size={18}/> Setting</div>
        </nav>

        <div className="sidebar-header" style={{ borderTop: '1px solid rgba(212,175,55,0.3)', borderBottom: 'none' }}>
          <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0 }}>Developed by</p>
          <p style={{ color: 'var(--gold)', fontWeight: 'bold', fontSize: '12px' }}>SOFTVIEW TECHNOLOGIES<br/>+91 7972084304</p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="luxury-header">
          <div style={{ fontWeight: '900', color: 'var(--dark-blue)' }}>{activeTab.toUpperCase()}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--dark-blue)' }}><Clock size={14} color="var(--gold)"/> {time.toLocaleTimeString()}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}><Calendar size={12}/> {time.toLocaleDateString()}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{user.email.split('@')[0]}</span>
              <button className="btn-gold" style={{ padding: '5px 10px', background: '#ffefef', color: 'red', border: '1px solid red' }} onClick={() => signOut(auth)}>Logout</button>
            </div>
          </div>
        </header>

        <div style={{ padding: '30px', overflowY: 'auto' }}>
          
          {/* DASHBOARD SECTION */}
          {activeTab === "Dashboard" && (
            <div>
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <label style={{ fontWeight: 'bold' }}>Select Firm:</label>
                <select className="btn-gold" style={{ background: 'white' }} onChange={(e) => setSelectedFirm(e.target.value)}>
                  <option value="All">All Firm</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>

              <table className="royal-table">
                <thead>
                  <tr><th>Bank Name</th><th>A/c No.</th><th>Closing Balance</th><th>Ledger</th></tr>
                </thead>
                <tbody>
                  {filteredBanks.map(b => (
                    <React.Fragment key={b.id}>
                      <tr style={{ background: b.status === 'Closed' ? '#fff5f5' : 'white' }}>
                        <td>{b.bankName} {b.status === 'Closed' && <span className="status-closed">(CLOSED - {b.closeDate})</span>}</td>
                        <td>{b.accNo}</td>
                        <td style={{ fontWeight: '900' }}>₹ {b.balance} Cr/Dr</td>
                        <td><ChevronDown style={{ cursor: 'pointer' }} onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}/></td>
                      </tr>
                      {expandedBank === b.id && (
                        <tr>
                          <td colSpan="4">
                            <div className="ledger-box">
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                  <button className="btn-gold" style={{ fontSize: '10px' }}>Daily</button>
                                  <button className="btn-gold" style={{ fontSize: '10px' }}>Monthly</button>
                                  <button className="btn-gold" style={{ fontSize: '10px' }}>Period</button>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                  <button onClick={() => exportExcel([{Date: '01/01', Particular: 'Test', Amt: '100'}], 'Ledger')} style={{ background: 'green', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px' }}>Excel</button>
                                  <button onClick={() => exportPDF([['01/01', 'Test', '100']], 'Account Ledger')} style={{ background: 'red', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px' }}>PDF</button>
                                </div>
                              </div>
                              <table style={{ width: '100%', fontSize: '12px' }}>
                                <thead>
                                  <tr><th>Date</th><th>Particular</th><th>Receipt</th><th>Payment</th><th>Balance</th></tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td>08/05/2026</td><td>Cash Deposit</td>
                                    <td style={{ color: 'var(--receipt-green)' }}>5000 <ArrowDown size={10}/></td>
                                    <td>-</td><td>5000</td>
                                  </tr>
                                  <tr>
                                    <td>08/05/2026</td><td>Vendor Pay</td><td>-</td>
                                    <td style={{ color: 'var(--payment-red)' }}>2000 <ArrowUp size={10}/></td>
                                    <td>3000</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* FIRM MASTER */}
          {activeTab === "Firm Master" && (
            <div>
              <div className="ledger-box" style={{ background: 'white' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                  <input placeholder="Firm Name" className="btn-gold" style={{ background: 'white', textAlign: 'left' }} onChange={e => setForm({...form, name: e.target.value})} />
                  <input placeholder="GST No" className="btn-gold" style={{ background: 'white', textAlign: 'left' }} onChange={e => setForm({...form, gst: e.target.value})} />
                  <input placeholder="Office Address" className="btn-gold" style={{ background: 'white', textAlign: 'left' }} onChange={e => setForm({...form, address: e.target.value})} />
                </div>
                <button className="btn-gold" style={{ width: '100%', marginTop: '15px' }} onClick={() => handleSave("firms")}>SAVE FIRM MASTER</button>
              </div>

              <h3 style={{ fontSize: '14px', marginTop: '20px' }}>Firm History</h3>
              <table className="royal-table">
                <thead><tr><th>Name</th><th>GST</th><th>Address</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {firms.map(f => (
                    <tr key={f.id} style={{ background: f.status === 'Closed' ? '#fff5f5' : 'white' }}>
                      <td>{f.name}</td><td>{f.gst}</td><td>{f.address}</td>
                      <td>{f.status}</td>
                      <td>
                        <Edit3 size={16} onClick={() => handleEdit('firms', f.id, f.name)} style={{ cursor: 'pointer', marginRight: '10px' }}/>
                        <XCircle size={16} color="orange" onClick={() => handleClose('firms', f.id)} style={{ cursor: 'pointer', marginRight: '10px' }}/>
                        <Trash2 size={16} color="red" onClick={() => handleDelete('firms', f.id)} style={{ cursor: 'pointer' }}/>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* BANK MASTER */}
          {activeTab === "Bank Master" && (
            <div>
               <div className="ledger-box" style={{ background: 'white' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                  <input placeholder="Bank Name" className="btn-gold" style={{ background: 'white', textAlign: 'left' }} onChange={e => setForm({...form, bankName: e.target.value})} />
                  <input placeholder="Branch" className="btn-gold" style={{ background: 'white', textAlign: 'left' }} onChange={e => setForm({...form, branch: e.target.value})} />
                  <input placeholder="A/c No" className="btn-gold" style={{ background: 'white', textAlign: 'left' }} onChange={e => setForm({...form, accNo: e.target.value})} />
                  <input placeholder="IFSC" className="btn-gold" style={{ background: 'white', textAlign: 'left' }} onChange={e => setForm({...form, ifsc: e.target.value})} />
                  <input placeholder="Opening Bal" className="btn-gold" style={{ background: 'white', textAlign: 'left' }} onChange={e => setForm({...form, balance: e.target.value})} />
                  <select className="btn-gold" style={{ background: 'white' }} onChange={e => setForm({...form, type: e.target.value})}><option>Dr/Cr</option><option>Dr</option><option>Cr</option></select>
                  <select className="btn-gold" style={{ background: 'white' }} onChange={e => setForm({...form, linkedFirm: e.target.value})}>
                    <option>Link to Firm</option>
                    {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                  </select>
                </div>
                <button className="btn-gold" style={{ width: '100%', marginTop: '15px' }} onClick={() => handleSave("banks")}>SAVE BANK MASTER</button>
              </div>
              <h3 style={{ fontSize: '14px', marginTop: '20px' }}>Bank History</h3>
              <table className="royal-table">
                <thead><tr><th>Bank</th><th>A/c No</th><th>IFSC</th><th>Firm</th><th>Bal</th><th>Actions</th></tr></thead>
                <tbody>
                  {banks.map(b => (
                    <tr key={b.id} style={{ background: b.status === 'Closed' ? '#fff5f5' : 'white' }}>
                      <td>{b.bankName}</td><td>{b.accNo}</td><td>{b.ifsc}</td><td>{b.linkedFirm}</td>
                      <td>{b.balance} {b.type}</td>
                      <td>
                        <Edit3 size={16} onClick={() => {}} style={{ cursor: 'pointer', marginRight: '10px' }}/>
                        <XCircle size={16} color="orange" onClick={() => handleClose('banks', b.id)} style={{ cursor: 'pointer', marginRight: '10px' }}/>
                        <Trash2 size={16} color="red" onClick={() => handleDelete('banks', b.id)} style={{ cursor: 'pointer' }}/>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* USER MASTER */}
          {activeTab === "User Master" && (
            <div>
              <div className="ledger-box" style={{ background: 'white' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                  <input placeholder="Code" className="btn-gold" style={{ background: 'white', textAlign: 'left' }} onChange={e => setForm({...form, code: e.target.value})} />
                  <input placeholder="Name" className="btn-gold" style={{ background: 'white', textAlign: 'left' }} onChange={e => setForm({...form, uName: e.target.value})} />
                  <input placeholder="Email" className="btn-gold" style={{ background: 'white', textAlign: 'left' }} onChange={e => setForm({...form, uEmail: e.target.value})} />
                  <input placeholder="Mobile" className="btn-gold" style={{ background: 'white', textAlign: 'left' }} onChange={e => setForm({...form, uMobile: e.target.value})} />
                  <select className="btn-gold" style={{ background: 'white' }} onChange={e => setForm({...form, role: e.target.value})}>
                    <option>Role</option><option>Admin</option><option>Operator</option><option>Viewer</option>
                  </select>
                </div>
                <button className="btn-gold" style={{ width: '100%', marginTop: '15px' }} onClick={() => handleSave("users")}>SAVE USER MASTER</button>
              </div>
              <table className="royal-table" style={{marginTop: '20px'}}>
                <thead><tr><th>Code</th><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
                <tbody>
                  {usersList.map(u => (
                    <tr key={u.id}><td>{u.code}</td><td>{u.uName}</td><td>{u.uEmail}</td><td>{u.role}</td>
                    <td><Trash2 size={16} color="red" onClick={() => handleDelete('users', u.id)}/></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* SETTING SECTION */}
          {activeTab === "Setting" && (
            <div style={{ maxWidth: '400px', background: 'white', padding: '40px', borderRadius: '20px' }}>
              <h3>Change Password</h3>
              <input type="password" placeholder="New Password" className="btn-gold" style={{ background: 'white', width: '100%', marginBottom: '20px' }} onChange={e => setNewPass(e.target.value)} />
              <button className="btn-gold" style={{ width: '100%' }} onClick={() => updatePassword(auth.currentUser, newPass).then(() => alert("Password Updated!"))}>Update</button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

function LoginScreen() {
  const [e, setE] = useState(""); const [p, setP] = useState("");
  const handleLogin = (ev) => { ev.preventDefault(); signInWithEmailAndPassword(auth, e, p).catch(() => alert("Access Denied")); };
  return (
    <div className="login-container">
      <div className="login-box">
        <div style={{ width: '60px', height: '60px', background: 'var(--dark-blue)', borderRadius: '15px', margin: '0 auto 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '2px solid var(--gold)' }}>
          <ShieldCheck color="var(--gold)" size={35}/>
        </div>
        <h2>BANKING PRO</h2>
        <p style={{ color: 'var(--gold)', fontSize: '10px', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '30px' }}>EXECUTIVE LOGIN</p>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="email" placeholder="Login ID" className="btn-gold" style={{ background: 'white', textAlign: 'left' }} onChange={v => setE(v.target.value)} required />
          <input type="password" placeholder="Password" className="btn-gold" style={{ background: 'white', textAlign: 'left' }} onChange={v => setP(v.target.value)} required />
          <button type="submit" className="btn-gold" style={{ width: '100%', marginTop: '10px' }}>LOG IN</button>
        </form>
        <div style={{ marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
          <p style={{ fontSize: '10px', color: '#94a3b8' }}>Developed by</p>
          <p style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--dark-blue)' }}>SOFTVIEW TECHNOLOGIES</p>
          <p style={{ color: 'var(--gold)', fontSize: '11px' }}>+91 7972084304</p>
        </div>
      </div>
    </div>
  );
}