import React, { useState, useEffect } from 'react';
import './App.css';
import { auth, db } from "./firebase"; 
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [dateTime, setDateTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [banks, setBanks] = useState([]);
  const [firms, setFirms] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [selectedFirm, setSelectedFirm] = useState("All");
  const [expandedId, setExpandedId] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => setUser(u));
    if (user) {
      onSnapshot(collection(db, "firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "banks"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "users"), s => setUsersList(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
  }, [user]);

  // Point 9: Export to Excel (Colourful)
  const exportToExcel = (bank) => {
    const data = [
      ["Date", "Particulars", "Receipt (CR)", "Payment (DR)", "Balance"],
      ["01-04-2026", "Opening Balance", "", "", bank.balance]
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, `${bank.bankName}_Ledger.xlsx`);
  };

  // Point 9: Export to PDF (Professional)
  const exportToPDF = (bank) => {
    const doc = new jsPDF();
    doc.text(`Account Ledger: ${bank.bankName}`, 14, 15);
    doc.autoTable({
      startY: 20,
      head: [['Date', 'Particulars', 'Receipt', 'Payment', 'Balance']],
      body: [['01-04-2026', 'Opening Balance', '-', '-', bank.balance]],
      headStyles: { fillColor: [10, 14, 46] } // Dark Blue Heading
    });
    doc.save(`${bank.bankName}_Ledger.pdf`);
  };

  const handleSave = async (coll) => {
    await addDoc(collection(db, coll), {...formData, status: 'Open'});
    setFormData({});
    alert("Saved Successfully!");
  };

  if (!user) return <LoginScreen />;

  return (
    <div className="app-shell">
      <div className="sidebar">
        <div className="sidebar-brand">BANKING PRO</div>
        {['Dashboard', 'Firm Master', 'Bank Master', 'User Master'].map(tab => (
          <div key={tab} className={`nav-item ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</div>
        ))}
        <div className="logout-container">
          <button className="btn-logout" onClick={() => signOut(auth)}>LOGOUT</button>
        </div>
      </div>

      <div className="main-stage">
        <div className="header-top">
          <div className="welcome-txt">Welcome, <strong>{user.email}</strong></div>
          <div className="clock-txt">{dateTime.toLocaleDateString('en-GB')} | {dateTime.toLocaleTimeString()}</div>
        </div>

        {activeTab === "Dashboard" && (
          <>
            <div className="filter-box">
              <label>Select Firm Here:</label>
              <select onChange={(e) => setSelectedFirm(e.target.value)}>
                <option value="All">All Banks</option>
                {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
            </div>
            <div className="card">
              <table className="pro-table">
                <thead><tr><th>Bank Details</th><th>A/c No</th><th>Balance</th><th>Action</th></tr></thead>
                <tbody>
                  {banks.filter(b => selectedFirm === "All" || b.firmName === selectedFirm).map(bank => (
                    <React.Fragment key={bank.id}>
                      <tr className={bank.status === 'Closed' ? 'closed-row' : ''}>
                        <td><strong>{bank.bankName}</strong><br/>{bank.branch}</td>
                        <td>{bank.accNo}</td>
                        <td className="amt">₹ {bank.balance}</td>
                        <td><button onClick={() => setExpandedId(expandedId === bank.id ? null : bank.id)}>{expandedId === bank.id ? '▲' : '▼'}</button></td>
                      </tr>
                      {expandedId === bank.id && (
                        <tr>
                          <td colSpan="4">
                            <div className="ledger-box">
                               <div className="ledger-btns">
                                  <button onClick={() => exportToPDF(bank)} className="btn-pdf">PDF</button>
                                  <button onClick={() => exportToExcel(bank)} className="btn-excel">Excel</button>
                               </div>
                               <table className="inner-ledger">
                                 <thead><tr><th>Date</th><th>Particular</th><th>Receipt</th><th>Payment</th><th>Balance</th></tr></thead>
                                 <tbody><tr><td>01/04/2026</td><td>Opening Balance</td><td>-</td><td>-</td><td>{bank.balance} CR</td></tr></tbody>
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
          </>
        )}

        {/* FIRM MASTER (Point 10) */}
        {activeTab === "Firm Master" && (
          <div className="card">
            <h3>Firm Master Form</h3>
            <div className="master-form">
              <input placeholder="Firm Name" onChange={e => setFormData({...formData, name: e.target.value})} />
              <input placeholder="Firm Address" onChange={e => setFormData({...formData, address: e.target.value})} />
              <input placeholder="GST No." onChange={e => setFormData({...formData, gst: e.target.value})} />
              <button className="btn-save" onClick={() => handleSave("firms")}>Add Firm</button>
            </div>
            <table className="pro-table">
              <thead><tr><th>Name</th><th>Address</th><th>GST</th><th>Action</th></tr></thead>
              <tbody>{firms.map(f => <tr key={f.id}><td>{f.name}</td><td>{f.address}</td><td>{f.gst}</td><td>Edit | Delete</td></tr>)}</tbody>
            </table>
          </div>
        )}

        {/* BANK MASTER (Point 11) */}
        {activeTab === "Bank Master" && (
          <div className="card">
            <h3>Bank Master Form</h3>
            <div className="master-form">
              <input placeholder="Bank Name" onChange={e => setFormData({...formData, bankName: e.target.value})} />
              <input placeholder="Branch" onChange={e => setFormData({...formData, branch: e.target.value})} />
              <input placeholder="Account No." onChange={e => setFormData({...formData, accNo: e.target.value})} />
              <input placeholder="IFSC No." onChange={e => setFormData({...formData, ifsc: e.target.value})} />
              <input placeholder="Opening Balance" onChange={e => setFormData({...formData, balance: e.target.value})} />
              <select onChange={e => setFormData({...formData, firmName: e.target.value})}>
                <option>Link Firm</option>
                {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
              <button className="btn-save" onClick={() => handleSave("banks")}>Add Bank</button>
            </div>
          </div>
        )}

        {/* USER MASTER (Point 12) */}
        {activeTab === "User Master" && (
          <div className="card">
            <h3>User Master Form</h3>
            <div className="master-form">
              <input placeholder="User Id" onChange={e => setFormData({...formData, uId: e.target.value})} />
              <input placeholder="User Name" onChange={e => setFormData({...formData, uName: e.target.value})} />
              <input placeholder="User Email" onChange={e => setFormData({...formData, uEmail: e.target.value})} />
              <input placeholder="Mobile No." onChange={e => setFormData({...formData, uMobile: e.target.value})} />
              <input placeholder="Password" type="password" onChange={e => setFormData({...formData, pass: e.target.value})} />
              <button className="btn-save" onClick={() => handleSave("users")}>Add User</button>
            </div>
          </div>
        )}

        <div className="footer-right">
          <div className="footer-txt">Developed by: <strong>SOFTVIEW TECHNOLOGIES</strong></div>
          <div className="footer-phone">+91 7972084304</div>
        </div>
      </div>
    </div>
  );
}

function LoginScreen() {
  const [e, setE] = useState("");
  const [p, setP] = useState("");
  const login = (ev) => { ev.preventDefault(); signInWithEmailAndPassword(auth, e, p); };
  return (
    <div className="login-bg">
      <div className="login-card">
        <h2 className="brand-dark">BANKING PRO</h2>
        <form onSubmit={login}>
          <input placeholder="Email" onChange={(ev)=>setE(ev.target.value)} />
          <input type="password" placeholder="Password" onChange={(ev)=>setP(ev.target.value)} />
          <button className="btn-auth">LOGIN</button>
        </form>
      </div>
    </div>
  );
}