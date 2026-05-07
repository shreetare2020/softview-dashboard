import React, { useState, useEffect } from "react";
import "./App.css";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc, updateDoc } from "firebase/firestore";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// --- Login Component ---
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

// --- Main App Component ---
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

  // PDF Export Function
  const exportPDF = (b) => {
    const docObj = new jsPDF();
    docObj.text("Bank Statement Report", 14, 20);
    docObj.autoTable({
      startY: 30,
      head: [['Date', 'Particulars', 'A/c No', 'Balance']],
      body: [[currentTime.toLocaleDateString(), 'Opening Balance', b.accNo, `Rs. ${b.balance}`]],
    });
    docObj.save(`${b.bankName}_Statement.pdf`);
  };

  // Excel Export Function
  const exportToExcel = (data, fileName) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  // Delete Confirmation
  const confirmDelete = async (col, id) => {
    if (window.confirm("Record delete karna chahte hain?")) {
      await deleteDoc(doc(db, col, id));
    }
  };

  const handleUpdate = async (e, col) => {
    e.preventDefault();
    await updateDoc(doc(db, col, editId), editData);
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
              <div className="filter-container" style={{display:'flex', justifyContent:'space-between'}}>
                <select className="pro-select-premium" value={selectedFirm} onChange={(e) => setSelectedFirm(e.target.value)}>
                  <option value="">-- Choose Firm --</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
                {selectedFirm && <button className="btn-edit-sm" onClick={() => exportToExcel(banks.filter(b => b.firmName === selectedFirm), "Report")}>Excel Export</button>}
              </div>
              {selectedFirm && (
                <div className="card-premium">
                  <table className="pro-table">
                    <thead><tr><th>Bank</th><th>Branch</th><th>Balance</th><th>Action</th></tr></thead>
                    <tbody>
                      {banks.filter(b => b.firmName === selectedFirm).map(b => (
                        <React.Fragment key={b.id}>
                          <tr>
                            <td>{b.bankName}</td><td>{b.branch}</td><td>₹ {b.balance}</td>
                            <td><button className="btn-gold-sm" onClick={() => setExpandedBank(expandedBank === b.id ? null : b.id)}>Ledger</button></td>
                          </tr>
                          {expandedBank === b.id && (
                            <tr><td colSpan="4"><button onClick={() => exportPDF(b)}>Download PDF</button></td></tr>
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
                <form className="master-grid-form" onSubmit={(e) => editId ? handleUpdate(e, "firms") : (async (ev) => {
                  ev.preventDefault();
                  await addDoc(collection(db, "firms"), { name: ev.target.fName.value, address: ev.target.fAddr.value });
                  ev.target.reset();
                })(e)}>
                  <input name="fName" placeholder="Firm Name" value={editData.name || ""} onChange={(e)=>setEditData({...editData, name:e.target.value})} required />
                  <input name="fAddr" placeholder="Address" value={editData.address || ""} onChange={(e)=>setEditData({...editData, address:e.target.value})} required />
                  <button type="submit" className="btn-gold">{editId ? "Update" : "Save"}</button>
                </form>
                <table className="pro-table mt-20">
                  <tbody>{firms.map(f => <tr key={f.id}><td>{f.name}</td><td><button onClick={() => {setEditId(f.id); setEditData(f);}}>Edit</button><button onClick={() => confirmDelete("firms", f.id)}>Delete</button></td></tr>)}</tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "Bank Master" && (
            <div className="fade-in">
              <div className="card-premium">
                <form className="master-grid-form" onSubmit={(e) => editId ? handleUpdate(e, "banks") : (async (ev) => {
                  ev.preventDefault();
                  await addDoc(collection(db, "banks"), { firmName: ev.target.fS.value, bankName: ev.target.bN.value, branch: ev.target.br.value, accNo: ev.target.ac.value, balance: ev.target.ba.value });
                  ev.target.reset();
                })(e)}>
                  <select name="fS" value={editData.firmName || ""} onChange={(e)=>setEditData({...editData, firmName:e.target.value})}>
                    {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                  </select>
                  <input name="bN" placeholder="Bank" value={editData.bankName || ""} onChange={(e)=>setEditData({...editData, bankName:e.target.value})} required />
                  <input name="br" placeholder="Branch" value={editData.branch || ""} onChange={(e)=>setEditData({...editData, branch:e.target.value})} required />
                  <input name="ac" placeholder="A/c" value={editData.accNo || ""} onChange={(e)=>setEditData({...editData, accNo:e.target.value})} required />
                  <input name="ba" placeholder="Bal" value={editData.balance || ""} onChange={(e)=>setEditData({...editData, balance:e.target.value})} required />
                  <button type="submit" className="btn-gold">{editId ? "Update" : "Save"}</button>
                </form>
                <table className="pro-table mt-20">
                  <tbody>{banks.map(b => <tr key={b.id}><td>{b.bankName}</td><td><button onClick={() => {setEditId(b.id); setEditData(b);}}>Edit</button><button onClick={() => confirmDelete("banks", b.id)}>Delete</button></td></tr>)}</tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "User Master" && (
            <div className="fade-in">
              <div className="card-premium">
                <form className="master-grid-form" onSubmit={(e) => editId ? handleUpdate(e, "users") : (async (ev) => {
                  ev.preventDefault();
                  await addDoc(collection(db, "users"), { uName: ev.target.uN.value, uEmail: ev.target.uE.value, uMobile: ev.target.uM.value, uRole: ev.target.uR.value });
                  ev.target.reset();
                })(e)}>
                  <input name="uN" placeholder="Name" value={editData.uName || ""} onChange={(e)=>setEditData({...editData, uName:e.target.value})} required />
                  <input name="uE" placeholder="Email" value={editData.uEmail || ""} onChange={(e)=>setEditData({...editData, uEmail:e.target.value})} required />
                  <input name="uM" placeholder="Mobile" value={editData.uMobile || ""} onChange={(e)=>setEditData({...editData, uMobile:e.target.value})} required />
                  <select name="uR" value={editData.uRole || "Operator"} onChange={(e)=>setEditData({...editData, uRole:e.target.value})}>
                    <option value="Admin">Admin</option><option value="Operator">Operator</option>
                  </select>
                  <button type="submit" className="btn-gold">{editId ? "Update" : "Save"}</button>
                </form>
                <table className="pro-table mt-20">
                  <tbody>{usersList.map(u => <tr key={u.id}><td>{u.uName}</td><td><button onClick={() => {setEditId(u.id); setEditData(u);}}>Edit</button><button onClick={() => confirmDelete("users", u.id)}>Delete</button></td></tr>)}</tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}