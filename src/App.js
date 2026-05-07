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
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Data States
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

  // --- PDF Generation Fix ---
  const exportPDF = (b) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Bank Ledger Statement", 14, 20);
    doc.setFontSize(12);
    doc.text(`Bank: ${b.bankName} | A/c: ${b.accNo}`, 14, 30);
    
    const tableColumn = ["Date", "Particulars", "Receipt", "Payment", "Balance"];
    const tableRows = [
      [currentTime.toLocaleDateString(), "Opening Balance", b.openingBal, "0", b.balance]
    ];

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }
    });
    doc.save(`${b.bankName}_Statement.pdf`);
  };

  const deleteItem = async (col, id) => {
    if(window.confirm("Are you sure you want to delete?")) {
      await deleteDoc(doc(db, col, id));
    }
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
            <span className="seconds-clock">{currentTime.toLocaleTimeString()}</span>
          </div>
          <button className="btn-logout" onClick={() => signOut(auth)}>Logout</button>
        </div>

        {/* --- USER MASTER --- */}
        {activeTab === "User Master" && (
          <div className="fade-in">
            <div className="card">
              <h3>👥 User Access Control</h3>
              <form className="master-form" onSubmit={async (e) => {
                e.preventDefault();
                await addDoc(collection(db, "users"), {
                  uName: e.target.uName.value, uEmail: e.target.uEmail.value,
                  uPass: e.target.uPass.value, uRole: e.target.uRole.value, uPhone: e.target.uPhone.value
                });
                e.target.reset();
              }}>
                <input name="uName" placeholder="Full Name" className="pro-input" required />
                <input name="uEmail" type="email" placeholder="Login Email" className="pro-input" required />
                <input name="uPass" type="password" placeholder="Set Password" className="pro-input" required />
                <input name="uPhone" placeholder="Mobile" className="pro-input" />
                <select name="uRole" className="pro-input">
                  <option value="Admin">Admin (Full Access)</option>
                  <option value="Operator">Operator (Addition Only)</option>
                  <option value="Viewer">Viewer (View Only)</option>
                </select>
                <button type="submit" className="btn-gold">Create User</button>
              </form>
            </div>
            <div className="card mt-20">
              <table className="pro-table">
                <thead><tr><th>Name</th><th>Role</th><th>Actions</th></tr></thead>
                <tbody>
                  {usersList.map(u => (
                    <tr key={u.id}>
                      <td>{u.uName}</td><td>{u.uRole}</td>
                      <td>
                        <button className="btn-edit-sm">Edit</button>
                        <button className="btn-del-sm" onClick={() => deleteItem("users", u.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- FIRM MASTER --- */}
        {activeTab === "Firm Master" && (
          <div className="fade-in">
            <div className="card">
              <h3>🏢 Firm Registration</h3>
              <form className="master-form" onSubmit={async (e) => {
                e.preventDefault();
                await addDoc(collection(db, "firms"), { name: e.target.fName.value, address: e.target.fAddr.value, gstin: e.target.fGst.value });
                e.target.reset();
              }}>
                <input name="fName" placeholder="Firm Name" className="pro-input" required />
                <input name="fAddr" placeholder="Full Address" className="pro-input" required />
                <input name="fGst" placeholder="GSTIN" className="pro-input" />
                <button type="submit" className="btn-gold">Save Firm</button>
              </form>
            </div>
            <div className="card mt-20">
              <table className="pro-table">
                <thead><tr><th>Firm Name</th><th>Address</th><th>Actions</th></tr></thead>
                <tbody>
                  {firms.map(f => (
                    <tr key={f.id}>
                      <td>{f.name}</td><td>{f.address}</td>
                      <td>
                        <button className="btn-edit-sm">Edit</button>
                        <button className="btn-del-sm" onClick={() => deleteItem("firms", f.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- BANK MASTER --- */}
        {activeTab === "Bank Master" && (
          <div className="fade-in">
            <div className="card">
              <h3>🏦 Bank Account Master</h3>
              <form className="master-form" onSubmit={async (e) => {
                e.preventDefault();
                await addDoc(collection(db, "banks"), {
                  firmName: e.target.firm.value, bankName: e.target.bank.value,
                  branch: e.target.branch.value, accNo: e.target.acc.value,
                  openingBal: Number(e.target.bal.value), balance: Number(e.target.bal.value)
                });
                e.target.reset();
              }}>
                <select name="firm" className="pro-input" required>
                  <option value="">Select Firm</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
                <input name="bank" placeholder="Bank Name" className="pro-input" required />
                <input name="branch" placeholder="Branch Name" className="pro-input" required />
                <input name="acc" placeholder="Account No" className="pro-input" required />
                <input name="bal" placeholder="Opening Balance" type="number" className="pro-input" required />
                <button type="submit" className="btn-gold">Save Bank</button>
              </form>
            </div>
            <div className="card mt-20">
              <table className="pro-table">
                <thead><tr><th>Bank</th><th>Branch</th><th>Actions</th></tr></thead>
                <tbody>
                  {banks.map(b => (
                    <tr key={b.id}>
                      <td>{b.bankName}</td><td>{b.branch}</td>
                      <td>
                        <button className="btn-edit-sm">Edit</button>
                        <button className="btn-del-sm" onClick={() => deleteItem("banks", b.id)}>Delete</button>
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
  );
}

// Login Screen with user master check logic (Abstracted for brevity)
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
          <button type="submit" className="btn-gold" style={{width:'100%'}}>LOGIN</button>
        </form>
      </div>
    </div>
  );
}