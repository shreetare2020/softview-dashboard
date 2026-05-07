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
        <div className="login-logo">🏢</div>
        <h1>BANKING PRO</h1>
        <span className="ca-portal-tag">CA Enterprise Portal</span>
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

  // 1. Fixed PDF Export
  const exportPDF = (b) => {
    const docObj = new jsPDF();
    docObj.setFontSize(18);
    docObj.text("Bank Statement Report", 14, 20);
    docObj.setFontSize(12);
    docObj.text(`Firm: ${b.firmName} | Bank: ${b.bankName}`, 14, 30);
    docObj.autoTable({
      startY: 40,
      head: [['Date', 'Particulars', 'A/c No', 'Balance']],
      body: [[currentTime.toLocaleDateString(), 'Opening Balance', b.accNo, `Rs. ${b.balance}`]],
      theme: 'grid'
    });
    docObj.save(`${b.bankName}_Statement.pdf`);
  };

  // 2. Added Excel Export
  const exportToExcel = (data, fileName) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  // 3. Delete Confirmation Logic
  const confirmDelete = async (collectionName, id) => {
    if (window.confirm("Are you sure you want to delete this record? This action cannot be undone.")) {
      await deleteDoc(doc(db, collectionName, id));
    }
  };

  const handleUpdate = async (e, collectionName) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, collectionName, editId), editData);
      setEditId(null);
      setEditData({});
    } catch (err) { alert("Error updating record"); }
  };

  if (!user) return <LoginScreen />;

  return (
    <div className="app-shell">
      <div className="sidebar">
        <div className="sidebar-brand">BANKING PRO</div>
        <div className="nav-links">
          {['Dashboard', 'Firm Master', 'Bank Master', 'User Master'].map(tab => (
            <div key={tab} className={`nav-item ${activeTab === tab ? 'active' : ''}`} onClick={() => {setActiveTab(tab); setEditId(null); setEditData({});}}>
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
              <div className="filter-container" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div>
                  <label className="filter-label">SELECT FIRM:</label>
                  <select className="pro-select-premium" value={selectedFirm} onChange={(e) => setSelectedFirm(e.target.value)}>
                    <option value="">-- Choose Firm --</option>
                    {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                  </select>
                </div>
                {selectedFirm && (
                  <button className="btn-edit-sm" onClick={() => exportToExcel(banks.filter(b => b.firmName === selectedFirm), "Firm_Bank_Report")}>Export to Excel</button>
                )}
              </div>
              
              {selectedFirm && (
                <div className="card-premium">
                  <table className="pro-table">
                    <thead><tr><th>Bank Name</th><th>Branch</th><th>A/c No</th><th>Balance</th><th>Action</th></tr></thead>
                    <tbody>
                      {banks.filter(b => b.firmName === selectedFirm).map(b => (
                        <React.Fragment key={b.id}>
                          <tr>
                            <td><strong>{b.bankName}</strong></td><td>{b.branch}</td><td>{b.accNo}</td>
                            <td className="txt-success">₹ {b.balance}</td>
                            <td><button className="btn-gold-sm" onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}>Ledger</button></td>
                          </tr>
                          {expandedBank === b.id && (
                            <tr>
                              <td colSpan="5">
                                <div className="ledger-panel">
                                  <div className="flex-between mb-10">
                                    <span className="ledger-title">Statement View</span>
                                    <button className="btn-pdf-sm" onClick={() => exportPDF(b)}>Download PDF</button>
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
              )}
            </div>
          )}

          {activeTab === "Firm Master" && (
            <div className="fade-in">
              <div className="card-premium">
                <h3>{editId ? "📝 Edit Firm" : "🏢 Add Firm"}</h3>
                <form className="master-grid-form" onSubmit={(e) => {
                  if (editId) { handleUpdate(e, "firms"); } 
                  else {
                    e.preventDefault();
                    addDoc(collection(db, "firms"), { name: e.target.fName.value, address: e.target.fAddr.value });
                    e.target.reset();
                  }
                }}>
                  <input name="fName" placeholder="Firm Name" className="pro-input" value={editData.name || ""} onChange={(e)=>setEditData({...editData, name: e.target.value})} required />
                  <input name="fAddr" placeholder="Address" className="pro-input" value={editData.address || ""} onChange={(e)=>setEditData({...editData, address: e.target.value})} required />
                  <button type="submit" className="btn-gold">{editId ? "Update" : "Save"}</button>
                </form>
              </div>
              <div className="card-premium mt-20">
                <table className="pro-table">
                  <thead><tr><th>Firm Name</th><th>Address</th><th>Action</th></tr></thead>
                  <tbody>
                    {firms.map(f => (
                      <tr key={f.id}>
                        <td>{f.name}</td><td>{f.address}</td>
                        <td>
                          <button className="btn-edit-sm" onClick={() => {setEditId(f.id); setEditData(f);}}>Edit</button>
                          <button className="btn-del-sm" onClick={() => confirmDelete("firms", f.id)}>Delete</button>
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
                <h3>{editId ? "📝 Edit Bank" : "🏦 Add Bank"}</h3>
                <form className="master-grid-form" onSubmit={(e) => {
                  if (editId) { handleUpdate(e, "banks"); } 
                  else {
                    e.preventDefault();
                    addDoc(collection(db, "banks"), { 
                      firmName: e.target.fSelect.value, 
                      bankName: e.target.bName.value, 
                      branch: e.target.branch.value, // Re-added Branch
                      accNo: e.target.acc.value, 
                      balance: e.target.bal.value 
                    });
                    e.target.reset();
                  }
                }}>
                  <select name="fSelect" className="pro-input" value={editData.firmName || ""} onChange={(e)=>setEditData({...editData, firmName: e.target.value})}>
                    <option value="">Select Firm</option>
                    {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                  </select>
                  <input name="bName" placeholder="Bank Name" className="pro-input" value={editData.bankName || ""} onChange={(e)=>setEditData({...editData, bankName: e.target.value})} required />
                  <input name="branch" placeholder="Branch" className="pro-input" value={editData.branch || ""} onChange={(e)=>setEditData({...editData, branch: e.target.value})} required />
                  <input name="acc" placeholder="A/c No" className="pro-input" value={editData.accNo || ""} onChange={(e)=>setEditData({...editData, accNo: e.target.value})} required />
                  <input name="bal" placeholder="Balance" className="pro-input" value={editData.balance || ""} onChange={(e)=>setEditData({...editData, balance: e.target.value})} required />
                  <button type="submit" className="btn-gold">{editId ? "Update" : "Save"}</button>
                </form>
              </div>
              <div className="card-premium mt-20">
                <table className="pro-table">
                  <thead><tr><th>Bank</th><th>Branch</th><th>Firm</th><th>Action</th></tr></thead>
                  <tbody>
                    {banks.map(b => (
                      <tr key={b.id}>
                        <td>{b.bankName}</td><td>{b.branch}</td><td>{b.firmName}</td>
                        <td>
                          <button className="btn-edit-sm" onClick={() => {setEditId(b.id); setEditData(b);}}>Edit</button>
                          <button className="btn-del-sm" onClick={() => confirmDelete("banks", b.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "User Master" && (
            <div className="fade-in">
              <div className="card-premium">
                <h3>{editId ? "📝 Edit User" : "👥 Add User"}</h3>
                <form className="master-grid-form" onSubmit={(e) => {
                  if (editId) { handleUpdate(e, "users"); } 
                  else {
                    e.preventDefault();
                    addDoc(collection(db, "users"), { 
                      uName: e.target.uName.value, 
                      uEmail: e.target.uEmail.value, 
                      uMobile: e.target.uMobile.value, // Re-added Mobile
                      uRole: e.target.uRole.value 
                    });
                    e.target.reset();
                  }
                }}>
                  <input name="uName" placeholder="Name" className="pro-input" value={editData.uName || ""} onChange={(e)=>setEditData({...editData, uName: e.target.value})} required />
                  <input name="uEmail" placeholder="Email" className="pro-input" value={editData.uEmail || ""} onChange={(e)=>setEditData({...editData, uEmail: e.target.value})} required />
                  <input name="uMobile" placeholder="Mobile No" className="pro-input" value={editData.uMobile || ""} onChange={(e)=>setEditData({...editData, uMobile: e.target.value})} required />
                  <select name="uRole" className="pro-input" value={editData.uRole || "Admin"} onChange={(e)=>setEditData({...editData, uRole: e.target.value})}>
                    <option value="Admin">Admin</option>
                    <option value="Operator">Operator</option>
                  </select>
                  <button type="submit" className="btn-gold">{editId ? "Update" : "Save"}</button>
                </form>
              </div>
              <div className="card-premium mt-20">
                <table className="pro-table">
                  <thead><tr><th>Name</th><th>Mobile</th><th>Role</th><th>Action</th></tr></thead>
                  <tbody>
                    {usersList.map(u => (
                      <tr key={u.id}>
                        <td>{u.uName}</td><td>{u.uMobile}</td><td>{u.uRole}</td>
                        <td>
                          <button className="btn-edit-sm" onClick={() => {setEditId(u.id); setEditData(u);}}>Edit</button>
                          <button className="btn-del-sm" onClick={() => confirmDelete("users", u.id)}>Delete</button>
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