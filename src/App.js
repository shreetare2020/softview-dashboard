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
  const [clock, setClock] = useState(new Date());
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [banks, setBanks] = useState([]);
  const [firms, setFirms] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedFirm, setSelectedFirm] = useState("All");
  const [expandedId, setExpandedId] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    onAuthStateChanged(auth, (u) => setUser(u));
    if (user) {
      onSnapshot(collection(db, "firms"), s => setFirms(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "banks"), s => setBanks(s.docs.map(d => ({id: d.id, ...d.data()}))));
      onSnapshot(collection(db, "users"), s => setUsers(s.docs.map(d => ({id: d.id, ...d.data()}))));
    }
  }, [user]);

  const handleSave = async (coll) => {
    await addDoc(collection(db, coll), { ...form, status: 'Open' });
    setForm({}); alert("Record Added!");
  };

  const exportExcel = (b) => {
    const ws = XLSX.utils.json_to_sheet([{Date: '01-04-2026', Particulars: 'Opening Balance', Balance: b.balance}]);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, `${b.bankName}.xlsx`);
  };

  if (!user) return <LoginScreen />;

  return (
    <div className="app-shell">
      <div className="sidebar">
        <div className="sidebar-brand">BANKING PRO</div>
        {['Dashboard', 'Firm Master', 'Bank Master', 'User Master'].map(t => (
          <div key={t} className={`nav-item ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{t}</div>
        ))}
        <div className="logout-box">
          <button className="btn-logout" onClick={() => signOut(auth)}>LOGOUT</button>
        </div>
      </div>

      <div className="main-stage">
        <div className="header-top">
          <div className="welcome-msg">Welcome, {user.email}</div>
          <div className="live-clock">{clock.toLocaleDateString('en-GB')} | {clock.toLocaleTimeString()}</div>
        </div>

        {activeTab === "Dashboard" && (
          <>
            <div className="filter-card">
              <label>Select Firm Here:</label>
              <select onChange={(e) => setSelectedFirm(e.target.value)}>
                <option value="All">-- All Banks --</option>
                {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
            </div>
            <div className="card">
              <table className="pro-table">
                <thead><tr><th>Bank Details</th><th>A/c No</th><th>Balance</th><th>Action</th></tr></thead>
                <tbody>
                  {banks.filter(b => selectedFirm === "All" || b.firmName === selectedFirm).map(b => (
                    <React.Fragment key={b.id}>
                      <tr>
                        <td><strong>{b.bankName}</strong><br/><small>{b.branch}</small></td>
                        <td>{b.accNo}</td>
                        <td className="amt-cr">₹ {b.balance} CR</td>
                        <td><button onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}>{expandedId === b.id ? '▲' : '▼'}</button></td>
                      </tr>
                      {expandedId === b.id && (
                        <tr><td colSpan="4">
                          <div className="ledger-container">
                             <div style={{textAlign:'right', marginBottom:'10px'}}>
                               <button className="btn-exp" style={{background:'#d32f2f'}}>PDF</button>
                               <button className="btn-exp" style={{background:'#2e7d32'}} onClick={()=>exportExcel(b)}>EXCEL</button>
                             </div>
                             <table className="pro-table" style={{background:'white'}}>
                               <thead><tr><th>Date</th><th>Particular</th><th>Receipt</th><th>Payment</th><th>Balance</th></tr></thead>
                               <tbody><tr><td>01/04/2026</td><td>Opening Balance</td><td>-</td><td>-</td><td>{b.balance} CR</td></tr></tbody>
                             </table>
                          </div>
                        </td></tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === "Firm Master" && (
          <div className="card">
            <h3>Add New Firm</h3>
            <div className="form-grid">
              <input placeholder="Firm Name" onChange={e => setForm({...form, name: e.target.value})} />
              <input placeholder="Address" onChange={e => setForm({...form, address: e.target.value})} />
              <input placeholder="GST No" onChange={e => setForm({...form, gst: e.target.value})} />
              <button className="btn-save" onClick={() => handleSave("firms")}>Save Firm</button>
            </div>
            <table className="pro-table">
               <thead><tr><th>Firm Name</th><th>GST</th><th>Action</th></tr></thead>
               <tbody>{firms.map(f => <tr key={f.id}><td>{f.name}</td><td>{f.gst}</td><td>Edit | Delete | Close</td></tr>)}</tbody>
            </table>
          </div>
        )}

        {activeTab === "Bank Master" && (
          <div className="card">
            <h3>Add New Bank</h3>
            <div className="form-grid">
              <input placeholder="Bank Name" onChange={e => setForm({...form, bankName: e.target.value})} />
              <input placeholder="Branch" onChange={e => setForm({...form, branch: e.target.value})} />
              <input placeholder="A/c No" onChange={e => setForm({...form, accNo: e.target.value})} />
              <input placeholder="IFSC" onChange={e => setForm({...form, ifsc: e.target.value})} />
              <input placeholder="Opening Bal" onChange={e => setForm({...form, balance: e.target.value})} />
              <select onChange={e => setForm({...form, firmName: e.target.value})}>
                 <option>Link Firm</option>
                 {firms.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
              <button className="btn-save" onClick={() => handleSave("banks")}>Save Bank</button>
            </div>
          </div>
        )}

        {activeTab === "User Master" && (
          <div className="card">
            <h3>Add New User</h3>
            <div className="form-grid">
              <input placeholder="User Id" onChange={e => setForm({...form, uId: e.target.value})} />
              <input placeholder="User Name" onChange={e => setForm({...form, uName: e.target.value})} />
              <input placeholder="Email" onChange={e => setForm({...form, uEmail: e.target.value})} />
              <input placeholder="Mobile No" onChange={e => setForm({...form, uMobile: e.target.value})} />
              <input type="password" placeholder="Password" onChange={e => setForm({...form, pass: e.target.value})} />
              <button className="btn-save" onClick={() => handleSave("users")}>Save User</button>
            </div>
          </div>
        )}

        <div className="footer-branding">
          <div className="softview-text">Developed by: SOFTVIEW TECHNOLOGIES</div>
          <div className="softview-phone">+91 7972084304</div>
        </div>
      </div>
    </div>
  );
}

function LoginScreen() {
  const [e, setE] = useState("");
  const [p, setP] = useState("");
  return (
    <div className="login-bg">
      <div className="login-card">
        <h2 style={{color: '#0a0e2e'}}>BANKING PRO</h2>
        <form onSubmit={(ev)=>{ev.preventDefault(); signInWithEmailAndPassword(auth,e,p)}}>
          <input className="login-input" placeholder="Email" style={{width:'100%', padding:'12px', margin:'10px 0'}} onChange={ev=>setE(ev.target.value)} />
          <input className="login-input" type="password" placeholder="Password" style={{width:'100%', padding:'12px', margin:'10px 0'}} onChange={ev=>setP(ev.target.value)} />
          <button type="submit" style={{width:'100%', padding:'12px', background:'#0a0e2e', color:'#ffca28', border:'none', borderRadius:'5px', fontWeight:'bold'}}>LOGIN</button>
        </form>
      </div>
    </div>
  );
}