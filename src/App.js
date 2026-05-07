import React, { useState, useEffect } from "react";
import "./App.css";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc } from "firebase/firestore";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Loading state to prevent white screen
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

  // --- Functions ---
  const exportExcel = (b) => {
    const data = [{ Date: '07/05/2026', Particulars: 'Opening Balance', Receipt: b.openingBal, Payment: 0, Balance: b.balance }];
    const ws = XLSX.utils.json_to_sheet(data);
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

  const deleteItem = async (col, id) => {
    if(window.confirm("Delete karein?")) await deleteDoc(doc(db, col, id));
  };

  if (loading) return <div className="loading-screen">Authenticating Secure Access...</div>;
  if (!user) return <LoginScreen />;

  return (
    <div className="app-shell">
      {/* Sidebar - FIXED Position */}
      <div className="sidebar">
        <div className="sidebar-brand">BANKING SYSTEM</div>
        <div className="nav-links">
          {['Dashboard', 'Firm Master', 'Bank Master', 'User Master'].map(tab => (
            <div key={tab} className={`nav-item ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</div>
          ))}
        </div>
        <div className="sidebar-footer">
          Developed by <strong>Softview Technologies</strong><br/>
          Contact: 7972084304
        </div>
      </div>

      <div className="main-stage">
        {/* Header - Fixed Alignment */}
        <div className="top-right-header">
          <span className="user-info">{user.email}</span>
          <span className="live-clock">{currentTime.toLocaleDateString('en-GB')} || {currentTime.toLocaleTimeString()}</span>
          <button className="btn-logout" onClick={() => signOut(auth)}>Logout</button>
        </div>

        <div className="content-container">
          {activeTab === "Dashboard" && (
            <div className="fade-in">
              <div className="filter-container">
                <h2 style={{margin:0, color:'white'}}>Consolidated Bank Summary</h2>
                <select className="pro-select" value={selectedFirm} onChange={(e) => setSelectedFirm(e.target.value)}>
                  <option value="">-- Select Active Firm --</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>

              {!selectedFirm ? (
                <div className="empty-state"><h3>Select a firm to unlock financial data.</h3></div>
              ) : (
                <div className="card">
                  <table className="pro-table">
                    <thead><tr><th>Bank Name</th><th>A/c No</th><th>Balance</th><th>Action</th></tr></thead>
                    <tbody>
                      {banks.filter(b => b.firmName === selectedFirm).map(b => (
                        <React.Fragment key={b.id}>
                          <tr>
                            <td><strong>{b.bankName}</strong></td>
                            <td>{b.accNo}</td>
                            <td className="amt-receipt">₹ {b.balance}</td>
                            <td><button className="btn-gold-sm" onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}>
                              {expandedBank === b.id ? "Hide" : "View"} Ledger
                            </button></td>
                          </tr>
                          {expandedBank === b.id && (
                            <tr>
                              <td colSpan="4" className="ledger-expanded">
                                <div className="ledger-box">
                                  <div className="flex-between">
                                    <h4>Ledger: {b.bankName}</h4>
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
              )}
            </div>
          )}

          {activeTab === "Firm Master" && (
            <div className="fade-in">
              <div className="card">
                <h3>🏢 Add New Firm</h3>
                <form className="master-form" onSubmit={async (e) => {
                  e.preventDefault();
                  await addDoc(collection(db, "firms"), { name: e.target.fName.value, gstin: e.target.fGst.value });
                  e.target.reset();
                }}>
                  <input name="fName" placeholder="Firm Name" required />
                  <input name="fGst" placeholder="GSTIN (Optional)" />
                  <button type="submit" className="btn-gold">Add Firm</button>
                </form>
                <h3 style={{marginTop:'30px'}}>Registered Firms ({firms.length})</h3>
                <table className="pro-table">
                  <thead><tr><th>Name</th><th>GSTIN</th><th>Action</th></tr></thead>
                  <tbody>
                    {firms.map(f => (
                      <tr key={f.id}><td>{f.name}</td><td>{f.gstin || '-'}</td>
                      <td><button className="btn-del" onClick={() => deleteItem("firms", f.id)}>Delete</button></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bank & User Masters following same pattern... */}
        </div>
      </div>
    </div>
  );
}

function LoginScreen() {
  return (
    <div className="login-screen-v2">
      <div className="login-card">
        <div className="login-icon">🏦</div>
        <h2>BANKING PRO</h2>
        <p>CA Enterprise Portal</p>
        <form onSubmit={(e) => {
          e.preventDefault();
          signInWithEmailAndPassword(auth, e.target.email.value, e.target.pass.value);
        }}>
          <input name="email" type="email" placeholder="Email" required />
          <input name="pass" type="password" placeholder="Password" required />
          <button type="submit" className="btn-login">AUTHORIZE</button>
        </form>
      </div>
    </div>
  );
}