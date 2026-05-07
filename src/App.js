import React, { useState, useEffect } from "react";
import "./App.css";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc } from "firebase/firestore";

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [time, setTime] = useState(new Date());

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
    <div style={{background:'#0f172a', height:'100vh', display:'flex', justifyContent:'center', alignItems:'center'}}>
      <div className="card" style={{width:'350px', textAlign:'center'}}>
        <h2>ADMIN LOGIN</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          signInWithEmailAndPassword(auth, e.target.email.value, e.target.pass.value);
        }}>
          <input name="email" type="email" placeholder="Email" style={{width:'100%', padding:'10px', margin:'10px 0'}} required />
          <input name="pass" type="password" placeholder="Password" style={{width:'100%', padding:'10px', margin:'10px 0'}} required />
          <button type="submit" style={{width:'100%', padding:'10px', background:'#2563eb', color:'white', border:'none', borderRadius:'5px'}}>LOGIN</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="app-shell">
      <div className="sidebar">
        <div className="sidebar-brand">BANKING ERP</div>
        <div className="nav-links">
          {['Dashboard', 'Firm Master', 'Bank Master', 'User Master'].map(tab => (
            <div key={tab} className={`nav-item ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</div>
          ))}
        </div>
        <div style={{padding:'20px'}}><button onClick={() => signOut(auth)} className="logout-btn">Log Out</button></div>
      </div>

      <div className="main-stage">
        <div className="top-nav">
          <div className="user-meta">
            <span className="name">{user.email}</span>
            <span className="clock">{time.toLocaleDateString()} || {time.toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="content-area">
          {activeTab === "Dashboard" && (
            <div className="card">
              <h3>Consolidated Bank Summary</h3>
              <table className="pro-table">
                <thead>
                  <tr><th>Firm Name</th><th>Bank</th><th>A/c No</th><th>Balance</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {banks.map(b => (
                    <tr key={b.id}>
                      <td>{b.firmName}</td>
                      <td>{b.bankName}</td>
                      <td>{b.accNo}</td>
                      <td>₹ {b.balance} {b.type === 'Receipt' ? <span className="amt-down">↓</span> : <span className="amt-up">↑</span>}</td>
                      <td><span className={`status-tag ${b.status === 'Active' ? 'status-active' : 'status-closed'}`}>{b.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "Firm Master" && (
            <div className="card">
              <h3>🏢 Add New Firm</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                addDoc(collection(db, "firms"), { name: e.target.fName.value });
                e.target.reset();
              }}>
                <input name="fName" placeholder="Firm Name" style={{padding:'10px', marginRight:'10px'}} required />
                <button type="submit">Add Firm</button>
              </form>
            </div>
          )}

          {activeTab === "Bank Master" && (
            <div className="card">
              <h3>🏦 Bank Setup</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                addDoc(collection(db, "banks"), {
                  firmName: e.target.fSelect.value,
                  bankName: e.target.bName.value,
                  accNo: e.target.acc.value,
                  balance: e.target.bal.value,
                  status: 'Active'
                });
                e.target.reset();
              }}>
                <select name="fSelect" required style={{padding:'10px', margin:'5px'}}>
                  <option value="">Select Firm</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
                <input name="bName" placeholder="Bank Name" style={{padding:'10px', margin:'5px'}} required />
                <input name="acc" placeholder="Account Number" style={{padding:'10px', margin:'5px'}} required />
                <input name="bal" placeholder="Opening Balance" style={{padding:'10px', margin:'5px'}} required />
                <button type="submit">Link Bank</button>
              </form>
            </div>
          )}
        </div>

        <div className="footer-fix">Developed by <strong>Softview Technologies</strong> | 7972084304</div>
      </div>
    </div>
  );
}