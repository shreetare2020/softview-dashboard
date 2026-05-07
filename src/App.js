import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from "./firebase"; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [banks, setBanks] = useState([]);
  const [firms, setFirms] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  useEffect(() => {
    if (user) {
      onSnapshot(collection(db, "banks"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "users"), s => setUsersList(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
  }, [user]);

  const handleLogin = (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password).catch(() => alert("Galt Details!"));
  };

  if (!user) {
    return (
      <div className="login-bg">
        <div className="login-card">
          <div style={{fontSize: '50px'}}>🏢</div>
          <h2 className="brand-dark">BANKING PRO</h2>
          <form onSubmit={handleLogin}>
            <input type="email" placeholder="Email" onChange={(e)=>setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" onChange={(e)=>setPassword(e.target.value)} required />
            <button type="submit" className="btn-auth">LOGIN</button>
          </form>
          <div className="dev-footer">Powered by <strong>SOFTVIEW TECHNOLOGIES</strong></div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="sidebar">
        <div className="brand">BANKING PRO</div>
        {['Dashboard', 'Firm Master', 'Bank Master', 'User Master'].map(tab => (
          <div key={tab} className={`nav-item ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </div>
        ))}
        <div className="dev-footer">Developed by: <strong>SOFTVIEW TECHNOLOGIES</strong><br/>+91 7972084304</div>
      </div>

      <div className="main-content">
        <header className="top-bar card" style={{display:'flex', justifyContent:'space-between', padding:'15px 25px'}}>
          <span>Welcome, <strong>{user.email}</strong></span>
          <button className="exp-btn pdf" onClick={() => signOut(auth)}>LOGOUT</button>
        </header>

        <div className="card">
          <h2 style={{color: '#0a0e2e', marginBottom: '20px'}}>{activeTab}</h2>
          
          {activeTab === "Dashboard" ? (
            <table className="pro-table">
              <thead>
                <tr><th>Bank Name</th><th>Account No</th><th>Balance</th><th>Action</th></tr>
              </thead>
              <tbody>
                {banks.map(bank => (
                  <React.Fragment key={bank.id}>
                    <tr>
                      <td>{bank.bankName}</td>
                      <td><strong>{bank.accNo}</strong></td>
                      <td className="amt">₹ {bank.balance}</td>
                      <td>
                        <button className="btn-ledger" onClick={() => setExpandedId(expandedId === bank.id ? null : bank.id)}>
                          {expandedId === bank.id ? 'Close' : 'Ledger'}
                        </button>
                      </td>
                    </tr>
                    {expandedId === bank.id && (
                      <tr>
                        <td colSpan="4">
                          <div className="ledger-box">
                            <div style={{display:'flex', justifyContent:'space-between'}}>
                              <span><strong>IFSC:</strong> {bank.ifsc}</span>
                              <div>
                                <button className="exp-btn pdf">PDF</button>
                                <button className="exp-btn excel">EXCEL</button>
                              </div>
                            </div>
                            <p style={{marginTop:'15px', color:'#999'}}>Transactions fetching...</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="pro-table">
              <thead>
                {activeTab === "User Master" ? <tr><th>Name</th><th>Email</th><th>Role</th></tr> : 
                 activeTab === "Firm Master" ? <tr><th>Firm Name</th><th>GST</th><th>Address</th></tr> :
                 <tr><th>Bank</th><th>Acc No</th><th>Firm</th></tr>}
              </thead>
              <tbody>
                {activeTab === "User Master" && usersList.map(u => <tr key={u.id}><td>{u.uName}</td><td>{u.uEmail}</td><td>{u.role}</td></tr>)}
                {activeTab === "Firm Master" && firms.map(f => <tr key={f.id}><td>{f.name}</td><td>{f.gst}</td><td>{f.address}</td></tr>)}
                {activeTab === "Bank Master" && banks.map(b => <tr key={b.id}><td>{b.bankName}</td><td>{b.accNo}</td><td>{b.firmName}</td></tr>)}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}