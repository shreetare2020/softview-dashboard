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
    const doc = new jsPDF();
    doc.text(`Bank Statement: ${b.bankName}`, 14, 15);
    doc.autoTable({
      startY: 25,
      head: [['Date', 'Particulars', 'Balance']],
      body: [[currentTime.toLocaleDateString(), 'Opening Balance', `Rs. ${b.balance}`]],
    });
    doc.save(`${b.bankName}_Statement.pdf`);
  };

  const exportExcel = (b) => {
    const ws = XLSX.utils.json_to_sheet([{ Date: currentTime.toLocaleDateString(), Particulars: 'Opening Balance', Balance: b.balance }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, `${b.bankName}_Ledger.xlsx`);
  };

  const handleUpdate = async (e, collectionName) => {
    e.preventDefault();
    await updateDoc(doc(db, collectionName, editId), editData);
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
                <label className="filter-label">SELECT FIRM:</label>
                <select className="pro-select-premium" value={selectedFirm} onChange={(e) => setSelectedFirm(e.target.value)}>
                  <option value="">-- Choose Firm --</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>
              {selectedFirm && (
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
              )}
            </div>
          )}

          {activeTab === "Firm Master" && (
            <div className="fade-in">
              <div className="card-premium">
                <h3>{editId ? "📝 Edit Firm" : "🏢 Firm Master"}</h3>
                <form className="master-grid-form" onSubmit={(e) => editId ? handleUpdate(e, "firms") : async (ev) => {
                  ev.preventDefault();
                  await addDoc(collection(db, "firms"), { name: ev.target.fName.value, address: ev.target.fAddr.value });
                  ev.target.reset();
                }(e)}>
                  <input name="fName" placeholder="Firm Name" className="pro-input" value={editData.name || ""} onChange={(e)=>setEditData({...editData, name: e.target.value})} required />
                  <input name="fAddr" placeholder="Address" className="pro-input" value={editData.address || ""} onChange={(e)=>setEditData({...editData, address: e.target.value})} required />
                  <button type="submit" className="btn-gold">{editId ? "Update" : "Save"}</button>
                  {editId && <button type="button" onClick={()=>setEditId(null)} className="btn-del-sm">Cancel</button>}
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
                          <button className="btn-edit-sm" onClick={() => {setEditId(f.id); setEditData(f);}}>Edit</button>
                          <button className="btn-del-sm" onClick={() => deleteDoc(doc(db, "firms", f.id))}>Delete</button>
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
                <h3>{editId ? "📝 Edit Bank" : "🏦 Bank Master"}</h3>
                <form className="master-grid-form" onSubmit={(e) => editId ? handleUpdate(e, "banks") : async (ev) => {
                  ev.preventDefault();
                  await addDoc(collection(db, "banks"), { firmName: ev.target.fSelect.value, bankName: ev.target.bName.value, accNo: ev.target.acc.value, balance: ev.target.bal.value });
                  ev.target.reset();
                }(e)}>
                  <select name="fSelect" className="pro-input" value={editData.firmName || ""} onChange={(e)=>setEditData({...editData, firmName: e.target.value})}>
                    <option value="">Select Firm</option>
                    {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                  </select>
                  <input name="bName" placeholder="Bank Name" className="pro-input" value={editData.bankName || ""} onChange={(e)=>setEditData({...editData, bankName: e.target.value})} required />
                  <input name="acc" placeholder="A/c No" className="pro-input" value={editData.accNo || ""} onChange={(e)=>setEditData({...editData, accNo: e.target.value})} required />
                  <input name="bal" placeholder="Balance" className="pro-input" value={editData.balance || ""} onChange={(e)=>setEditData({...editData, balance: e.target.value})} required />
                  <button type="submit" className="btn-gold">{editId ? "Update" : "Save"}</button>
                  {editId && <button type="button" onClick={()=>setEditId(null)} className="btn-del-sm">Cancel</button>}
                </form>
              </div>
              <div className="card-premium mt-20">
                <table className="pro-table">
                  <thead><tr><th>Bank</th><th>Firm</th><th>Actions</th></tr></thead>
                  <tbody>
                    {banks.map(b => (
                      <tr key={b.id}>
                        <td>{b.bankName}</td><td>{b.firmName}</td>
                        <td>
                          <button className="btn-edit-sm" onClick={() => {setEditId(b.id); setEditData(b);}}>Edit</button>
                          <button className="btn-del-sm" onClick={() => deleteDoc(doc(db, "banks", b.id))}>Delete</button>
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
                <h3>{editId ? "📝 Edit User" : "👥 User Master"}</h3>
                <form className="master-grid-form" onSubmit={(e) => editId ? handleUpdate(e, "users") : async (ev) => {
                  ev.preventDefault();
                  await addDoc(collection(db, "users"), { uName: ev.target.uName.value, uEmail: ev.target.uEmail.value, uPass: ev.target.uPass.value, uRole: ev.target.uRole.value });
                  ev.target.reset();
                }(e)}>
                  <input name="uName" placeholder="Name" className="pro-input" value={editData.uName || ""} onChange={(e)=>setEditData({...editData, uName: e.target.value})} required />
                  <input name="uEmail" placeholder="Email" className="pro-input" value={editData.uEmail || ""} onChange={(e)=>setEditData({...editData, uEmail: e.target.value})} required />
                  <input name="uPass" type="password" placeholder="Pass" className="pro-input" value={editData.uPass || ""} onChange={(e)=>setEditData({...editData, uPass: e.target.value})} required />
                  <select name="uRole" className="pro-input" value={editData.uRole || "Admin"} onChange={(e)=>setEditData({...editData, uRole: e.target.value})}>
                    <option value="Admin">Admin</option>
                    <option value="Operator">Operator</option>
                  </select>
                  <button type="submit" className="btn-gold">{editId ? "Update" : "Save"}</button>
                  {editId && <button type="button" onClick={()=>setEditId(null)} className="btn-del-sm">Cancel</button>}
                </form>
              </div>
              <div className="card-premium mt-20">
                <table className="pro-table">
                  <thead><tr><th>Name</th><th>Role</th><th>Actions</th></tr></thead>
                  <tbody>
                    {usersList.map(u => (
                      <tr key={u.id}>
                        <td>{u.uName}</td><td>{u.uRole}</td>
                        <td>
                          <button className="btn-edit-sm" onClick={() => {setEditId(u.id); setEditData(u);}}>Edit</button>
                          <button className="btn-del-sm" onClick={() => deleteDoc(doc(db, "users", u.id))}>Delete</button>
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