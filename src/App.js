import React, { useState, useEffect } from "react";
import "./App.css";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc } from "firebase/firestore";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// --- Login Screen ---
function LoginScreen() {
  return (
    <div style={{background: '#0f172a', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{background: 'white', padding: '50px', borderRadius: '30px', width: '380px', textAlign: 'center'}}>
        <h1 style={{color: '#0f172a', marginBottom: '30px'}}>BANKING PRO</h1>
        <form onSubmit={(e) => {
          e.preventDefault();
          signInWithEmailAndPassword(auth, e.target.email.value, e.target.pass.value);
        }}>
          <input name="email" type="email" placeholder="Email" style={{width:'100%', padding:'15px', marginBottom:'15px', borderRadius:'10px', border:'1px solid #ddd'}} required />
          <input name="pass" type="password" placeholder="Password" style={{width:'100%', padding:'15px', marginBottom:'25px', borderRadius:'10px', border:'1px solid #ddd'}} required />
          <button type="submit" style={{width:'100%', padding:'15px', background:'#0f172a', color:'#fbbf24', border:'none', borderRadius:'10px', fontWeight:'bold', cursor:'pointer'}}>AUTHORIZE LOGIN</button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [selectedFirm, setSelectedFirm] = useState("");
  const [expandedBank, setExpandedBank] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => { clearInterval(timer); unsubscribe(); };
  }, []);

  useEffect(() => {
    if (user) {
      onSnapshot(collection(db, "firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "banks"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
  }, [user]);

  if (!user) return <LoginScreen />;

  return (
    <div className="app-shell">
      <div className="sidebar">
        <div className="sidebar-brand">BANKING PRO</div>
        <div className="nav-links">
          {['Dashboard', 'Firm Master', 'Bank Master', 'User Master'].map(t => (
            <div key={t} className={`nav-item ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t}</div>
          ))}
        </div>
        <div className="sidebar-footer">
          <strong>SOFTVIEW TECHNOLOGIES</strong><br/>
          📞 +91 7972084304
        </div>
      </div>

      <div className="main-stage">
        <div className="top-nav">
          <div className="user-welcome">Welcome, <strong>{user.email.toUpperCase()}</strong></div>
          <div className="live-clock">
            {currentTime.toLocaleDateString('en-GB')} | {currentTime.toLocaleTimeString()}
          </div>
          <button onClick={() => signOut(auth)} style={{cursor:'pointer', border:'none', background:'#fee2e2', color:'#ef4444', padding:'8px 15px', borderRadius:'8px', fontWeight:'600'}}>Logout</button>
        </div>

        <div className="content-area">
          {activeTab === "Dashboard" && (
            <>
              <div className="filter-section">
                <span className="filter-label">Select Firm Here:</span>
                <select className="pro-select" value={selectedFirm} onChange={(e) => setSelectedFirm(e.target.value)}>
                  <option value="">-- Choose Firm --</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>

              {selectedFirm ? (
                <div className="card-premium">
                  <table className="pro-table">
                    <thead><tr><th>Bank Name</th><th>Branch</th><th>Current Bal.</th><th>Action</th></tr></thead>
                    <tbody>
                      {banks.filter(b => b.firmName === selectedFirm).map(b => (
                        <React.Fragment key={b.id}>
                          <tr>
                            <td>{b.bankName}</td><td>{b.branch}</td><td>₹ {b.balance}</td>
                            <td><button className="btn-ledger" onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}>Ledger</button></td>
                          </tr>
                          {expandedBank === b.id && (
                            <tr style={{background:'#f8fafc'}}>
                              <td colSpan="4" style={{padding:'20px'}}>
                                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                  <span>Account No: <strong>{b.accNo}</strong></span>
                                  <button style={{background:'#0f172a', color:'white', padding:'8px 15px', borderRadius:'6px', cursor:'pointer'}}>Download PDF</button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <div style={{textAlign:'center', marginTop:'50px', color:'#94a3b8'}}>Please select a firm to view detailed reports.</div>}
            </>
          )}

          {activeTab !== "Dashboard" && (
            <div className="card-premium" style={{padding:'30px'}}>
              <h3>{activeTab} Content</h3>
              <p>Master forms and tables are restored here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}