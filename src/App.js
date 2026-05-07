import React, { useState, useEffect } from "react";
import "./App.css";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";

function LoginScreen() {
  const handleLogin = (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, e.target.email.value, e.target.pass.value);
  };
  return (
    <div className="login-screen">
      <div className="login-card">
        <div style={{fontSize: '50px', marginBottom: '10px'}}>🏢</div>
        <h1>BANKING PRO</h1>
        <form className="login-form" onSubmit={handleLogin}>
          <input name="email" type="email" placeholder="Email Address" required />
          <input name="pass" type="password" placeholder="Password" required />
          <button type="submit" className="login-submit">LOGIN TO SYSTEM</button>
        </form>
        <div className="sidebar-footer" style={{color: '#666'}}>
          Developed by: <br/><span className="softview-name">SOFTVIEW TECHNOLOGIES</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [expandedLedger, setExpandedLedger] = useState(null); // Expansion Logic
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [selectedFirm, setSelectedFirm] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      onSnapshot(collection(db, "firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "banks"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "users"), s => setUsersList(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
  }, [user]);

  if (!user) return <LoginScreen />;

  return (
    <div className="app-shell">
      <div className="sidebar">
        <div className="sidebar-brand">BANKING PRO</div>
        {['Dashboard', 'Firm Master', 'Bank Master', 'User Master'].map(tab => (
          <div key={tab} className={`nav-item ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </div>
        ))}
        <div className="sidebar-footer">
          Developed by:<br/><span className="softview-name">SOFTVIEW TECHNOLOGIES</span><br/>
          📞 +91 7972084304
        </div>
      </div>

      <div className="main-stage">
        <div className="top-nav">
          <div>Welcome, <strong>{user.email.toUpperCase()}</strong></div>
          <button className="btn-action btn-pdf" onClick={() => signOut(auth)}>LOGOUT</button>
        </div>

        <div className="content-area">
          {activeTab === "Dashboard" && (
            <div className="fade-in">
              <div className="card-premium" style={{background: '#161b22', color: 'white'}}>
                <label>SELECT FIRM HERE:</label>
                <select className="pro-select" style={{width: '100%', padding: '10px', marginTop: '10px'}} value={selectedFirm} onChange={(e) => setSelectedFirm(e.target.value)}>
                  <option value="">-- Choose Firm --</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>

              {selectedFirm && (
                <div className="card-premium">
                  <table className="pro-table">
                    <thead><tr><th>Bank Name</th><th>Branch</th><th>Balance</th><th>Actions</th></tr></thead>
                    <tbody>
                      {banks.filter(b => b.firmName === selectedFirm).map(b => (
                        <React.Fragment key={b.id}>
                          <tr>
                            <td>{b.bankName}</td><td>{b.branch}</td>
                            <td style={{color: 'green', fontWeight: 'bold'}}>₹ {b.balance}</td>
                            <td>
                              <button className="btn-action btn-ledger" onClick={() => setExpandedLedger(expandedLedger === b.id ? null : b.id)}>
                                {expandedLedger === b.id ? 'Close' : 'Ledger'}
                              </button>
                            </td>
                          </tr>
                          {expandedLedger === b.id && (
                            <tr className="ledger-row">
                              <td colSpan="4">
                                <div style={{padding: '20px'}}>
                                  <h4>Account No: {b.accNo} | IFSC: {b.ifsc}</h4>
                                  <div style={{marginTop: '10px'}}>
                                    <button className="btn-action btn-pdf">DOWNLOAD PDF</button>
                                    <button className="btn-action btn-excel">DOWNLOAD EXCEL</button>
                                  </div>
                                  <p style={{marginTop: '15px', color: '#666'}}>Ledger entries will appear here from Firebase...</p>
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

          {activeTab !== "Dashboard" && (
            <div className="card-premium">
              <h2 style={{borderBottom: '2px solid var(--accent)', paddingBottom: '10px'}}>{activeTab}</h2>
              <table className="pro-table">
                <thead>
                  {activeTab === "Firm Master" && <tr><th>Firm Name</th><th>GST No</th><th>Address</th></tr>}
                  {activeTab === "Bank Master" && <tr><th>Firm</th><th>Bank</th><th>A/c No</th><th>IFSC</th></tr>}
                  {activeTab === "User Master" && <tr><th>Username</th><th>Email</th><th>Role</th></tr>}
                </thead>
                <tbody>
                  {activeTab === "Firm Master" && firms.map(f => <tr key={f.id}><td>{f.name}</td><td>{f.gst}</td><td>{f.address}</td></tr>)}
                  {activeTab === "Bank Master" && banks.map(b => <tr key={b.id}><td>{b.firmName}</td><td>{b.bankName}</td><td>{b.accNo}</td><td>{b.ifsc}</td></tr>)}
                  {activeTab === "User Master" && usersList.map(u => <tr key={u.id}><td>{u.uName}</td><td>{u.uEmail}</td><td>{u.role || 'Staff'}</td></tr>)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}