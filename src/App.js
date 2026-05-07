import React, { useState, useEffect } from "react";
import "./App.css";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [expandedBankId, setExpandedBankId] = useState(null); 
  const [ledgerData, setLedgerData] = useState([]); // Ledger data state
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [selectedFirm, setSelectedFirm] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // Masters Data loading
  useEffect(() => {
    if (user) {
      onSnapshot(collection(db, "firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "banks"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "users"), s => setUsersList(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
  }, [user]);

  // Specific Ledger Fetching Logic
  useEffect(() => {
    if (expandedBankId) {
      const q = query(collection(db, "transactions"), where("bankId", "==", expandedBankId));
      const unsub = onSnapshot(q, (s) => {
        setLedgerData(s.docs.map(d => ({id: d.id, ...d.data()})));
      });
      return () => unsub();
    } else {
      setLedgerData([]);
    }
  }, [expandedBankId]);

  if (!user) return <LoginScreen />;

  const handleExpand = (bankId) => {
    setExpandedBankId(expandedBankId === bankId ? null : bankId);
  };

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
              <div className="card-premium dark-box">
                <label>SELECT FIRM HERE:</label>
                <select className="pro-select" value={selectedFirm} onChange={(e) => setSelectedFirm(e.target.value)}>
                  <option value="">-- Choose Firm --</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>

              {selectedFirm && (
                <div className="card-premium">
                  <table className="pro-table">
                    <thead><tr><th>Bank Name</th><th>Branch</th><th>Balance</th><th>Action</th></tr></thead>
                    <tbody>
                      {banks.filter(b => b.firmName === selectedFirm).map(b => (
                        <React.Fragment key={b.id}>
                          <tr>
                            <td>{b.bankName}</td><td>{b.branch}</td>
                            <td className="bal-text">₹ {b.balance}</td>
                            <td>
                              <button className={`btn-action ${expandedBankId === b.id ? 'btn-close' : 'btn-ledger'}`} onClick={() => handleExpand(b.id)}>
                                {expandedBankId === b.id ? 'Close' : 'Ledger'}
                              </button>
                            </td>
                          </tr>
                          {expandedBankId === b.id && (
                            <tr className="ledger-row">
                              <td colSpan="4">
                                <div className="ledger-container">
                                  <div className="ledger-header">
                                    <span><strong>Account No:</strong> {b.accNo}</span>
                                    <span><strong>IFSC:</strong> {b.ifsc || 'N/A'}</span>
                                  </div>
                                  <div className="ledger-buttons">
                                    <button className="btn-action btn-pdf">DOWNLOAD PDF</button>
                                    <button className="btn-action btn-excel">DOWNLOAD EXCEL</button>
                                  </div>
                                  <table className="inner-table">
                                    <thead><tr><th>Date</th><th>Particulars</th><th>Debit</th><th>Credit</th></tr></thead>
                                    <tbody>
                                      {ledgerData.length > 0 ? ledgerData.map(t => (
                                        <tr key={t.id}><td>{t.date}</td><td>{t.desc}</td><td>{t.dr}</td><td>{t.cr}</td></tr>
                                      )) : <tr><td colSpan="4" style={{textAlign:'center', padding:'20px'}}>No transactions found for this account.</td></tr>}
                                    </tbody>
                                  </table>
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

          {/* Masters with all fields */}
          {activeTab !== "Dashboard" && (
            <div className="card-premium">
              <h2>{activeTab}</h2>
              <table className="pro-table">
                <thead>
                  {activeTab === "Firm Master" && <tr><th>Firm Name</th><th>GST No</th><th>Address</th></tr>}
                  {activeTab === "Bank Master" && <tr><th>Bank Name</th><th>A/c No</th><th>IFSC</th><th>Firm</th></tr>}
                  {activeTab === "User Master" && <tr><th>Full Name</th><th>Email</th><th>Role</th></tr>}
                </thead>
                <tbody>
                  {activeTab === "Firm Master" && firms.map(f => <tr key={f.id}><td>{f.name}</td><td>{f.gst}</td><td>{f.address}</td></tr>)}
                  {activeTab === "Bank Master" && banks.map(b => <tr key={b.id}><td>{b.bankName}</td><td>{b.accNo}</td><td>{b.ifsc}</td><td>{b.firmName}</td></tr>)}
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

function LoginScreen() {
  const handleLogin = (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, e.target.email.value, e.target.pass.value).catch(err => alert("Invalid Login"));
  };
  return (
    <div className="login-screen">
      <div className="login-card">
        <div style={{fontSize: '50px'}}>🏢</div>
        <h1>BANKING PRO</h1>
        <form className="login-form" onSubmit={handleLogin}>
          <input name="email" type="email" placeholder="Email" required />
          <input name="pass" type="password" placeholder="Password" required />
          <button type="submit" className="login-submit">LOGIN</button>
        </form>
        <p>Developed by: <span className="softview-name">SOFTVIEW TECHNOLOGIES</span></p>
      </div>
    </div>
  );
}