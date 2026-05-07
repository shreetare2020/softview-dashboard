import React, { useState, useEffect } from "react";
import "./App.css";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc } from "firebase/firestore";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// --- Login Screen Fix ---
function LoginScreen() {
  return (
    <div className="login-screen">
      <div className="login-card">
        <h1>BANKING PRO</h1>
        <form onSubmit={(e) => {
          e.preventDefault();
          signInWithEmailAndPassword(auth, e.target.email.value, e.target.pass.value);
        }}>
          <input name="email" type="email" placeholder="Email" className="pro-input" required />
          <input name="pass" type="password" placeholder="Password" className="pro-input" required />
          <button type="submit" className="btn-gold-full">AUTHORIZE LOGIN</button>
        </form>
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
    onAuthStateChanged(auth, (u) => setUser(u));
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user) {
      onSnapshot(collection(db, "firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "banks"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "users"), s => setUsersList(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
  }, [user]);

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

  const deleteItem = async (col, id) => {
    if(window.confirm("Are you sure?")) await deleteDoc(doc(db, col, id));
  };

  if (!user) return <LoginScreen />;

  return (
    <div className="app-shell">
      <div className="sidebar">
        <div className="sidebar-brand">BANKING PRO</div>
        <div className="nav-links">
          {['Dashboard', 'Firm Master', 'Bank Master', 'User Master'].map(t => (
            <div key={t} className={`nav-item ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t}</div>
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
            <span>{currentTime.toLocaleTimeString()}</span>
          </div>
          <button className="btn-logout" onClick={() => signOut(auth)}>Logout</button>
        </div>

        <div className="content-area">
          {activeTab === "Dashboard" && (
            <div>
              <div className="filter-card">
                <select className="pro-select" value={selectedFirm} onChange={(e) => setSelectedFirm(e.target.value)}>
                  <option value="">Select Firm...</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>
              {selectedFirm && (
                <div className="card">
                  <table className="pro-table">
                    <thead><tr><th>Bank</th><th>A/c No</th><th>Balance</th><th>Action</th></tr></thead>
                    <tbody>
                      {banks.filter(b => b.firmName === selectedFirm).map(b => (
                        <React.Fragment key={b.id}>
                          <tr>
                            <td>{b.bankName}</td><td>{b.accNo}</td><td className="txt-success">₹{b.balance}</td>
                            <td><button className="btn-gold-sm" onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}>Ledger</button></td>
                          </tr>
                          {expandedBank === b.id && (
                            <tr>
                              <td colSpan="4">
                                <div className="ledger-box">
                                  <button className="btn-pdf" onClick={() => exportPDF(b)}>Download PDF</button>
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
              )}
            </div>
          )}

          {activeTab === "User Master" && (
            <div className="card">
              <h3>User Master</h3>
              <form className="master-grid" onSubmit={async (e) => {
                e.preventDefault();
                await addDoc(collection(db, "users"), {
                  uName: e.target.uName.value, uEmail: e.target.uEmail.value,
                  uPass: e.target.uPass.value, uRole: e.target.uRole.value
                });
                e.target.reset();
              }}>
                <input name="uName" placeholder="Name" className="pro-input" required />
                <input name="uEmail" placeholder="Email" className="pro-input" required />
                <input name="uPass" type="password" placeholder="Password" className="pro-input" required />
                <select name="uRole" className="pro-input">
                  <option value="Operator">Operator</option>
                  <option value="Viewer">Viewer</option>
                  <option value="Admin">Admin</option>
                </select>
                <button type="submit" className="btn-gold">Add</button>
              </form>
              <table className="pro-table mt-20">
                <thead><tr><th>Name</th><th>Role</th><th>Action</th></tr></thead>
                <tbody>{usersList.map(u => <tr key={u.id}><td>{u.uName}</td><td>{u.uRole}</td><td><button className="btn-del" onClick={() => deleteItem("users", u.id)}>Delete</button></td></tr>)}</tbody>
              </table>
            </div>
          )}

          {activeTab === "Firm Master" && (
            <div className="card">
              <h3>Firm Master</h3>
              <form className="master-grid" onSubmit={async (e) => {
                e.preventDefault();
                await addDoc(collection(db, "firms"), { name: e.target.fName.value, address: e.target.fAddr.value });
                e.target.reset();
              }}>
                <input name="fName" placeholder="Firm Name" className="pro-input" required />
                <input name="fAddr" placeholder="Address" className="pro-input" required />
                <button type="submit" className="btn-gold">Add</button>
              </form>
              <table className="pro-table mt-20">
                <thead><tr><th>Firm Name</th><th>Address</th><th>Action</th></tr></thead>
                <tbody>{firms.map(f => <tr key={f.id}><td>{f.name}</td><td>{f.address}</td><td><button className="btn-del" onClick={() => deleteItem("firms", f.id)}>Delete</button></td></tr>)}</tbody>
              </table>
            </div>
          )}

          {activeTab === "Bank Master" && (
            <div className="card">
              <h3>Bank Master</h3>
              <form className="master-grid" onSubmit={async (e) => {
                e.preventDefault();
                await addDoc(collection(db, "banks"), {
                  firmName: e.target.firm.value, bankName: e.target.bank.value,
                  branch: e.target.branch.value, accNo: e.target.acc.value, balance: Number(e.target.bal.value)
                });
                e.target.reset();
              }}>
                <select name="firm" className="pro-input">{firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}</select>
                <input name="bank" placeholder="Bank" className="pro-input" required />
                <input name="branch" placeholder="Branch" className="pro-input" required />
                <input name="acc" placeholder="Acc No" className="pro-input" required />
                <input name="bal" placeholder="Opening Bal" className="pro-input" required />
                <button type="submit" className="btn-gold">Add</button>
              </form>
              <table className="pro-table mt-20">
                <thead><tr><th>Bank</th><th>Branch</th><th>Action</th></tr></thead>
                <tbody>{banks.map(b => <tr key={b.id}><td>{b.bankName}</td><td>{b.branch}</td><td><button className="btn-del" onClick={() => deleteItem("banks", b.id)}>Delete</button></td></tr>)}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}