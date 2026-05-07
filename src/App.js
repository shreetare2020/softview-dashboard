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
  
  // Professional Dashboard States
  const [selectedFirmFilter, setSelectedFirmFilter] = useState(""); 
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
            <div className="dashboard-wrapper">
              {/* 1) PROFESSIONAL FILTER CONTAINER */}
              <div className="filter-container">
                <div>
                  <span className="filter-label">🏢 Active Firm:</span>
                  <select 
                    className="pro-select"
                    value={selectedFirmFilter}
                    onChange={(e) => {
                      setSelectedFirmFilter(e.target.value);
                      setExpandedBank(null); 
                    }}
                  >
                    <option value="">-- Select Firm to View Dashboard --</option>
                    {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                  </select>
                </div>
                <h3 style={{margin:0, color:'var(--navy)'}}>Bank Summary Dashboard</h3>
              </div>

              {/* 2) CONDITIONAL DASHBOARD VIEW */}
              {!selectedFirmFilter ? (
                <div className="empty-state">
                  <div style={{fontSize:'40px', marginBottom:'10px'}}>📊</div>
                  <h3>No Firm Selected</h3>
                  <p>Please select a firm from the dropdown above to view its bank summary and ledgers.</p>
                </div>
              ) : (
                <div className="card" style={{padding:'0', overflow:'hidden'}}>
                  <table className="pro-table">
                    <thead>
                      <tr>
                        <th>Firm Name</th>
                        <th>Bank Name</th>
                        <th>A/c No</th>
                        <th>Balance</th>
                        <th>Status</th>
                        <th style={{textAlign:'center'}}>Ledger</th>
                      </tr>
                    </thead>
                    <tbody>
                      {banks
                        .filter(b => b.firmName === selectedFirmFilter)
                        .map(b => {
                          const isClosed = b.status === 'Closed';
                          const hasBal = parseFloat(b.balance) !== 0;
                          if (isClosed && !hasBal) return null;

                          return (
                            <React.Fragment key={b.id}>
                              <tr className={isClosed && hasBal ? 'bank-closed-warning' : ''}>
                                <td style={{fontWeight:'bold'}}>{b.firmName}</td>
                                <td>{b.bankName}</td>
                                <td>{b.accNo}</td>
                                <td className={parseFloat(b.balance) >= 0 ? 'amt-receipt' : 'amt-payment'}>
                                  ₹ {b.balance} {parseFloat(b.balance) >= 0 ? ' ↓' : ' ↑'}
                                </td>
                                <td>
                                  <span className={`status-badge ${b.status?.toLowerCase()}`}>
                                    {b.status}
                                  </span>
                                </td>
                                <td style={{textAlign:'center'}}>
                                  <button 
                                    className="btn-save" 
                                    style={{padding:'5px 15px', fontSize:'12px'}}
                                    onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}
                                  >
                                    {expandedBank === b.id ? "Close Ledger" : "View Ledger"}
                                  </button>
                                </td>
                              </tr>

                              {/* 3) PROFESSIONAL LEDGER EXPANSION */}
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
                                          <tr style={{fontWeight:'600', background:'#fffbeb'}}>
                                            <td>-</td>
                                            <td>Opening Balance</td>
                                            <td style={{textAlign:'right'}} className="amt-receipt">
                                              {parseFloat(b.openingBal || 0) >= 0 ? `₹ ${b.openingBal || 0}` : '-'}
                                            </td>
                                            <td style={{textAlign:'right'}} className="amt-payment">
                                              {parseFloat(b.openingBal || 0) < 0 ? `₹ ${Math.abs(b.openingBal || 0)}` : '-'}
                                            </td>
                                            <td style={{textAlign:'right', fontWeight:'bold'}}>₹ {b.openingBal || 0}</td>
                                          </tr>
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
            </div>
          )}

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
                  {firms.map((f) => (
                    <tr key={f.id}>
                      <td>{f.name}</td>
                      <td>
                        <button onClick={()=>setEditingFirm(f)}>Edit</button>
                        <button onClick={()=>deleteItem("firms", f.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "Bank Master" && (
            <div className="card">
              <h3>🏦 Bank Master Setup</h3>
              <p style={{color: '#64748b'}}>Use the form to link banks with active firms.</p>
              {/* Add your Bank Master form logic here */}
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