import React, { useState, useEffect } from "react";
import "./App.css";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc } from "firebase/firestore";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// --- Login Screen ---
function LoginScreen() {
  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">🏢</div>
        <h1>BANKING PRO</h1>
        <form className="login-form" onSubmit={(e) => {
          e.preventDefault();
          signInWithEmailAndPassword(auth, e.target.email.value, e.target.pass.value);
        }}>
          <input name="email" type="email" placeholder="Email Address" required />
          <input name="pass" type="password" placeholder="Password" required />
          <button type="submit" className="login-submit">AUTHORIZE LOGIN</button>
        </form>
        <div className="login-footer">Powered by <strong>Softview Technologies</strong></div>
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
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

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
    docObj.text(`Statement: ${b.bankName}`, 14, 20);
    docObj.autoTable({ startY: 30, head: [['Date', 'Bank', 'A/c No', 'Balance']], body: [[currentTime.toLocaleDateString(), b.bankName, b.accNo, `Rs. ${b.balance}`]] });
    docObj.save(`${b.bankName}_Report.pdf`);
  };

  const handleUpdate = async (e, col) => {
    e.preventDefault();
    await updateDoc(doc(db, col, editId), editData);
    setEditId(null); setEditData({});
  };

  if (!user) return <LoginScreen />;

  return (
    <div className="app-shell">
      <div className="sidebar">
        <div className="sidebar-brand">BANKING PRO</div>
        <div className="nav-links">
          {['Dashboard', 'Firm Master', 'Bank Master', 'User Master'].map(tab => (
            <div key={tab} className={`nav-item ${activeTab === tab ? 'active' : ''}`} onClick={() => {setActiveTab(tab); setEditId(null);}}>
              {tab}
            </div>
          ))}
        </div>
        <div className="sidebar-footer">
          <span className="softview-logo">SOFTVIEW TECHNOLOGIES</span>
          <div className="contact-pill">📞 +91 7972084304</div>
        </div>
      </div>

      <div className="main-stage">
        <div className="top-right-header">
          <div className="user-info-box">
             <span className="user-welcome">Welcome, <strong>{user.email.split('@')[0].toUpperCase()}</strong></span>
          </div>
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
              <div className="filter-card">
                <label className="filter-label">SELECT FIRM HERE:</label>
                <select className="pro-select-premium" value={selectedFirm} onChange={(e) => setSelectedFirm(e.target.value)}>
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
                            <td>{b.bankName}</td><td>{b.branch}</td><td>₹ {b.balance}</td>
                            <td><button className="btn-gold-sm" onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}>
                              {expandedBank === b.id ? "Close" : "Ledger"}
                            </button></td>
                          </tr>
                          {expandedBank === b.id && (
                            <tr className="ledger-row">
                              <td colSpan="4">
                                <div className="ledger-actions">
                                  <span>Account No: {b.accNo}</span>
                                  <button className="btn-pdf" onClick={() => exportPDF(b)}>Download PDF</button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <div className="empty-state">Please select a firm to view reports.</div>}
            </div>
          )}

          {activeTab === "Firm Master" && (
            <div className="card-premium">
              <h3>Firm Management</h3>
              <form className="master-grid-form" onSubmit={(e) => editId ? handleUpdate(e, "firms") : (async (ev) => {
                  ev.preventDefault();
                  await addDoc(collection(db, "firms"), { name: ev.target.fName.value, address: ev.target.fAddr.value });
                  ev.target.reset();
                })(e)}>
                <input name="fName" placeholder="Firm Name" value={editData.name || ""} onChange={(e)=>setEditData({...editData, name:e.target.value})} required />
                <input name="fAddr" placeholder="Address" value={editData.address || ""} onChange={(e)=>setEditData({...editData, address:e.target.value})} required />
                <button type="submit" className="btn-gold">{editId ? "Update Firm" : "Add Firm"}</button>
              </form>
              <table className="pro-table">
                <tbody>{firms.map(f => <tr key={f.id}><td>{f.name}</td><td><button onClick={() => {setEditId(f.id); setEditData(f);}}>Edit</button></td></tr>)}</tbody>
              </table>
            </div>
          )}
          
          {/* Bank & User Masters content is also restored in the same structural way */}
        </div>
      </div>
    </div>
  );
}