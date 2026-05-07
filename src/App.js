import React, { useState, useEffect } from "react";
import "./App.css";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, deleteDoc } from "firebase/firestore";
import * as XLSX from 'xlsx';

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

  // Live Clock with Seconds
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
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

  const handleDelete = async (col, id) => {
    if(window.confirm("Kya aap ise delete karna chahte hain?")) {
      await deleteDoc(doc(db, col, id));
    }
  };

  if (!user) return <LoginScreen />;

  return (
    <div className="app-shell">
      {/* Sidebar - Remains Premium */}
      <div className="sidebar">
        <div className="sidebar-brand">BANKING PRO</div>
        <div className="nav-links">
          {['Dashboard', 'Firm Master', 'Bank Master', 'User Master'].map(tab => (
            <div key={tab} className={`nav-item ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</div>
          ))}
        </div>
        <div className="sidebar-footer">
          <strong>SOFTVIEW TECHNOLOGIES</strong><br/>
          Support: +91 7972084304
        </div>
      </div>

      <div className="main-stage">
        {/* Header with Live Seconds */}
        <div className="top-right-header">
          <span className="user-badge">{user.email}</span>
          <span className="divider">|</span>
          <span className="live-time">
            {currentTime.toLocaleDateString('en-GB')} || {currentTime.toLocaleTimeString('en-IN', { hour12: true })}
          </span>
          <button className="logout-minimal" onClick={() => signOut(auth)}>Logout</button>
        </div>

        <div className="content-area">
          
          {/* 1. DASHBOARD TAB */}
          {activeTab === "Dashboard" && (
            <div>
              <div className="filter-container">
                <h2 style={{margin:0}}>Consolidated Bank Summary</h2>
                <select className="pro-select" value={selectedFirm} onChange={(e) => setSelectedFirm(e.target.value)}>
                  <option value="">Select Firm to View Ledger...</option>
                  {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                </select>
              </div>
              {/* Dashboard Table Logic... (same as your premium view) */}
            </div>
          )}

          {/* 2. FIRM MASTER - Forms & History */}
          {activeTab === "Firm Master" && (
            <div className="fade-in">
              <div className="card master-form-card">
                <h3>🏢 Register New Firm</h3>
                <form className="master-form" onSubmit={async (e) => {
                  e.preventDefault();
                  await addDoc(collection(db, "firms"), { 
                    name: e.target.fName.value, 
                    gstin: e.target.fGst.value,
                    address: e.target.fAddr.value,
                    created: new Date().toISOString() 
                  });
                  e.target.reset();
                }}>
                  <input name="fName" placeholder="Firm Full Name" required />
                  <input name="fGst" placeholder="GST Number (Optional)" />
                  <input name="fAddr" placeholder="Office Address" required />
                  <button type="submit" className="btn-gold">Register Firm</button>
                </form>
              </div>

              <div className="card mt-20">
                <h3>Registered Firms ({firms.length})</h3>
                <table className="pro-table">
                  <thead><tr><th>Firm Name</th><th>GSTIN</th><th>Address</th><th>Action</th></tr></thead>
                  <tbody>
                    {firms.map(f => (
                      <tr key={f.id}>
                        <td><strong>{f.name}</strong></td>
                        <td>{f.gstin || 'N/A'}</td>
                        <td>{f.address}</td>
                        <td><button className="btn-del" onClick={() => handleDelete("firms", f.id)}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. BANK MASTER - Forms & History */}
          {activeTab === "Bank Master" && (
            <div className="fade-in">
              <div className="card master-form-card">
                <h3>🏦 Add New Bank Account</h3>
                <form className="master-form" onSubmit={async (e) => {
                  e.preventDefault();
                  await addDoc(collection(db, "banks"), {
                    firmName: e.target.firm.value,
                    bankName: e.target.bank.value,
                    accNo: e.target.acc.value,
                    ifsc: e.target.ifsc.value,
                    openingBal: Number(e.target.bal.value),
                    balance: Number(e.target.bal.value),
                    status: 'Active'
                  });
                  e.target.reset();
                }}>
                  <select name="firm" className="pro-input" required>
                    <option value="">Link to Firm</option>
                    {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                  </select>
                  <input name="bank" placeholder="Bank Name (e.g. ICICI)" required />
                  <input name="acc" placeholder="Account Number" required />
                  <input name="ifsc" placeholder="IFSC Code" />
                  <input name="bal" type="number" placeholder="Opening Balance" required />
                  <button type="submit" className="btn-gold">Add Bank</button>
                </form>
              </div>

              <div className="card mt-20">
                <h3>Active Bank Accounts ({banks.length})</h3>
                <table className="pro-table">
                  <thead><tr><th>Firm</th><th>Bank</th><th>Account No</th><th>Balance</th><th>Action</th></tr></thead>
                  <tbody>
                    {banks.map(b => (
                      <tr key={b.id}>
                        <td>{b.firmName}</td>
                        <td><strong>{b.bankName}</strong></td>
                        <td><code>{b.accNo}</code></td>
                        <td className="txt-success">₹ {b.balance}</td>
                        <td><button className="btn-del" onClick={() => handleDelete("banks", b.id)}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. USER MASTER - Forms & History */}
          {activeTab === "User Master" && (
            <div className="fade-in">
              <div className="card master-form-card">
                <h3>👥 Create System User</h3>
                <form className="master-form" onSubmit={async (e) => {
                  e.preventDefault();
                  await addDoc(collection(db, "users"), {
                    uName: e.target.uName.value,
                    uEmail: e.target.uEmail.value,
                    uRole: e.target.uRole.value,
                    uPhone: e.target.uPhone.value
                  });
                  e.target.reset();
                }}>
                  <input name="uName" placeholder="Full Name" required />
                  <input name="uEmail" type="email" placeholder="Email Address" required />
                  <input name="uPhone" placeholder="Mobile Number" />
                  <select name="uRole" className="pro-input">
                    <option value="Operator">Operator</option>
                    <option value="Manager">Manager</option>
                    <option value="Viewer">Only Viewer</option>
                  </select>
                  <button type="submit" className="btn-gold">Create Access</button>
                </form>
              </div>

              <div className="card mt-20">
                <h3>Authorized Users ({usersList.length})</h3>
                <table className="pro-table">
                  <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Contact</th><th>Action</th></tr></thead>
                  <tbody>
                    {usersList.map(u => (
                      <tr key={u.id}>
                        <td><strong>{u.uName}</strong></td>
                        <td>{u.uEmail}</td>
                        <td><span className="badge-role">{u.uRole}</span></td>
                        <td>{u.uPhone || '-'}</td>
                        <td><button className="btn-del" onClick={() => handleDelete("users", u.id)}>Delete</button></td>
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

// Separate Login Component for Cleanliness
function LoginScreen() {
  return (
    <div className="login-screen">
      <div className="card login-card">
        <h2 style={{color:'#b58921'}}>BANKING PRO</h2>
        <p>Enter administrative credentials</p>
        <form onSubmit={(e) => {
          e.preventDefault();
          signInWithEmailAndPassword(auth, e.target.email.value, e.target.pass.value);
        }}>
          <input name="email" type="email" placeholder="Email" required />
          <input name="pass" type="password" placeholder="Password" required />
          <button type="submit" className="btn-gold">LOGIN</button>
        </form>
      </div>
    </div>
  );
}