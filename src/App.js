import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from "./firebase"; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const unsubFirms = onSnapshot(collection(db, "firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
      const unsubBanks = onSnapshot(collection(db, "banks"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
      return () => { unsubFirms(); unsubBanks(); };
    }
  }, [user]);

  const handleLogin = (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password).catch(err => alert("Login Failed: " + err.message));
  };

  // LOGIN PAGE UI (image_deac70 look)
  if (!user) {
    return (
      <div className="login-bg">
        <div className="login-card">
          <div className="login-icon">🏢</div>
          <h2 className="brand-dark">BANKING PRO</h2>
          <form onSubmit={handleLogin}>
            <input type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
            <button type="submit" className="btn-auth">LOGIN</button>
          </form>
          <div className="login-footer">Developed by: SOFTVIEW TECHNOLOGIES</div>
        </div>
      </div>
    );
  }

  // MAIN DASHBOARD UI
  return (
    <div className="app-shell">
      <div className="sidebar">
        <div className="brand">BANKING PRO</div>
        {['Dashboard', 'Firm Master', 'Bank Master', 'User Master'].map(tab => (
          <div key={tab} className={`nav-item ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </div>
        ))}
        <div className="dev-footer">
          Developed by:<br/>
          <strong>SOFTVIEW TECHNOLOGIES</strong><br/>
          +91 7972084304
        </div>
      </div>

      <div className="main-content">
        <header className="top-bar">
          <span>Welcome, <strong>{user.email}</strong></span>
          <button className="logout-btn" onClick={() => signOut(auth)}>LOGOUT</button>
        </header>

        {activeTab === "Dashboard" && (
          <div className="card">
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
                        <button className={`btn-ledger ${expandedId === bank.id ? 'active' : ''}`} 
                                onClick={() => setExpandedId(expandedId === bank.id ? null : bank.id)}>
                          {expandedId === bank.id ? 'Close' : 'Ledger'}
                        </button>
                      </td>
                    </tr>
                    {expandedId === bank.id && (
                      <tr>
                        <td colSpan="4">
                          <div className="ledger-box">
                            <div className="ledger-header">
                              <span><strong>IFSC:</strong> {bank.ifsc || 'N/A'}</span>
                              <div className="export-group">
                                <button className="exp-btn pdf">DOWNLOAD PDF</button>
                                <button className="exp-btn excel">DOWNLOAD EXCEL</button>
                              </div>
                            </div>
                            <p style={{textAlign:'center', color:'#999'}}>No transactions found.</p>
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
    </div>
  );
}