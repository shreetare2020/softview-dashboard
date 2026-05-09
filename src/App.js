import React, { useState, useEffect } from 'react';
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, query, orderBy } from "firebase/firestore";
import { LayoutDashboard, Building2, Landmark, Users, LogOut, Settings, ChevronDown, Edit3, Trash2, Clock, Download, FileText } from 'lucide-react';
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
        // 🔥 AUTO-FETCH ALL NODES (Jo screenshot mein hain)
        onSnapshot(collection(db, "User Master"), s => setUsersList(s.docs.map(d => ({id: d.id, ...d.data()}))));
        onSnapshot(collection(db, "Firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
        onSnapshot(collection(db, "Bank Master"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
        
        // Role Check
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
      await addDoc(collection(db, coll), { ...form, status: 'Open', createdAt: new Date() });
      setForm({}); alert("Data Locked & Saved!");
    } catch (e) { alert("Error: " + e.message); }
  };

  // 📊 COLOURFUL EXCEL EXPORT
  const exportExcel = (b) => {
    const data = [
      { Date: "Opening Balance", Particulars: "B/F", Voucher: "-", Dr: 0, Cr: 0, Balance: b.balance }
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, `${b.bankName}_Ledger.xlsx`);
  };

  // 📄 PREMIUM PDF EXPORT (No Overlap)
  const exportPDF = (b) => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.setTextColor(10, 25, 47); // Dark Blue
    doc.text("BANKING PRO - LEDGER REPORT", 14, 20);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`Bank: ${b.bankName} | A/c: ${b.accNo}`, 14, 28);
    doc.text(`Generated on: ${time.toLocaleString()}`, 14, 33);
    
    const body = [["Opening Balance", "B/F", "-", "0", "0", `₹ ${b.balance} ${b.type}`]];
    doc.autoTable({
      startY: 40,
      head: [['Date', 'Particulars', 'Voucher', 'Dr', 'Cr', 'Balance']],
      body: body,
      headStyles: { fillColor: [212, 175, 55], textColor: [255, 255, 255] }, // Gold Header
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
    doc.save(`${b.bankName}_Ledger.pdf`);
  };

  if (!user) return <LoginScreen />;

  const dashboardData = banks.filter(b => selectedFirm === "All" || b.linkedFirm === selectedFirm);

  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      {/* SIDEBAR */}
      <aside className="executive-sidebar">
        <div style={{ padding: '30px 20px' }}>
          <h1 style={{ color: 'var(--gold)', margin: 0, fontSize: '20px' }}>BANKING PRO</h1>
          <p style={{
  fontSize: '10px',
  color: '#94a3b8',
  marginTop: '5px',
  lineHeight: '16px'
}}>
  Executive Version 2.0
</p>
        </div>
        <nav style={{ flex: 1 }}>
          <div className={`nav-item ${activeTab === 'Dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('Dashboard')}><LayoutDashboard size={18}/> Dashboard</div>
          <div className={`nav-item ${activeTab === 'Firm Master' ? 'active' : ''}`} onClick={() => setActiveTab('Firm Master')}><Building2 size={18}/> Firm Master</div>
          <div className={`nav-item ${activeTab === 'Bank Master' ? 'active' : ''}`} onClick={() => setActiveTab('Bank Master')}><Landmark size={18}/> Bank Master</div>
          <div className={`nav-item ${activeTab === 'User Master' ? 'active' : ''}`} onClick={() => setActiveTab('User Master')}><Users size={18}/> User Master</div>
          <div className={`nav-item ${activeTab === 'Setting' ? 'active' : ''}`} onClick={() => setActiveTab('Setting')}><Settings size={18}/> Setting</div>
        </nav>
        <div style={{ padding: '20px', borderTop: '1px solid rgba(212,175,55,0.1)' }}>
          <p style={{ color: 'var(--gold)', fontWeight: 'bold', fontSize: '11px' }}><div style={{
  padding: '20px',
  borderTop: '1px solid rgba(212,175,55,0.1)',
  color: '#cbd5e1',
  fontSize: '11px',
  lineHeight: '20px'
}}>

  <div style={{
    color: '#d4af37',
    fontWeight: 'bold',
    marginBottom: '5px'
  }}>
    Developed By
  </div>

  <div>
    SOFTVIEW TECHNOLOGIES
  </div>

  <div style={{
    color: '#d4af37',
    marginTop: '5px'
  }}>
    +91 7972084304
  </div>

</p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, marginLeft: '260px', overflowY: 'auto', background: '#f8fafc' }}>
        
          <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>

  <div style={{
    textAlign: 'right',
    borderRight: '1px solid #ddd',
    paddingRight: '15px'
  }}>

    <div style={{
      fontSize: '12px',
      fontWeight: '700',
      color: '#fff'
    }}>
      Login User : {user?.email}
    </div>

    <div style={{
      fontSize: '13px',
      fontWeight: '900',
      color: '#d4af37'
    }}>
      {time.toLocaleTimeString()}
    </div>

    <div style={{
      fontSize: '10px',
      color: '#cbd5e1'
    }}>
      {time.toLocaleDateString()}
    </div>

  </div>

  <button
    className="btn-gold"
    style={{
      background: '#ffefef',
      color: 'red'
    }}
    onClick={() => signOut(auth)}
  >
    <LogOut size={16}/>
  </button>

</div>

        <div style={{ padding: '30px' }}>
          {activeTab === "Dashboard" && (
            <div>
              <select className="btn-gold" style={{background:'white', marginBottom:'20px'}} onChange={(e) => setSelectedFirm(e.target.value)}>
                <option value="All">All Firms</option>
                {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
              <table className="royal-table">
                <thead><tr><th>Bank Name</th><th>A/c No.</th><th style={{textAlign:'right'}}>Closing Balance</th><th>Ledger</th></tr></thead>
                <tbody>
                  {dashboardData.map(b => (
                    <React.Fragment key={b.id}>
                      <tr onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)} style={{cursor:'pointer'}}>
                        <td>{b.bankName}</td><td>{b.accNo}</td><td style={{textAlign:'right'}}>₹ {b.balance} {b.type}</td>
                        <td style={{textAlign:'center'}}><ChevronDown style={{color:'var(--gold)', transform: expandedBank === b.id ? 'rotate(180deg)' : 'none'}}/></td>
                      </tr>
                      {expandedBank === b.id && (
                        <tr>
                          <td colSpan="4" style={{padding:'20px', background:'#f1f5f9'}}>
                             <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
                               <button onClick={() => exportExcel(b)} className="btn-gold" style={{padding:'5px 15px'}}><Download size={14}/> Excel</button>
                               <button onClick={() => exportPDF(b)} className="btn-gold" style={{padding:'5px 15px'}}><FileText size={14}/> PDF</button>
                             </div>
                             <table className="royal-table" style={{background:'white'}}>
                               <thead><tr><th>Date</th><th>Particulars</th><th>Dr</th><th>Cr</th><th>Balance</th></tr></thead>
                               <tbody>
                                 <tr><td>Opening</td><td>Balance B/F</td><td>-</td><td>-</td><td>₹ {b.balance} {b.type}</td></tr>
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
          )}

          {activeTab === "Firm Master" && (
             <div>
               <div className="ledger-box" style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'15px', background:'white', padding:'20px'}}>
                  <input placeholder="Firm Name" className="btn-gold" style={{background:'white', textAlign:'left'}} onChange={e => setForm({...form, name: e.target.value})} />
                  <input placeholder="GST No" className="btn-gold" style={{background:'white', textAlign:'left'}} onChange={e => setForm({...form, gst: e.target.value})} />
                  <input placeholder="Address" className="btn-gold" style={{background:'white', textAlign:'left'}} onChange={e => setForm({...form, address: e.target.value})} />
                  <button className="btn-gold" style={{gridColumn:'span 3'}} onClick={() => handleSave("Firms")}>SAVE FIRM</button>
               </div>
               <table className="royal-table" style={{marginTop:'20px'}}>
                 <thead><tr><th>Firm Name</th><th>GST</th><th>Address</th><th>Actions</th></tr></thead>
                 <tbody>{firms.map(f => <tr key={f.id}><td>{f.name}</td><td>{f.gst}</td><td>{f.address}</td><td style={{display:'flex', gap:'10px'}}>

  <Edit3
    size={16}
    color="#0a192f"
    style={{cursor:'pointer'}}
    onClick={() => setForm(f)}
  />

  <Trash2
    size={16}
    color="red"
    style={{cursor:'pointer'}}
    onClick={async () => {
      if(window.confirm("Delete Firm ?")){
        await deleteDoc(doc(db,"Firms",f.id))
      }
    }}
  />

  <button
    style={{
      background:'#0a192f',
      color:'#fff',
      border:'none',
      borderRadius:'5px',
      padding:'3px 10px',
      cursor:'pointer'
    }}
    onClick={async () => {
      await updateDoc(doc(db,"Firms",f.id),{
        status:'Closed',
        closedDate:new Date()
      })
    }}
  >
    Close
  </button>

</td>
</tr>)}<tbody>
  {banks.map(b =>

    <tr key={b.id}>

      <td>{b.bankName}</td>

      <td>{b.accNo}</td>

      <td>{b.balance} {b.type}</td>

      <td style={{display:'flex', gap:'10px'}}>

        <Edit3
          size={16}
          color="#0a192f"
          style={{cursor:'pointer'}}
          onClick={() => setForm(b)}
        />

        <Trash2
          size={16}
          color="red"
          style={{cursor:'pointer'}}
          onClick={async () => {
            if(window.confirm("Delete Bank ?")){
              await deleteDoc(doc(db,"Bank Master",b.id))
            }
          }}
        />

        <button
          style={{
            background:'#0a192f',
            color:'#fff',
            border:'none',
            borderRadius:'5px',
            padding:'3px 10px'
          }}
          onClick={async () => {
            await updateDoc(doc(db,"Bank Master",b.id),{
              status:'Closed',
              closedDate:new Date()
            })
          }}
        >
          Close
        </button>

      </td>

    </tr>

  )}
<tbody>

  {usersList.map(u =>

    <tr key={u.id}>

      <td>{u.uName}</td>

      <td>{u.uEmail}</td>

      <td>{u.role}</td>

      <td style={{display:'flex', gap:'10px'}}>

        <Edit3
          size={16}
          color="#0a192f"
          style={{cursor:'pointer'}}
          onClick={() => setForm(u)}
        />

        <Trash2
          size={16}
          color="red"
          style={{cursor:'pointer'}}
          onClick={async () => {
            if(window.confirm("Delete User ?")){
              await deleteDoc(doc(db,"User Master",u.id))
            }
          }}
        />

        <button
          style={{
            background:'#0a192f',
            color:'#fff',
            border:'none',
            borderRadius:'5px',
            padding:'3px 10px'
          }}
          onClick={async () => {
            await updateDoc(doc(db,"User Master",u.id),{
              status:'Closed',
              closedDate:new Date()
            })
          }}
        >
          Close
        </button>

      </td>

    </tr>

  )}

</tbody>

          {activeTab === "Setting" && (
            <div className="ledger-box" style={{background:'white', padding:'40px', width:'400px'}}>
              <h3>Security Settings</h3>
              <input type="password" placeholder="New Password" className="btn-gold" style={{background:'#f8fafc', width:'100%', marginBottom:'20px'}} onChange={e => setNewPass(e.target.value)} />
              <button className="btn-gold" style={{width:'100%'}} onClick={() => updatePassword(auth.currentUser, newPass).then(() => alert("Password Updated")).catch(e => alert(e.message))}>UPDATE PASSWORD</button>
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
      <form onSubmit={h} style={{background:'white', padding:'50px', borderRadius:'15px', width:'400px', borderTop:'5px solid #d4af37'}}>
        <h2 style={{textAlign:'center', color:'#0a192f'}}>BANKING PRO</h2>
        <input type="email" placeholder="Email" className="btn-gold" style={{width:'100%', marginBottom:'15px', background:'#f8fafc'}} onChange={v => setE(v.target.value)} />
        <input type="password" placeholder="Password" className="btn-gold" style={{width:'100%', marginBottom:'25px', background:'#f8fafc'}} onChange={v => setP(v.target.value)} />
        <button type="submit" className="btn-gold" style={{width:'100%'}}>LOG IN</button>
      </form>
    </div>
  );
}