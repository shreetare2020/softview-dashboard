import React, { useState, useEffect } from "react";
import "./App.css";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// --- Login Screen ---
function LoginScreen() {
  const handleLogin = (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, e.target.email.value, e.target.pass.value);
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">🏢</div>
        <h1>BANKING PRO</h1>
        <form className="login-form" onSubmit={handleLogin}>
          <input name="email" type="email" placeholder="Email Address" required />
          <input name="pass" type="password" placeholder="Password" required />
          <button type="submit" className="login-submit">AUTHORIZE LOGIN</button>
        </form>
        <div className="login-footer">
          Developed by:<br/>
          <strong>SOFTVIEW TECHNOLOGIES</strong><br/>
          📞 +91 7972084304
        </div>
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
  const [usersList, setUsersList] = useState([]);
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
      onSnapshot(collection(db, "users"), s => setUsersList(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
  }, [user]);

  const exportPDF = (b) => {
    const docObj = new jsPDF();
    docObj.text("Bank Statement Report", 14, 20);
    docObj.autoTable({
      startY: 30,
      head: [['Firm', 'Bank', 'A/c No', 'Branch', 'Balance']],
      body: [[b.firmName, b.bankName, b.accNo, b.branch, `Rs. ${b.balance}`]],
    });
    docObj.save(`${b.bankName}_Statement.pdf`);
  };

  const exportExcel = (data, fileName) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  if (!user) return <LoginScreen />;

  return (
    <div className="app-shell">
      <div className="sidebar">
        <div className="sidebar-brand">BANKING PRO</div>
        <div className="nav-links">
          {['Dashboard', 'Firm Master', 'Bank Master', 'User Master'].map(tab => (
            <div key={tab} className={`nav-item ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab}
            </div>
          ))}
        </div>
        <div className="sidebar-footer">
          <div style={{opacity: 0.7, marginBottom: '5px'}}>Developed by:</div>
          <span className="softview-name">SOFTVIEW TECHNOLOGIES</span><br/>
          <span className="contact-pill">📞 +91 7972084304</span>
        </div>
      </div>

      <div className="main-stage">
        <div className="top-nav">
          <div className="user-welcome">Welcome, <strong>{user.email.toUpperCase()}</strong></div>
          <div className="live-clock">{currentTime.toLocaleDateString('en-GB')} | {currentTime.toLocaleTimeString()}</div>
          <button className="btn-logout" onClick={() => signOut(auth)}>Logout</button>
        </div>

        <div className="content-area">
          {activeTab === "Dashboard" && (
            <div className="fade-in">
              <div className="filter-card">
                <label className="filter-label">SELECT FIRM HERE:</label>
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
                            <td>{b.bankName}</td><td>{b.branch}</td><td className="txt-success">₹ {b.balance}</td>
                            <td><button className="btn-ledger" onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}>Ledger</button></td>
                          </tr>
                          {expandedBank === b.id && (
                            <tr className="ledger-row">
                              <td colSpan="4">
                                <div className="ledger-container-premium">
                                  <div className="ledger-header-info">
                                    <div>
                                      <span className="acc-label">Account Identification</span>
                                      <span className="acc-number-big">{b.accNo}</span>
                                    </div>
                                    <div className="action-buttons-group">
                                      <button className="btn-premium-pdf" onClick={() => exportPDF(b)}>📄 PDF</button>
                                      <button className="btn-premium-excel" onClick={() => exportExcel([b], b.bankName)}>📊 Excel</button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <div className="empty-state">Select a firm to view reports.</div>}
            </div>
          )}

          {activeTab !== "Dashboard" && (
            <div className="card-premium master-view">
              <h3>{activeTab} Data</h3>
              <table className="pro-table">
                <thead>
                  {activeTab === "Firm Master" && <tr><th>Firm Name</th><th>Address</th></tr>}
                  {activeTab === "Bank Master" && <tr><th>Firm</th><th>Bank</th><th>A/c No</th><th>Balance</th></tr>}
                  {activeTab === "User Master" && <tr><th>Name</th><th>Email</th><th>Mobile</th></tr>}
                </thead>
                <tbody>
                  {activeTab === "Firm Master" && firms.map(f => <tr key={f.id}><td>{f.name}</td><td>{f.address}</td></tr>)}
                  {activeTab === "Bank Master" && banks.map(b => <tr key={b.id}><td>{b.firmName}</td><td>{b.bankName}</td><td>{b.accNo}</td><td>₹ {b.balance}</td></tr>)}
                  {activeTab === "User Master" && usersList.map(u => <tr key={u.id}><td>{u.uName}</td><td>{u.uEmail}</td><td>{u.uMobile}</td></tr>)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}