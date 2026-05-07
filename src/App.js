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
  const [expandedBank, setExpandedBank] = useState(null);

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

  if (!user) return (
    <div className="login-screen">
      <div className="login-card">
        <h2 style={{color: '#0f172a'}}>ADMIN SECURE LOGIN</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          signInWithEmailAndPassword(auth, e.target.email.value, e.target.pass.value);
        }}>
          <input name="email" type="email" placeholder="Email Address" style={{width:'100%', padding:'10px', margin:'10px 0'}} required />
          <input name="pass" type="password" placeholder="Password" style={{width:'100%', padding:'10px', margin:'10px 0'}} required />
          <button type="submit" className="btn-save" style={{width:'100%'}}>ACCESS DASHBOARD</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="app-shell">
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-brand">BANKING SYSTEM</div>
        <div className="nav-links">
          {['Dashboard', 'Firm Master', 'Bank Master', 'User Master'].map(tab => (
            <div key={tab} className={`nav-item ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</div>
          ))}
        </div>
        <div style={{padding:'20px'}}><button className="btn-save" style={{background:'#ef4444', width:'100%'}} onClick={() => signOut(auth)}>Logout Session</button></div>
      </div>

      <div className="main-stage">
        {/* 1) TOP RIGHT HEADER */}
        <div className="top-right-header">
          <span className="user-name">{user.email}</span>
          <span className="live-clock">{time.toLocaleDateString('en-GB')} || {time.toLocaleTimeString()}</span>
        </div>

        <div className="content-container">
          {activeTab === "Dashboard" && (
            <div className="card">
              <h3>Consolidated Bank Summary</h3>
              <table className="pro-table">
                <thead>
                  <tr><th>Firm</th><th>Bank Name</th><th>A/c No</th><th>Balance</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {banks.map(b => {
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
                          <td><button onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}>Expand Ledger</button></td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "Firm Master" && (
            <div className="card">
              <h3>🏢 Add New Firm</h3>
              <form className="form-group" onSubmit={(e) => {
                e.preventDefault();
                addDoc(collection(db, "firms"), { name: e.target.fName.value });
                e.target.reset();
              }}>
                <input name="fName" placeholder="Firm Name" required />
                <button type="submit" className="btn-save">Save Firm</button>
              </form>
              <table className="pro-table">
                <thead><tr><th>Sr.</th><th>Firm Name</th></tr></thead>
                <tbody>{firms.map((f, i) => <tr key={f.id}><td>{i+1}</td><td>{f.name}</td></tr>)}</tbody>
              </table>
            </div>
          )}

          {activeTab === "Bank Master" && (
            <div className="card">
              <h3>🏦 Bank Setup & Linking</h3>
              <form className="form-group" onSubmit={(e) => {
                e.preventDefault();
                addDoc(collection(db, "banks"), {
                  bankName: e.target.bName.value,
                  accNo: e.target.acc.value,
                  branch: e.target.branch.value,
                  balance: e.target.bal.value,
                  firmName: e.target.fSelect.value,
                  status: 'Active'
                });
                e.target.reset();
              }}>
                <select name="fSelect" required>
                  <option value="">Select Firm to Link</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
                <input name="bName" placeholder="Bank Name" required />
                <input name="acc" placeholder="Account Number" required />
                <input name="branch" placeholder="Branch" required />
                <input name="bal" placeholder="Opening Balance" type="number" required />
                <button type="submit" className="btn-save">Link & Save Bank</button>
              </form>
            </div>
          )}
        </div>

        {/* 2) BOTTOM LEFT BRANDING */}
        <div className="footer-branding">
          Developed by <strong>Softview Technologies</strong> | Contact: 7972084304
        </div>
      </div>
    </div>
  );
}