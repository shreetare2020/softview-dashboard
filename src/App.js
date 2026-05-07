import React, { useState, useEffect } from "react";
import "./App.css";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc } from "firebase/firestore";
import * as XLSX from 'xlsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [time, setTime] = useState(new Date());
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  
  // New States for Filter and Expansion
  const [selectedFirmFilter, setSelectedFirmFilter] = useState("All");
  const [expandedBank, setExpandedBank] = useState(null);
  
  const [editingFirm, setEditingFirm] = useState(null);
  const [editingBank, setEditingBank] = useState(null);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => setUser(u));
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user) {
      onSnapshot(collection(db, "firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "banks"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
  }, [user]);

  const deleteItem = async (col, id) => {
    if(window.confirm("Delete karein?")) await deleteDoc(doc(db, col, id));
  };

  if (!user) return (
    <div className="login-screen">
      <div className="login-card">
        <h2 style={{color: '#0f172a'}}>ADMIN SECURE LOGIN</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          signInWithEmailAndPassword(auth, e.target.email.value, e.target.pass.value);
        }}>
          <input name="email" type="email" placeholder="Email" required />
          <input name="pass" type="password" placeholder="Password" required />
          <button type="submit" className="btn-save" style={{width:'100%'}}>LOGIN</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="app-shell">
      <div className="sidebar">
        <div className="sidebar-brand">BANKING SYSTEM</div>
        <div className="nav-links">
          {['Dashboard', 'Firm Master', 'Bank Master', 'User Master'].map(tab => (
            <div key={tab} className={`nav-item ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</div>
          ))}
        </div>
        <div style={{padding:'20px'}}><button className="btn-save" style={{background:'#ef4444', width:'100%'}} onClick={() => signOut(auth)}>Logout</button></div>
      </div>

      <div className="main-stage">
        <div className="top-right-header">
          <span className="user-name">{user.email}</span>
          <span className="live-clock">{time.toLocaleDateString('en-GB')} || {time.toLocaleTimeString()}</span>
        </div>

        <div className="content-container">
          {activeTab === "Dashboard" && (
            <div className="card">
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'20px'}}>
                <h3>Consolidated Bank Summary</h3>
                {/* 1) FIRM FILTER DROPDOWN */}
                <select 
                  onChange={(e) => setSelectedFirmFilter(e.target.value)}
                  style={{padding:'8px', borderRadius:'6px', border:'1px solid #cbd5e1'}}
                >
                  <option value="All">All Firms (Filter)</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>

              <table className="pro-table">
                <thead>
                  <tr><th>Firm</th><th>Bank Name</th><th>A/c No</th><th>Balance</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {banks
                    .filter(b => selectedFirmFilter === "All" || b.firmName === selectedFirmFilter)
                    .map(b => {
                      const isClosed = b.status === 'Closed';
                      const hasBal = parseFloat(b.balance) !== 0;
                      if (isClosed && !hasBal) return null;

                      return (
                        <React.Fragment key={b.id}>
                          <tr className={isClosed && hasBal ? 'bank-closed-warning' : ''}>
                            <td>{b.firmName}</td>
                            <td>{b.bankName}</td>
                            <td>{b.accNo}</td>
                            <td className={parseFloat(b.balance) >= 0 ? 'amt-receipt' : 'amt-payment'}>
                              ₹ {b.balance} {parseFloat(b.balance) >= 0 ? ' ↓' : ' ↑'}
                            </td>
                            <td>{b.status}</td>
                            <td>
                              {/* 2) EXPAND LEDGER BUTTON */}
                              <button onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}>
                                {expandedBank === b.id ? "Hide" : "Expand"}
                              </button>
                            </td>
                          </tr>
                          {expandedBank === b.id && (
  <tr>
    <td colSpan="6" style={{background:'#f8fafc', padding:'20px'}}>
      <div style={{border:'1px solid #e2e8f0', padding:'20px', borderRadius:'8px', background:'white', boxShadow:'0 2px 4px rgba(0,0,0,0.05)'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
          <h4 style={{margin:0, color:'#0f172a'}}>Bank Ledger: {b.bankName} ({b.accNo})</h4>
          <button style={{padding:'5px 15px', fontSize:'12px'}}>Print PDF</button>
        </div>
        
        <table className="pro-table" style={{border:'1px solid #f1f5f9'}}>
          <thead>
            <tr style={{background:'#f8fafc'}}>
              <th style={{width:'120px'}}>Date</th>
              <th>Particulars</th>
              <th style={{textAlign:'right'}}>Receipt (Cr)</th>
              <th style={{textAlign:'right'}}>Payment (Dr)</th>
              <th style={{textAlign:'right'}}>Balance</th>
            </tr>
          </thead>
          <tbody>
            {/* 1. Hamesha Pehli Row Opening Balance ki hogi */}
            <tr style={{fontWeight:'600', background:'#fffbeb'}}>
              <td>-</td>
              <td>Opening Balance</td>
              <td style={{textAlign:'right'}} className="amt-receipt">
                {parseFloat(b.openingBal || 0) >= 0 ? `₹ ${b.openingBal}` : '-'}
              </td>
              <td style={{textAlign:'right'}} className="amt-payment">
                {parseFloat(b.openingBal || 0) < 0 ? `₹ ${Math.abs(b.openingBal)}` : '-'}
              </td>
              <td style={{textAlign:'right', fontWeight:'bold'}}>₹ {b.openingBal || 0}</td>
            </tr>

            {/* 2. Iske niche saare transactions aayenge (Future logic ke liye placeholder) */}
            {/* b.transactions?.map((t, index) => (...)) */}
            
            {/* 3. Final Closing Row */}
            <tr style={{background:'#f1f5f9', fontWeight:'800'}}>
              <td colSpan="4" style={{textAlign:'right'}}>Current Net Balance:</td>
              <td style={{textAlign:'right'}} className={parseFloat(b.balance) >= 0 ? 'amt-receipt' : 'amt-payment'}>
                ₹ {b.balance} {parseFloat(b.balance) >= 0 ? ' (Dr)' : ' (Cr)'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </td>
  </tr>
)}
                        </React.Fragment>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}

          {/* Firm Master remains same with Edit/Delete as per previous update */}
          {activeTab === "Firm Master" && (
            <div className="card">
               <h3>🏢 Firm Master Management</h3>
               <form className="form-group" onSubmit={async (e) => {
                e.preventDefault();
                const name = e.target.fName.value;
                if(editingFirm) {
                  await updateDoc(doc(db, "firms", editingFirm.id), { name });
                  setEditingFirm(null);
                } else {
                  await addDoc(collection(db, "firms"), { name });
                }
                e.target.reset();
              }}>
                <input name="fName" defaultValue={editingFirm?.name || ""} placeholder="Firm Name" required />
                <button type="submit" className="btn-save">{editingFirm ? "Update" : "Save"}</button>
              </form>
              <table className="pro-table">
                <tbody>
                  {firms.map((f, i) => (
                    <tr key={f.id}><td>{f.name}</td><td>
                      <button onClick={()=>setEditingFirm(f)}>Edit</button>
                      <button onClick={()=>deleteItem("firms", f.id)}>Delete</button>
                    </td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Bank Master linking remains active */}
          {activeTab === "Bank Master" && (
            <div className="card">
              <h3>🏦 Bank Master Setup</h3>
              {/* Previous Bank Master Form Code... */}
            </div>
          )}
        </div>

        <div className="footer-branding">
          Developed by <strong>Softview Technologies</strong> | Contact: 7972084304
        </div>
      </div>
    </div>
  );
}