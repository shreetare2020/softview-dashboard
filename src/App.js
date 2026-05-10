import React, { useState, useEffect } from 'react';
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { LayoutDashboard, Building2, Landmark, Users, LogOut, Settings, ChevronDown, Edit3, Trash2, Clock, Download, FileText, ShieldCheck } from 'lucide-react';
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
  const [time, setTime] = useState(new Date());
  const [form, setForm] = useState({});
  const [newPass, setNewPass] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        onSnapshot(collection(db, "User Master"), s => setUsersList(s.docs.map(d => ({id: d.id, ...d.data()}))));
        onSnapshot(collection(db, "Firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
        onSnapshot(collection(db, "Bank Master"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
        onSnapshot(collection(db, "User Master"), s => {
          const match = s.docs.find(d => d.data().uEmail === u.email);
          if (match) setUserRole(match.data().role);
        });
      }
    });
    return () => { clearInterval(timer); unsub(); };
  }, [user]);

  const handleSave = async (coll) => {
    if (userRole === "Viewer") return alert("Permission Denied!");
    try {
      if (form.id) {
        const { id, ...data } = form;
        await updateDoc(doc(db, coll, id), { ...data, updatedAt: new Date() });
        alert("Updated Successfully!");
      } else {
        await addDoc(collection(db, coll), { ...form, status: 'Open', createdAt: new Date() });
        alert("Saved Successfully!");
      }
      setForm({});
    } catch (e) { alert(e.message); }
  };

  //---const handleEdit = (item) => { setForm(item); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  //--const handleDelete = async (coll, id) => { if (window.confirm("Delete?")) await deleteDoc(doc(db, coll, id)); };
  //---const handleCloseEntry = async (id) => {
   //--- const d = prompt("Enter Closing Date:", new Date().toLocaleDateString());
    //---if (d) await updateDoc(doc(db, "Bank Master", id), { status: 'Closed', closingDate: d });
  //--};
  const handleEdit = (item) => { 
    setForm(item); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const handleDelete = async (coll, id) => { 
    if (window.confirm("Delete?")) await deleteDoc(doc(db, coll, id)); 
  };

  const handleCloseEntry = async (id) => {
    const d = prompt("Enter Closing Date:", new Date().toLocaleDateString());
    if (d) await updateDoc(doc(db, "Bank Master", id), { status: 'Closed', closingDate: d });
  };

  // --- UPGRADED EXCEL LOGIC ---
  const exportToExcel = (data, fileName) => {
    console.log("Excel Export Triggered for:", fileName); // Ye console mein dikhega
    try {
      const filteredData = data.map(item => ({
        "Bank Name": item.bankName || "N/A",
        "Account No": item.accNo || "N/A",
        "Firm Name": item.linkedFirm || "N/A",
        "Balance": `${item.balance || 0} ${item.type || ""}`,
        "Status": item.status || 'Open'
      }));
      
      const worksheet = XLSX.utils.json_to_sheet(filteredData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Ledger");
      XLSX.writeFile(workbook, `${fileName}_Report.xlsx`);
      console.log("Excel Download Initiated");
    } catch (error) {
      console.error("Excel Error:", error);
      alert("Excel Export Failed: " + error.message);
    }
  };

  // --- UPGRADED PDF LOGIC ---
  const exportToPDF = (bank) => {
    console.log("PDF Export Triggered for:", bank.bankName);
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("BANKING PRO - STATEMENT", 14, 20);
      doc.setFontSize(11);
      doc.text(`Bank: ${bank.bankName} | A/c: ${bank.accNo}`, 14, 30);
      doc.text(`Firm: ${bank.linkedFirm}`, 14, 35);
      
      const tableData = [
        [new Date().toLocaleDateString(), "Opening Balance B/F", "-", "-", `₹ ${bank.balance} ${bank.type}`]
      ];

      doc.autoTable({
        head: [['Date', 'Particulars', 'Debit', 'Credit', 'Balance']],
        body: tableData,
        startY: 45,
        theme: 'grid'
      });

      doc.save(`${bank.bankName}_Statement.pdf`);
      console.log("PDF Download Initiated");
    } catch (error) {
      console.error("PDF Error:", error);
      alert("PDF Export Failed: " + error.message);
    }
  };

  if (!user) return <LoginScreen />;

  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      
      {/* SIDEBAR */}
      <aside className="executive-sidebar">
        <div style={{ padding: '30px 20px' }}>
          <h1 style={{ color: 'var(--gold)', margin: 0, fontSize: '22px', letterSpacing:'1px' }}>BANKING PRO</h1>
          <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight:'bold', marginTop:'5px' }}>EXECUTIVE VERSION 2.0</p>
        </div>
        <nav style={{ flex: 1 }}>
          <div className={`nav-item ${activeTab === 'Dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('Dashboard')}><LayoutDashboard size={18}/> Dashboard</div>
          <div className={`nav-item ${activeTab === 'Firm Master' ? 'active' : ''}`} onClick={() => setActiveTab('Firm Master')}><Building2 size={18}/> Firm Master</div>
          <div className={`nav-item ${activeTab === 'Bank Master' ? 'active' : ''}`} onClick={() => setActiveTab('Bank Master')}><Landmark size={18}/> Bank Master</div>
          <div className={`nav-item ${activeTab === 'User Master' ? 'active' : ''}`} onClick={() => setActiveTab('User Master')}><Users size={18}/> User Master</div>
          <div className={`nav-item ${activeTab === 'Setting' ? 'active' : ''}`} onClick={() => setActiveTab('Setting')}><Settings size={18}/> Setting</div>
        </nav>
        <div style={{ padding: '20px', borderTop: '1px solid rgba(212,175,55,0.1)', background: 'rgba(0,0,0,0.3)' }}>
          <p style={{ color: '#64748b', fontSize: '9px', margin: 0 }}>DEVELOPED BY</p>
          <p style={{ color: 'var(--gold)', fontWeight: 'bold', fontSize: '14px', margin: '2px 0' }}>SOFTVIEW TECHNOLOGIES</p>
          <p style={{ color: '#cbd5e1', fontSize: '11px', margin: 0 }}>+91 7972084304</p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, marginLeft: '260px', overflowY: 'auto', background: '#f0f2f5' }}>
        
        {/* ENHANCED ATTRACTIVE HEADER */}
        <header className="luxury-header" style={{ height: '90px', padding: '0 40px', background: 'linear-gradient(90deg, #0a192f 0%, #112240 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid var(--gold)' }}>
          <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>{activeTab.toUpperCase()}</div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
            {/* Clock Section */}
            <div style={{ textAlign: 'center', color: 'var(--gold)', borderRight: '1px solid #233554', paddingRight: '30px' }}>
              <div style={{ fontSize: '22px', fontWeight: '900', lineHeight: '1' }}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', textTransform: 'uppercase' }}>{time.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}</div>
            </div>

            {/* User Profile Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{user.email.split('@')[0]}</div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '3px' }}>
                  <span style={{ fontSize: '10px', background: 'var(--gold)', color: '#000', padding: '2px 10px', borderRadius: '50px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={10}/> {userRole.toUpperCase()}
                  </span>
                </div>
              </div>
              <button onClick={() => signOut(auth)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #ef4444', color: '#ef4444', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}><LogOut size={20}/></button>
            </div>
          </div>
        </header>

        <div style={{ padding: '40px' }}>
          {/* DASHBOARD WITH EXPANSION */}
          {activeTab === "Dashboard" && (
            <div>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'25px'}}>
                <select className="btn-gold" style={{background:'white', width:'300px'}} onChange={(e) => setSelectedFirm(e.target.value)}>
                  <option value="All">View All Firms</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>
              <table className="royal-table">
                <thead><tr><th>Bank Name</th><th>A/c No.</th><th style={{textAlign:'right'}}>Current Balance</th><th style={{textAlign:'center'}}>Ledger</th></tr></thead>
                <tbody>
                  {banks.filter(b => selectedFirm === "All" || b.linkedFirm === selectedFirm).map(b => (
                    <React.Fragment key={b.id}>
                      <tr onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)} style={{cursor:'pointer', borderLeft: expandedBank === b.id ? '4px solid var(--gold)' : 'none'}}>
                        <td><div style={{fontWeight:'bold'}}>{b.bankName}</div><div style={{fontSize:'10px', color:'#64748b'}}>{b.linkedFirm}</div></td>
                        <td>{b.accNo}</td>
                        <td style={{textAlign:'right', fontWeight:'bold', color: b.status === 'Closed' ? '#ef4444' : '#059669'}}>₹ {b.balance} {b.type} {b.status === 'Closed' && '(CLOSED)'}</td>
                        <td style={{textAlign:'center'}}><ChevronDown style={{transform: expandedBank === b.id ? 'rotate(180deg)' : 'none', transition:'0.3s'}}/></td>
                      </tr>
                      {expandedBank === b.id && (
                        <tr>
                          <td colSpan="4" style={{background:'#f8fafc', padding:'25px'}}>
                            <div style={{display:'flex', gap:'15px', marginBottom:'15px'}}>
                              <button className="btn-gold" style={{fontSize:'12px'}}><Download size={14}/> EXCEL REPORT</button>
                              <button className="btn-gold" style={{fontSize:'12px'}}><FileText size={14}/> PDF STATEMENT</button>
                            </div>
                            <table className="royal-table" style={{background:'white', boxShadow:'none'}}>
                              <thead><tr><th>Date</th><th>Particulars</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead>
                              <tbody><tr><td>-</td><td>Opening Balance B/F</td><td>-</td><td>-</td><td>₹ {b.balance}</td></tr></tbody>
                            </table>
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
              <div className="ledger-box" style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'20px', background:'white', padding:'30px'}}>
                <input placeholder="Firm Name" className="btn-gold" style={{background:'white'}} value={form.name || ""} onChange={e => setForm({...form, name: e.target.value})} />
                <input placeholder="GST Number" className="btn-gold" style={{background:'white'}} value={form.gst || ""} onChange={e => setForm({...form, gst: e.target.value})} />
                <input placeholder="Address" className="btn-gold" style={{background:'white'}} value={form.address || ""} onChange={e => setForm({...form, address: e.target.value})} />
                <button className="btn-gold" style={{gridColumn:'span 3', height:'50px'}} onClick={() => handleSave("Firms")}>{form.id ? "UPDATE FIRM" : "REGISTER NEW FIRM"}</button>
              </div>
              <table className="royal-table" style={{marginTop:'30px'}}>
                <thead><tr><th>Firm Name</th><th>GSTIN</th><th>Actions</th></tr></thead>
                <tbody>{firms.map(f => <tr key={f.id}><td>{f.name}</td><td>{f.gst}</td>
                <td><Edit3 size={18} color="blue" onClick={() => handleEdit(f)} style={{marginRight:'20px', cursor:'pointer'}}/><Trash2 size={18} color="red" onClick={() => handleDelete("Firms", f.id)} style={{cursor:'pointer'}}/></td></tr>)}</tbody>
              </table>
            </div>
          )}

          {/* BANK MASTER */}
          {activeTab === "Bank Master" && (
            <div>
              <div className="ledger-box" style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px', background:'white', padding:'30px'}}>
                <input placeholder="Bank Name" className="btn-gold" style={{background:'white'}} value={form.bankName || ""} onChange={e => setForm({...form, bankName: e.target.value})} />
                <input placeholder="Account No" className="btn-gold" style={{background:'white'}} value={form.accNo || ""} onChange={e => setForm({...form, accNo: e.target.value})} />
                <input placeholder="Balance" className="btn-gold" style={{background:'white'}} value={form.balance || ""} onChange={e => setForm({...form, balance: e.target.value})} />
                <select className="btn-gold" style={{background:'white'}} value={form.type || ""} onChange={e => setForm({...form, type: e.target.value})}><option>Type</option><option value="dr">Debit (Dr)</option><option value="cr">Credit (Cr)</option></select>
                <select className="btn-gold" style={{background:'white'}} value={form.linkedFirm || ""} onChange={e => setForm({...form, linkedFirm: e.target.value})}><option>Link Firm</option>{firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}</select>
                <button className="btn-gold" style={{gridColumn:'span 3', height:'50px'}} onClick={() => handleSave("Bank Master")}>{form.id ? "UPDATE BANK" : "ADD BANK ACCOUNT"}</button>
              </div>
              <table className="royal-table" style={{marginTop:'30px'}}>
                <thead><tr><th>Bank Details</th><th>A/c No</th><th>Balance</th><th>Actions</th></tr></thead>
                <tbody>{banks.map(b => <tr key={b.id}>
                  <td>{b.bankName}</td><td>{b.accNo}</td><td>{b.balance} {b.type}</td>
                  <td>
                    <Edit3 size={18} color="blue" onClick={() => handleEdit(b)} style={{marginRight:'15px', cursor:'pointer'}}/>
                    <Trash2 size={18} color="red" onClick={() => handleDelete("Bank Master", b.id)} style={{marginRight:'15px', cursor:'pointer'}}/>
                    <button onClick={() => handleCloseEntry(b.id)} style={{fontSize:'10px', background: b.status==='Closed'?'#64748b':'#ef4444', color:'white', border:'none', padding:'5px 12px', borderRadius:'4px'}}>{b.status === 'Closed' ? `CLOSED: ${b.closingDate}` : 'CLOSE'}</button>
                  </td>
                </tr>)}</tbody>
              </table>
            </div>
          )}

          {/* USER MASTER */}
          {activeTab === "User Master" && (
            <div>
              <div className="ledger-box" style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px', background:'white', padding:'30px'}}>
                <input placeholder="User Name" className="btn-gold" style={{background:'white'}} value={form.uName || ""} onChange={e => setForm({...form, uName: e.target.value})} />
                <input placeholder="User Email" className="btn-gold" style={{background:'white'}} value={form.uEmail || ""} onChange={e => setForm({...form, uEmail: e.target.value})} />
                <select className="btn-gold" style={{background:'white'}} value={form.role || ""} onChange={e => setForm({...form, role: e.target.value})}><option>Select Role</option><option value="Admin">Admin</option><option value="Operator">Operator</option><option value="Viewer">Viewer</option></select>
                <button className="btn-gold" style={{gridColumn:'span 3'}} onClick={() => handleSave("User Master")}>SAVE USER</button>
              </div>
              <table className="royal-table" style={{marginTop:'30px'}}>
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
                <tbody>{usersList.map(u => <tr key={u.id}><td>{u.uName}</td><td>{u.uEmail}</td><td>{u.role}</td><td><Trash2 size={18} color="red" onClick={() => handleDelete("User Master", u.id)} style={{cursor:'pointer'}}/></td></tr>)}</tbody>
              </table>
            </div>
          )}

          {/* SETTING */}
          {activeTab === "Setting" && (
            <div className="ledger-box" style={{background:'white', padding:'50px', maxWidth:'500px'}}>
              <h2 style={{color:'#0a192f', marginBottom:'20px'}}>Security & Settings</h2>
              <p style={{color:'#64748b', marginBottom:'30px'}}>Update your account password regularly to keep your financial data secure.</p>
              <input type="password" placeholder="New Strong Password" className="btn-gold" style={{background:'#f8fafc', width:'100%', marginBottom:'20px'}} onChange={e => setNewPass(e.target.value)} />
              <button className="btn-gold" style={{width:'100%', height:'50px'}} onClick={() => updatePassword(auth.currentUser, newPass).then(() => alert("Success")).catch(e => alert(e.message))}>UPDATE PASSWORD</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function LoginScreen() {
  const [e, setE] = useState(""); const [p, setP] = useState("");
  const h = (ev) => { ev.preventDefault(); signInWithEmailAndPassword(auth, e, p).catch(() => alert("Login Failed")); };
  return (
    <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0a192f'}}>
      <div style={{background:'white', padding:'60px', borderRadius:'20px', width:'450px', borderTop:'8px solid #d4af37', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.5)'}}>
        <h1 style={{textAlign:'center', color:'#0a192f', margin:0}}>BANKING PRO</h1>
        <p style={{textAlign:'center', color:'#94a3b8', fontSize:'12px', marginBottom:'40px'}}>EXECUTIVE MANAGEMENT SYSTEM</p>
        <form onSubmit={h}>
          <input type="email" placeholder="Email Address" className="btn-gold" style={{width:'100%', marginBottom:'20px', background:'#f8fafc', textAlign:'left'}} onChange={v => setE(v.target.value)} />
          <input type="password" placeholder="Password" className="btn-gold" style={{width:'100%', marginBottom:'30px', background:'#f8fafc', textAlign:'left'}} onChange={v => setP(v.target.value)} />
          <button type="submit" className="btn-gold" style={{width:'100%', height:'55px', fontSize:'16px'}}>LOGIN TO DASHBOARD</button>
        </form>
      </div>
    </div>
  );
}