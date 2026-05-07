import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from "./firebase"; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore";

export default function App() {
  const [user, setUser] = useState(null);
  const [dateTime, setDateTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState("Dashboard");
  
  // Data States
  const [banks, setBanks] = useState([]);
  const [firms, setFirms] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [ledgerData, setLedgerData] = useState([]);
  
  // Filter & UI States
  const [selectedFirm, setSelectedFirm] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [formData, setFormData] = useState({});

  // 1. Clock Update (Point 2)
  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => setUser(u));
    if (user) {
      onSnapshot(collection(db, "banks"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "users"), s => setUsersList(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
  }, [user]);

  // Fetch Ledger (Point 9)
  useEffect(() => {
    if (expandedId) {
      const q = query(collection(db, "transactions"), where("bankId", "==", expandedId));
      onSnapshot(q, s => setLedgerData(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
  }, [expandedId]);

  const handleSave = async (coll) => {
    await addDoc(collection(db, coll), {...formData, status: 'Open'});
    setFormData({});
    alert("Record Saved!");
  };

  const closeRecord = async (id, coll) => {
    const closeDate = new Date().toLocaleDateString('en-GB');
    await updateDoc(doc(db, coll, id), { status: 'Closed', closeDate });
  };

  if (!user) return <LoginScreen />;

  return (
    <div className="app-shell">
      {/* SIDEBAR (Point 3) */}
      <div className="sidebar">
        <div className="sidebar-brand">BANKING PRO</div>
        {['Dashboard', 'Firm Master', 'Bank Master', 'User Master'].map(tab => (
          <div key={tab} className={`nav-item ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </div>
        ))}
        <div className="logout-container">
          <button className="btn-primary" style={{width:'100%'}} onClick={() => signOut(auth)}>LOGOUT</button>
        </div>
      </div>

      <div className="main-stage">
        {/* HEADER (Point 1 & 2) */}
        <div className="header-top">
          <div className="welcome-txt">Welcome, {user.email}</div>
          <div className="clock-txt">
            {dateTime.toLocaleDateString('en-GB')} | {dateTime.toLocaleTimeString()}
          </div>
        </div>

        {activeTab === "Dashboard" && (
          <>
            {/* FIRM FILTER (Point 5) */}
            <div className="filter-box">
              <label>Select Firm Here:</label>
              <select style={{padding:'8px', borderRadius:'5px'}} onChange={(e) => setSelectedFirm(e.target.value)}>
                <option value="">All Firms</option>
                {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
            </div>

            <div className="card-premium">
              <table className="pro-table">
                <thead>
                  <tr><th>Bank Details</th><th>A/c No</th><th>Balance</th><th>Status</th><th>View</th></tr>
                </thead>
                <tbody>
                  {banks.filter(b => !selectedFirm || b.firmName === selectedFirm).map(bank => {
                    const isClosed = bank.status === 'Closed';
                    const hasBalance = parseFloat(bank.balance) !== 0;
                    // Point 11: Logic for Closed Bank with Balance
                    if (isClosed && !hasBalance) return null;

                    return (
                      <React.Fragment key={bank.id}>
                        <tr className={isClosed ? 'closed-bank-row' : ''}>
                          <td><strong>{bank.bankName}</strong><br/><small>{bank.branch}</small></td>
                          <td>{bank.accNo}</td>
                          <td className="amt">
                            ₹ {bank.balance} <span className={parseFloat(bank.balance) >= 0 ? 'cr-tag' : 'dr-tag'}>
                              {parseFloat(bank.balance) >= 0 ? 'CR' : 'DR'}
                            </span>
                          </td>
                          <td>{bank.status}</td>
                          <td>
                            <button className="btn-ledger" onClick={() => setExpandedId(expandedId === bank.id ? null : bank.id)}>
                              {expandedId === bank.id ? '✖' : '➔'}
                            </button>
                          </td>
                        </tr>
                        {expandedId === bank.id && (
                          <tr>
                            <td colSpan="5">
                              <div className="ledger-container fade-in">
                                <div className="ledger-header" style={{display:'flex', justifyContent:'space-between'}}>
                                   <h4>Account Passbook: {bank.accNo}</h4>
                                   <div className="ledger-actions">
                                      <button className="btn-primary" style={{background:'#d32f2f'}}>PDF</button>
                                      <button className="btn-primary" style={{background:'#2e7d32'}}>EXCEL</button>
                                   </div>
                                </div>
                                <table className="inner-ledger">
                                  <thead>
                                    <tr><th>Date</th><th>Particulars</th><th>Receipt (CR)</th><th>Payment (DR)</th><th>Balance</th></tr>
                                  </thead>
                                  <tbody>
                                    <tr><td>01/04/2026</td><td>Opening Balance</td><td>-</td><td>-</td><td>{bank.balance}</td></tr>
                                    {ledgerData.map(t => (
                                      <tr key={t.id}>
                                        <td>{t.date}</td><td>{t.particular}</td>
                                        <td style={{color:'green'}}>{t.type === 'Receipt' ? `⬇ ${t.amount} CR` : '-'}</td>
                                        <td style={{color:'red'}}>{t.type === 'Payment' ? `⬆ ${t.amount} DR` : '-'}</td>
                                        <td>{t.runningBal}</td>
                                      </tr>
                                    ))}
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
          </>
        )}

        {activeTab === "Firm Master" && (
          <div className="card-premium">
            <h3>Firm Entry Form</h3>
            <div className="master-form">
              <input placeholder="Firm Name" onChange={e => setFormData({...formData, name: e.target.value})} />
              <input placeholder="Firm Address" onChange={e => setFormData({...formData, address: e.target.value})} />
              <input placeholder="GST No" onChange={e => setFormData({...formData, gst: e.target.value})} />
              <button className="btn-primary" onClick={() => handleSave("firms")}>Save Firm</button>
            </div>
            <table className="pro-table">
               <thead><tr><th>Firm Name</th><th>GST</th><th>Status</th><th>Action</th></tr></thead>
               <tbody>
                 {firms.map(f => (
                   <tr key={f.id}>
                     <td>{f.name}</td><td>{f.gst}</td><td>{f.status} {f.closeDate && `(${f.closeDate})`}</td>
                     <td>
                        <span className="btn-edit">Edit</span>
                        <span className="btn-delete" onClick={() => closeRecord(f.id, "firms")}>Close</span>
                     </td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        )}

        {/* BANK MASTER & USER MASTER follow similar logic */}
        {/* FOOTER (Point 4) */}
        <div className="footer-right">
          <div className="footer-txt">Developed by: SOFTVIEW TECHNOLOGIES</div>
          <div className="footer-phone">+91 7972084304</div>
        </div>
      </div>
    </div>
  );
}

function LoginScreen() {
  const [e, setE] = useState("");
  const [p, setP] = useState("");
  const handleLogin = (submitE) => {
    submitE.preventDefault();
    signInWithEmailAndPassword(auth, e, p).catch(err => alert("Login Failed"));
  };
  return (
    <div className="login-bg">
      <div className="login-card">
        <div style={{fontSize: '50px'}}>🏦</div>
        <div className="brand-dark">BANKING PRO</div>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email Address" onChange={(ev)=>setE(ev.target.value)} required />
          <input type="password" placeholder="Password" onChange={(ev)=>setP(ev.target.value)} required />
          <button type="submit" className="btn-auth" style={{background:'#0a0e2e', color:'#ffca28', width:'100%', padding:'12px', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'bold'}}>LOGIN TO SYSTEM</button>
        </form>
        <div style={{marginTop:'20px', fontSize:'12px', color:'#666'}}>Developed by SOFTVIEW TECHNOLOGIES</div>
      </div>
    </div>
  );
}