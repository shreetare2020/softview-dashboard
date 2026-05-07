import React, { useState, useEffect } from "react";
import "./App.css";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc } from "firebase/firestore";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [time, setTime] = useState(new Date());
  const [firms, setFirms] = useState([]);
  const [banks, setBanks] = useState([]);
  const [usersList, setUsersList] = useState([]);
  
  const [selectedFirmFilter, setSelectedFirmFilter] = useState(""); 
  const [expandedBank, setExpandedBank] = useState(null);
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
      onSnapshot(collection(db, "users"), s => setUsersList(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
  }, [user]);

  // --- Export Logic ---
  const exportExcel = (bank) => {
    const data = [{ Date: 'Opening', Particulars: 'Opening Balance', Receipt: bank.openingBal, Payment: 0, Balance: bank.balance }];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, `${bank.bankName}_Ledger.xlsx`);
  };

  const exportPDF = (bank) => {
    const doc = new jsPDF();
    doc.text(`Ledger: ${bank.bankName}`, 14, 15);
    doc.autoTable({
      startY: 20,
      head: [['Date', 'Particulars', 'Receipt', 'Payment', 'Balance']],
      body: [['-', 'Opening Balance', bank.openingBal, '0', bank.balance]],
    });
    doc.save(`${bank.bankName}_Ledger.pdf`);
  };

  const deleteItem = async (col, id) => {
    if(window.confirm("Delete karein?")) await deleteDoc(doc(db, col, id));
  };

  if (!user) return (
    <div className="login-screen">
      <div className="login-card">
        <h2 style={{color: '#0f172a'}}>ADMIN SECURE LOGIN</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          signInWithEmailAndPassword(auth, e.target.email.value, e.target.pass.value);
        }}>
          <input name="email" type="email" placeholder="Email" required />
          <input name="pass" type="password" placeholder="Password" required />
          <button type="submit" className="btn-save" style={{width:'100%'}}>LOGIN</button>
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
        <div className="footer-fixed">
          Developed by <strong>Softview Technologies</strong><br/>
          Contact: 7972084304
        </div>
      </div>

      <div className="main-stage">
        <div className="top-right-header">
          <span className="user-name">{user.email}</span>
          <span className="live-clock">{time.toLocaleDateString('en-GB')} || {time.toLocaleTimeString()}</span>
          <button className="btn-logout" onClick={() => signOut(auth)}>Logout</button>
        </div>

        <div className="content-container">
          {activeTab === "Dashboard" && (
            <div className="dashboard-wrapper">
              <div className="filter-container">
                <div>
                  <span className="filter-label">🏢 Active Firm:</span>
                  <select className="pro-select" value={selectedFirmFilter} onChange={(e) => setSelectedFirmFilter(e.target.value)}>
                    <option value="">-- Select Firm --</option>
                    {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                  </select>
                </div>
              </div>

              {!selectedFirmFilter ? (
                <div className="empty-state"><h3>Please Select a Firm to View Dashboard</h3></div>
              ) : (
                <div className="card">
                  <table className="pro-table">
                    <thead>
                      <tr><th>Bank Name</th><th>A/c No</th><th>Balance</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {banks.filter(b => b.firmName === selectedFirmFilter).map(b => (
                        <React.Fragment key={b.id}>
                          <tr>
                            <td>{b.bankName}</td>
                            <td>{b.accNo}</td>
                            <td className="amt-receipt">₹ {b.balance}</td>
                            <td><button className="btn-save" onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}>View Ledger</button></td>
                          </tr>
                          {expandedBank === b.id && (
                            <tr>
                              <td colSpan="4">
                                <div className="ledger-box">
                                  <div className="flex-between">
                                    <h4>{b.bankName} Ledger</h4>
                                    <div>
                                      <button className="btn-save" onClick={() => exportPDF(b)}>PDF</button>
                                      <button className="btn-save" onClick={() => exportExcel(b)} style={{marginLeft:'5px', background:'#16a34a'}}>Excel</button>
                                    </div>
                                  </div>
                                  <table className="pro-table">
                                    <thead><tr><th>Date</th><th>Particulars</th><th>Receipt</th><th>Payment</th><th>Balance</th></tr></thead>
                                    <tbody>
                                      <tr><td>-</td><td>Opening Balance</td><td>{b.openingBal}</td><td>0</td><td>{b.balance}</td></tr>
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

          {activeTab === "Bank Master" && (
            <div className="card">
              <h3>🏦 Bank Master Management</h3>
              <form className="form-grid" onSubmit={async (e) => {
                e.preventDefault();
                const data = {
                  firmName: e.target.firm.value,
                  bankName: e.target.bank.value,
                  accNo: e.target.acc.value,
                  openingBal: e.target.bal.value,
                  balance: e.target.bal.value,
                  status: 'Active'
                };
                await addDoc(collection(db, "banks"), data);
                e.target.reset();
              }}>
                <select name="firm" className="pro-select" required>
                  <option value="">Select Firm</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
                <input name="bank" placeholder="Bank Name" required />
                <input name="acc" placeholder="Account Number" required />
                <input name="bal" type="number" placeholder="Opening Balance" required />
                <button type="submit" className="btn-save">Add Bank</button>
              </form>
              <table className="pro-table" style={{marginTop:'20px'}}>
                <thead><tr><th>Firm</th><th>Bank</th><th>A/c No</th><th>Action</th></tr></thead>
                <tbody>
                  {banks.map(b => (
                    <tr key={b.id}><td>{b.firmName}</td><td>{b.bankName}</td><td>{b.accNo}</td>
                    <td><button onClick={() => deleteItem("banks", b.id)}>Delete</button></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "User Master" && (
            <div className="card">
              <h3>👥 User Master Management</h3>
              <form className="form-grid" onSubmit={async (e) => {
                e.preventDefault();
                await addDoc(collection(db, "users"), {
                  name: e.target.uName.value,
                  email: e.target.uEmail.value,
                  role: e.target.uRole.value
                });
                e.target.reset();
              }}>
                <input name="uName" placeholder="Full Name" required />
                <input name="uEmail" type="email" placeholder="Email ID" required />
                <select name="uRole" className="pro-select">
                  <option value="Operator">Operator</option>
                  <option value="Viewer">Viewer</option>
                </select>
                <button type="submit" className="btn-save">Create User</button>
              </form>
              <table className="pro-table" style={{marginTop:'20px'}}>
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Action</th></tr></thead>
                <tbody>
                  {usersList.map(u => (
                    <tr key={u.id}><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td>
                    <td><button onClick={() => deleteItem("users", u.id)}>Delete</button></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}