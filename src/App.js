import React, { useState, useEffect } from "react";
import "./App.css";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc } from "firebase/firestore";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Fix: LoginScreen defined before use to prevent Vercel Build Error
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
          <input name="email" type="email" placeholder="Email Address" required />
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

  const exportExcel = (b) => {
    const ws = XLSX.utils.json_to_sheet([{ Date: currentTime.toLocaleDateString(), Particulars: 'Opening Balance', Balance: b.balance }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, `${b.bankName}_Ledger.xlsx`);
  };

  const exportPDF = (b) => {
    const doc = new jsPDF();
    doc.text(`Bank Statement: ${b.bankName}`, 14, 15);
    doc.autoTable({
      startY: 25,
      head: [['Date', 'Particulars', 'Balance']],
      body: [[currentTime.toLocaleDateString(), 'Opening Balance', b.balance]],
    });
    doc.save(`${b.bankName}_Statement.pdf`);
  };

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
                <label className="filter-label">SELECT FIRM HERE:</label>
                <select className="pro-select-premium" value={selectedFirm} onChange={(e) => setSelectedFirm(e.target.value)}>
                  <option value="">-- Choose Firm --</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>
              {selectedFirm ? (
                <div className="card-premium">
                  <table className="pro-table">
                    <thead><tr><th>Bank</th><th>A/c No</th><th>Balance</th><th>Action</th></tr></thead>
                    <tbody>
                      {banks.filter(b => b.firmName === selectedFirm).map(b => (
                        <React.Fragment key={b.id}>
                          <tr>
                            <td><strong>{b.bankName}</strong></td><td>{b.accNo}</td>
                            <td className="txt-success">₹ {b.balance}</td>
                            <td><button className="btn-gold-sm" onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}>Ledger</button></td>
                          </tr>
                          {expandedBank === b.id && (
                            <tr>
                              <td colSpan="4">
                                <div className="ledger-panel">
                                  <div className="flex-between mb-10">
                                    <span className="ledger-title">Statement</span>
                                    <div className="btn-group">
                                      <button className="btn-excel-sm" onClick={() => exportExcel(b)}>Excel</button>
                                      <button className="btn-pdf-sm" onClick={() => exportPDF(b)}>PDF</button>
                                    </div>
                                  </div>
                                  <table className="pro-table inner">
                                    <thead><tr><th>Date</th><th>Particulars</th><th>Balance</th></tr></thead>
                                    <tbody><tr><td>{currentTime.toLocaleDateString()}</td><td>Opening Balance</td><td>{b.balance}</td></tr></tbody>
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
              ) : <div className="card-premium">Please select a firm from the menu above to view reports.</div>}
            </div>
          )}

          {activeTab === "User Master" && (
            <div className="fade-in">
              <div className="card-premium">
                <h3>👥 User Access Management</h3>
                <form className="master-grid-form" onSubmit={async (e) => {
                  e.preventDefault();
                  await addDoc(collection(db, "users"), {
                    uName: e.target.uName.value, uEmail: e.target.uEmail.value,
                    uPass: e.target.uPass.value, uPhone: e.target.uPhone.value, uRole: e.target.uRole.value
                  });
                  e.target.reset();
                }}>
                  <input name="uName" placeholder="Full Name" className="pro-input" required />
                  <input name="uEmail" type="email" placeholder="Email" className="pro-input" required />
                  <input name="uPass" type="password" placeholder="Password" className="pro-input" required />
                  <input name="uPhone" placeholder="Mobile No" className="pro-input" required />
                  <select name="uRole" className="pro-input">
                    <option value="Admin">Admin</option>
                    <option value="Operator">Operator</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                  <button type="submit" className="btn-gold">Create User</button>
                </form>
              </div>
              <div className="card-premium mt-20">
                <table className="pro-table">
                  <thead><tr><th>Name</th><th>Mobile</th><th>Role</th><th>Actions</th></tr></thead>
                  <tbody>
                    {usersList.map(u => (
                      <tr key={u.id}>
                        <td>{u.uName}</td><td>{u.uPhone}</td><td>{u.uRole}</td>
                        <td>
                          <button className="btn-edit-sm">Edit</button>
                          <button className="btn-del-sm" onClick={async () => {if(window.confirm("Delete User?")) await deleteDoc(doc(db, "users", u.id))}}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "Firm Master" && (
            <div className="fade-in">
              <div className="card-premium">
                <h3>🏢 Firm Registration</h3>
                <form className="master-grid-form" onSubmit={async (e) => {
                  e.preventDefault();
                  await addDoc(collection(db, "firms"), { name: e.target.fName.value, address: e.target.fAddr.value });
                  e.target.reset();
                }}>
                  <input name="fName" placeholder="Firm Name" className="pro-input" required />
                  <input name="fAddr" placeholder="Firm Address" className="pro-input" required />
                  <button type="submit" className="btn-gold">Save Firm</button>
                </form>
              </div>
              <div className="card-premium mt-20">
                <table className="pro-table">
                  <thead><tr><th>Firm Name</th><th>Address</th><th>Actions</th></tr></thead>
                  <tbody>
                    {firms.map(f => (
                      <tr key={f.id}>
                        <td>{f.name}</td><td>{f.address}</td>
                        <td>
                          <button className="btn-edit-sm">Edit</button>
                          <button className="btn-del-sm" onClick={async () => {if(window.confirm("Delete?")) await deleteDoc(doc(db, "firms", f.id))}}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "Bank Master" && (
            <div className="fade-in">
              <div className="card-premium">
                <h3>🏦 Bank Account Master</h3>
                <form className="master-grid-form" onSubmit={async (e) => {
                  e.preventDefault();
                  await addDoc(collection(db, "banks"), {
                    firmName: e.target.firm.value, bankName: e.target.bank.value,
                    branch: e.target.branch.value, accNo: e.target.acc.value, balance: Number(e.target.bal.value)
                  });
                  e.target.reset();
                }}>
                  <select name="firm" className="pro-input">{firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}</select>
                  <input name="bank" placeholder="Bank Name" className="pro-input" required />
                  <input name="branch" placeholder="Branch Name" className="pro-input" required />
                  <input name="acc" placeholder="Account No" className="pro-input" required />
                  <input name="bal" placeholder="Opening Balance" type="number" className="pro-input" required />
                  <button type="submit" className="btn-gold">Add Bank</button>
                </form>
              </div>
              <div className="card-premium mt-20">
                <table className="pro-table">
                  <thead><tr><th>Bank</th><th>Branch</th><th>Actions</th></tr></thead>
                  <tbody>
                    {banks.map(b => (
                      <tr key={b.id}>
                        <td>{b.bankName}</td><td>{b.branch}</td>
                        <td>
                          <button className="btn-edit-sm">Edit</button>
                          <button className="btn-del-sm" onClick={async () => {if(window.confirm("Delete?")) await deleteDoc(doc(db, "banks", b.id))}}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}