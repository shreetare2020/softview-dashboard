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
  
  // Edit States
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

  // --- Handlers ---
  const deleteItem = async (col, id) => {
    if(window.confirm("Kya aap ise delete karna chahte hain?")) {
      await deleteDoc(doc(db, col, id));
    }
  };

  const closeBank = async (id) => {
    const reason = window.prompt("Bank band karne ka karan (Reason):");
    if (reason) {
      await updateDoc(doc(db, "banks", id), {
        status: 'Closed',
        closeReason: reason,
        closeDate: new Date().toLocaleDateString()
      });
    }
  };

  if (!user) return (
    <div className="login-screen">
      <div className="login-card">
        <h2 style={{color: '#0f172a'}}>ADMIN SECURE LOGIN</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          signInWithEmailAndPassword(auth, e.target.email.value, e.target.pass.value);
        }}>
          <input name="email" type="email" placeholder="Email Address" required />
          <input name="pass" type="password" placeholder="Password" type="password" required />
          <button type="submit" className="btn-save" style={{width:'100%'}}>ACCESS DASHBOARD</button>
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
        <div style={{padding:'20px'}}><button className="btn-save" style={{background:'#ef4444', width:'100%'}} onClick={() => signOut(auth)}>Logout Session</button></div>
      </div>

      <div className="main-stage">
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
                      <tr key={b.id} className={isClosed && hasBal ? 'bank-closed-warning' : ''}>
                        <td>{b.firmName}</td>
                        <td>{b.bankName}</td>
                        <td>{b.accNo}</td>
                        <td className={parseFloat(b.balance) >= 0 ? 'amt-receipt' : 'amt-payment'}>
                          ₹ {b.balance} {parseFloat(b.balance) >= 0 ? ' ↓' : ' ↑'}
                        </td>
                        <td>{b.status} {isClosed && `(${b.closeDate})`}</td>
                        <td><button onClick={() => setExpandedBank(b.id)}>Ledger</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "Firm Master" && (
            <div className="card">
              <h3>🏢 Firm Master {editingFirm ? "(Edit Mode)" : "(Add Mode)"}</h3>
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
                <input name="fName" defaultValue={editingFirm?.name || ""} placeholder="Enter Firm Name" required />
                <button type="submit" className="btn-save">{editingFirm ? "Update Firm" : "Save Firm"}</button>
                {editingFirm && <button type="button" onClick={()=>setEditingFirm(null)}>Cancel</button>}
              </form>
              <table className="pro-table">
                <thead><tr><th>Sr.</th><th>Firm Name</th><th>Actions</th></tr></thead>
                <tbody>
                  {firms.map((f, i) => (
                    <tr key={f.id}>
                      <td>{i+1}</td>
                      <td>{f.name}</td>
                      <td>
                        <button onClick={() => setEditingFirm(f)} style={{marginRight:'5px'}}>Edit</button>
                        <button onClick={() => deleteItem("firms", f.id)} style={{color:'red'}}>Delete</button>
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
              <form className="form-group" onSubmit={async (e) => {
                e.preventDefault();
                const data = {
                  bankName: e.target.bName.value,
                  accNo: e.target.acc.value,
                  branch: e.target.branch.value,
                  balance: e.target.bal.value,
                  firmName: e.target.fSelect.value,
                  status: 'Active'
                };
                if(editingBank) {
                  await updateDoc(doc(db, "banks", editingBank.id), data);
                  setEditingBank(null);
                } else {
                  await addDoc(collection(db, "banks"), data);
                }
                e.target.reset();
              }}>
                <select name="fSelect" defaultValue={editingBank?.firmName || ""} required>
                  <option value="">Link Firm</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
                <input name="bName" defaultValue={editingBank?.bankName || ""} placeholder="Bank Name" required />
                <input name="acc" defaultValue={editingBank?.accNo || ""} placeholder="Acc No" required />
                <input name="branch" defaultValue={editingBank?.branch || ""} placeholder="Branch" required />
                <input name="bal" defaultValue={editingBank?.balance || ""} placeholder="Balance" type="number" required />
                <button type="submit" className="btn-save">{editingBank ? "Update Bank" : "Save Bank"}</button>
              </form>
              <table className="pro-table" style={{marginTop:'20px'}}>
                <thead><tr><th>Bank</th><th>Firm</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {banks.map(b => (
                    <tr key={b.id}>
                      <td>{b.bankName}</td>
                      <td>{b.firmName}</td>
                      <td>{b.status}</td>
                      <td>
                        <button onClick={() => setEditingBank(b)}>Edit</button>
                        <button onClick={() => closeBank(b.id)} style={{margin:'0 5px'}}>Close</button>
                        <button onClick={() => deleteItem("banks", b.id)} style={{color:'red'}}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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