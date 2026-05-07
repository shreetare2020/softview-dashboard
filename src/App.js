import React, { useState, useEffect } from "react";
import "./App.css";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc } from "firebase/firestore";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// --- 1. Login Component (Pehle define karna zaruri hai taaki error na aaye) ---
function LoginScreen() {
  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">🏦</div>
        <h1>BANKING PRO</h1>
        <p>CA Enterprise Portal</p>
        <form className="login-form" onSubmit={(e) => {
          e.preventDefault();
          signInWithEmailAndPassword(auth, e.target.email.value, e.target.pass.value);
        }}>
          <div className="input-group">
            <label>Email Address</label>
            <input name="email" type="email" placeholder="admin@softview.com" required />
          </div>
          <div className="input-group">
            <label>Security Password</label>
            <input name="pass" type="password" placeholder="••••••••" required />
          </div>
          <button type="submit" className="login-submit">AUTHORIZE LOGIN</button>
        </form>
        <div className="login-footer-text">Powered by Softview Technologies</div>
      </div>
    </div>
  );
}

// --- 2. Main Dashboard Component ---
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [usersList, setUsersList] = useState([]);
  
  const [selectedFirm, setSelectedFirm] = useState("");
  const [expandedBank, setExpandedBank] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => { clearInterval(timer); unsubscribe(); };
  }, []);

  useEffect(() => {
    if (user) {
      onSnapshot(collection(db, "firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "banks"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "users"), s => setUsersList(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
  }, [user]);

  const exportExcel = (b) => {
    const ws = XLSX.utils.json_to_sheet([{ Date: '07/05/2026', Particulars: 'Opening Balance', Receipt: b.openingBal, Payment: 0, Balance: b.balance }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, `${b.bankName}_Ledger.xlsx`);
  };

  const exportPDF = (b) => {
    const doc = new jsPDF();
    doc.text(`Bank Ledger: ${b.bankName}`, 14, 15);
    doc.autoTable({
      startY: 25,
      head: [['Date', 'Particulars', 'Receipt', 'Payment', 'Balance']],
      body: [['07/05/2026', 'Opening Balance', b.openingBal, '0', b.balance]],
    });
    doc.save(`${b.bankName}_Ledger.pdf`);
  };

  if (loading) return <div className="loading-state">Initialising Secure Access...</div>;
  if (!user) return <LoginScreen />;

  return (
    <div className="app-shell">
      <div className="sidebar">
        <div className="sidebar-brand">BANKING PRO</div>
        <div className="nav-links">
          {['Dashboard', 'Firm Master', 'Bank Master', 'User Master'].map(tab => (
            <div key={tab} className={`nav-item ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</div>
          ))}
        </div>
        <div className="sidebar-footer">
          <span className="softview-logo">SOFTVIEW TECHNOLOGIES</span>
          <div className="contact-pill">📞 +91 7972084304</div>
        </div>
      </div>

      <div className="main-stage">
        <div className="top-right-header">
          <div className="live-clock-box">
            <span>{currentTime.toLocaleDateString('en-GB')}</span>
            <span className="clock-divider">|</span>
            <span className="seconds-clock">{currentTime.toLocaleTimeString()}</span>
          </div>
          <button className="btn-logout" onClick={() => signOut(auth)}>Logout</button>
        </div>

        <div className="content-area">
          {activeTab === "Dashboard" && (
            <div className="fade-in">
              <div className="filter-container">
                <h2 style={{margin:0}}>Bank Summary</h2>
                <select className="pro-select" value={selectedFirm} onChange={(e) => setSelectedFirm(e.target.value)}>
                  <option value="">Select Firm...</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>

              {selectedFirm ? (
                <div className="card">
                  <table className="pro-table">
                    <thead><tr><th>Bank</th><th>A/c No</th><th>Balance</th><th>Action</th></tr></thead>
                    <tbody>
                      {banks.filter(b => b.firmName === selectedFirm).map(b => (
                        <React.Fragment key={b.id}>
                          <tr>
                            <td><strong>{b.bankName}</strong></td>
                            <td>{b.accNo}</td>
                            <td className="txt-success">₹ {b.balance}</td>
                            <td><button className="btn-gold-sm" onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}>Ledger</button></td>
                          </tr>
                          {expandedBank === b.id && (
                            <tr>
                              <td colSpan="4">
                                <div className="ledger-box">
                                  <div className="flex-between">
                                    <h4>Statement: {b.bankName}</h4>
                                    <div>
                                      <button className="btn-excel" onClick={() => exportExcel(b)}>Excel</button>
                                      <button className="btn-pdf" onClick={() => exportPDF(b)}>PDF</button>
                                    </div>
                                  </div>
                                  <table className="pro-table inner">
                                    <thead><tr><th>Date</th><th>Particulars</th><th>Receipt</th><th>Payment</th><th>Balance</th></tr></thead>
                                    <tbody>
                                      <tr><td>07/05/2026</td><td>Opening Balance</td><td>{b.openingBal}</td><td>0</td><td>{b.balance}</td></tr>
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
              ) : <div className="card">Please select a firm from the menu above.</div>}
            </div>
          )}

          {activeTab === "User Master" && (
            <div className="fade-in">
              <div className="card">
                <h3>👥 Create System User</h3>
                <form className="master-form" onSubmit={async (e) => {
                  e.preventDefault();
                  await addDoc(collection(db, "users"), {
                    uName: e.target.uName.value, uEmail: e.target.uEmail.value,
                    uRole: e.target.uRole.value, uPhone: e.target.uPhone.value
                  });
                  e.target.reset();
                }}>
                  <input name="uName" placeholder="Full Name" className="pro-input" required />
                  <input name="uEmail" type="email" placeholder="Email" className="pro-input" required />
                  <input name="uPhone" placeholder="Mobile" className="pro-input" />
                  <select name="uRole" className="pro-input">
                    <option value="Operator">Operator</option>
                    <option value="Admin">Admin</option>
                  </select>
                  <button type="submit" className="btn-gold">Create Access</button>
                </form>
              </div>
              <div className="card mt-20">
                <h3>User History ({usersList.length})</h3>
                <table className="pro-table">
                  <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
                  <tbody>{usersList.map(u => <tr key={u.id}><td>{u.uName}</td><td>{u.uEmail}</td><td>{u.uRole}</td></tr>)}</tbody>
                </table>
              </div>
            </div>
          )}
          {/* Similar Cards for Firm and Bank Master follow... */}
        </div>
      </div>
    </div>
  );
}