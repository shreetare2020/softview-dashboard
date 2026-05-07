import React, { useState, useEffect } from "react";
import "./App.css";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc } from "firebase/firestore";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function LoginScreen() {
  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">🏦</div>
        <h1>BANKING PRO</h1>
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
  
  // Edit State
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

  // PDF Export Fix
  const exportPDF = (b) => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Bank Statement", 14, 20);
      doc.setFontSize(12);
      doc.text(`Bank: ${b.bankName} | A/c: ${b.accNo}`, 14, 30);
      
      const tableColumn = ["Date", "Particulars", "Balance"];
      const tableRows = [[currentTime.toLocaleDateString(), "Opening Balance", `Rs. ${b.balance}`]];

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'striped'
      });
      
      doc.save(`${b.bankName}_Statement.pdf`);
    } catch (error) {
      console.error("PDF Error:", error);
      alert("PDF generate karne mein dikkat aa rahi hai. Kripya dependencies check karein.");
    }
  };

  const exportExcel = (b) => {
    const ws = XLSX.utils.json_to_sheet([{ Date: currentTime.toLocaleDateString(), Particulars: 'Opening Balance', Balance: b.balance }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, `${b.bankName}_Ledger.xlsx`);
  };

  // Edit Logic
  const handleEdit = (item, type) => {
    setEditId(item.id);
    setEditData(item);
  };

  const handleUpdate = async (e, collectionName) => {
    e.preventDefault();
    const docRef = doc(db, collectionName, editId);
    await updateDoc(docRef, editData);
    setEditId(null);
    setEditData({});
  };

  if (!user) return <LoginScreen />;

  return (
    <div className="app-shell">
      <div className="sidebar">
        <div className="sidebar-brand">BANKING PRO</div>
        <div className="nav-links">
          {['Dashboard', 'Firm Master', 'Bank Master', 'User Master'].map(tab => (
            <div key={tab} className={`nav-item ${activeTab === tab ? 'active' : ''}`} onClick={() => {setActiveTab(tab); setEditId(null);}}>{tab}</div>
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
                                    <span className="ledger-title">Statement View</span>
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
              ) : <div className="card-premium">Please select a firm from the menu above.</div>}
            </div>
          )}

          {activeTab === "User Master" && (
            <div className="fade-in">
              <div className="card-premium">
                <h3>{editId ? "📝 Edit User" : "👥 User Master"}</h3>
                <form className="master-grid-form" onSubmit={(e) => editId ? handleUpdate(e, "users") : async (e) => {
                  e.preventDefault();
                  await addDoc(collection(db, "users"), {
                    uName: e.target.uName.value, uEmail: e.target.uEmail.value,
                    uPass: e.target.uPass.value, uPhone: e.target.uPhone.value, uRole: e.target.uRole.value
                  });
                  e.target.reset();
                }(e)}>
                  <input name="uName" placeholder="Name" className="pro-input" value={editData.uName || ""} onChange={(e)=>setEditData({...editData, uName: e.target.value})} required />
                  <input name="uEmail" placeholder="Email" className="pro-input" value={editData.uEmail || ""} onChange={(e)=>setEditData({...editData, uEmail: e.target.value})} required />
                  <input name="uPass" type="password" placeholder="Password" className="pro-input" value={editData.uPass || ""} onChange={(e)=>setEditData({...editData, uPass: e.target.value})} required />
                  <input name="uPhone" placeholder="Mobile" className="pro-input" value={editData.uPhone || ""} onChange={(e)=>setEditData({...editData, uPhone: e.target.value})} required />
                  <select name="uRole" className="pro-input" value={editData.uRole || "Admin"} onChange={(e)=>setEditData({...editData, uRole: e.target.value})}>
                    <option value="Admin">Admin</option>
                    <option value="Operator">Operator</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                  <button type="submit" className="btn-gold">{editId ? "Update" : "Save"}</button>
                  {editId && <button type="button" onClick={()=>setEditId(null)} className="btn-del-sm">Cancel</button>}
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
                          <button className="btn-edit-sm" onClick={() => handleEdit(u)}>Edit</button>
                          <button className="btn-del-sm" onClick={() => deleteDoc(doc(db, "users", u.id))}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* Repeat same Edit Logic for Firm and Bank Master tabs */}
        </div>
      </div>
    </div>
  );
}