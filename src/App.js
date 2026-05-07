import React, { useState, useEffect } from "react";
import "./App.css";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc } from "firebase/firestore";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Login Screen Component (Pehle rakha hai taaki build error na aaye)
function LoginScreen() {
  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">🏦</div>
        <h1>BANKING PRO</h1>
        <p>Secure Enterprise Portal</p>
        <form className="login-form" onSubmit={(e) => {
          e.preventDefault();
          signInWithEmailAndPassword(auth, e.target.email.value, e.target.pass.value);
        }}>
          <input name="email" type="email" placeholder="Admin Email" required />
          <input name="pass" type="password" placeholder="Password" required />
          <button type="submit" className="login-submit">AUTHORIZE LOGIN</button>
        </form>
        <div className="login-footer">Powered by Softview Technologies</div>
      </div>
    </div>
  );
}

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
    const ws = XLSX.utils.json_to_sheet([{ Date: currentTime.toLocaleDateString(), Particulars: 'Opening Balance', Receipt: b.openingBal, Payment: 0, Balance: b.balance }]);
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
      body: [[currentTime.toLocaleDateString(), 'Opening Balance', b.openingBal, '0', b.balance]],
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
          {/* DASHBOARD */}
          {activeTab === "Dashboard" && (
            <div className="fade-in">
              <div className="filter-container">
                <h2 style={{margin:0, color:'white'}}>Consolidated Summary</h2>
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
                            <td><button className="btn-gold-sm" onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}>View Ledger</button></td>
                          </tr>
                          {expandedBank === b.id && (
                            <tr>
                              <td colSpan="4">
                                <div className="ledger-box">
                                  <div className="flex-between">
                                    <h4>Ledger: {b.bankName}</h4>
                                    <div className="btn-group">
                                      <button className="btn-excel" onClick={() => exportExcel(b)}>Excel</button>
                                      <button className="btn-pdf" onClick={() => exportPDF(b)}>PDF</button>
                                    </div>
                                  </div>
                                  <table className="pro-table inner">
                                    <thead><tr><th>Date</th><th>Particulars</th><th>Receipt</th><th>Payment</th><th>Balance</th></tr></thead>
                                    <tbody><tr><td>{currentTime.toLocaleDateString()}</td><td>Opening Balance</td><td>{b.openingBal}</td><td>0</td><td>{b.balance}</td></tr></tbody>
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
              ) : <div className="card">Please select a firm to load financial data.</div>}
            </div>
          )}

          {/* FIRM MASTER */}
          {activeTab === "Firm Master" && (
            <div className="fade-in">
              <div className="card">
                <h3>🏢 Register New Firm</h3>
                <form className="master-form" onSubmit={async (e) => {
                  e.preventDefault();
                  await addDoc(collection(db, "firms"), { name: e.target.fName.value, gstin: e.target.fGst.value });
                  e.target.reset();
                }}>
                  <input name="fName" placeholder="Firm Name" className="pro-input" required />
                  <input name="fGst" placeholder="GSTIN" className="pro-input" />
                  <button type="submit" className="btn-gold">Add Firm</button>
                </form>
              </div>
              <div className="card mt-20">
                <h3>Total Firms Open: {firms.length}</h3>
                <table className="pro-table">
                  <thead><tr><th>Firm Name</th><th>GSTIN</th></tr></thead>
                  <tbody>{firms.map(f => <tr key={f.id}><td>{f.name}</td><td>{f.gstin || '-'}</td></tr>)}</tbody>
                </table>
              </div>
            </div>
          )}

          {/* BANK MASTER */}
          {activeTab === "Bank Master" && (
            <div className="fade-in">
              <div className="card">
                <h3>🏦 Add Bank Account</h3>
                <form className="master-form" onSubmit={async (e) => {
                  e.preventDefault();
                  await addDoc(collection(db, "banks"), {
                    firmName: e.target.firm.value, bankName: e.target.bank.value,
                    accNo: e.target.acc.value, openingBal: Number(e.target.bal.value), balance: Number(e.target.bal.value)
                  });
                  e.target.reset();
                }}>
                  <select name="firm" className="pro-input" required>
                    <option value="">Link to Firm</option>
                    {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                  </select>
                  <input name="bank" placeholder="Bank Name" className="pro-input" required />
                  <input name="acc" placeholder="Account No" className="pro-input" required />
                  <input name="bal" placeholder="Opening Bal" type="number" className="pro-input" required />
                  <button type="submit" className="btn-gold">Add Account</button>
                </form>
              </div>
              <div className="card mt-20">
                <h3>Total Accounts Open: {banks.length}</h3>
                <table className="pro-table">
                  <thead><tr><th>Firm</th><th>Bank</th><th>Acc No</th></tr></thead>
                  <tbody>{banks.map(b => <tr key={b.id}><td>{b.firmName}</td><td>{b.bankName}</td><td>{b.accNo}</td></tr>)}</tbody>
                </table>
              </div>
            </div>
          )}

          {/* USER MASTER */}
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
                    <option value="Admin">Admin</option>
                    <option value="Operator">Operator</option>
                  </select>
                  <button type="submit" className="btn-gold">Add User</button>
                </form>
              </div>
              <div className="card mt-20">
                <h3>Total Users Created: {usersList.length}</h3>
                <table className="pro-table">
                  <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
                  <tbody>{usersList.map(u => <tr key={u.id}><td>{u.uName}</td><td>{u.uEmail}</td><td>{u.uRole}</td></tr>)}</tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}