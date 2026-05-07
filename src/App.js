import React, { useState, useEffect } from "react";
import "./App.css";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc } from "firebase/firestore";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [selectedFirm, setSelectedFirm] = useState("");
  const [expandedBank, setExpandedBank] = useState(null);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => setUser(u));
    if (user) {
      onSnapshot(collection(db, "firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "banks"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "users"), s => setUsersList(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
  }, [user]);

  const exportExcel = (b) => {
    const ws = XLSX.utils.json_to_sheet([{ Date: '07/05/2026', Particulars: 'Opening Balance', Receipt: b.openingBal, Payment: 0, Balance: b.balance }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, `${b.bankName}_Ledger.xlsx`);
  };

  if (!user) return (
    <div className="login-screen" style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background:'#0f172a'}}>
      <div className="card" style={{width:'350px', textAlign:'center'}}>
        <h2 style={{color:'#b58921', marginBottom:'20px'}}>SYSTEM LOGIN</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          signInWithEmailAndPassword(auth, e.target.email.value, e.target.pass.value);
        }}>
          <input name="email" type="email" placeholder="Admin Email" style={{width:'100%', padding:'12px', marginBottom:'15px', borderRadius:'8px', border:'1px solid #ddd'}} required />
          <input name="pass" type="password" placeholder="Password" style={{width:'100%', padding:'12px', marginBottom:'20px', borderRadius:'8px', border:'1px solid #ddd'}} required />
          <button type="submit" className="btn-gold" style={{width:'100%'}}>AUTHORIZE ACCESS</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="app-shell">
      <div className="sidebar">
        <div className="sidebar-brand">BANKING PRO</div>
        <div className="nav-links">
          {['Dashboard', 'Firm Master', 'Bank Master', 'User Master'].map(tab => (
            <div key={tab} className={`nav-item ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</div>
          ))}
        </div>
        <div className="sidebar-footer">
          <strong>SOFTVIEW TECHNOLOGIES</strong><br/>
          Support: +91 7972084304
        </div>
      </div>

      <div className="main-stage">
        <div className="top-right-header">
          <span style={{fontWeight:'700'}}>{user.email}</span>
          <span style={{color:'#64748b'}}>|</span>
          <span>{new Date().toLocaleDateString('en-GB')}</span>
          <button onClick={() => signOut(auth)} style={{background:'#fee2e2', color:'#ef4444', border:'none', padding:'8px 15px', borderRadius:'8px', cursor:'pointer', fontWeight:'600'}}>Logout</button>
        </div>

        {activeTab === "Dashboard" && (
          <div>
            <div className="filter-container">
              <h2 style={{margin:0}}>Global Bank Summary</h2>
              <select className="pro-select" value={selectedFirm} onChange={(e) => setSelectedFirm(e.target.value)}>
                <option value="">Choose Firm to Unlock Data...</option>
                {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
            </div>

            {!selectedFirm ? (
              <div className="card" style={{textAlign:'center', padding:'100px', color:'#94a3b8'}}>
                <div style={{fontSize:'50px', marginBottom:'20px'}}>🏦</div>
                <h3>Select an active firm from the top to view ledger details.</h3>
              </div>
            ) : (
              <div className="card" style={{padding:0, overflow:'hidden'}}>
                <table className="pro-table">
                  <thead>
                    <tr><th>Bank Details</th><th>A/C Number</th><th>Current Balance</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {banks.filter(b => b.firmName === selectedFirm).map(b => (
                      <React.Fragment key={b.id}>
                        <tr>
                          <td><strong>{b.bankName}</strong><br/><small style={{color:'#64748b'}}>{b.firmName}</small></td>
                          <td><code>{b.accNo}</code></td>
                          <td style={{color:'#16a34a', fontWeight:'800', fontSize:'16px'}}>₹ {b.balance}</td>
                          <td><button className="btn-gold" onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}>Open Ledger</button></td>
                        </tr>
                        {expandedBank === b.id && (
                          <tr>
                            <td colSpan="4" style={{background:'#f8fafc', padding:'30px'}}>
                              <div className="card">
                                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
                                  <h4>Account Statement: {b.bankName}</h4>
                                  <div>
                                    <button className="btn-gold" onClick={() => exportExcel(b)} style={{background:'#16a34a', marginRight:'10px'}}>Export Excel</button>
                                    <button className="btn-gold" onClick={() => window.print()}>Print Statement</button>
                                  </div>
                                </div>
                                <table className="pro-table">
                                  <thead><tr><th>Date</th><th>Particulars</th><th>Cr (Receipt)</th><th>Dr (Payment)</th><th>Running Balance</th></tr></thead>
                                  <tbody>
                                    <tr style={{background:'#fffbeb', fontWeight:'700'}}>
                                      <td>07/05/2026</td><td>Opening Balance Brought Forward</td><td>₹ {b.openingBal}</td><td>-</td><td>₹ {b.balance}</td>
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
          </div>
        )}

        {activeTab === "Bank Master" && (
          <div className="card">
            <h3 style={{marginBottom:'25px'}}>🏦 Link New Bank Account</h3>
            <form style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'20px'}} onSubmit={async (e) => {
              e.preventDefault();
              await addDoc(collection(db, "banks"), {
                firmName: e.target.firm.value,
                bankName: e.target.bank.value,
                accNo: e.target.acc.value,
                openingBal: e.target.bal.value,
                balance: e.target.bal.value,
                status: 'Active'
              });
              e.target.reset();
            }}>
              <select name="firm" className="pro-select" style={{minWidth:'auto'}} required>
                <option value="">Select Firm</option>
                {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
              <input name="bank" placeholder="Bank Name (e.g. HDFC)" style={{padding:'12px', borderRadius:'8px', border:'1px solid #ddd'}} required />
              <input name="acc" placeholder="Account No" style={{padding:'12px', borderRadius:'8px', border:'1px solid #ddd'}} required />
              <input name="bal" type="number" placeholder="Opening Balance" style={{padding:'12px', borderRadius:'8px', border:'1px solid #ddd'}} required />
              <button type="submit" className="btn-gold">Link Account</button>
            </form>
          </div>
        )}

        {activeTab === "User Master" && (
          <div className="card">
            <h3>👥 System User Access</h3>
            <div style={{color:'#64748b', marginBottom:'20px'}}>Manage team members and their access levels.</div>
            {/* User Form Logic */}
          </div>
        )}
      </div>
    </div>
  );
}